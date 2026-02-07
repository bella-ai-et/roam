import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { differenceInYears } from "date-fns";
import { useMutation } from "convex/react";

import { GlassHeader, GlassButton, GlassInput, GlassOption, GlassDatePicker } from "@/components/glass";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppTheme } from "@/lib/theme";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { hapticSelection } from "@/lib/haptics";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/convex/_generated/api";

const MAX_PHOTOS = 5;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { pickImage, uploadPhoto } = usePhotoPicker({ aspect: [1, 1], quality: 0.8 });
  const { currentUser, clerkUser } = useCurrentUser();
  const createProfile = useMutation(api.users.createProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(currentUser?.name || "");
  const [dob, setDob] = useState<Date | undefined>(
    currentUser?.dateOfBirth ? new Date(currentUser.dateOfBirth) : undefined
  );
  const [gender, setGender] = useState(currentUser?.gender || "");
  const [lifestyleLabel, setLifestyleLabel] = useState(currentUser?.lifestyleLabel || "");
  const [photos, setPhotos] = useState<string[]>(currentUser?.photos || []);
  const [localPhotos, setLocalPhotos] = useState<{ id: string; uri: string }[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name ?? "");
    setDob(currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth) : undefined);
    setGender(currentUser.gender ?? "");
    setLifestyleLabel(currentUser.lifestyleLabel ?? "");
    setPhotos(currentUser.photos ?? []);
  }, [currentUser]);

  const handleAddPhoto = async () => {
    if (localPhotos.length >= MAX_PHOTOS) return;

    try {
      setUploading(true);
      const image = await pickImage();
      if (!image) return;
      const storageId = await uploadPhoto(image);
      const newPhoto = { id: storageId, uri: image.uri };
      setLocalPhotos(prev => [...prev, newPhoto]);
      setPhotos(prev => [...prev, storageId]);
      hapticSelection();
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setLocalPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotos(prev => prev.filter((_, i) => i !== index));
    hapticSelection();
  };

  const isValidDob = dob ? differenceInYears(new Date(), dob) >= 18 : false;
  const canContinue = 
    name.trim().length > 0 && 
    isValidDob && 
    gender.length > 0 && 
    photos.length > 0;

  const handleContinue = async () => {
    if (!canContinue || !dob || !clerkUser?.id) return;
    setSaving(true);
    try {
      if (currentUser?._id) {
        await updateProfile({
          userId: currentUser._id,
          name: name.trim(),
          dateOfBirth: dob.getTime(),
          gender,
          lifestyleLabel: lifestyleLabel.trim() || undefined,
          photos,
        });
      } else {
        await createProfile({
          clerkId: clerkUser.id,
          name: name.trim(),
          dateOfBirth: dob.getTime(),
          gender,
          lifestyleLabel: lifestyleLabel.trim() || undefined,
          photos,
          interests: [],
          lookingFor: [],
          vanType: undefined,
          vanBuildStatus: undefined,
          vanVerified: false,
          vanPhotoUrl: undefined,
          currentRoute: undefined,
        });
      }
      router.push("/(app)/onboarding/travel-styles" as never);
    } catch {
      Alert.alert("Error", "Failed to save profile.");
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
        title="Your Profile"
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
        <ProgressBar current={1} total={9} />

        <View style={styles.section}>
          <GlassInput
            label="Name"
            placeholder="Your full name"
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
            error={dob && !isValidDob ? "Must be 18+" : undefined}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Gender</Text>
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
            label="Lifestyle label"
            placeholder="Vanlife • Remote Developer"
            value={lifestyleLabel}
            onChangeText={setLifestyleLabel}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.photoHeader}>
            <Text style={[styles.label, { color: colors.onSurface, marginBottom: 0 }]}>Photos (at least 1)</Text>
            <Text style={[styles.counter, { color: colors.onSurfaceVariant }]}>{localPhotos.length} / {MAX_PHOTOS}</Text>
          </View>
          
          <View style={styles.photoGrid}>
            {localPhotos.map((photo, index) => (
              <Pressable key={photo.id} onPress={() => handleRemovePhoto(index)} style={styles.photoSlot}>
                <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
                <View style={styles.removeBadge}>
                  <Ionicons name="close" size={12} color="white" />
                </View>
              </Pressable>
            ))}
            
            {localPhotos.length < MAX_PHOTOS && (
              <Pressable 
                onPress={handleAddPhoto} 
                style={[styles.addPhoto, { borderColor: colors.primary, borderStyle: "dashed", borderWidth: 2 }]}
              >
                {uploading ? (
                  <Ionicons name="cloud-upload" size={24} color={colors.primary} />
                ) : (
                  <Ionicons name="add" size={32} color={colors.primary} />
                )}
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          disabled={!canContinue || saving}
          loading={saving}
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
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  counter: {
    fontSize: 14,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoSlot: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  addPhoto: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  removeBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
});
