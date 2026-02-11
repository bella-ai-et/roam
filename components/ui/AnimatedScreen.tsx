import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";

interface AnimatedScreenProps {
  children: React.ReactNode;
  /** Fade duration in ms (default 220) */
  duration?: number;
}

/**
 * Wraps tab screen content with a subtle fade-in on focus.
 * Keeps things smooth without being flashy.
 */
export function AnimatedScreen({ children, duration = 220 }: AnimatedScreenProps) {
  const opacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }, [duration, opacity])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
