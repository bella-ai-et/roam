import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCurrentUser() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  return { currentUser, clerkUser: user };
}
