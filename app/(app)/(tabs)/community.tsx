import React, { useMemo, useState } from "react";
import { Text, View, StyleSheet, Pressable, FlatList, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { BUILD_CATEGORIES, CATEGORY_COLORS, VAN_TYPES } from "@/lib/constants";
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

function isRemoteUrl(value?: string) {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function normalizePhotoValue(value?: string) {
  if (!value) return undefined;
  return value.replace(/`/g, "").trim();
}

function Avatar({ user }: { user: Doc<"users"> | null }) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(user?.photos?.[0]);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  if (remote && normalized) {
    return <Image source={{ uri: normalized }} style={styles.avatar} contentFit="cover" />;
  }

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

function HeroImage({ storageId }: { storageId: string }) {
  const { isDark } = useAppTheme();
  const normalized = normalizePhotoValue(storageId);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  const uri = remote && normalized ? normalized : photoUrl;

  if (!uri) {
    return (
      <View
        style={[
          styles.heroImage,
          { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" },
        ]}
      />
    );
  }

  return <Image source={{ uri }} style={styles.heroImage} contentFit="cover" />;
}

export default function CommunityScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const posts = useQuery(api.posts.getPosts, { category: selectedCategory ?? undefined }) as PostListItem[] | undefined;

  const data = useMemo(() => posts ?? [], [posts]);
  const selectedLabel = selectedCategory
    ? BUILD_CATEGORIES.find((item) => item.value === selectedCategory)?.label ?? "Category"
    : "All";

  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const separatorColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const mutedText = isDark ? "#94A3B8" : "#94A3B8";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Community</Text>
        <Pressable
          onPress={() => {
            hapticButtonPress();
            router.push("/(app)/community/create");
          }}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color="white" />
        </Pressable>
      </View>
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
          const catColors = CATEGORY_COLORS[item.post.category];
          const badgeBg = catColors
            ? isDark ? catColors.darkBg : catColors.bg
            : colors.primaryContainer;
          const badgeText = catColors
            ? isDark ? catColors.darkText : catColors.text
            : colors.onPrimaryContainer;
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
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.categoryText, { color: badgeText }]}>
                      {category?.emoji ?? "🛠️"} {(category?.label ?? item.post.category).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.spacer} />
                  <View style={styles.upvoteRow}>
                    <Ionicons name="arrow-up" size={16} color={mutedText} />
                    <Text style={[styles.upvoteText, { color: mutedText }]}>{item.post.upvotes}</Text>
                  </View>
                </View>
                <Text style={[styles.cardTitle, { color: colors.onBackground }]} numberOfLines={2}>
                  {item.post.title}
                </Text>
                <Text style={[styles.preview, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                  {item.post.content}
                </Text>
                {item.post.photos.length > 0 && (
                  <View style={styles.heroImageWrapper}>
                    <HeroImage storageId={item.post.photos[0]} />
                  </View>
                )}
                <View style={[styles.cardBottomRow, { borderTopColor: separatorColor }]}>
                  <View style={styles.authorRow}>
                    <Avatar user={item.author} />
                    <View>
                      <Text style={[styles.authorName, { color: colors.onBackground }]}>
                        {item.author?.name ?? "Unknown"}
                      </Text>
                      {(item.post.vanType || item.author?.vanType) && (
                        <View style={[styles.vanBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }]}>
                          <Text style={[styles.vanText, { color: colors.primary }]}>
                            {vanType?.emoji ?? "🚐"} {(vanType?.label ?? item.post.vanType ?? item.author?.vanType ?? "").toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.replyRow}>
                      <Ionicons name="chatbubble-outline" size={13} color={mutedText} />
                      <Text style={[styles.metaText, { color: mutedText }]}>{item.replyCount}</Text>
                    </View>
                    <Text style={[styles.metaText, { color: mutedText }]}>
                      {formatPostTime(item.post.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#B65A3D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterRow: {
    paddingBottom: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 0,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  spacer: { flex: 1 },
  upvoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  upvoteText: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
    marginBottom: 6,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  heroImageWrapper: {
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 192,
    borderRadius: 12,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(182,90,61,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: "700",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "700",
  },
  vanBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  vanText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  replyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
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
