import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GlassButton } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";

export default function CompleteScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startAnimations = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [pulseAnim, scaleAnim]);

  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

  const handleStartExploring = () => {
    router.push("/(app)/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.checkCircle,
            {
              backgroundColor: "#34C759",
              transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="checkmark" size={40} color="#FFFFFF" />
        </Animated.View>

        <Text style={[styles.title, { color: colors.onSurface, marginTop: 32 }]}>
          You are all set!
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Your Roam profile is live
        </Text>

        <View style={styles.buttonContainer}>
          <GlassButton title="Start Exploring" onPress={handleStartExploring} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 48,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
  },
});
