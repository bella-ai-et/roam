import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { GlassButton, GlassOption } from "@/components/glass";
import { VAN_TYPES, VAN_BUILD_STATUSES } from "@/lib/constants";
import { hapticSelection } from "@/lib/haptics";

interface VanStepProps {
  vanType: string | undefined;
  vanBuildStatus: string | undefined;
  onChangeVanType: (type: string) => void;
  onChangeVanBuildStatus: (status: string) => void;
  onNext: () => void;
}

export function VanStep({ vanType, vanBuildStatus, onChangeVanType, onChangeVanBuildStatus, onNext }: VanStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const handleVanType = (value: string) => {
    hapticSelection();
    onChangeVanType(value);
  };

  const handleBuildStatus = (value: string) => {
    hapticSelection();
    onChangeVanBuildStatus(value);
  };

  const isComplete = !!vanType && !!vanBuildStatus;

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
          Tell us about your van
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
        >
          What do you roll in?
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Van Type</Text>
          <View style={styles.options}>
            {VAN_TYPES.map((item) => (
              <GlassOption
                key={item.value}
                label={item.label}
                emoji={item.emoji}
                selected={vanType === item.value}
                onPress={() => handleVanType(item.value)}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, marginTop: 24 }]}>Build Status</Text>
          <View style={styles.options}>
            {VAN_BUILD_STATUSES.map((item) => (
              <GlassOption
                key={item.value}
                label={item.label}
                emoji={item.emoji}
                selected={vanBuildStatus === item.value}
                onPress={() => handleBuildStatus(item.value)}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GlassButton title="Continue" onPress={onNext} disabled={!isComplete} />
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
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
