import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
  args: {
    matchId: v.id("matches"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, { matchId, senderId, content }) => {
    return await ctx.db.insert("messages", {
      matchId,
      senderId,
      content,
      createdAt: Date.now(),
      read: false,
    });
  },
});

export const getMessages = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_match_created", (q) => q.eq("matchId", matchId))
      .collect();
    messages.sort((a, b) => a.createdAt - b.createdAt);
    return messages;
  },
});

export const markMessagesRead = mutation({
  args: { matchId: v.id("matches"), readerId: v.id("users") },
  handler: async (ctx, { matchId, readerId }) => {
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_match", (q) => q.eq("matchId", matchId))
      .filter((q) => q.and(q.eq(q.field("read"), false), q.neq(q.field("senderId"), readerId)))
      .collect();
    for (const msg of unread) {
      await ctx.db.patch(msg._id, { read: true });
    }
  },
});

export const getMatchesWithLastMessage = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
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
        return { match, otherUser, lastMessage, unreadCount };
      })
    );

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
