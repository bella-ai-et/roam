import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";

import { GlassHeader, GlassButton, GlassChip } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/convex/_generated/api";
import { INTERESTS, MAX_INTERESTS, MIN_INTERESTS } from "@/lib/constants";

export default function EditInterestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);

  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setInterests(currentUser.interests ?? []);
  }, [currentUser]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((item) => item !== interest);
      }
      if (prev.length >= MAX_INTERESTS) {
        return prev;
      }
      return [...prev, interest];
    });
  };

  const handleSave = async () => {
    if (!currentUser?._id) return;
    if (interests.length < MIN_INTERESTS) {
      Alert.alert(`Select at least ${MIN_INTERESTS} interests`);
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        userId: currentUser._id,
        interests,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save interests");
    } finally {
      setSaving(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        title="Interests"
        leftContent={
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 120 },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.helpText, { color: colors.onSurfaceVariant }]}>
            Select {MIN_INTERESTS} to {MAX_INTERESTS} interests that describe what you love doing on the road.
          </Text>
          <Text style={[styles.counter, { color: colors.primary }]}>
            {interests.length}/{MAX_INTERESTS} selected
          </Text>
        </View>

        <View style={styles.chipGrid}>
          {INTERESTS.map((interest) => (
            <GlassChip
              key={interest.name}
              label={interest.name}
              emoji={interest.emoji}
              selected={interests.includes(interest.name)}
              onPress={() => toggleInterest(interest.name)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24), backgroundColor: colors.background }]}>
        <GlassButton title="Save Changes" onPress={handleSave} loading={saving} />
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
  header: {
    marginBottom: 24,
  },
  helpText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  counter: {
    fontSize: 14,
    fontWeight: "700",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});
