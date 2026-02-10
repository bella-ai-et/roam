import React from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { GlassInput, GlassButton } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";

interface DestinationStepProps {
  destinationName: string;
  onChangeDestination: (text: string) => void;
  onNext: () => void;
}

export function DestinationStep({
  destinationName,
  onChangeDestination,
  onNext,
}: DestinationStepProps) {
  const { colors } = useAppTheme();
  const canContinue = destinationName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={120}
    >
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={[styles.headline, { color: colors.onSurface }]}>
            Where are you{"\n"}heading?
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Tell us your destination and we'll find people going the same way.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.inputWrapper}>
          <GlassInput
            value={destinationName}
            onChangeText={onChangeDestination}
            placeholder="City, region, or place"
            icon={<Ionicons name="flag-outline" size={20} color={colors.onSurfaceVariant} />}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => canContinue && onNext()}
          />
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <GlassButton
          title="Continue"
          onPress={onNext}
          disabled={!canContinue}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    paddingBottom: 80,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 48,
  },
  inputWrapper: {
    width: "100%",
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
});
