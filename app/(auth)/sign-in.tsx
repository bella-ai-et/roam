import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import React, { useState, useCallback } from "react";
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSequence, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GlassButton } from "@/components/glass";
import { AppColors } from "@/lib/theme";
import { hapticError } from "@/lib/haptics";

/** Map Clerk error codes to friendly user-facing messages */
function friendlySignInError(err: any): { message: string; field?: "email" | "password" } {
  const code = err.errors?.[0]?.code;
  const param = err.errors?.[0]?.meta?.paramName;

  switch (code) {
    case "form_password_incorrect":
      return { message: "Incorrect password. Please try again.", field: "password" };
    case "form_identifier_not_found":
      return { message: "We couldn't find an account with that email.", field: "email" };
    case "form_param_format_invalid":
      if (param === "identifier" || param === "email_address")
        return { message: "Please enter a valid email address.", field: "email" };
      return { message: "Please check your input and try again." };
    case "too_many_attempts":
    case "strategy_for_user_invalid":
      return { message: "Too many attempts. Please wait a moment and try again." };
    case "form_password_pwned":
      return { message: "This password has been found in a data breach. Please use a different one.", field: "password" };
    case "session_exists":
      return { message: "You're already signed in. Restarting…" };
    default:
      return { message: err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Something went wrong. Please try again." };
  }
}

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<"email" | "password" | undefined>();

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Shake animation
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeX]);

  const clearError = useCallback(() => {
    if (error) { setError(""); setErrorField(undefined); }
  }, [error]);

  const onSignInPress = async () => {
    if (!isLoaded) return;

    setIsSigningIn(true);
    clearError();
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      if (completeSignIn.status === "complete") {
        await setActive({ session: completeSignIn.createdSessionId });
      } else {
        console.log("Sign in status:", completeSignIn.status);
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const { message, field } = friendlySignInError(err);
      setError(message);
      setErrorField(field);
      hapticError();
      triggerShake();
      setIsSigningIn(false);
    }
  };

  const isFormValid = emailAddress.length > 0 && password.length >= 6;

  return (
    <LinearGradient
      colors={[AppColors.background.dark, "#1A1510", AppColors.background.dark]}
      style={styles.container}
    >
      {/* Warm glow */}
      <View style={styles.glow} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.content}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={[AppColors.primary, AppColors.primaryDark]}
            style={styles.logoBackground}
          >
            <Ionicons name="location" size={40} color="white" />
          </LinearGradient>
          <Text style={styles.appName}>Zelani</Text>
          <Text style={styles.tagline}>Find your people on the road</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error ? (
            <Animated.View
              entering={FadeIn.duration(250)}
              exiting={FadeOut.duration(200)}
              style={styles.errorContainer}
            >
              <Animated.View style={shakeStyle}>
                <View style={styles.errorInner}>
                  <View style={styles.errorIconCircle}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </View>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </Animated.View>
            </Animated.View>
          ) : null}

          <View style={[
            styles.inputContainer,
            emailFocused && styles.inputFocused,
            errorField === "email" && styles.inputError,
          ]}>
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={errorField === "email" ? "#E74C3C" : emailFocused ? AppColors.primary : "#666"} 
            />
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Email"
              placeholderTextColor="#666"
              onChangeText={(t) => { setEmailAddress(t); clearError(); }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={styles.input}
            />
          </View>

          <View style={[
            styles.inputContainer,
            passwordFocused && styles.inputFocused,
            errorField === "password" && styles.inputError,
          ]}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={errorField === "password" ? "#E74C3C" : passwordFocused ? AppColors.primary : "#666"} 
            />
            <TextInput
              value={password}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              onChangeText={(t) => { setPassword(t); clearError(); }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              style={styles.input}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#666" 
              />
            </Pressable>
          </View>

          <GlassButton
            title={isSigningIn ? "Signing in..." : "Sign In"}
            onPress={onSignInPress}
            loading={isSigningIn}
            disabled={!isFormValid}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text style={styles.linkText}>Sign Up</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    top: -100,
    alignSelf: "center",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(232,114,74,0.15)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: "#777",
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    overflow: "hidden",
    borderRadius: 14,
  },
  errorInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(231,76,60,0.12)",
    borderWidth: 1,
    borderColor: "rgba(231,76,60,0.2)",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 10,
  },
  errorIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E74C3C",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#F8A9A0",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },
  inputContainer: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  inputFocused: {
    borderColor: AppColors.primary,
    backgroundColor: "rgba(210,124,92,0.08)",
  },
  inputError: {
    borderColor: "rgba(231,76,60,0.6)",
    backgroundColor: "rgba(231,76,60,0.06)",
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 16,
    height: "100%",
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#777",
    fontSize: 15,
  },
  linkText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});
