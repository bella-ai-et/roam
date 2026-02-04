import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
        return { post, author, replyCount: replies.length };
      })
    );

    return results;
  },
});

export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
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

    return { post, author, replies: enrichedReplies };
  },
});

export const createPost = mutation({
  args: {
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    vanType: v.optional(v.string()),
    photos: v.array(v.string()),
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
