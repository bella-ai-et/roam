import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { GlassButton, GlassOption } from "@/components/glass";
import { hapticSelection } from "@/lib/haptics";

const OPTIONS = [
  { value: "dating", label: "Dating", emoji: "💛", description: "Find romantic connections on the road" },
  { value: "friends", label: "Friends", emoji: "🤝", description: "Meet travel companions and buddies" },
  { value: "van_help", label: "Van Help", emoji: "🔧", description: "Get and give help with van builds" },
];

interface LookingForStepProps {
  lookingFor: string[];
  onChangeLookingFor: (lookingFor: string[]) => void;
  onNext: () => void;
}

export function LookingForStep({ lookingFor, onChangeLookingFor, onNext }: LookingForStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const toggle = (value: string) => {
    hapticSelection();
    if (lookingFor.includes(value)) {
      onChangeLookingFor(lookingFor.filter((v) => v !== value));
    } else {
      onChangeLookingFor([...lookingFor, value]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: 120 }]}
      >
        <Animated.Text
          entering={FadeInDown.delay(100).duration(500)}
          style={[styles.headline, { color: colors.onSurface }]}
        >
          What are you looking for?
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
        >
          You can choose more than one
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.options}>
          {OPTIONS.map((opt) => (
            <GlassOption
              key={opt.value}
              label={opt.label}
              emoji={opt.emoji}
              description={opt.description}
              selected={lookingFor.includes(opt.value)}
              onPress={() => toggle(opt.value)}
              multiSelect
            />
          ))}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GlassButton title="Continue" onPress={onNext} disabled={lookingFor.length === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingTop: 16,
  },
});
