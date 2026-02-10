import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { format, addDays } from "date-fns";
import { GlassButton, GlassDatePicker } from "@/components/glass";
import { useAppTheme, AppColors } from "@/lib/theme";
import { hapticSelection, hapticError } from "@/lib/haptics";

type TimingPreset = "this_week" | "next_week" | "next_month" | "pick_dates";

interface TimingStepProps {
  arrival: Date | undefined;
  departure: Date | undefined;
  onChangeArrival: (d: Date | undefined) => void;
  onChangeDeparture: (d: Date | undefined) => void;
  isPro: boolean;
  maxDate: Date;
  onShowPaywall?: (msg: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRESETS: { key: TimingPreset; label: string; icon: string }[] = [
  { key: "this_week", label: "This week", icon: "today-outline" },
  { key: "next_week", label: "Next week", icon: "calendar-outline" },
  { key: "next_month", label: "Next month", icon: "calendar-number-outline" },
  { key: "pick_dates", label: "Pick dates", icon: "options-outline" },
];

function PresetChip({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.02 : 1, { damping: 15, stiffness: 200 }) }],
  }), [selected]);

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: selected ? `${AppColors.primary}15` : "transparent",
            borderColor: selected ? colors.primary : colors.outline,
            borderWidth: selected ? 1.5 : 1,
          },
          animatedStyle,
        ]}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={selected ? colors.primary : colors.onSurfaceVariant}
        />
        <Text
          style={[
            styles.chipText,
            { color: selected ? colors.primary : colors.onSurface },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function TimingStep({
  arrival,
  departure,
  onChangeArrival,
  onChangeDeparture,
  isPro,
  maxDate,
  onShowPaywall,
  onNext,
  onBack,
}: TimingStepProps) {
  const { colors } = useAppTheme();
  const [activePreset, setActivePreset] = useState<TimingPreset | null>(null);
  const [showPickers, setShowPickers] = useState(false);

  const applyPreset = (preset: TimingPreset) => {
    hapticSelection();
    setActivePreset(preset);

    if (preset === "pick_dates") {
      setShowPickers(true);
      return;
    }

    setShowPickers(false);
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case "this_week":
        start = today;
        end = addDays(today, 4);
        break;
      case "next_week":
        start = addDays(today, 7);
        end = addDays(today, 11);
        break;
      case "next_month":
        start = addDays(today, 30);
        end = addDays(today, 37);
        break;
      default:
        return;
    }

    if (!isPro && end > maxDate) {
      hapticError();
      if (onShowPaywall) {
        onShowPaywall("Plan further ahead with Pro");
        return;
      }
    }

    onChangeArrival(start);
    onChangeDeparture(end);
  };

  const enforceDateLimit = (
    date: Date | undefined,
    setter: (d: Date | undefined) => void
  ) => {
    if (!date) return;
    if (date > maxDate && !isPro) {
      hapticError();
      if (onShowPaywall) {
        onShowPaywall("Plan further ahead with Pro");
      }
      setter(maxDate);
      return;
    }
    setter(date);
  };

  const canContinue = !!arrival && !!departure;

  const dateSummary =
    arrival && departure
      ? `${format(arrival, "MMM d")} – ${format(departure, "MMM d, yyyy")}`
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={[styles.headline, { color: colors.onSurface }]}>
            When are you{"\n"}going?
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Pick a rough timeframe — you can always adjust later.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.presetGrid}>
          {PRESETS.map((preset) => {
            if (preset.key === "next_month" && !isPro) return null;
            return (
              <PresetChip
                key={preset.key}
                label={preset.label}
                icon={preset.icon}
                selected={activePreset === preset.key}
                onPress={() => applyPreset(preset.key)}
              />
            );
          })}
          {!isPro && (
            <Pressable
              onPress={() => {
                hapticSelection();
                if (onShowPaywall) onShowPaywall("Plan further ahead with Pro");
              }}
            >
              <View
                style={[
                  styles.chip,
                  { borderColor: colors.outline, borderWidth: 1, opacity: 0.5 },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={colors.onSurfaceVariant} />
                <Text style={[styles.chipText, { color: colors.onSurfaceVariant }]}>
                  Next month
                </Text>
              </View>
            </Pressable>
          )}
        </Animated.View>

        {showPickers && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.pickersRow}>
            <View style={{ flex: 1 }}>
              <GlassDatePicker
                value={arrival}
                onChange={(d) => enforceDateLimit(d, onChangeArrival)}
                placeholder="From"
                label="From"
                containerStyle={{ marginBottom: 0 }}
                maximumDate={isPro ? undefined : maxDate}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <GlassDatePicker
                value={departure}
                onChange={(d) => enforceDateLimit(d, onChangeDeparture)}
                placeholder="Until"
                label="Until"
                containerStyle={{ marginBottom: 0 }}
                minimumDate={arrival}
                maximumDate={isPro ? undefined : maxDate}
              />
            </View>
          </Animated.View>
        )}

        {dateSummary && !showPickers && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.summaryRow}>
            <Ionicons name="calendar" size={18} color={colors.primary} />
            <Text style={[styles.summaryText, { color: colors.onSurface }]}>
              {dateSummary}
            </Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.footer}>
        <GlassButton title="Continue" onPress={onNext} disabled={!canContinue} />
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.onSurfaceVariant }]}>Back</Text>
        </Pressable>
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
    marginBottom: 40,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  pickersRow: {
    flexDirection: "row",
    marginTop: 24,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    gap: 12,
    alignItems: "center",
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
