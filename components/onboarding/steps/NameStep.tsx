import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { GlassButton } from "@/components/glass";

interface NameStepProps {
  name: string;
  onChangeName: (name: string) => void;
  onNext: () => void;
}

export function NameStep({ name, onChangeName, onNext }: NameStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const canContinue = name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <Animated.Text
          entering={FadeInDown.delay(100).duration(500)}
          style={[styles.headline, { color: colors.onSurface }]}
        >
          What's your name?
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
        >
          This is how you'll appear to others
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            value={name}
            onChangeText={onChangeName}
            placeholder="Your name"
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.input, { color: colors.onSurface, borderColor: colors.outline }]}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => canContinue && onNext()}
          />
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GlassButton title="Continue" onPress={onNext} disabled={!canContinue} />
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
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  inputWrapper: {
    width: "100%",
  },
  input: {
    fontSize: 24,
    fontWeight: "600",
    borderBottomWidth: 2,
    paddingVertical: 12,
  },
  footer: {
    paddingHorizontal: 32,
    paddingTop: 16,
  },
});
