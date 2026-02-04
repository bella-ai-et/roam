import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassHeader, GlassButton, GlassOption } from "@/components/glass";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppTheme } from "@/lib/theme";
import { setOnboardingField, getOnboardingData } from "@/lib/onboardingState";
import { hapticSelection } from "@/lib/haptics";
import { VAN_TYPES, VAN_BUILD_STATUSES } from "@/lib/constants";

export default function VanDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const existingData = getOnboardingData();
  const [vanType, setVanType] = useState<string | undefined>(existingData.vanType);
  const [buildStatus, setBuildStatus] = useState<string | undefined>(existingData.vanBuildStatus);

  const handleVanTypeSelect = (value: string) => {
    setVanType(value);
    hapticSelection();
  };

  const handleBuildStatusSelect = (value: string) => {
    setBuildStatus(value);
    hapticSelection();
  };

  const handleContinue = () => {
    if (!vanType || !buildStatus) return;
    
    setOnboardingField("vanType", vanType);
    setOnboardingField("vanBuildStatus", buildStatus);
    
    router.push("/(app)/onboarding/route");
  };

  const isComplete = !!vanType && !!buildStatus;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        title="Your Van"
        leftContent={
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        }
      />

      <ScrollView 
        contentContainerStyle={[
          styles.content, 
          { paddingTop: insets.top + 60, paddingBottom: 100 }
        ]}
      >
        <ProgressBar current={5} total={8} />

        {/* Van Type Section */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
          Van Type
        </Text>
        
        <View style={styles.optionsContainer}>
          {VAN_TYPES.map((item) => (
            <GlassOption
              key={item.value}
              label={item.label}
              emoji={item.emoji}
              selected={vanType === item.value}
              onPress={() => handleVanTypeSelect(item.value)}
            />
          ))}
        </View>

        {/* Build Status Section */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface, marginTop: 32 }]}>
          Build Status
        </Text>
        
        <View style={styles.optionsContainer}>
          {VAN_BUILD_STATUSES.map((item) => (
            <GlassOption
              key={item.value}
              label={item.label}
              emoji={item.emoji}
              selected={buildStatus === item.value}
              onPress={() => handleBuildStatusSelect(item.value)}
            />
          ))}
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          disabled={!isComplete}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
