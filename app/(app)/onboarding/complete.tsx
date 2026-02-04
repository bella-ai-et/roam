import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";

import { GlassButton } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";
import { getOnboardingData, resetOnboardingData } from "@/lib/onboardingState";
import { api } from "@/convex/_generated/api";
import { hapticSuccess, hapticError } from "@/lib/haptics";

export default function CompleteScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { userId: clerkId } = useAuth();
  const createProfile = useMutation(api.users.createProfile);
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    submitProfile();
  }, []);

  useEffect(() => {
    if (status === "success") {
      startAnimations();
    }
  }, [status]);

  const submitProfile = async () => {
    try {
      setStatus("loading");
      setErrorMsg(null);
      
      const data = getOnboardingData();
      console.log("Submitting onboarding data:", JSON.stringify(data, null, 2));
      
      if (!clerkId) throw new Error("No authentication found");
      
      // Check for missing required fields and redirect if necessary
      if (!data.name || !data.dateOfBirth || !data.gender) {
        console.log("Missing required fields, redirecting to profile...");
        // Use replace to prevent going back to complete screen
        router.replace("/(app)/onboarding/profile");
        return;
      }

      // Clean undefined fields if necessary, or let convex handle optional ones
      // We assume data is valid based on previous screen checks
      
      await createProfile({
        clerkId,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        photos: data.photos || [],
        interests: data.interests || [],
        lookingFor: data.lookingFor || [],
        vanType: data.vanType,
        vanBuildStatus: data.vanBuildStatus,
        vanVerified: false, // Default to false until verified
        vanPhotoUrl: data.vanPhotoUrl,
        currentRoute: data.currentRoute,
      });

      setStatus("success");
      hapticSuccess();
    } catch (err: any) {
      console.error("Profile creation failed:", err);
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong.");
      hapticError();
    }
  };

  const startAnimations = () => {
    // 1. Scale up from 0 to 1 with spring
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      // 2. Continuous pulse animation
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
  };

  const handleStartExploring = () => {
    resetOnboardingData();
    router.push("/(app)/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {status === "loading" && (
        <View style={styles.centerContent}>
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Creating your profile...
          </Text>
        </View>
      )}

      {status === "error" && (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={64} color={colors.error} style={{ marginBottom: 16 }} />
          <Text style={[styles.title, { color: colors.onSurface }]}>Oops!</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {errorMsg}
          </Text>
          <View style={styles.buttonContainer}>
             <GlassButton title="Try Again" onPress={submitProfile} />
          </View>
        </View>
      )}

      {status === "success" && (
        <View style={styles.centerContent}>
          <Animated.View
            style={[
              styles.checkCircle,
              {
                backgroundColor: "#34C759", // Green
                transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
          </Animated.View>

          <Text style={[styles.title, { color: colors.onSurface, marginTop: 32 }]}>
            You're all set!
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Your Roam profile is live
          </Text>

          <View style={styles.buttonContainer}>
            <GlassButton
              title="Start Exploring"
              onPress={handleStartExploring}
            />
          </View>
        </View>
      )}
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
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
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
