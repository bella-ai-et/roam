import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GlassButton } from "@/components/glass";
import { AppColors } from "@/lib/theme";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState("");

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    
    setIsSigningUp(true);
    setError("");
    try {
      await signUp.create({
        emailAddress,
        password,
      });
      await setActive({ session: signUp.createdSessionId });
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      const message = err.errors?.[0]?.message || "Failed to sign up";
      // Handle "email taken" error specifically
      if (err.errors?.[0]?.code === "form_identifier_exists") {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(message);
      }
      setIsSigningUp(false);
    }
  };

  const isFormValid = 
    emailAddress.length > 0 && 
    password.length >= 6;

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
        <Pressable 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the nomad community</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={[
            styles.inputContainer,
            emailFocused && styles.inputFocused
          ]}>
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={emailFocused ? AppColors.primary : "#666"} 
            />
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Email"
              placeholderTextColor="#666"
              onChangeText={setEmailAddress}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={styles.input}
            />
          </View>

          {/* Password */}
          <View style={[
            styles.inputContainer,
            passwordFocused && styles.inputFocused
          ]}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={passwordFocused ? AppColors.primary : "#666"} 
            />
            <TextInput
              value={password}
              placeholder="Password"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
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
          {password.length > 0 && password.length < 6 && (
            <Text style={{ color: "#FF3B30", fontSize: 12, marginLeft: 16, marginTop: -8 }}>
              Password must be at least 6 characters
            </Text>
          )}

          <GlassButton
            title={isSigningUp ? "Creating account..." : "Create Account"}
            onPress={onSignUpPress}
            loading={isSigningUp}
            disabled={!isFormValid}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <Text style={styles.linkText}>Sign In</Text>
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
  backButton: {
    position: "absolute",
    top: 60,
    left: 24,
    zIndex: 10,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#777",
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,59,48,0.1)",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    flex: 1,
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
