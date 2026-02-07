import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/lib/theme";
import { GlassChip } from "@/components/glass";
import { AdaptiveGlassView } from "@/lib/glass";
import { INTERESTS, VAN_TYPES, VAN_BUILD_STATUSES, TRAVEL_STYLES } from "@/lib/constants";
import { hapticButtonPress } from "@/lib/haptics";
import type { Doc } from "@/convex/_generated/dataModel";

interface BioInfoTabProps {
  user: Doc<"users">;
}

export function BioInfoTab({ user }: BioInfoTabProps) {
  const { colors } = useAppTheme();
  const router = useRouter();

  const interests = useMemo(
    () =>
      (user.interests ?? []).map((interest) => {
        const match = INTERESTS.find((item) => item.name === interest);
        return { name: interest, emoji: match?.emoji };
      }),
    [user.interests]
  );

  const vanType = useMemo(
    () => VAN_TYPES.find((type) => type.value === user.vanType),
    [user.vanType]
  );

  const vanBuildStatus = useMemo(
    () => VAN_BUILD_STATUSES.find((status) => status.value === user.vanBuildStatus),
    [user.vanBuildStatus]
  );

  const travelStyles = useMemo(
    () =>
      (user.travelStyles ?? []).map((v) => {
        const match = TRAVEL_STYLES.find((t) => t.value === v);
        return { value: v, label: match?.label ?? v, emoji: match?.emoji ?? "🚐" };
      }),
    [user.travelStyles]
  );

  const lookingForChips = useMemo(() => {
    const values = user.lookingFor ?? [];
    return values.map((value) => {
      if (value === "dating") {
        return { value, label: "Dating", color: colors.primary, textColor: colors.onPrimary };
      }
      if (value === "friends") {
        return { value, label: "Friends", color: colors.secondary, textColor: colors.onSecondary };
      }
      if (value === "van_help" || value === "vanhelp") {
        return { value, label: "Van Help", color: colors.accent, textColor: colors.onBackground };
      }
      return { value, label: value, color: colors.surfaceVariant, textColor: colors.onSurfaceVariant };
    });
  }, [user.lookingFor, colors]);

  const nav = (path: string) => {
    hapticButtonPress();
    router.push(path as never);
  };

  return (
    <View style={styles.container}>
      {/* About Me */}
      <Pressable onPress={() => nav("/(app)/edit-about")} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>About Me</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
        </View>
        {user.bio ? (
          <Text style={[styles.bio, { color: colors.onSurfaceVariant }]} numberOfLines={4}>
            {user.bio}
          </Text>
        ) : (
          <Text style={[styles.bioMuted, { color: colors.onSurfaceVariant }]}>
            Add a bio to your profile
          </Text>
        )}
      </Pressable>

      {/* Interests */}
      <Pressable onPress={() => nav("/(app)/edit-interests")} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Interests</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
        </View>
        {interests.length > 0 ? (
          <View style={styles.chipRow}>
            {interests.map((interest) => (
              <GlassChip
                key={interest.name}
                label={interest.name}
                emoji={interest.emoji}
                selected
                onPress={() => {}}
                disabled
              />
            ))}
          </View>
        ) : (
          <Text style={[styles.bioMuted, { color: colors.onSurfaceVariant }]}>
            Add your interests
          </Text>
        )}
      </Pressable>

      {/* My Van */}
      <Pressable onPress={() => nav("/(app)/edit-van")} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>My Van</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
        </View>
        <AdaptiveGlassView style={styles.vanCard}>
          <View style={styles.vanRow}>
            <View style={styles.vanLabelRow}>
              <Text style={styles.vanEmoji}>{vanType?.emoji ?? "🚐"}</Text>
              <Text style={[styles.vanLabel, { color: colors.onBackground }]}>
                {vanType?.label ?? "Van type not set"}
              </Text>
            </View>
            <Text style={[styles.vanStatus, { color: colors.onSurfaceVariant }]}>
              {vanBuildStatus?.label ?? "Build status not set"}
            </Text>
          </View>
        </AdaptiveGlassView>
      </Pressable>

      {/* Travel Styles */}
      {travelStyles.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Travel Style</Text>
          <View style={styles.chipRow}>
            {travelStyles.map((style) => (
              <View
                key={style.value}
                style={[styles.travelPill, { backgroundColor: colors.surfaceVariant }]}
              >
                <Text style={styles.travelEmoji}>{style.emoji}</Text>
                <Text style={[styles.travelText, { color: colors.onSurfaceVariant }]}>
                  {style.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Looking For */}
      <Pressable onPress={() => nav("/(app)/edit-looking-for")} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Looking For</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
        </View>
        {lookingForChips.length > 0 ? (
          <View style={styles.chipRow}>
            {lookingForChips.map((chip) => (
              <View key={chip.value} style={[styles.lookingForChip, { backgroundColor: chip.color }]}>
                <Text style={[styles.lookingForText, { color: chip.textColor }]}>{chip.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.bioMuted, { color: colors.onSurfaceVariant }]}>
            What are you looking for?
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },
  bioMuted: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  vanCard: {
    borderRadius: 18,
    padding: 20,
  },
  vanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vanLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vanEmoji: {
    fontSize: 20,
  },
  vanLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
  vanStatus: {
    fontSize: 14,
    fontWeight: "600",
  },
  travelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  travelEmoji: {
    fontSize: 14,
  },
  travelText: {
    fontSize: 12,
    fontWeight: "500",
  },
  lookingForChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  lookingForText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
