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
    }))), 
  }).index("by_clerkId", ["clerkId"]), 
});
