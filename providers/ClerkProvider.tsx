import { tokenCache } from "@/lib/auth";
import { ClerkLoaded, ClerkProvider as ClerkProviderBase } from "@clerk/clerk-expo";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
if (!clerkPublishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables");
}

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProviderBase publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>{children}</ClerkLoaded>
    </ClerkProviderBase>
  );
}
