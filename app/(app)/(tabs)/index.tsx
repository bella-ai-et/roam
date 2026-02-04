import React, { useEffect, useRef } from "react";
import { Text, View, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassHeader } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";

export default function DiscoverScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="Discover" />
      <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Ionicons name="map-outline" size={64} color={colors.primary} />
        </Animated.View>
        <Text style={[styles.title, { color: colors.onBackground }]}>Route Matching</Text>
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          We{"'"}re finding nomads on overlapping travel routes. Check back soon.
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
