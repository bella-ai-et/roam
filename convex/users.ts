import { mutation, query } from "./_generated/server"; 
import { v } from "convex/values"; 

export const getByClerkId = query({ 
  args: { clerkId: v.string() }, 
  handler: async (ctx, { clerkId }) => { 
    return await ctx.db.query("users").filter((q) => q.eq(q.field("clerkId"), clerkId)).first(); 
  }, 
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
}); 

export const createProfile = mutation({ 
  args: { 
    clerkId: v.string(), 
    name: v.string(), 
    dateOfBirth: v.number(), 
    gender: v.string(), 
    photos: v.array(v.string()), 
    interests: v.array(v.string()), 
    lookingFor: v.array(v.string()), 
    vanType: v.optional(v.string()), 
    vanBuildStatus: v.optional(v.string()), 
    vanVerified: v.boolean(), 
    vanPhotoUrl: v.optional(v.string()),
    vanModel: v.optional(v.string()),
    nomadSinceYear: v.optional(v.number()),
    pathVisibility: v.optional(v.string()),
    travelStyles: v.optional(v.array(v.string())),
    lifestyleLabel: v.optional(v.string()),
    socialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
    })),
  }, 
  handler: async (ctx, args) => { 
    return await ctx.db.insert("users", { ...args, bio: undefined, onboardingComplete: false, applicationStatus: "pending" }); 
  }, 
}); 

export const updateProfile = mutation({ 
  args: { 
    userId: v.id("users"), 
    name: v.optional(v.string()), 
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.string()),
    bio: v.optional(v.string()), 
    photos: v.optional(v.array(v.string())), 
    interests: v.optional(v.array(v.string())), 
    lookingFor: v.optional(v.array(v.string())), 
    vanType: v.optional(v.string()), 
    vanBuildStatus: v.optional(v.string()), 
    vanPhotoUrl: v.optional(v.string()),
    vanModel: v.optional(v.string()),
    nomadSinceYear: v.optional(v.number()),
    pathVisibility: v.optional(v.string()),
    travelStyles: v.optional(v.array(v.string())),
    lifestyleLabel: v.optional(v.string()),
    socialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      tiktok: v.optional(v.string()),
    })),
  }, 
  handler: async (ctx, { userId, ...updates }) => { 
    const filtered = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined)); 
    await ctx.db.patch(userId, filtered); 
  }, 
}); 

export const completeOnboarding = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { onboardingComplete: true });
  },
});

export const approveUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { applicationStatus: "approved" });
  },
});

export const approveWithInviteCode = mutation({
  args: {
    userId: v.id("users"),
    inviteCode: v.string(),
  },
  handler: async (ctx, { userId, inviteCode }) => {
    if (inviteCode.trim().toLowerCase() !== "shipyard2026") {
      throw new Error("Invalid invite code");
    }
    await ctx.db.patch(userId, { applicationStatus: "approved" });
    return { success: true };
  },
});

export const getApplicationStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.applicationStatus ?? "approved";
  },
});

export const updateRoute = mutation({ 
  args: { 
    userId: v.id("users"), 
    route: v.array(v.object({ 
      location: v.object({ latitude: v.number(), longitude: v.number(), name: v.string() }), 
      arrivalDate: v.string(), 
      departureDate: v.string(), 
      notes: v.optional(v.string()), 
      role: v.optional(v.string()),
      intent: v.optional(v.string()),
      destinationType: v.optional(v.string()),
      status: v.optional(v.string()),
    })), 
  }, 
  handler: async (ctx, { userId, route }) => {
    // Server-side stopover limit enforcement
    const user = await ctx.db.get(userId);
    const tier = user?.subscriptionTier ?? "free";
    if (tier !== "pro") {
      const stopovers = route.filter((s) => s.role !== "origin" && s.role !== "destination");
      if (stopovers.length > 1) {
        throw new Error("Free plan allows only 1 stopover. Upgrade to Pro for unlimited stopovers.");
      }
    }

    await ctx.db.patch(userId, { currentRoute: route });

    // Recalculate sync statuses for all matches involving this user
    const asUser1 = await ctx.db.query("matches").withIndex("by_user1", (q) => q.eq("user1Id", userId)).collect();
    const asUser2 = await ctx.db.query("matches").withIndex("by_user2", (q) => q.eq("user2Id", userId)).collect();
    const allMatches = [...asUser1, ...asUser2];

    for (const match of allMatches) {
      const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const otherUser = await ctx.db.get(otherId);
      const otherRoute = otherUser?.currentRoute;

      if (!otherRoute?.length || !route.length) continue;

      // Inline lightweight sync calc to avoid cross-file import issues
      const now = Date.now();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();
      let syncStatus = "none";
      let syncLocation = "";
      let syncDaysUntil: number | undefined = undefined;

      for (const myStop of route) {
        for (const theirStop of otherRoute) {
          const R = 6371;
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const dLat = toRad(theirStop.location.latitude - myStop.location.latitude);
          const dLon = toRad(theirStop.location.longitude - myStop.location.longitude);
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(myStop.location.latitude)) * Math.cos(toRad(theirStop.location.latitude)) * Math.sin(dLon / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          if (dist > 150) continue;

          const myArr = new Date(myStop.arrivalDate).getTime();
          const myDep = new Date(myStop.departureDate).getTime();
          const thArr = new Date(theirStop.arrivalDate).getTime();
          const thDep = new Date(theirStop.departureDate).getTime();
          if (myArr > thDep || thArr > myDep) continue;

          const overlapStart = Math.max(myArr, thArr);
          const overlapEnd = Math.min(myDep, thDep);
          const loc = myStop.location.name || theirStop.location.name || "Unknown";

          if (overlapStart <= todayMs && overlapEnd >= todayMs) {
            syncStatus = "same_stop"; syncLocation = loc; break;
          } else if (overlapStart <= now && overlapEnd > now) {
            if (syncStatus !== "same_stop") { syncStatus = "syncing"; syncLocation = loc; }
          } else if (overlapStart > now) {
            if (syncStatus === "none") {
              syncStatus = "crossing"; syncLocation = loc;
              syncDaysUntil = Math.ceil((overlapStart - now) / (1000 * 60 * 60 * 24));
            }
          }
        }
        if (syncStatus === "same_stop") break;
      }

      await ctx.db.patch(match._id, {
        syncStatus,
        syncLocation,
        syncDaysUntil,
        lastSyncUpdate: Date.now(),
      });
    }
  }, 
});

export const updateSubscriptionTier = mutation({
  args: {
    userId: v.id("users"),
    tier: v.string(),
  },
  handler: async (ctx, { userId, tier }) => {
    await ctx.db.patch(userId, { subscriptionTier: tier });
  },
});
