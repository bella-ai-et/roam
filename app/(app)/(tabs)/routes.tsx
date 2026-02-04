import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";

export default function RoutesScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="Routes" />
      <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
        <Ionicons name="map" size={64} color={colors.primary} />
        <Text style={[styles.title, { color: colors.onBackground }]}>Your Matches</Text>
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          Once you start swiping, your matches and shared routes will appear here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 22,
  },
});
