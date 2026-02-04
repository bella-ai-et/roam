import React, { useMemo, useState } from "react";
import { Text, View, StyleSheet, Pressable, FlatList, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { GlassHeader } from "@/components/glass";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { BUILD_CATEGORIES, VAN_TYPES } from "@/lib/constants";
import { AdaptiveGlassView } from "@/lib/glass";
import { hapticButtonPress, hapticSelection } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

type PostListItem = {
  post: Doc<"posts">;
  author: Doc<"users"> | null;
  replyCount: number;
};

function formatPostTime(timestamp: number) {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(timestamp));
}

function getInitials(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function Avatar({ user }: { user: Doc<"users"> | null }) {
  const { colors } = useAppTheme();
  const photoUrl = useQuery(
    api.files.getUrl,
    user?.photos?.[0] ? { storageId: user.photos[0] as Id<"_storage"> } : "skip"
  );

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={styles.avatar} contentFit="cover" />;
  }

  const initials = getInitials(user?.name);
  return (
    <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
      <Text style={[styles.avatarInitials, { color: colors.onPrimaryContainer }]}>{initials}</Text>
    </View>
  );
}

function PhotoThumb({ storageId }: { storageId: string }) {
  const photoUrl = useQuery(
    api.files.getUrl,
    storageId ? { storageId: storageId as Id<"_storage"> } : "skip"
  );

  if (!photoUrl) {
    return <View style={styles.photoPlaceholder} />;
  }

  return <Image source={{ uri: photoUrl }} style={styles.photoThumb} contentFit="cover" />;
}

export default function CommunityScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const posts = useQuery(api.posts.getPosts, { category: selectedCategory ?? undefined }) as PostListItem[] | undefined;

  const data = useMemo(() => posts ?? [], [posts]);
  const selectedLabel = selectedCategory
    ? BUILD_CATEGORIES.find((item) => item.value === selectedCategory)?.label ?? "Category"
    : "All";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        title="Community"
        rightContent={
          <Pressable
            onPress={() => {
              hapticButtonPress();
              router.push("/(app)/community/create");
            }}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="white" />
          </Pressable>
        }
      />
      <FlatList
        data={data}
        keyExtractor={(item) => item.post._id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 88, paddingBottom: 120 },
        ]}
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <Pressable
              onPress={() => {
                hapticSelection();
                setSelectedCategory(null);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedCategory === null ? colors.primary : colors.surfaceVariant,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selectedCategory === null ? "white" : colors.onBackground },
                ]}
              >
                All
              </Text>
            </Pressable>
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
                    styles.filterChip,
                    { backgroundColor: isSelected ? colors.primary : colors.surfaceVariant },
                  ]}
                >
                  <Text style={[styles.filterText, { color: isSelected ? "white" : colors.onBackground }]}>
                    {category.emoji} {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.primary} />
              <Ionicons name="help-circle-outline" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>
              No posts yet in {selectedLabel}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.onSurfaceVariant }]}>
              Be the first to ask or share!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const category = BUILD_CATEGORIES.find((entry) => entry.value === item.post.category);
          const previewText =
            item.post.content.length > 80 ? `${item.post.content.slice(0, 80)}...` : item.post.content;
          const vanType = item.post.vanType
            ? VAN_TYPES.find((type) => type.value === item.post.vanType)
            : null;
          return (
            <Pressable
              onPress={() => {
                hapticButtonPress();
                router.push(`/(app)/community/${item.post._id}`);
              }}
            >
              <AdaptiveGlassView style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={[styles.categoryText, { color: colors.onPrimaryContainer }]}>
                      {category?.emoji ?? "🛠️"} {category?.label ?? item.post.category}
                    </Text>
                  </View>
                  <View style={styles.spacer} />
                  <View style={styles.upvoteRow}>
                    <Ionicons name="arrow-up" size={14} color={colors.onSurfaceVariant} />
                    <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>{item.post.upvotes}</Text>
                  </View>
                </View>
                <Text style={[styles.cardTitle, { color: colors.onBackground }]} numberOfLines={2}>
                  {item.post.title}
                </Text>
                <Text style={[styles.preview, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                  {previewText}
                </Text>
                {item.post.photos.length > 0 && (
                  <View style={styles.photoRow}>
                    {item.post.photos.slice(0, 3).map((photo) => (
                      <PhotoThumb key={photo} storageId={photo} />
                    ))}
                  </View>
                )}
                <View style={styles.cardBottomRow}>
                  <View style={styles.authorRow}>
                    <Avatar user={item.author} />
                    <Text style={[styles.authorName, { color: colors.onBackground }]}>
                      {item.author?.name ?? "Unknown"}
                    </Text>
                    {item.post.vanType && (
                      <View style={[styles.vanBadge, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.vanText, { color: colors.onSurfaceVariant }]}>
                          {vanType?.emoji ?? "🚐"} {vanType?.label ?? item.post.vanType}
                        </Text>
                      </View>
                    )}
                    {item.author?.vanVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="shield-checkmark" size={12} color={colors.like} />
                        <Text style={[styles.verifiedText, { color: colors.like }]}>✓</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.replyRow}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.onSurfaceVariant} />
                    <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>{item.replyCount}</Text>
                  </View>
                  <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {formatPostTime(item.post.createdAt)}
                  </Text>
                </View>
              </AdaptiveGlassView>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryBadge: {
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  spacer: { flex: 1 },
  upvoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  preview: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  photoRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: "700",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
  },
  vanBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  vanText: {
    fontSize: 11,
    fontWeight: "600",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "700",
  },
  replyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 8,
  },
  emptyIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
  },
});
