import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { GlassButton, GlassChip } from "@/components/glass";
import { INTERESTS, MIN_INTERESTS, MAX_INTERESTS } from "@/lib/constants";
import { hapticWarning } from "@/lib/haptics";

interface InterestsStepProps {
  interests: string[];
  onChangeInterests: (interests: string[]) => void;
  onNext: () => void;
}

export function InterestsStep({ interests, onChangeInterests, onNext }: InterestsStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const toggle = (name: string) => {
    if (interests.includes(name)) {
      onChangeInterests(interests.filter((v) => v !== name));
    } else {
      if (interests.length >= MAX_INTERESTS) {
        hapticWarning();
        return;
      }
      onChangeInterests([...interests, name]);
    }
  };

  const isValid = interests.length >= MIN_INTERESTS && interests.length <= MAX_INTERESTS;
  const isTooFew = interests.length < MIN_INTERESTS;

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
          What do you enjoy?
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.headerRow}>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Pick {MIN_INTERESTS} to {MAX_INTERESTS} activities
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: isTooFew ? `${colors.reject}26` : `${colors.like}26` },
            ]}
          >
            <Text
              style={[styles.badgeText, { color: isTooFew ? colors.reject : colors.like }]}
            >
              {interests.length} selected
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.grid}>
          {INTERESTS.map((item) => (
            <GlassChip
              key={item.name}
              label={item.name}
              emoji={item.emoji}
              selected={interests.includes(item.name)}
              onPress={() => toggle(item.name)}
            />
          ))}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GlassButton title="Continue" onPress={onNext} disabled={!isValid} />
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
