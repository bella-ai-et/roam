import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { differenceInYears } from "date-fns";
import { useAppTheme } from "@/lib/theme";
import { GlassButton, GlassDatePicker } from "@/components/glass";

interface BirthdayStepProps {
  dob: Date | undefined;
  onChangeDob: (date: Date) => void;
  onNext: () => void;
}

export function BirthdayStep({ dob, onChangeDob, onNext }: BirthdayStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const isValidAge = dob ? differenceInYears(new Date(), dob) >= 18 : false;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <Animated.Text
          entering={FadeInDown.delay(100).duration(500)}
          style={[styles.headline, { color: colors.onSurface }]}
        >
          When's your birthday?
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
        >
          You must be 18 or older to use Roam
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.pickerWrapper}>
          <GlassDatePicker
            value={dob}
            onChange={onChangeDob}
            maximumDate={new Date()}
            placeholder="Select your birthday"
            error={dob && !isValidAge ? "Must be 18 or older" : undefined}
          />
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GlassButton title="Continue" onPress={onNext} disabled={!isValidAge} />
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
  pickerWrapper: {
    width: "100%",
  },
  footer: {
    paddingHorizontal: 32,
    paddingTop: 16,
  },
});
