import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useMutation, useQuery } from "convex/react";

import { GlassHeader, GlassButton } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      <Pressable onPress={onRemove} style={styles.removeBadge}>
        <Ionicons name="close" size={14} color="white" />
      </Pressable>
    </View>
  );
}

export default function EditPhotosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const { pickImage, uploadPhoto } = usePhotoPicker({ aspect: [1, 1], quality: 0.8 });

  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setPhotos(currentUser.photos ?? []);
  }, [currentUser]);

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
    if (photos.length === 0) {
      Alert.alert("Please add at least one photo");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        userId: currentUser._id,
        photos,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save photos");
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
        title="Edit Photos"
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
          Add up to {MAX_PHOTOS} photos. Your first photo will be your profile picture.
        </Text>

        <View style={styles.photoGrid}>
          {photos.map((photoId, index) => (
            <PhotoTile key={`${photoId}-${index}`} storageId={photoId} onRemove={() => removePhoto(index)} />
          ))}
          {photos.length < MAX_PHOTOS && (
            <Pressable
              onPress={handleAddPhoto}
              style={[styles.addPhoto, { borderColor: colors.primary, backgroundColor: colors.surfaceVariant }]}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="camera" size={32} color={colors.primary} />
                  <Text style={[styles.addPhotoText, { color: colors.primary }]}>Add Photo</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        <Text style={[styles.photoCount, { color: colors.onSurfaceVariant }]}>
          {photos.length} of {MAX_PHOTOS} photos
        </Text>
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
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoSlot: {
    width: 160,
    height: 200,
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
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhoto: {
    width: 160,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: "600",
  },
  photoCount: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
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
