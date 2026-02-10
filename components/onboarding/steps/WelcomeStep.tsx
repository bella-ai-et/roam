import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColors } from "@/lib/theme";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[AppColors.primary, AppColors.primaryDark, AppColors.background.dark]}
      locations={[0, 0.4, 1]}
      style={styles.container}
    >
      <View style={styles.overlay} />

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Ionicons name="location" size={48} color="white" style={styles.icon} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.title}>
          Roam
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.subtitle}>
          Find your people{"\n"}on the road
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.featureList}>
          <FeatureItem text="Match by overlapping travel routes" />
          <FeatureItem text="Connect with verified van lifers" />
          <FeatureItem text="Get help building your van" />
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View entering={FadeInDown.delay(800).duration(500)} style={styles.buttonWrapper}>
          <Pressable style={styles.button} onPress={onNext}>
            <Text style={styles.buttonText}>Apply to Join</Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name="checkmark-circle" size={24} color="#4CD964" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 56,
    fontWeight: "800",
    color: "white",
    letterSpacing: -2,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 22,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 48,
  },
  featureList: {
    gap: 14,
    width: "100%",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 17,
    color: "white",
    fontWeight: "500",
  },
  spacer: {
    flex: 1,
  },
  buttonWrapper: {
    width: "100%",
  },
  button: {
    backgroundColor: "white",
    width: "100%",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: AppColors.primary,
    fontSize: 17,
    fontWeight: "700",
  },
});
