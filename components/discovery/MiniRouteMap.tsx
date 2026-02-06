import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";
import { AppColors } from "@/lib/theme";
import { MINI_MAP_SIZE } from "@/lib/constants";

interface MiniRouteMapProps {
  /** First photo storage ID or URL for avatar thumbnail */
  avatarStorageId?: string;
  /** Avatar component to render (e.g. small circular image) */
  avatarElement: React.ReactNode;
  onExpand?: () => void;
}

/**
 * Small route map widget for the discovery card.
 * Renders a placeholder (route line + avatar + expand). When expo-maps is added,
 * replace the placeholder with a MapView and polyline from currentRoute coordinates.
 */
export function MiniRouteMap({ avatarElement, onExpand }: MiniRouteMapProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { borderColor: colors.surface }]}>
      <View style={[styles.placeholder, { backgroundColor: colors.surfaceVariant }]} />
      {/* Dashed path representation: simple diagonal line placeholder (use MapView + polyline when expo-maps is available) */}
      <View style={styles.pathLine}>
        <View style={[styles.pathSegment, { backgroundColor: AppColors.primary, opacity: 0.9 }]} />
        <View style={[styles.pathSegment, styles.pathSegment2, { backgroundColor: AppColors.primary, opacity: 0.6 }]} />
        <View style={[styles.pathSegment, styles.pathSegment3, { backgroundColor: AppColors.primary, opacity: 0.9 }]} />
      </View>
      <View style={styles.avatarWrap}>{avatarElement}</View>
      {onExpand && (
        <Pressable style={[styles.expandButton, { backgroundColor: "rgba(0,0,0,0.4)" }]} onPress={onExpand}>
          <Ionicons name="expand" size={14} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: MINI_MAP_SIZE,
    height: MINI_MAP_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  pathLine: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
  },
  pathSegment: {
    position: "absolute",
    height: 2,
    borderRadius: 1,
    width: "40%",
    top: "70%",
    left: "10%",
    transform: [{ rotate: "-30deg" }],
  },
  pathSegment2: {
    width: "35%",
    top: "45%",
    left: "35%",
    transform: [{ rotate: "10deg" }],
  },
  pathSegment3: {
    width: "30%",
    top: "20%",
    left: "60%",
    transform: [{ rotate: "-20deg" }],
  },
  avatarWrap: {
    position: "absolute",
    bottom: 6,
    right: 6,
  },
  expandButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    padding: 4,
    borderRadius: 6,
  },
});
