import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors, useAppTheme } from "@/lib/theme";

interface PathVisibilityCardProps {
  visibility: string;
  onChangeVisibility: () => void;
}

const VISIBILITY_LABELS: Record<string, string> = {
  everyone: "Visible to everyone",
  verified_syncs: "Visible to Verified Syncs only",
  private: "Hidden from Discovery",
};

export function PathVisibilityCard({ visibility, onChangeVisibility }: PathVisibilityCardProps) {
  const { isDark } = useAppTheme();
  const label = VISIBILITY_LABELS[visibility] ?? VISIBILITY_LABELS.everyone;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "rgba(232,155,116,0.1)" : "rgba(232,155,116,0.05)",
          borderColor: isDark ? "rgba(232,155,116,0.2)" : "rgba(232,155,116,0.1)",
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          <View style={[styles.iconBox, { backgroundColor: `${AppColors.accentOrange}20` }]}>
            <Ionicons name="share-social" size={20} color={AppColors.accentOrange} />
          </View>
          <View>
            <Text style={[styles.title, { color: isDark ? "#fff" : "#1e293b" }]}>
              Path Visibility
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? "#94a3b8" : "#64748b" }]}>
              {label}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onChangeVisibility}
          style={[styles.changeButton, { backgroundColor: AppColors.accentOrange }]}
        >
          <Text style={styles.changeButtonText}>CHANGE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 24,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  changeButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});
