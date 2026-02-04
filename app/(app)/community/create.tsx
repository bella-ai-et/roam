import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { Image } from "expo-image";
import { GlassHeader, GlassInput } from "@/components/glass";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { AdaptiveGlassView } from "@/lib/glass";
import { BUILD_CATEGORIES, VAN_TYPES } from "@/lib/constants";
import { hapticButtonPress, hapticSelection, hapticSuccess } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

const MAX_PHOTOS = 3;

export default function CreateCommunityPostScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { pickImage, uploadPhoto } = usePhotoPicker({ aspect: [4, 3], quality: 0.8 });
  const createPost = useMutation(api.posts.createPost);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedVanType, setSelectedVanType] = useState<string | null>(null);
  const [localPhotos, setLocalPhotos] = useState<Array<{ id: string; uri: string }>>([]);
  const [uploading, setUploading] = useState(false);

  const canPost = useMemo(
    () => title.trim().length > 0 && content.trim().length > 0 && !!selectedCategory && !uploading,
    [title, content, selectedCategory, uploading]
  );

  const handleAddPhoto = async () => {
    if (localPhotos.length >= MAX_PHOTOS || uploading) return;
    try {
      setUploading(true);
      const image = await pickImage();
      if (!image) return;
      const storageId = await uploadPhoto(image);
      setLocalPhotos((prev) => [...prev, { id: storageId, uri: image.uri }]);
      hapticSelection();
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setLocalPhotos((prev) => prev.filter((_, i) => i !== index));
    hapticSelection();
  };

  const handlePost = async () => {
    if (!canPost || !currentUser?._id || !selectedCategory) return;
    await createPost({
      authorId: currentUser._id,
      title: title.trim(),
      content: content.trim(),
      category: selectedCategory,
      vanType: selectedVanType ?? undefined,
      photos: localPhotos.map((photo) => photo.id),
    });
    hapticSuccess();
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        title="New Post"
        leftContent={
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        }
        rightContent={
          <Pressable onPress={handlePost} disabled={!canPost}>
            <Text style={[styles.postText, { color: canPost ? colors.primary : colors.onSurfaceVariant }]}>
              Post
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {BUILD_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.value;
            return (
              <Pressable
                key={category.value}
                onPress={() => {
                  hapticSelection();
                  setSelectedCategory(category.value);
                }}
                style={[
                  styles.categoryChip,
                  { backgroundColor: isSelected ? colors.primary : colors.surfaceVariant },
                ]}
              >
                <Text style={[styles.categoryText, { color: isSelected ? "white" : colors.onBackground }]}>
                  {category.emoji} {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <GlassInput
          label="Title"
          placeholder="What's your question?"
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Content</Text>
          <AdaptiveGlassView style={styles.contentBox}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Describe your question or share your experience..."
              placeholderTextColor={colors.onSurfaceVariant}
              style={[styles.contentInput, { color: colors.onBackground }]}
              multiline
              maxLength={2000}
            />
          </AdaptiveGlassView>
        </View>

        <View style={styles.section}>
          <View style={styles.photoHeader}>
            <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Photos</Text>
            <Text style={[styles.photoCount, { color: colors.onSurfaceVariant }]}>
              {localPhotos.length} / {MAX_PHOTOS}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              hapticButtonPress();
              handleAddPhoto();
            }}
            style={[styles.addPhotoButton, { borderColor: colors.outline }]}
          >
            <Ionicons name="images-outline" size={18} color={colors.onSurfaceVariant} />
            <Text style={[styles.addPhotoText, { color: colors.onSurfaceVariant }]}>Add Photos</Text>
          </Pressable>

          {localPhotos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {localPhotos.map((photo, index) => (
                <Pressable key={photo.id} onPress={() => handleRemovePhoto(index)} style={styles.photoSlot}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
                  <View style={styles.removeBadge}>
                    <Ionicons name="close" size={12} color="white" />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Van Type (optional)</Text>
          <View style={styles.vanRow}>
            {VAN_TYPES.map((type) => {
              const isSelected = selectedVanType === type.value;
              return (
                <Pressable
                  key={type.value}
                  onPress={() => {
                    hapticSelection();
                    setSelectedVanType(type.value);
                  }}
                  style={[
                    styles.vanChip,
                    { backgroundColor: isSelected ? colors.primary : colors.surfaceVariant },
                  ]}
                >
                  <Text style={[styles.vanText, { color: isSelected ? "white" : colors.onBackground }]}>
                    {type.emoji} {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  postText: {
    fontSize: 15,
    fontWeight: "600",
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  contentBox: {
    borderRadius: 16,
    padding: 14,
  },
  contentInput: {
    minHeight: 150,
    fontSize: 15,
    lineHeight: 22,
  },
  photoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  photoCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  addPhotoText: {
    fontSize: 13,
    fontWeight: "600",
  },
  photoRow: {
    marginTop: 12,
    gap: 10,
  },
  photoSlot: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  removeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  vanRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  vanChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vanText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
