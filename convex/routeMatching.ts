import { query } from "./_generated/server";
import { v } from "convex/values";

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

function datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 <= e2 && s2 <= e1;
}

interface RouteOverlap {
  locationName: string;
  dateRange: { start: string; end: string };
  distance: number;
}

export const findRouteMatches = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentUser = await ctx.db.get(userId);
    if (!currentUser || !currentUser.currentRoute || currentUser.currentRoute.length === 0) {
      return [];
    }

    const allUsers = await ctx.db.query("users").collect();
    const candidates = allUsers.filter(
      (u) => u._id !== userId && u.currentRoute && u.currentRoute.length > 0
    );

    const mySwipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiper", (q) => q.eq("swiperId", userId))
      .collect();
    const swipedIds = new Set(mySwipes.map((s) => s.swipedId));

    const results: {
      user: typeof currentUser;
      overlaps: RouteOverlap[];
      score: number;
      sharedInterests: string[];
    }[] = [];

    const DISTANCE_THRESHOLD_KM = 150;

    for (const candidate of candidates) {
      if (swipedIds.has(candidate._id)) continue;

      const overlaps: RouteOverlap[] = [];

      for (const myStop of currentUser.currentRoute) {
        for (const theirStop of candidate.currentRoute!) {
          const dist = haversineDistance(
            myStop.location.latitude,
            myStop.location.longitude,
            theirStop.location.latitude,
            theirStop.location.longitude
          );

          if (
            dist <= DISTANCE_THRESHOLD_KM &&
            datesOverlap(myStop.arrivalDate, myStop.departureDate, theirStop.arrivalDate, theirStop.departureDate)
          ) {
            const overlapStart = new Date(
              Math.max(new Date(myStop.arrivalDate).getTime(), new Date(theirStop.arrivalDate).getTime())
            );
            const overlapEnd = new Date(
              Math.min(new Date(myStop.departureDate).getTime(), new Date(theirStop.departureDate).getTime())
            );

            overlaps.push({
              locationName: myStop.location.name || theirStop.location.name || "Unknown",
              dateRange: {
                start: overlapStart.toISOString().split("T")[0],
                end: overlapEnd.toISOString().split("T")[0],
              },
              distance: Math.round(dist),
            });
          }
        }
      }

      if (overlaps.length === 0) continue;

      const sharedInterests = currentUser.interests.filter((i: string) => candidate.interests.includes(i));
      const score =
        overlaps.reduce((sum, o) => sum + 10 + Math.max(0, 10 - o.distance / 15), 0) +
        sharedInterests.length * 3;

      results.push({ user: candidate, overlaps, score, sharedInterests });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 20);
  },
});
