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

    await ctx.db.insert("swipes", { swiperId, swipedId, action, createdAt: Date.now() });

    if (action === "like") {
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
