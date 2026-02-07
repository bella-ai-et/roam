import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { useColorScheme } from "react-native";

/** Earthy Terracotta – app-wide primary (Material3 seed + accents) */
export const SEED_COLOR = "#D27C5C";

export const AppColors = {
  primary: "#D27C5C",
  primaryDark: "#B86A4A",
  secondary: "#4ECDC4",
  accent: "#F4D03F",
  accentOrange: "#E89B74",
  accentGreen: "#74A48A",
  accentTeal: "#5C9D9B",
  like: "#4CD964",
  reject: "#FF3B30",
  match: "#D27C5C",
  background: { light: "#F9F6F2", dark: "#121212" },
  surface: { light: "#F5F3F0", dark: "#1A1A1A" },
  text: { light: "#1A1A1A", dark: "#F0EDE8" },
  textSecondary: { light: "#6B6560", dark: "#8E8A85" },
};

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme({ sourceColor: SEED_COLOR });
  const isDark = colorScheme === "dark";
  const bg = AppColors.background[isDark ? "dark" : "light"];

  return {
    isDark,
    theme,
    colors: {
      primary: isDark ? theme.dark.primary : theme.light.primary,
      onPrimary: isDark ? theme.dark.onPrimary : theme.light.onPrimary,
      primaryContainer: isDark ? theme.dark.primaryContainer : theme.light.primaryContainer,
      onPrimaryContainer: isDark ? theme.dark.onPrimaryContainer : theme.light.onPrimaryContainer,
      secondary: isDark ? theme.dark.secondary : theme.light.secondary,
      onSecondary: isDark ? theme.dark.onSecondary : theme.light.onSecondary,
      background: bg,
      onBackground: isDark ? theme.dark.onBackground : theme.light.onBackground,
      surface: isDark ? theme.dark.surface : theme.light.surface,
      onSurface: isDark ? theme.dark.onSurface : theme.light.onSurface,
      surfaceVariant: isDark ? theme.dark.surfaceVariant : theme.light.surfaceVariant,
      onSurfaceVariant: isDark ? theme.dark.onSurfaceVariant : theme.light.onSurfaceVariant,
      outline: isDark ? theme.dark.outline : theme.light.outline,
      error: isDark ? theme.dark.error : theme.light.error,
      like: AppColors.like,
      reject: AppColors.reject,
      match: AppColors.match,
      accent: AppColors.accent,
      accentOrange: AppColors.accentOrange,
      accentGreen: AppColors.accentGreen,
      accentTeal: AppColors.accentTeal,
    },
  };
}

export type AppTheme = ReturnType<typeof useAppTheme>;
