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
import { COMMUNITY_TOPICS, POST_TYPES, SPOT_AMENITIES, TOPIC_COLORS } from "@/lib/constants";
import { hapticButtonPress, hapticSelection, hapticSuccess } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

const MAX_PHOTOS = 5;

// ─── Post-type → default topic mapping ─────────────────────────────
const TYPE_TO_TOPIC: Record<string, string> = {
  question: "ask",
  spot: "camp_spots",
  tip: "local_tips",
  meetup: "meetups",
  showcase: "showcase",
};

export default function CreateCommunityPostScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { pickImage, uploadPhoto } = usePhotoPicker({ aspect: [4, 3], quality: 0.8 });
  const createPost = useMutation(api.posts.createPost);

  // Core fields
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [localPhotos, setLocalPhotos] = useState<Array<{ id: string; uri: string }>>([]);
  const [uploading, setUploading] = useState(false);

  // Spot review fields
  const [locationName, setLocationName] = useState("");
  const [rating, setRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Meetup fields
  const [meetupDate, setMeetupDate] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");

  const canPost = useMemo(() => {
    if (uploading || !selectedPostType || !title.trim()) return false;
    if (selectedPostType === "tip") return title.trim().length > 0 && content.trim().length > 0;
    if (selectedPostType === "spot") return title.trim().length > 0 && locationName.trim().length > 0;
    if (selectedPostType === "meetup") return title.trim().length > 0 && meetupDate.trim().length > 0;
    return title.trim().length > 0 && content.trim().length > 0;
  }, [uploading, selectedPostType, title, content, locationName, meetupDate]);

  const handleSelectPostType = (value: string) => {
    hapticSelection();
    setSelectedPostType(value);
    const defaultTopic = TYPE_TO_TOPIC[value];
    if (defaultTopic) setSelectedTopic(defaultTopic);
  };

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

  const toggleAmenity = (value: string) => {
    hapticSelection();
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  const handlePost = async () => {
    if (!canPost || !currentUser?._id || !selectedPostType) return;
    const topic = selectedTopic ?? TYPE_TO_TOPIC[selectedPostType] ?? "ask";

    await createPost({
      authorId: currentUser._id,
      title: title.trim(),
      content: content.trim(),
      category: topic,
      postType: selectedPostType,
      photos: localPhotos.map((photo) => photo.id),
      ...(selectedPostType === "spot" && locationName.trim()
        ? {
            location: { latitude: 0, longitude: 0, name: locationName.trim() },
            rating: rating > 0 ? rating : undefined,
            amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
          }
        : {}),
      ...(selectedPostType === "meetup"
        ? {
            meetupDate: meetupDate.trim() || undefined,
            maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
            ...(locationName.trim()
              ? { location: { latitude: 0, longitude: 0, name: locationName.trim() } }
              : {}),
          }
        : {}),
    });
    hapticSuccess();
    router.back();
  };

  // ─── Render ────────────────────────────────────────────────────────

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
            <Text style={[styles.postBtn, { color: canPost ? colors.primary : colors.onSurfaceVariant }]}>
              Post
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 1: Post type selector ───────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>What are you sharing?</Text>
        <View style={styles.typeGrid}>
          {POST_TYPES.map((pt) => {
            const isSelected = selectedPostType === pt.value;
            return (
              <Pressable
                key={pt.value}
                onPress={() => handleSelectPostType(pt.value)}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: isSelected ? colors.primary : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"),
                    borderColor: isSelected ? colors.primary : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                  },
                ]}
              >
                <Text style={styles.typeEmoji}>{pt.emoji}</Text>
                <Text style={[styles.typeLabel, { color: isSelected ? "white" : colors.onBackground }]}>
                  {pt.label}
                </Text>
                <Text style={[styles.typeDesc, { color: isSelected ? "rgba(255,255,255,0.7)" : colors.onSurfaceVariant }]}>
                  {pt.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Show rest of form only after post type is chosen */}
        {selectedPostType && (
          <>
            {/* ── Topic selector ──────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Topic</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {COMMUNITY_TOPICS.map((topic) => {
                  const isSelected = selectedTopic === topic.value;
                  const tc = TOPIC_COLORS[topic.value];
                  const chipBg = isSelected
                    ? (isDark ? tc?.darkText ?? colors.primary : tc?.text ?? colors.primary)
                    : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)");
                  return (
                    <Pressable
                      key={topic.value}
                      onPress={() => { hapticSelection(); setSelectedTopic(topic.value); }}
                      style={[styles.chip, { backgroundColor: chipBg }]}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? "white" : colors.onBackground }]}>
                        {topic.emoji} {topic.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Title ───────────────────────────────────────────── */}
            <GlassInput
              label="Title"
              placeholder={
                selectedPostType === "spot"
                  ? "Name this spot..."
                  : selectedPostType === "tip"
                    ? "What's the tip?"
                    : selectedPostType === "meetup"
                      ? "What's the plan?"
                      : "What's on your mind?"
              }
              value={title}
              onChangeText={setTitle}
            />

            {/* ── Spot review: Location + Rating + Amenities ──────── */}
            {selectedPostType === "spot" && (
              <>
                <View style={styles.section}>
                  <GlassInput
                    label="Location name"
                    placeholder="e.g. Praia do Guincho, Portugal"
                    value={locationName}
                    onChangeText={setLocationName}
                  />
                </View>
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Rating</Text>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable key={star} onPress={() => { hapticSelection(); setRating(star); }}>
                        <Ionicons
                          name={star <= rating ? "star" : "star-outline"}
                          size={28}
                          color={star <= rating ? "#F59E0B" : colors.onSurfaceVariant}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Amenities</Text>
                  <View style={styles.amenityGrid}>
                    {SPOT_AMENITIES.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.value);
                      return (
                        <Pressable
                          key={amenity.value}
                          onPress={() => toggleAmenity(amenity.value)}
                          style={[
                            styles.amenityChip,
                            {
                              backgroundColor: isSelected ? colors.primary : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"),
                              borderColor: isSelected ? colors.primary : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                            },
                          ]}
                        >
                          <Text style={styles.amenityEmoji}>{amenity.emoji}</Text>
                          <Text style={[styles.amenityLabel, { color: isSelected ? "white" : colors.onBackground }]}>
                            {amenity.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {/* ── Meetup: Location + Date + Max Attendees ─────────── */}
            {selectedPostType === "meetup" && (
              <>
                <View style={styles.section}>
                  <GlassInput
                    label="Location"
                    placeholder="e.g. Café XYZ, Lisbon"
                    value={locationName}
                    onChangeText={setLocationName}
                  />
                </View>
                <View style={styles.section}>
                  <GlassInput
                    label="Date"
                    placeholder="e.g. 2026-03-15"
                    value={meetupDate}
                    onChangeText={setMeetupDate}
                  />
                </View>
                <View style={styles.section}>
                  <GlassInput
                    label="Max attendees (optional)"
                    placeholder="e.g. 20"
                    value={maxAttendees}
                    onChangeText={setMaxAttendees}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            {/* ── Content ─────────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>
                {selectedPostType === "spot" ? "Review" : selectedPostType === "tip" ? "Details" : "Content"}
              </Text>
              <AdaptiveGlassView style={styles.contentBox}>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder={
                    selectedPostType === "spot"
                      ? "Share your experience at this spot..."
                      : selectedPostType === "tip"
                        ? "Share the tip in detail..."
                        : selectedPostType === "meetup"
                          ? "What should people know about this meetup?"
                          : "Describe your question or share your experience..."
                  }
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={[styles.contentInput, { color: colors.onBackground }]}
                  multiline
                  maxLength={2000}
                />
              </AdaptiveGlassView>
            </View>

            {/* ── Photos ──────────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.photoHeader}>
                <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Photos</Text>
                <Text style={[styles.photoCount, { color: colors.onSurfaceVariant }]}>
                  {localPhotos.length} / {MAX_PHOTOS}
                </Text>
              </View>
              <Pressable
                onPress={() => { hapticButtonPress(); handleAddPhoto(); }}
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  postBtn: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Post type grid
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  typeEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  typeDesc: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },

  // Chip row
  chipRow: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Content
  contentBox: {
    borderRadius: 16,
    padding: 14,
  },
  contentInput: {
    minHeight: 120,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: "top",
  },

  // Star rating
  starRow: {
    flexDirection: "row",
    gap: 6,
  },

  // Amenity grid
  amenityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  amenityEmoji: {
    fontSize: 14,
  },
  amenityLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Photos
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
});
