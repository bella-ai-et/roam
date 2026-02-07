import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DISTANCE_THRESHOLD_KM = 150;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type RouteStop = {
  location: { latitude: number; longitude: number; name: string };
  arrivalDate: string;
  departureDate: string;
  notes?: string;
  role?: string;
  intent?: string;
  destinationType?: string;
  status?: string;
};

type SyncResult = {
  status: "crossing" | "same_stop" | "syncing" | "departed" | "none";
  location: string;
  daysUntil: number | null;
  movingTo: string | null;
};

function computeSyncStatus(
  myRoute: RouteStop[] | undefined,
  theirRoute: RouteStop[] | undefined
): SyncResult {
  const noResult: SyncResult = { status: "none", location: "", daysUntil: null, movingTo: null };

  if (!myRoute?.length || !theirRoute?.length) return noResult;

  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  let bestResult: SyncResult = noResult;
  let bestPriority = -1;

  for (const myStop of myRoute) {
    for (const theirStop of theirRoute) {
      const dist = haversineDistance(
        myStop.location.latitude,
        myStop.location.longitude,
        theirStop.location.latitude,
        theirStop.location.longitude
      );

      if (dist > DISTANCE_THRESHOLD_KM) continue;

      const myArrival = new Date(myStop.arrivalDate).getTime();
      const myDeparture = new Date(myStop.departureDate).getTime();
      const theirArrival = new Date(theirStop.arrivalDate).getTime();
      const theirDeparture = new Date(theirStop.departureDate).getTime();

      const datesOverlap = myArrival <= theirDeparture && theirArrival <= myDeparture;
      if (!datesOverlap) continue;

      const overlapStart = Math.max(myArrival, theirArrival);
      const overlapEnd = Math.min(myDeparture, theirDeparture);
      const locationName = myStop.location.name || theirStop.location.name || "Unknown";

      // same_stop: both are there right now (priority 3)
      if (overlapStart <= todayMs && overlapEnd >= todayMs) {
        if (bestPriority < 3) {
          bestPriority = 3;
          bestResult = { status: "same_stop", location: locationName, daysUntil: null, movingTo: null };
        }
      }
      // syncing: overlap is happening now but started in the past or today (priority 2)
      else if (overlapStart <= now && overlapEnd > now) {
        if (bestPriority < 2) {
          bestPriority = 2;
          bestResult = { status: "syncing", location: locationName, daysUntil: null, movingTo: null };
        }
      }
      // crossing: overlap is in the future (priority 1)
      else if (overlapStart > now) {
        const daysUntil = Math.ceil((overlapStart - now) / (1000 * 60 * 60 * 24));
        if (bestPriority < 1) {
          bestPriority = 1;
          bestResult = { status: "crossing", location: locationName, daysUntil, movingTo: null };
        }
      }
    }
  }

  // Check departed: their most recent stop has ended
  if (bestPriority < 0) {
    const theirSorted = [...theirRoute].sort(
      (a, b) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime()
    );
    const lastStop = theirSorted[0];
    if (lastStop && new Date(lastStop.departureDate).getTime() < now) {
      const daysAgo = Math.floor((now - new Date(lastStop.departureDate).getTime()) / (1000 * 60 * 60 * 24));
      // Find their next destination if any
      const futureStops = theirRoute.filter(
        (s) => new Date(s.arrivalDate).getTime() > now
      );
      futureStops.sort((a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime());
      const movingTo = futureStops[0]?.location?.name ?? null;

      if (daysAgo <= 14) {
        bestResult = {
          status: "departed",
          location: lastStop.location.name,
          daysUntil: daysAgo,
          movingTo,
        };
      }
    }
  }

  return bestResult;
}

export const getSyncsForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentUser = await ctx.db.get(userId);
    if (!currentUser) return [];

    const asUser1 = await ctx.db.query("matches").withIndex("by_user1", (q) => q.eq("user1Id", userId)).collect();
    const asUser2 = await ctx.db.query("matches").withIndex("by_user2", (q) => q.eq("user2Id", userId)).collect();
    const allMatches = [...asUser1, ...asUser2];

    const results = await Promise.all(
      allMatches.map(async (match) => {
        const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const otherUser = await ctx.db.get(otherId);

        const messages = await ctx.db
          .query("messages")
          .withIndex("by_match", (q) => q.eq("matchId", match._id))
          .collect();
        messages.sort((a, b) => b.createdAt - a.createdAt);
        const lastMessage = messages[0] || null;
        const unreadCount = messages.filter((m) => m.senderId !== userId && !m.read).length;

        // Compute live sync status
        const sync = computeSyncStatus(
          currentUser.currentRoute as RouteStop[] | undefined,
          otherUser?.currentRoute as RouteStop[] | undefined
        );

        return {
          match,
          otherUser,
          lastMessage,
          unreadCount,
          syncStatus: match.syncStatus ?? sync.status,
          syncLocation: match.syncLocation ?? sync.location,
          syncDaysUntil: match.syncDaysUntil ?? sync.daysUntil,
          movingTo: sync.movingTo,
        };
      })
    );

    // Sort: unread first, then by last message time
    results.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      const aTime = a.lastMessage?.createdAt || a.match.matchedAt;
      const bTime = b.lastMessage?.createdAt || b.match.matchedAt;
      return bTime - aTime;
    });

    return results;
  },
});

