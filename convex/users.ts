import { mutation, query } from "./_generated/server"; 
import { v } from "convex/values"; 

export const getByClerkId = query({ 
  args: { clerkId: v.string() }, 
  handler: async (ctx, { clerkId }) => { 
    return await ctx.db.query("users").filter((q) => q.eq(q.field("clerkId"), clerkId)).first(); 
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
    currentRoute: v.optional(v.array(v.object({ 
      location: v.object({ latitude: v.number(), longitude: v.number(), name: v.string() }), 
      arrivalDate: v.string(), 
      departureDate: v.string(), 
      notes: v.optional(v.string()), 
      role: v.optional(v.string()),
      intent: v.optional(v.string()),
      destinationType: v.optional(v.string()),
      status: v.optional(v.string()),
    }))),
    travelStyles: v.optional(v.array(v.string())),
    lifestyleLabel: v.optional(v.string()),
  }, 
  handler: async (ctx, args) => { 
    return await ctx.db.insert("users", { ...args, bio: undefined }); 
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
  }, 
  handler: async (ctx, { userId, ...updates }) => { 
    const filtered = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined)); 
    await ctx.db.patch(userId, filtered); 
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
    await ctx.db.patch(userId, { currentRoute: route }); 
  }, 
});
