import { useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { useColorScheme } from "react-native";

export const SEED_COLOR = "#E8724A";

export const AppColors = {
  primary: "#E8724A",
  secondary: "#4ECDC4",
  accent: "#F4D03F",
  like: "#4CD964",
  reject: "#FF3B30",
  match: "#E8724A",
  background: { light: "#FFFFFF", dark: "#0F0F0F" },
  surface: { light: "#F5F3F0", dark: "#1A1A1A" },
  text: { light: "#1A1A1A", dark: "#F0EDE8" },
  textSecondary: { light: "#6B6560", dark: "#8E8A85" },
};

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme({ sourceColor: SEED_COLOR });
  const isDark = colorScheme === "dark";

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
      background: isDark ? theme.dark.background : theme.light.background,
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
    },
  };
}

export type AppTheme = ReturnType<typeof useAppTheme>;
