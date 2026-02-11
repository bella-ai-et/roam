import { useQuery } from "convex/react";
import { Stack, Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { api } from "@/convex/_generated/api"; 
import { useAppTheme } from "@/lib/theme";     
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AppLayout() {
  const { clerkUser } = useCurrentUser();
  const { colors } = useAppTheme();

  const profile = useQuery(
    api.users.getByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  if (profile === undefined) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasProfile = profile !== null;
  const onboardingDone = hasProfile && profile.onboardingComplete === true;
  const isApproved = onboardingDone && (profile.applicationStatus ?? "approved") === "approved";
  const hasRoute = isApproved && (profile.currentRoute?.length ?? 0) > 0;

  // Determine which route to show
  let targetRoute = "/(tabs)";
  if (!hasProfile || !onboardingDone) {
    targetRoute = "/onboarding";
  } else if (!isApproved) {
    targetRoute = "/(pending)";
  } else if (!hasRoute) {
    targetRoute = "/(planning)";
  }

  return (
    <>
      <Redirect href={targetRoute as any} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(pending)" options={{ headerShown: false }} />
        <Stack.Screen name="(planning)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Edit screens — available to both pending and approved users */}
      {hasProfile && onboardingDone && (
        <Stack.Screen
          name="edit-profile"
          options={{ headerShown: true, title: "Edit Profile", presentation: "modal" }}
        />
      )}
      {hasProfile && onboardingDone && <Stack.Screen name="settings" options={{ headerShown: false }} />}
      {hasProfile && onboardingDone && <Stack.Screen name="edit-about" options={{ headerShown: false }} />}
      {hasProfile && onboardingDone && <Stack.Screen name="edit-interests" options={{ headerShown: false }} />}
      {hasProfile && onboardingDone && <Stack.Screen name="edit-photos" options={{ headerShown: false }} />}
      {hasProfile && onboardingDone && <Stack.Screen name="edit-van" options={{ headerShown: false }} />}
      {hasProfile && onboardingDone && <Stack.Screen name="edit-looking-for" options={{ headerShown: false }} />}
      {isApproved && <Stack.Screen name="edit-route" options={{ headerShown: false }} />}

      {/* Approved-only screens (require tabs access) */}
      {isApproved && <Stack.Screen name="profile/[userId]" options={{ headerShown: false }} />}
      {isApproved && <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />}
      {isApproved && <Stack.Screen name="community/[id]" options={{ headerShown: false }} />}
      {isApproved && <Stack.Screen name="community/create" options={{ headerShown: false }} />}
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
