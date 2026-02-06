import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useMutation, useQuery } from "convex/react";

import { GlassHeader, GlassButton, GlassInput, GlassChip, GlassOption, GlassDatePicker } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { INTERESTS, MAX_INTERESTS, MIN_INTERESTS, VAN_BUILD_STATUSES, VAN_TYPES } from "@/lib/constants";

const MAX_PHOTOS = 5;

function isRemoteUrl(value?: string) {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function normalizePhotoValue(value?: string) {
  if (!value) return undefined;
  return value.replace(/`/g, "").trim();
}

function PhotoTile({ storageId, onRemove }: { storageId: string; onRemove: () => void }) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(storageId);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  return (
    <View style={styles.photoSlot}>
      {remote && normalized ? (
        <Image source={{ uri: normalized }} style={styles.photo} contentFit="cover" />
      ) : photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} contentFit="cover" />
      ) : (
        <View style={[styles.photoPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="image-outline" size={28} color={colors.onSurfaceVariant} />
        </View>
      )}
      <Pressable onPress={onRemove} style={styles.removeBadge}>
        <Ionicons name="close" size={14} color="white" />
      </Pressable>
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const { pickImage, uploadPhoto } = usePhotoPicker({ aspect: [1, 1], quality: 0.8 });

  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>();
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [vanType, setVanType] = useState<string | undefined>();
  const [vanBuildStatus, setVanBuildStatus] = useState<string | undefined>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name ?? "");
    setDob(currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth) : undefined);
    setGender(currentUser.gender ?? "");
    setBio(currentUser.bio ?? "");
    setInterests(currentUser.interests ?? []);
    setLookingFor(currentUser.lookingFor ?? []);
    setVanType(currentUser.vanType);
    setVanBuildStatus(currentUser.vanBuildStatus);
    setPhotos(currentUser.photos ?? []);
  }, [currentUser]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((item) => item !== interest);
      }
      if (prev.length >= MAX_INTERESTS) {
        return prev;
      }
      return [...prev, interest];
    });
  };

  const toggleLookingFor = (value: string) => {
    setLookingFor((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
  };

  const handleAddPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Maximum 5 photos allowed");
      return;
    }
    try {
      setUploading(true);
      const image = await pickImage();
      if (!image) return;
      const storageId = await uploadPhoto(image);
      setPhotos((prev) => [...prev, storageId]);
    } catch {
      Alert.alert("Error", "Failed to add photo");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentUser?._id) return;
    if (!name.trim()) {
      Alert.alert("Please enter your name");
      return;
    }
    if (photos.length === 0) {
      Alert.alert("Please add at least one photo");
      return;
    }
    if (interests.length < MIN_INTERESTS) {
      Alert.alert(`Select at least ${MIN_INTERESTS} interests`);
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        userId: currentUser._id,
        name: name.trim(),
        dateOfBirth: dob ? dob.getTime() : undefined,
        gender: gender.trim() ? gender.trim() : undefined,
        bio: bio.trim(),
        interests,
        lookingFor,
        vanType,
        vanBuildStatus,
        photos,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save profile");
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
        title="Edit Profile"
        leftContent={
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 120 },
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
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Photos</Text>
            <Text style={[styles.sectionMeta, { color: colors.onSurfaceVariant }]}>
              {photos.length}/{MAX_PHOTOS}
            </Text>
          </View>
          <View style={styles.photoGrid}>
            {photos.map((photoId, index) => (
              <PhotoTile key={`${photoId}-${index}`} storageId={photoId} onRemove={() => removePhoto(index)} />
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable
                onPress={handleAddPhoto}
                style={[styles.addPhoto, { borderColor: colors.primary }]}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Ionicons name="add" size={28} color={colors.primary} />
                )}
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Interests</Text>
            <Text style={[styles.sectionMeta, { color: colors.onSurfaceVariant }]}>
              {interests.length}/{MAX_INTERESTS}
            </Text>
          </View>
          <View style={styles.chipGrid}>
            {INTERESTS.map((interest) => (
              <GlassChip
                key={interest.name}
                label={interest.name}
                emoji={interest.emoji}
                selected={interests.includes(interest.name)}
                onPress={() => toggleInterest(interest.name)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Looking For</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Van Type</Text>
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionMeta: {
    fontSize: 13,
    fontWeight: "600",
  },
  bioInput: {
    height: 120,
    textAlignVertical: "top",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoSlot: {
    width: 100,
    height: 130,
    borderRadius: 16,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhoto: {
    width: 100,
    height: 130,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
    paddingTop: 12,
  },
});
