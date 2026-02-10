import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { GlassButton, GlassOption } from "@/components/glass";
import { GENDERS } from "@/lib/constants";

interface GenderStepProps {
  gender: string;
  onChangeGender: (gender: string) => void;
  onNext: () => void;
}

export function GenderStep({ gender, onChangeGender, onNext }: GenderStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <Animated.Text
          entering={FadeInDown.delay(100).duration(500)}
          style={[styles.headline, { color: colors.onSurface }]}
        >
          How do you identify?
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
        >
          Select one
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.options}>
          {GENDERS.map((g) => (
            <GlassOption
              key={g.value}
              label={g.label}
              emoji={g.icon}
              selected={gender === g.value}
              onPress={() => onChangeGender(g.value)}
            />
          ))}
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GlassButton title="Continue" onPress={onNext} disabled={!gender} />
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
    marginBottom: 32,
  },
  options: {
    gap: 4,
  },
  footer: {
    paddingHorizontal: 32,
    paddingTop: 16,
  },
});
