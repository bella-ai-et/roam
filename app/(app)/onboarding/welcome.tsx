import { useUser } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { api } from "@/convex/_generated/api";
import { useAppTheme } from "@/lib/theme";
import { AdaptiveGlassView } from "@/lib/glass";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function WelcomeScreen() {
  const { user } = useUser();
  const createProfile = useMutation(api.users.createProfile);
  const { colors, isDark } = useAppTheme();
  
  const [name, setName] = useState(user?.fullName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreateProfile = async () => {
    if (!user?.id) return;
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Phase 0: Create with minimal defaults to get to tabs
      await createProfile({
        clerkId: user.id,
        name: name,
        dateOfBirth: Date.now(), // Default to today for now
        gender: "prefer_not_to_say",
        photos: [],
        interests: [],
        lookingFor: [],
        vanVerified: false,
      });
      // Navigation is handled automatically by _layout.tsx reacting to profile existence
    } catch (err) {
      console.error(err);
      setError("Failed to create profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={isDark ? ["#0F0F0F", "#1A1A1A"] : ["#F5F3F0", "#FFFFFF"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <AdaptiveGlassView
            intensity={30}
            glassEffectStyle="prominent"
            style={[styles.card, { borderColor: colors.outline }]}
        >
          <View style={styles.header}>
            <Ionicons name="sparkles" size={48} color={colors.primary} />
            <Text style={[styles.title, { color: colors.onSurface }]}>Welcome to Roam</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Let's get your profile set up so you can start exploring.
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + "20" }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>What should we call you?</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your Name"
                placeholderTextColor={colors.onSurfaceVariant + "80"}
                style={[styles.input, { 
                  color: colors.onSurface,
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  borderColor: colors.outline 
                }]}
              />
            </View>

            <TouchableOpacity
              onPress={handleCreateProfile}
              disabled={isSubmitting}
              style={[styles.button, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Start Exploring</Text>
              )}
            </TouchableOpacity>
          </View>
        </AdaptiveGlassView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1, justifyContent: "center", padding: 20 },
  card: { borderRadius: 24, padding: 24, overflow: "hidden", borderWidth: 1 },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "bold", marginTop: 16, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "500", marginLeft: 4 },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { fontSize: 16, fontWeight: "bold" },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 14 },
});
