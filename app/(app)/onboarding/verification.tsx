import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassHeader, GlassButton } from "@/components/glass";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppTheme } from "@/lib/theme";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { setOnboardingField } from "@/lib/onboardingState";
import { hapticSelection } from "@/lib/haptics";

export default function VerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { pickImage, uploadPhoto } = usePhotoPicker({ aspect: [3, 4], quality: 0.8 });
  const [uploading, setUploading] = useState(false);
  
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleUpload = async () => {
    try {
      setUploading(true);
      const image = await pickImage();
      if (!image) return;
      const storageId = await uploadPhoto(image);
      setPhotoUrl(image.uri);
      setOnboardingField("vanPhotoUrl", storageId);
      hapticSelection();
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    // Navigate to next screen (profile info)
    // For now we'll push to a placeholder or the next logical step
    // Assuming next step is profile info which we haven't built yet,
    // but the instruction says "navigate to profile screen"
    router.push("/(app)/onboarding/profile"); 
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        title="Van Verification"
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
        <ProgressBar current={1} total={8} />

        <View style={styles.badgeRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4CD964" />
          <Text style={styles.badgeText}>Safety Feature</Text>
        </View>

        <Text style={[styles.heading, { color: colors.onSurface }]}>
          Verify your van
        </Text>

        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          This helps keep our community safe and builds trust, especially for solo female travelers.
        </Text>

        <Pressable
          onPress={handleUpload}
          disabled={uploading}
          style={[
            styles.uploadArea,
            { 
              borderColor: colors.outline,
              backgroundColor: colors.surfaceVariant 
            }
          ]}
        >
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.previewImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons 
                name="camera-outline" 
                size={40} 
                color={colors.onSurfaceVariant} 
                style={{ opacity: 0.5 }}
              />
              <Text style={[styles.uploadText, { color: colors.onSurfaceVariant }]}>
                {uploading ? "Uploading..." : "Tap to upload van photo"}
              </Text>
            </View>
          )}
        </Pressable>

        {photoUrl && (
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={20} color="#4CD964" />
            <Text style={[styles.successText, { color: colors.onSurface }]}>
              Van photo uploaded
            </Text>
          </View>
        )}

        <Text style={[styles.note, { color: colors.onSurfaceVariant }]}>
          You can skip this for now and verify later from your profile.
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          loading={uploading}
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
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    backgroundColor: "rgba(76, 217, 100, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: "#4CD964",
    fontSize: 13,
    fontWeight: "600",
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 32,
  },
  uploadArea: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 16,
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: "500",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    justifyContent: "center",
  },
  successText: {
    fontSize: 15,
    fontWeight: "600",
  },
  note: {
    fontStyle: "italic",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
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
