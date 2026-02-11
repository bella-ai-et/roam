import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Queries ────────────────────────────────────────────────────────

export const getPosts = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, { category }) => {
    let posts;
    if (category) {
      posts = await ctx.db.query("posts").withIndex("by_category", (q) => q.eq("category", category)).collect();
    } else {
      posts = await ctx.db.query("posts").collect();
    }
    posts.sort((a, b) => b.createdAt - a.createdAt);

    const results = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const replies = await ctx.db.query("replies").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
        const reactions = await ctx.db.query("reactions").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
        const rsvps = post.postType === "meetup"
          ? await ctx.db.query("rsvps").withIndex("by_post", (q) => q.eq("postId", post._id)).collect()
          : [];
        const rsvpUsers = await Promise.all(rsvps.map(async (r) => {
          const u = await ctx.db.get(r.userId);
          return u ? { _id: u._id, name: u.name, photos: u.photos } : null;
        }));
        return {
          post,
          author,
          replyCount: replies.length,
          reactionCounts: {
            helpful: reactions.filter((r) => r.type === "helpful").length,
            been_there: reactions.filter((r) => r.type === "been_there").length,
            save: reactions.filter((r) => r.type === "save").length,
          },
          rsvpCount: rsvps.length,
          rsvpAvatars: rsvpUsers.filter(Boolean).slice(0, 3),
        };
      })
    );

    return results;
  },
});

export const getTrendingPosts = query({
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    const scored = await Promise.all(
      posts.map(async (post) => {
        const replies = await ctx.db.query("replies").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
        const reactions = await ctx.db.query("reactions").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
        const ageHours = (Date.now() - post.createdAt) / 3_600_000;
        const decay = Math.max(1, ageHours / 24);
        const score = (reactions.length * 2 + replies.length * 3 + post.upvotes) / decay;
        return { post, score, replyCount: replies.length, reactionCount: reactions.length };
      })
    );
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 10);
    const results = await Promise.all(
      top.map(async ({ post, replyCount }) => {
        const author = await ctx.db.get(post.authorId);
        const reactions = await ctx.db.query("reactions").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
        return {
          post,
          author,
          replyCount,
          reactionCounts: {
            helpful: reactions.filter((r) => r.type === "helpful").length,
            been_there: reactions.filter((r) => r.type === "been_there").length,
            save: reactions.filter((r) => r.type === "save").length,
          },
          rsvpCount: 0,
          rsvpAvatars: [],
        };
      })
    );
    return results;
  },
});

export const getPost = query({
  args: { postId: v.id("posts"), userId: v.optional(v.id("users")) },
  handler: async (ctx, { postId, userId }) => {
    const post = await ctx.db.get(postId);
    if (!post) return null;
    const author = await ctx.db.get(post.authorId);
    const replies = await ctx.db.query("replies").withIndex("by_post", (q) => q.eq("postId", postId)).collect();
    replies.sort((a, b) => a.createdAt - b.createdAt);

    const enrichedReplies = await Promise.all(
      replies.map(async (reply) => {
        const replyAuthor = await ctx.db.get(reply.authorId);
        return { reply, author: replyAuthor };
      })
    );

    const allReactions = await ctx.db.query("reactions").withIndex("by_post", (q) => q.eq("postId", postId)).collect();
    const reactionCounts = {
      helpful: allReactions.filter((r) => r.type === "helpful").length,
      been_there: allReactions.filter((r) => r.type === "been_there").length,
      save: allReactions.filter((r) => r.type === "save").length,
    };
    const myReactions = userId
      ? allReactions.filter((r) => r.userId === userId).map((r) => r.type)
      : [];

    const rsvps = post.postType === "meetup"
      ? await ctx.db.query("rsvps").withIndex("by_post", (q) => q.eq("postId", postId)).collect()
      : [];
    const rsvpUsers = await Promise.all(rsvps.map(async (r) => {
      const u = await ctx.db.get(r.userId);
      return u ? { _id: u._id, name: u.name, photos: u.photos } : null;
    }));
    const myRsvp = userId ? rsvps.some((r) => r.userId === userId) : false;

    return {
      post,
      author,
      replies: enrichedReplies,
      reactionCounts,
      myReactions,
      rsvpCount: rsvps.length,
      rsvpUsers: rsvpUsers.filter(Boolean),
      myRsvp,
    };
  },
});

export const getSavedPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const saves = await ctx.db.query("reactions").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    const savedReactions = saves.filter((r) => r.type === "save");
    const results = await Promise.all(
      savedReactions.map(async (reaction) => {
        const post = await ctx.db.get(reaction.postId);
        if (!post) return null;
        const author = await ctx.db.get(post.authorId);
        const replies = await ctx.db.query("replies").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
        return { post, author, replyCount: replies.length };
      })
    );
    return results.filter(Boolean);
  },
});

// ─── Mutations ──────────────────────────────────────────────────────

export const createPost = mutation({
  args: {
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    postType: v.optional(v.string()),
    vanType: v.optional(v.string()),
    photos: v.array(v.string()),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      name: v.string(),
    })),
    rating: v.optional(v.number()),
    amenities: v.optional(v.array(v.string())),
    meetupDate: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", { ...args, upvotes: 0, createdAt: Date.now() });
  },
});

export const upvotePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (post) await ctx.db.patch(postId, { upvotes: post.upvotes + 1 });
  },
});

export const toggleReaction = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
    type: v.string(), // "helpful" | "been_there" | "save"
  },
  handler: async (ctx, { postId, userId, type }) => {
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_post_user", (q) => q.eq("postId", postId).eq("userId", userId))
      .collect();
    const match = existing.find((r) => r.type === type);
    if (match) {
      await ctx.db.delete(match._id);
      return { action: "removed" };
    }
    await ctx.db.insert("reactions", { postId, userId, type, createdAt: Date.now() });
    return { action: "added" };
  },
});

export const toggleRsvp = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, { postId, userId }) => {
    const existing = await ctx.db
      .query("rsvps")
      .withIndex("by_post_user", (q) => q.eq("postId", postId).eq("userId", userId))
      .collect();
    if (existing.length > 0) {
      await ctx.db.delete(existing[0]._id);
      return { action: "removed" };
    }
    const post = await ctx.db.get(postId);
    if (post?.maxAttendees) {
      const all = await ctx.db.query("rsvps").withIndex("by_post", (q) => q.eq("postId", postId)).collect();
      if (all.length >= post.maxAttendees) return { action: "full" };
    }
    await ctx.db.insert("rsvps", { postId, userId, createdAt: Date.now() });
    return { action: "added" };
  },
});

export const addReply = mutation({
  args: {
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    photos: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("replies", { ...args, upvotes: 0, isHelpful: false, createdAt: Date.now() });
  },
});

export const upvoteReply = mutation({
  args: { replyId: v.id("replies") },
  handler: async (ctx, { replyId }) => {
    const reply = await ctx.db.get(replyId);
    if (reply) await ctx.db.patch(replyId, { upvotes: reply.upvotes + 1 });
  },
});

export const markHelpful = mutation({
  args: { replyId: v.id("replies") },
  handler: async (ctx, { replyId }) => {
    await ctx.db.patch(replyId, { isHelpful: true });
  },
});
