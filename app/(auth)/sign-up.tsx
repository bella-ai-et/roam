import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text, View, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import React from "react";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (!emailAddress || !password) {
        setError("Please enter both email and password");
        return;
    }

    setIsLoading(true);
    setError("");
    try {
      await signUp.create({
        emailAddress,
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Failed to sign up");
    } finally {
        setIsLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError("");
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      await setActive({ session: completeSignUp.createdSessionId });
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Verification failed");
    } finally {
        setIsLoading(false);
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
            <Ionicons name="compass" size={48} color={colors.primary} />
            <Text style={[styles.title, { color: colors.onSurface }]}>
                {pendingVerification ? "Verify Email" : "Create Account"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                {pendingVerification 
                    ? `We sent a code to ${emailAddress}` 
                    : "Start your adventure today"}
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + "20" }]}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {!pendingVerification ? (
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
                    onPress={onSignUpPress} 
                    disabled={isLoading}
                    style={[styles.button, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Sign Up</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
                        Already have an account?
                    </Text>
                    <Link href="/sign-in" asChild>
                        <TouchableOpacity>
                            <Text style={[styles.link, { color: colors.primary }]}>Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
          ) : (
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Verification Code</Text>
                    <TextInput
                        value={code}
                        placeholder="123456"
                        placeholderTextColor={colors.onSurfaceVariant + "80"}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        style={[styles.input, { 
                            color: colors.onSurface,
                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            borderColor: colors.outline 
                        }]}
                    />
                </View>

                <TouchableOpacity 
                    onPress={onPressVerify} 
                    disabled={isLoading}
                    style={[styles.button, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Verify Email</Text>
                    )}
                </TouchableOpacity>
            </View>
          )}
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
