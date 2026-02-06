import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";

import { GlassHeader, GlassButton, GlassOption } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/convex/_generated/api";

export default function EditLookingForScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);

  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setLookingFor(currentUser.lookingFor ?? []);
  }, [currentUser]);

  const toggleLookingFor = (value: string) => {
    setLookingFor((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
  };

  const handleSave = async () => {
    if (!currentUser?._id) return;

    setSaving(true);
    try {
      await updateProfile({
        userId: currentUser._id,
        lookingFor,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        title="Looking For"
        leftContent={
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 120 },
        ]}
      >
        <Text style={[styles.helpText, { color: colors.onSurfaceVariant }]}>
          Select what you're hoping to find on the road. You can choose multiple options.
        </Text>

        <View style={styles.optionsContainer}>
          <GlassOption
            label="Dating"
            emoji="💛"
            description="Find romantic connections on the road"
            selected={lookingFor.includes("dating")}
            onPress={() => toggleLookingFor("dating")}
            multiSelect
          />
          <GlassOption
            label="Friends"
            emoji="🤝"
            description="Meet travel companions and buddies"
            selected={lookingFor.includes("friends")}
            onPress={() => toggleLookingFor("friends")}
            multiSelect
          />
          <GlassOption
            label="Van Help"
            emoji="🔧"
            description="Get and give help with van builds"
            selected={lookingFor.includes("van_help")}
            onPress={() => toggleLookingFor("van_help")}
            multiSelect
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24), backgroundColor: colors.background }]}>
        <GlassButton title="Save Changes" onPress={handleSave} loading={saving} />
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
  helpText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
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
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});
