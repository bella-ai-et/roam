import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordSwipe = mutation({
  args: {
    swiperId: v.id("users"),
    swipedId: v.id("users"),
    action: v.string(),
  },
  handler: async (ctx, { swiperId, swipedId, action }) => {
    const existing = await ctx.db
      .query("swipes")
      .withIndex("by_swiper_and_swiped", (q) => q.eq("swiperId", swiperId).eq("swipedId", swipedId))
      .first();
    if (existing) return { matched: false, matchId: null };

    // Daily likes limit enforcement
    if (action === "like") {
      const swiper = await ctx.db.get(swiperId);
      const tier = swiper?.subscriptionTier ?? "free";
      const FREE_DAILY_LIKES = 5;

      if (tier !== "pro") {
        const now = Date.now();
        const resetAt = swiper?.dailyLikesResetAt ?? 0;
        let usedToday = swiper?.dailyLikesUsed ?? 0;

        // Reset counter if a new day has started
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (resetAt < startOfToday.getTime()) {
          usedToday = 0;
          await ctx.db.patch(swiperId, { dailyLikesUsed: 0, dailyLikesResetAt: now });
        }

        if (usedToday >= FREE_DAILY_LIKES) {
          return { matched: false, matchId: null, limitReached: true };
        }

        // Increment counter
        await ctx.db.patch(swiperId, { dailyLikesUsed: usedToday + 1, dailyLikesResetAt: resetAt < startOfToday.getTime() ? now : resetAt });
      }
    }

    await ctx.db.insert("swipes", { swiperId, swipedId, action, createdAt: Date.now() });

    if (action === "like") {
      const swipedUser = await ctx.db.get(swipedId);
      const isDemoUser = Boolean(swipedUser?.clerkId?.startsWith("seed-abu-dhabi-"));
      if (isDemoUser) {
        const existingMatch = await ctx.db
          .query("matches")
          .filter((q) =>
            q.or(
              q.and(q.eq(q.field("user1Id"), swiperId), q.eq(q.field("user2Id"), swipedId)),
              q.and(q.eq(q.field("user1Id"), swipedId), q.eq(q.field("user2Id"), swiperId))
            )
          )
          .first();
        if (!existingMatch) {
          const matchId = await ctx.db.insert("matches", {
            user1Id: swiperId,
            user2Id: swipedId,
            matchedAt: Date.now(),
          });
          return { matched: true, matchId };
        }
        return { matched: true, matchId: existingMatch._id };
      }

      const theirLike = await ctx.db
        .query("swipes")
        .withIndex("by_swiper_and_swiped", (q) => q.eq("swiperId", swipedId).eq("swipedId", swiperId))
        .first();

      if (theirLike && theirLike.action === "like") {
        const matchId = await ctx.db.insert("matches", {
          user1Id: swiperId,
          user2Id: swipedId,
          matchedAt: Date.now(),
        });
        return { matched: true, matchId };
      }
    }

    return { matched: false, matchId: null };
  },
});

export const resetSwipes = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const swipes = await ctx.db
      .query("swipes")
      .withIndex("by_swiper", (q) => q.eq("swiperId", userId))
      .collect();
    await Promise.all(swipes.map((swipe) => ctx.db.delete(swipe._id)));
    return { deleted: swipes.length };
  },
});

export const getMyMatches = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const asUser1 = await ctx.db
      .query("matches")
      .withIndex("by_user1", (q) => q.eq("user1Id", userId))
      .collect();
    const asUser2 = await ctx.db
      .query("matches")
      .withIndex("by_user2", (q) => q.eq("user2Id", userId))
      .collect();
    const allMatches = [...asUser1, ...asUser2];

    const results = await Promise.all(
      allMatches.map(async (match) => {
        const otherId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const otherUser = await ctx.db.get(otherId);
        return { match, otherUser };
      })
    );

    return results;
  },
});
