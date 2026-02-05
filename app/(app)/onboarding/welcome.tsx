import { useRouter } from "expo-router";
import React from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#E8724A", "#D45A2E", "#0F0F0F"]}
      locations={[0, 0.4, 1]}
      style={styles.container}
    >
      <View style={styles.overlay} />

      <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Ionicons name="location" size={48} color="white" style={styles.icon} />
        
        <Text style={styles.title}>Roam</Text>
        
        <Text style={styles.subtitle}>
          Find your people{"\n"}on the road
        </Text>

        <View style={styles.featureList}>
          <FeatureItem text="Match by overlapping travel routes" />
          <FeatureItem text="Connect with verified van lifers" />
          <FeatureItem text="Get help building your van" />
        </View>

        <View style={styles.spacer} />

        <Pressable
          style={styles.button}
          onPress={() => router.push("/(app)/onboarding/profile")}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
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
    color: "#E8724A",
    fontSize: 17,
    fontWeight: "700",
  },
});
