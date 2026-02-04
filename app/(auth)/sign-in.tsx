import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import React from "react";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [error, setError] = React.useState("");

  const onSignInPress = async () => {
    if (!isLoaded) return;
    if (!emailAddress || !password) {
        setError("Please enter both email and password");
        return;
    }
    
    setIsSigningIn(true);
    setError("");
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Failed to sign in");
      setIsSigningIn(false);
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
            <Ionicons name="location" size={48} color={colors.primary} />
            <Text style={[styles.title, { color: colors.onSurface }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Sign in to continue your journey
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
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Email</Text>
                <TextInput
                    autoCapitalize="none"
                    value={emailAddress}
                    placeholder="vanlife@roam.com"
                    placeholderTextColor={colors.onSurfaceVariant + "80"}
                    onChangeText={setEmailAddress}
                    style={[styles.input, { 
                        color: colors.onSurface,
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                        borderColor: colors.outline 
                    }]}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Password</Text>
                <TextInput
                    value={password}
                    placeholder="••••••••"
                    placeholderTextColor={colors.onSurfaceVariant + "80"}
                    secureTextEntry={true}
                    onChangeText={setPassword}
                    style={[styles.input, { 
                        color: colors.onSurface,
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                        borderColor: colors.outline 
                    }]}
                />
            </View>

            <TouchableOpacity 
                onPress={onSignInPress} 
                disabled={isSigningIn}
                style={[styles.button, { backgroundColor: colors.primary, opacity: isSigningIn ? 0.7 : 1 }]}
            >
                {isSigningIn ? (
                    <ActivityIndicator color={colors.onPrimary} />
                ) : (
                    <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Sign In</Text>
                )}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
                    Don't have an account?
                </Text>
                <Link href="/sign-up" asChild>
                    <TouchableOpacity>
                        <Text style={[styles.link, { color: colors.primary }]}>Sign Up</Text>
                    </TouchableOpacity>
                </Link>
            </View>
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
  title: { fontSize: 28, fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: "center" },
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
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16 },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: "bold" },
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
