import { useQuery } from "convex/react";
import { Stack } from "expo-router";
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!hasProfile && <Stack.Screen name="onboarding" options={{ headerShown: false }} />}
      {hasProfile && <Stack.Screen name="(tabs)" options={{ headerShown: false }} />}
      {hasProfile && (
        <Stack.Screen
          name="edit-profile"
          options={{ headerShown: true, title: "Edit Profile", presentation: "modal" }}
        />
      )}
      {hasProfile && <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: "Chat" }} />}
      {hasProfile && <Stack.Screen name="community/[id]" options={{ headerShown: false }} />}
      {hasProfile && <Stack.Screen name="community/create" options={{ headerShown: false }} />}
      {hasProfile && <Stack.Screen name="profile/[id]" options={{ presentation: "modal" }} />}
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
