import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";

import { GlassHeader, GlassButton, GlassChip } from "@/components/glass";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppTheme } from "@/lib/theme";
import { TRAVEL_STYLES } from "@/lib/constants";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/convex/_generated/api";

export default function TravelStylesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);

  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>(currentUser?.travelStyles ?? []);

  useEffect(() => {
    if (!currentUser) return;
    setSelected(currentUser.travelStyles ?? []);
  }, [currentUser]);

  const items = useMemo(() => TRAVEL_STYLES, []);

  const toggle = (value: string) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleContinue = async () => {
    if (!currentUser?._id) return;
    setSaving(true);
    try {
      await updateProfile({ userId: currentUser._id, travelStyles: selected });
      router.push("/(app)/onboarding/verification" as never);
    } catch {
      Alert.alert("Error", "Failed to save travel styles.");
    } finally {
      setSaving(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        title="Your travel style"
        leftContent={
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: 100 }]}
      >
        <ProgressBar current={2} total={7} />

        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Pick anything that fits you</Text>

        <View style={styles.grid}>
          {items.map((item) => (
            <GlassChip
              key={item.value}
              label={item.label}
              emoji={item.emoji}
              selected={selected.includes(item.value)}
              onPress={() => toggle(item.value)}
              style={styles.chip}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <GlassButton title="Continue" onPress={handleContinue} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 8,
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    marginBottom: 0,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
