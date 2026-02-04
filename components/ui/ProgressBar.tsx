import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useAppTheme } from "@/lib/theme";

interface ProgressBarProps {
  current: number;
  total: number;
  style?: ViewStyle;
}

export function ProgressBar({ current, total, style }: ProgressBarProps) {
  const { colors } = useAppTheme();
  
  // Ensure we don't divide by zero and clamp between 0 and 100
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: colors.surfaceVariant },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor: colors.primary,
            width: `${percentage}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    width: "100%",
    marginBottom: 24,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});
