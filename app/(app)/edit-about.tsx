import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";

import { GlassHeader, GlassButton, GlassInput, GlassDatePicker, GlassOption } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/convex/_generated/api";

export default function EditAboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [vanModel, setVanModel] = useState("");
  const [nomadSinceYear, setNomadSinceYear] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name ?? "");
    setDob(currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth) : undefined);
    setGender(currentUser.gender ?? "");
    setBio(currentUser.bio ?? "");
    setVanModel((currentUser as any).vanModel ?? "");
    setNomadSinceYear((currentUser as any).nomadSinceYear ? String((currentUser as any).nomadSinceYear) : "");
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?._id) return;
    if (!name.trim()) {
      Alert.alert("Please enter your name");
      return;
    }

    setSaving(true);
    try {
      const parsedYear = nomadSinceYear.trim() ? parseInt(nomadSinceYear.trim(), 10) : undefined;
      await updateProfile({
        userId: currentUser._id,
        name: name.trim(),
        dateOfBirth: dob ? dob.getTime() : undefined,
        gender: gender.trim() ? gender.trim() : undefined,
        bio: bio.trim(),
        vanModel: vanModel.trim() || undefined,
        nomadSinceYear: parsedYear && !isNaN(parsedYear) ? parsedYear : undefined,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save changes");
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
        title="About Me"
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
          <GlassInput
            label="Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <GlassDatePicker
            label="Date of Birth"
            value={dob}
            onChange={setDob}
            maximumDate={new Date()}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Gender</Text>
          <GlassOption
            label="Woman"
            emoji="♀"
            selected={gender === "woman"}
            onPress={() => setGender("woman")}
          />
          <GlassOption
            label="Man"
            emoji="♂"
            selected={gender === "man"}
            onPress={() => setGender("man")}
          />
          <GlassOption
            label="Non-binary"
            emoji="⚧"
            selected={gender === "non_binary"}
            onPress={() => setGender("non_binary")}
          />
        </View>

        <View style={styles.section}>
          <GlassInput
            label="Bio"
            placeholder="Tell people about yourself..."
            value={bio}
            onChangeText={setBio}
            multiline
            style={styles.bioInput}
          />
          <Text style={[styles.helpText, { color: colors.onSurfaceVariant }]}>
            Share what makes you unique and what you're looking for on the road.
          </Text>
        </View>

        <View style={styles.section}>
          <GlassInput
            label="Van Model"
            placeholder="e.g. Mercedes Sprinter '22"
            value={vanModel}
            onChangeText={setVanModel}
          />
          <Text style={[styles.helpText, { color: colors.onSurfaceVariant }]}>
            Shown under your name on your profile.
          </Text>
        </View>

        <View style={styles.section}>
          <GlassInput
            label="Nomad Since (Year)"
            placeholder="e.g. 2021"
            value={nomadSinceYear}
            onChangeText={setNomadSinceYear}
            keyboardType="number-pad"
          />
          <Text style={[styles.helpText, { color: colors.onSurfaceVariant }]}>
            The year you started your nomad journey.
          </Text>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  bioInput: {
    height: 120,
    textAlignVertical: "top",
  },
  helpText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
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
