import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { GlassButton, GlassChip } from "@/components/glass";
import { TRAVEL_STYLES } from "@/lib/constants";

interface TravelStyleStepProps {
  travelStyles: string[];
  onChangeTravelStyles: (styles: string[]) => void;
  onNext: () => void;
}

export function TravelStyleStep({ travelStyles, onChangeTravelStyles, onNext }: TravelStyleStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const toggle = (value: string) => {
    if (travelStyles.includes(value)) {
      onChangeTravelStyles(travelStyles.filter((v) => v !== value));
    } else {
      onChangeTravelStyles([...travelStyles, value]);
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
          How do you travel?
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
        >
          Pick anything that fits you
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.grid}>
          {TRAVEL_STYLES.map((item) => (
            <GlassChip
              key={item.value}
              label={item.label}
              emoji={item.emoji}
              selected={travelStyles.includes(item.value)}
              onPress={() => toggle(item.value)}
            />
          ))}
        </Animated.View>
      </ScrollView>

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
