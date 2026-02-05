import { defineSchema, defineTable } from "convex/server"; 
import { v } from "convex/values"; 

export default defineSchema({ 
  users: defineTable({ 
    clerkId: v.string(), 
    name: v.string(), 
    dateOfBirth: v.number(), 
    gender: v.string(), 
    bio: v.optional(v.string()), 
    photos: v.array(v.string()), 
    interests: v.array(v.string()), 
    lookingFor: v.array(v.string()), 
    vanType: v.optional(v.string()), 
    vanBuildStatus: v.optional(v.string()), 
    vanVerified: v.boolean(), 
    vanPhotoUrl: v.optional(v.string()), 
    currentRoute: v.optional(v.array(v.object({ 
      location: v.object({ latitude: v.number(), longitude: v.number(), name: v.string() }), 
      arrivalDate: v.string(), 
      departureDate: v.string(), 
      notes: v.optional(v.string()), 
      role: v.optional(v.string()),
      intent: v.optional(v.string()),
      destinationType: v.optional(v.string()),
    }))), 
  }).index("by_clerkId", ["clerkId"]), 
  swipes: defineTable({ 
    swiperId: v.id("users"), 
    swipedId: v.id("users"), 
    action: v.string(), 
    createdAt: v.number(), 
  })
    .index("by_swiper", ["swiperId"])
    .index("by_swiper_and_swiped", ["swiperId", "swipedId"]),
  matches: defineTable({ 
    user1Id: v.id("users"), 
    user2Id: v.id("users"), 
    matchedAt: v.number(), 
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"]),
  messages: defineTable({
    matchId: v.id("matches"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    read: v.boolean(),
  })
    .index("by_match", ["matchId"])
    .index("by_match_created", ["matchId", "createdAt"]),
  posts: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    vanType: v.optional(v.string()),
    photos: v.array(v.string()),
    upvotes: v.number(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_author", ["authorId"]),
  replies: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    photos: v.array(v.string()),
    upvotes: v.number(),
    isHelpful: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"]),
});
