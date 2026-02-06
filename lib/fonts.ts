import * as Font from "expo-font";
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";

/**
 * Font family names to use in styles after fonts are loaded.
 * React Native uses the loadAsync key as fontFamily (e.g. "Outfit_400Regular").
 * If font loading fails, the app falls back to system sans-serif.
 */
export const FONT_FAMILY_OUTFIT = "Outfit";
export const FONT_FAMILY_OUTFIT_LIGHT = "Outfit_300Light";
export const FONT_FAMILY_OUTFIT_REGULAR = "Outfit_400Regular";
export const FONT_FAMILY_OUTFIT_MEDIUM = "Outfit_500Medium";
export const FONT_FAMILY_OUTFIT_SEMIBOLD = "Outfit_600SemiBold";
export const FONT_FAMILY_OUTFIT_BOLD = "Outfit_700Bold";

/** Map of Outfit weights for use with expo-font loadAsync / useFonts */
export const OUTFIT_FONT_MAP = {
  Outfit_300Light: Outfit_300Light,
  Outfit_400Regular: Outfit_400Regular,
  Outfit_500Medium: Outfit_500Medium,
  Outfit_600SemiBold: Outfit_600SemiBold,
  Outfit_700Bold: Outfit_700Bold,
};

/**
 * Load Outfit font family (300, 400, 500, 600, 700).
 * Use in root layout with useFonts(OUTFIT_FONT_MAP) or call this before rendering.
 * On failure, the app will fall back to system default sans-serif.
 */
export async function loadAppFonts(): Promise<void> {
  await Font.loadAsync(OUTFIT_FONT_MAP);
}
