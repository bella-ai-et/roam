import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";

interface GlassHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function GlassHeader({
  title,
  subtitle,
  leftContent,
  rightContent,
}: GlassHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <AdaptiveGlassView
      style={[
        styles.container,
        { paddingTop: insets.top + 12 },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.sideContent}>{leftContent}</View>
        
        <View style={styles.centerContent}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.sideContent}>{rightContent}</View>
      </View>
    </AdaptiveGlassView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingBottom: 16,
    paddingHorizontal: 20,
    zIndex: 10,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sideContent: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: "center",
  },
});
