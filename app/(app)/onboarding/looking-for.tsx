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

export default function LookingForScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  // Initial state from store
  const existingData = getOnboardingData();
  const [lookingFor, setLookingFor] = useState<string[]>(existingData.lookingFor || []);

  const toggleSelection = (value: string) => {
    setLookingFor(prev => {
      const exists = prev.includes(value);
      if (exists) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
    hapticSelection();
  };

  const handleContinue = () => {
    if (lookingFor.length === 0) return;
    
    setOnboardingField("lookingFor", lookingFor);
    // Navigate to next screen - assuming interests is next based on typical flow
    // or placeholder for now until next instruction
    router.push("/(app)/onboarding/interests"); 
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        title="What are you looking for?"
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
        <ProgressBar current={3} total={8} />

        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          You can choose more than one
        </Text>

        <View style={styles.optionsContainer}>
          <GlassOption
            label="Dating"
            emoji="💛"
            description="Find romantic connections on the road"
            selected={lookingFor.includes("dating")}
            onPress={() => toggleSelection("dating")}
            multiSelect
          />
          
          <GlassOption
            label="Friends"
            emoji="🤝"
            description="Meet travel companions and buddies"
            selected={lookingFor.includes("friends")}
            onPress={() => toggleSelection("friends")}
            multiSelect
          />
          
          <GlassOption
            label="Van Help"
            emoji="🔧"
            description="Get and give help with van builds"
            selected={lookingFor.includes("van_help")}
            onPress={() => toggleSelection("van_help")}
            multiSelect
          />
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          disabled={lookingFor.length === 0}
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
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
    marginTop: 8,
  },
  optionsContainer: {
    gap: 16,
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