export const getNewRouteOverlaps = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentUser = await ctx.db.get(userId);
    if (!currentUser) return [];

    const asUser1 = await ctx.db.query("matches").withIndex("by_user1", (q) => q.eq("user1Id", userId)).collect();
    const asUser2 = await ctx.db.query("matches").withIndex("by_user2", (q) => q.eq("user2Id", userId)).collect();
    const allMatches = [...asUser1, ...asUser2];

    const results = await Promise.all(
      allMatches.map(async (match) => {
        const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const otherUser = await ctx.db.get(otherId);

        // Check if there are any messages (if so, it's not "new")
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_match", (q) => q.eq("matchId", match._id))
          .collect();
        if (messages.length > 0) return null;

        const sync = computeSyncStatus(
          currentUser.currentRoute as RouteStop[] | undefined,
          otherUser?.currentRoute as RouteStop[] | undefined
        );

        if (sync.status === "none") return null;

        return {
          matchId: match._id,
          otherUser,
          overlapLocation: sync.location,
          syncStatus: sync.status,
        };
      })
    );

    return results.filter(Boolean);
  },
});

export const recalcSyncForMatch = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const match = await ctx.db.get(matchId);
    if (!match) return;

    const user1 = await ctx.db.get(match.user1Id);
    const user2 = await ctx.db.get(match.user2Id);

    const sync = computeSyncStatus(
      user1?.currentRoute as RouteStop[] | undefined,
      user2?.currentRoute as RouteStop[] | undefined
    );

    await ctx.db.patch(matchId, {
      syncStatus: sync.status,
      syncLocation: sync.location,
      syncDaysUntil: sync.daysUntil ?? undefined,
      lastSyncUpdate: Date.now(),
    });
  },
});

export const recalcAllSyncsForUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const asUser1 = await ctx.db.query("matches").withIndex("by_user1", (q) => q.eq("user1Id", userId)).collect();
    const asUser2 = await ctx.db.query("matches").withIndex("by_user2", (q) => q.eq("user2Id", userId)).collect();
    const allMatches = [...asUser1, ...asUser2];

    const user = await ctx.db.get(userId);
    if (!user) return;

    for (const match of allMatches) {
      const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const otherUser = await ctx.db.get(otherId);

      const sync = computeSyncStatus(
        user.currentRoute as RouteStop[] | undefined,
        otherUser?.currentRoute as RouteStop[] | undefined
      );

      await ctx.db.patch(match._id, {
        syncStatus: sync.status,
        syncLocation: sync.location,
        syncDaysUntil: sync.daysUntil ?? undefined,
        lastSyncUpdate: Date.now(),
      });
    }
  },
});
