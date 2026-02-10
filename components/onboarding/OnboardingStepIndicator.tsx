import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";

interface OnboardingStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const DOT_SIZE = 10;
const DOT_ACTIVE_SIZE = 13;
const DOT_GAP = 10;
const SPRING_CONFIG = { damping: 15, stiffness: 180 };

function Dot({ index, currentStep }: { index: number; currentStep: number }) {
  const { colors } = useAppTheme();
  const isActive = index === currentStep;
  const isCompleted = index < currentStep;

  const animatedStyle = useAnimatedStyle(() => {
    const size = withSpring(isActive ? DOT_ACTIVE_SIZE : DOT_SIZE, SPRING_CONFIG);
    const backgroundColor = withTiming(
      isActive || isCompleted ? colors.primary : colors.surfaceVariant,
      { duration: 250 }
    );
    const opacity = withTiming(isActive ? 1 : isCompleted ? 0.9 : 0.4, { duration: 250 });

    return {
      width: size,
      height: size,
      borderRadius: withSpring(isActive ? DOT_ACTIVE_SIZE / 2 : DOT_SIZE / 2, SPRING_CONFIG),
      backgroundColor,
      opacity,
    };
  }, [isActive, isCompleted, colors.primary, colors.surfaceVariant]);

  if (isCompleted) {
    return (
      <Animated.View style={[styles.dot, animatedStyle, styles.completedDot]}>
        <Ionicons name="checkmark" size={8} color="#fff" />
      </Animated.View>
    );
  }

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function OnboardingStepIndicator({ currentStep, totalSteps }: OnboardingStepIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <Dot key={i} index={i} currentStep={currentStep} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DOT_GAP,
    marginBottom: 8,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  completedDot: {
    alignItems: "center",
    justifyContent: "center",
  },
});
