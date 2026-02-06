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
import { VAN_TYPES, VAN_BUILD_STATUSES } from "@/lib/constants";

export default function EditVanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);

  const [vanType, setVanType] = useState<string | undefined>();
  const [vanBuildStatus, setVanBuildStatus] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setVanType(currentUser.vanType);
    setVanBuildStatus(currentUser.vanBuildStatus);
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?._id) return;

    setSaving(true);
    try {
      await updateProfile({
        userId: currentUser._id,
        vanType,
        vanBuildStatus,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save van details");
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
        title="My Van"
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Van Type</Text>
          <Text style={[styles.helpText, { color: colors.onSurfaceVariant }]}>
            What type of van do you have or are you building?
          </Text>
          <View style={styles.optionsContainer}>
            {VAN_TYPES.map((item) => (
              <GlassOption
                key={item.value}
                label={item.label}
                emoji={item.emoji}
                selected={vanType === item.value}
                onPress={() => setVanType(item.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Build Status</Text>
          <Text style={[styles.helpText, { color: colors.onSurfaceVariant }]}>
            What stage is your van build at?
          </Text>
          <View style={styles.optionsContainer}>
            {VAN_BUILD_STATUSES.map((item) => (
              <GlassOption
                key={item.value}
                label={item.label}
                emoji={item.emoji}
                selected={vanBuildStatus === item.value}
                onPress={() => setVanBuildStatus(item.value)}
              />
            ))}
          </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
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
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});
