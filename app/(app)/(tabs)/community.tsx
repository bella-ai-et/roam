import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";

export default function CommunityScreen() { 
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="Community" />
      <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
        <Ionicons name="people-outline" size={64} color={colors.primary} />
        <Text style={[styles.title, { color: colors.onBackground }]}>Build Help</Text>
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          A place to ask questions, share your build, and help fellow van lifers.
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
