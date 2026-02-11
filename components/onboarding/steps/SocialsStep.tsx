import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme, AppColors } from "@/lib/theme";
import { GlassButton } from "@/components/glass";

interface SocialsStepProps {
  instagram: string;
  tiktok: string;
  onChangeInstagram: (value: string) => void;
  onChangeTiktok: (value: string) => void;
  onNext: () => void;
}

export function SocialsStep({
  instagram,
  tiktok,
  onChangeInstagram,
  onChangeTiktok,
  onNext,
}: SocialsStepProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  // Strip @ prefix for display consistency
  const cleanHandle = (raw: string) => raw.replace(/^@/, "").trim();

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <Animated.Text
          entering={FadeInDown.delay(100).duration(500)}
          style={[styles.headline, { color: colors.onSurface }]}
        >
          Your socials
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
        >
          Optional — helps others verify you're a real nomad and connect with you outside the app.
        </Animated.Text>

        {/* Instagram */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="logo-instagram" size={20} color="#E1306C" />
            <Text style={[styles.label, { color: colors.onSurface }]}>Instagram</Text>
          </View>
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: isDark ? colors.surfaceVariant : "#f8f6f2",
                borderColor: instagram ? AppColors.primary : isDark ? colors.outline : "#e5e2dc",
              },
            ]}
          >
            <Text style={[styles.atPrefix, { color: colors.onSurfaceVariant }]}>@</Text>
            <TextInput
              style={[styles.input, { color: colors.onSurface }]}
              value={cleanHandle(instagram)}
              onChangeText={(t) => onChangeInstagram(cleanHandle(t))}
              placeholder="your.handle"
              placeholderTextColor={colors.onSurfaceVariant + "66"}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
        </Animated.View>

        {/* TikTok */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="logo-tiktok" size={20} color={isDark ? "#fff" : "#000"} />
            <Text style={[styles.label, { color: colors.onSurface }]}>TikTok</Text>
          </View>
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: isDark ? colors.surfaceVariant : "#f8f6f2",
                borderColor: tiktok ? AppColors.primary : isDark ? colors.outline : "#e5e2dc",
              },
            ]}
          >
            <Text style={[styles.atPrefix, { color: colors.onSurfaceVariant }]}>@</Text>
            <TextInput
              style={[styles.input, { color: colors.onSurface }]}
              value={cleanHandle(tiktok)}
              onChangeText={(t) => onChangeTiktok(cleanHandle(t))}
              placeholder="your.handle"
              placeholderTextColor={colors.onSurfaceVariant + "66"}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(500).duration(500)}
          style={[styles.hint, { color: colors.onSurfaceVariant }]}
        >
          This will be visible on your profile so potential matches can check you out.
        </Animated.Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GlassButton title="Continue" onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  atPrefix: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  hint: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingTop: 16,
  },
});
