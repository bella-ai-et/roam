import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";

import { GlassHeader, GlassButton, GlassChip } from "@/components/glass";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppTheme } from "@/lib/theme";
import { hapticWarning } from "@/lib/haptics";
import { INTERESTS, MIN_INTERESTS, MAX_INTERESTS } from "@/lib/constants";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/convex/_generated/api";

export default function InterestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const [saving, setSaving] = useState(false);

  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentUser?.interests || []);

  useEffect(() => {
    if (!currentUser) return;
    setSelectedInterests(currentUser.interests ?? []);
  }, [currentUser]);

  const toggleInterest = (interestName: string) => {
    setSelectedInterests(prev => {
      const exists = prev.includes(interestName);
      if (exists) {
        return prev.filter(item => item !== interestName);
      } else {
        if (prev.length >= MAX_INTERESTS) {
          hapticWarning();
          return prev;
        }
        return [...prev, interestName];
      }
    });
    // hapticSelection is handled inside GlassChip if we use it, 
    // but GlassChip prop says onPress: () => void, and it calls hapticSelection internally.
    // So we don't need to call it here if we use GlassChip.
  };

  const handleContinue = async () => {
    if (!currentUser?._id) return;
    setSaving(true);
    try {
      await updateProfile({ userId: currentUser._id, interests: selectedInterests });
      router.push("/(app)/onboarding/van-details");
    } catch {
      Alert.alert("Error", "Failed to save your interests.");
    } finally {
      setSaving(false);
    }
  };

  const isValid = selectedInterests.length >= MIN_INTERESTS && selectedInterests.length <= MAX_INTERESTS;
  const isTooFew = selectedInterests.length < MIN_INTERESTS;

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
        title="What do you enjoy?"
        leftContent={
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        }
      />

      <ScrollView 
        contentContainerStyle={[
          styles.content, 
          { paddingTop: insets.top + 60, paddingBottom: 100 }
        ]}
      >
        <ProgressBar current={5} total={9} />

        <View style={styles.headerRow}>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Pick {MIN_INTERESTS} to {MAX_INTERESTS} activities
          </Text>
          <View style={[
            styles.badge, 
            { backgroundColor: isTooFew ? `${colors.reject}26` : `${colors.like}26` } // 26 is ~15% opacity
          ]}>
            <Text style={[
              styles.badgeText, 
              { color: isTooFew ? colors.reject : colors.like }
            ]}>
              {selectedInterests.length} selected
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {INTERESTS.map((item) => (
            <GlassChip
              key={item.name}
              label={item.name}
              emoji={item.emoji}
              selected={selectedInterests.includes(item.name)}
              onPress={() => toggleInterest(item.name)}
              style={styles.chip}
            />
          ))}
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          disabled={!isValid || saving}
          loading={saving}
        />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    marginBottom: 0, // Override default margin if needed, flexWrap handles gap
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
