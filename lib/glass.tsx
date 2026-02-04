import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import React from "react";
import { StyleProp, View, ViewProps, ViewStyle } from "react-native";
import { useAppTheme } from "@/lib/theme";

export const supportsGlassEffect = isLiquidGlassAvailable();

export const glassFallbackStyles = {
  button: { borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  card: { borderWidth: 1.5, borderColor: "rgba(0,0,0,0.15)" },
  elevated: { boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" },
} as const;

interface AdaptiveGlassViewProps extends ViewProps {
  children: React.ReactNode;
  glassEffectStyle?: "regular" | "prominent";
  tintColor?: string;
  fallbackColor?: string;
  fallbackStyle?: StyleProp<ViewStyle>;
  isInteractive?: boolean;
  useSolidFallback?: boolean;
}

export function AdaptiveGlassView({
  children,
  style,
  glassEffectStyle = "regular",
  tintColor,
  fallbackColor,
  fallbackStyle,
  isInteractive,
  useSolidFallback = false,
  ...props
}: AdaptiveGlassViewProps) {
  const { colors, isDark } = useAppTheme();

  if (supportsGlassEffect) {
    return (
      <GlassView style={style} glassEffectStyle={glassEffectStyle} tintColor={tintColor} isInteractive={isInteractive} {...props}>
        {children}
      </GlassView>
    );
  }

  if (useSolidFallback || fallbackColor) {
    return (
      <View style={[style, { backgroundColor: fallbackColor ?? colors.surfaceVariant }, fallbackStyle]} {...props}>
        {children}
      </View>
    );
  }

  if (process.env.EXPO_OS === "ios") {
    return (
      <BlurView tint={isDark ? "systemThickMaterial" : "systemMaterial"} intensity={80} style={[style, { overflow: "hidden" }, fallbackStyle]} {...props}>
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[style, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }, fallbackStyle]} {...props}>
      {children}
    </View>
  );
}

export { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
