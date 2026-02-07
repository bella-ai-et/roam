import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { AppColors, useAppTheme } from "@/lib/theme";

export type ProfileTab = "routes" | "bio" | "media";

interface ProfileTabBarProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "routes", label: "My Routes" },
  { key: "bio", label: "Bio & Info" },
  { key: "media", label: "Media" },
];

export function ProfileTabBar({ activeTab, onTabChange }: ProfileTabBarProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isActive
                    ? { color: AppColors.primary, fontWeight: "700" }
                    : { color: colors.onSurfaceVariant, fontWeight: "500" },
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.indicator,
                  {
                    backgroundColor: isActive ? AppColors.primary : "transparent",
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.separatorLine, { backgroundColor: colors.outline + "30" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  tabRow: {
    flexDirection: "row",
    gap: 32,
  },
  tab: {
    paddingTop: 12,
    paddingBottom: 0,
  },
  tabLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  indicator: {
    height: 3,
    borderRadius: 1.5,
    width: "100%",
  },
  separatorLine: {
    height: 1,
    width: "100%",
    marginTop: -1,
  },
});
