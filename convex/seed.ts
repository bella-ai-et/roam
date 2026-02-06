import { mutation } from "./_generated/server";
import abuDhabiProfiles, { type DemoRouteStop } from "./sampleData/abuDhabiProfiles";

const toClerkId = (name: string) =>
  `seed-abu-dhabi-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;

const toRoute = (route: DemoRouteStop[]) =>
  route.map((stop) => ({
    location: {
      latitude: stop.latitude,
      longitude: stop.longitude,
      name: stop.location,
    },
    arrivalDate: new Date(stop.startDate).toISOString(),
    departureDate: new Date(stop.endDate).toISOString(),
  }));

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const insertedIds: string[] = [];
    for (const profile of abuDhabiProfiles) {
      const clerkId = toClerkId(profile.name);
      const existing = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
        .first();
      if (existing) {
        continue;
      }
      const id = await ctx.db.insert("users", {
        clerkId,
        name: profile.name,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        bio: profile.bio,
        photos: profile.photos,
        interests: profile.interests,
        lookingFor: profile.lookingFor,
        vanType: profile.vanType,
        vanBuildStatus: profile.vanBuildStatus,
        vanVerified: profile.verified,
        vanPhotoUrl: undefined,
        currentRoute: toRoute(profile.currentRoute),
      });
      insertedIds.push(id);
    }
    return { inserted: insertedIds.length };
  },
});
