import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { loadOnboardingData } from "@/lib/onboardingState";
import { useAppTheme } from "@/lib/theme";

export default function OnboardingLayout() {
  const [loaded, setLoaded] = useState(false);
  const { colors } = useAppTheme();

  useEffect(() => {
    loadOnboardingData().finally(() => {
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
