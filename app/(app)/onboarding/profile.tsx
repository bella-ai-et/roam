import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { differenceInYears } from "date-fns";

import { GlassHeader, GlassButton, GlassInput, GlassOption, GlassDatePicker } from "@/components/glass";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppTheme } from "@/lib/theme";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { setOnboardingField, getOnboardingData } from "@/lib/onboardingState";
import { hapticSelection } from "@/lib/haptics";

const MAX_PHOTOS = 5;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { pickImage, uploadPhoto } = usePhotoPicker({ aspect: [1, 1], quality: 0.8 });
  const [uploading, setUploading] = useState(false);

  // Initial state from store or defaults
  const existingData = getOnboardingData();
  const [name, setName] = useState(existingData.name || "");
  const [dob, setDob] = useState<Date | undefined>(
    existingData.dateOfBirth ? new Date(existingData.dateOfBirth) : undefined
  );
  const [gender, setGender] = useState(existingData.gender || "");
  const [photos, setPhotos] = useState<string[]>(existingData.photos || []); // array of storageIds
  
  // We need to store local URIs for preview since storageIds are not directly viewable without a signed URL
  // For simplicity in this demo, we might rely on the fact that pickAndUpload returns localUri.
  // In a real app, we'd want to manage local preview URIs separately or fetch signed URLs.
  // For this implementation, I will store objects { id: string, uri: string } in local state, 
  // but only sync IDs to the store.
  const [localPhotos, setLocalPhotos] = useState<Array<{ id: string; uri: string }>>([]);

  // Load existing photos if we had them (this part is tricky without persistent local URIs across refreshes,
  // but for a single session flow, we assume the user just added them or we restart).
  // If we came back from next screen, we might lose image previews if we don't persist them.
  // For now, we'll start fresh or rely on what's in memory.

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

  const handleContinue = () => {
    if (!canContinue || !dob) return;
    
    setOnboardingField("name", name);
    setOnboardingField("dateOfBirth", dob.getTime());
    setOnboardingField("gender", gender);
    setOnboardingField("photos", photos);

    router.push("/(app)/onboarding/looking-for");
  };

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
        <ProgressBar current={2} total={8} />

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
          disabled={!canContinue}
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
