import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { GlassButton } from "@/components/glass";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { hapticSelection } from "@/lib/haptics";

const MAX_PHOTOS = 5;

interface PhotosStepProps {
  photos: string[];
  localPhotos: { id: string; uri: string }[];
  onAddPhoto: (storageId: string, uri: string) => void;
  onRemovePhoto: (index: number) => void;
  onNext: () => void;
}

export function PhotosStep({ photos, localPhotos, onAddPhoto, onRemovePhoto, onNext }: PhotosStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { pickImage, uploadPhoto } = usePhotoPicker({ aspect: [1, 1], quality: 0.8 });
  const [uploading, setUploading] = useState(false);

  const handleAdd = async () => {
    if (localPhotos.length >= MAX_PHOTOS) return;
    try {
      setUploading(true);
      const image = await pickImage();
      if (!image) return;
      const storageId = await uploadPhoto(image);
      onAddPhoto(storageId, image.uri);
      hapticSelection();
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    onRemovePhoto(index);
    hapticSelection();
  };

  const canContinue = photos.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: 120 }]}
      >
        <Animated.Text
          entering={FadeInDown.delay(100).duration(500)}
          style={[styles.headline, { color: colors.onSurface }]}
        >
          Show yourself
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.subtitleRow}>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            At least 1 photo
          </Text>
          <Text style={[styles.counter, { color: colors.onSurfaceVariant }]}>
            {localPhotos.length} / {MAX_PHOTOS}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.photoGrid}>
          {localPhotos.map((photo, index) => (
            <Animated.View key={photo.id} entering={ZoomIn.duration(300)} style={styles.photoSlot}>
              <Pressable onPress={() => handleRemove(index)} style={styles.photoSlot}>
                <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
                <View style={styles.removeBadge}>
                  <Ionicons name="close" size={12} color="white" />
                </View>
              </Pressable>
            </Animated.View>
          ))}

          {localPhotos.length < MAX_PHOTOS && (
            <Pressable
              onPress={handleAdd}
              disabled={uploading}
              style={[styles.addPhoto, { borderColor: colors.primary }]}
            >
              {uploading ? (
                <Ionicons name="cloud-upload" size={24} color={colors.primary} />
              ) : (
                <Ionicons name="add" size={32} color={colors.primary} />
              )}
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GlassButton title="Continue" onPress={onNext} disabled={!canContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 32,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
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
    borderStyle: "dashed",
    borderWidth: 2,
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
    paddingHorizontal: 32,
    paddingTop: 16,
  },
});
