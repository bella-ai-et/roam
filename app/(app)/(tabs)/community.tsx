import React, { useMemo, useState } from "react";
import { Text, View, StyleSheet, Pressable, FlatList, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { COMMUNITY_TOPICS, TOPIC_COLORS, SPOT_AMENITIES } from "@/lib/constants";
import { hapticButtonPress, hapticSelection } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";
import { AnimatedScreen } from "@/components/ui/AnimatedScreen";
import { CommunitySkeleton } from "@/components/ui/Skeleton";

type PostListItem = {
  post: Doc<"posts">;
  author: Doc<"users"> | null;
  replyCount: number;
  reactionCounts: { helpful: number; been_there: number; save: number };
  rsvpCount: number;
  rsvpAvatars: Array<{ _id: string; name: string; photos: string[] } | null>;
};

type FeedMode = "recent" | "trending";

// ─── Helpers ────────────────────────────────────────────────────────

function formatPostTime(timestamp: number) {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(timestamp));
}

function formatMeetupDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", weekday: "short" }).format(new Date(dateStr));
  } catch { return dateStr; }
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

function isVisualPost(post: Doc<"posts">) {
  return (post.postType === "showcase" || post.postType === "spot") && post.photos.length > 0;
}

function getAuthorLocation(author: Doc<"users"> | null): string | null {
  if (!author?.currentRoute?.length) return null;
  return author.currentRoute[0].location.name;
}

function getNomadYears(author: Doc<"users"> | null): string | null {
  if (!author?.nomadSinceYear) return null;
  const years = new Date().getFullYear() - author.nomadSinceYear;
  if (years < 1) return "New nomad";
  return `${years}y nomad`;
}

// ─── Sub-components ─────────────────────────────────────────────────

function Avatar({ user, size = 28 }: { user: Doc<"users"> | null; size?: number }) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(user?.photos?.[0]);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  const s = { width: size, height: size, borderRadius: size / 2 };

  if (remote && normalized) {
    return <Image source={{ uri: normalized }} style={s} contentFit="cover" />;
  }
  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={s} contentFit="cover" />;
  }
  const initials = getInitials(user?.name);
  return (
    <View style={[s, { alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryContainer }]}>
      <Text style={{ fontSize: size * 0.4, fontWeight: "700", color: colors.onPrimaryContainer }}>{initials}</Text>
    </View>
  );
}

function HeroImage({ storageId, height = 200 }: { storageId: string; height?: number }) {
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
      <View style={[styles.heroImage, { height, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }]} />
    );
  }
  return <Image source={{ uri }} style={[styles.heroImage, { height }]} contentFit="cover" />;
}

function AuthorRow({ author, timestamp, compact }: { author: Doc<"users"> | null; timestamp: number; compact?: boolean }) {
  const { colors, isDark } = useAppTheme();
  const location = getAuthorLocation(author);
  const tenure = getNomadYears(author);
  const muted = isDark ? "#8E8A85" : "#6B6560";

  return (
    <View style={styles.authorRow}>
      <Avatar user={author} size={compact ? 22 : 28} />
      <View style={{ flex: 1 }}>
        <View style={styles.authorNameRow}>
          <Text style={[styles.authorName, { color: colors.onBackground }]} numberOfLines={1}>
            {author?.name ?? "Unknown"}
          </Text>
          {author?.vanVerified && (
            <Ionicons name="shield-checkmark" size={12} color={colors.like} style={{ marginLeft: 3 }} />
          )}
          <Text style={[styles.dotSeparator, { color: muted }]}> · </Text>
          <Text style={[styles.timeText, { color: muted }]}>{formatPostTime(timestamp)}</Text>
        </View>
        {!compact && (location || tenure) && (
          <View style={styles.authorMetaRow}>
            {location && (
              <Text style={[styles.authorMeta, { color: muted }]} numberOfLines={1}>
                <Ionicons name="location-outline" size={10} color={muted} /> {location}
              </Text>
            )}
            {tenure && (
              <Text style={[styles.authorMeta, { color: muted }]}> · {tenure}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function ReactionBar({ counts, replyCount }: { counts: { helpful: number; been_there: number; save: number }; replyCount: number }) {
  const { isDark } = useAppTheme();
  const muted = isDark ? "#8E8A85" : "#94A3B8";
  const total = counts.helpful + counts.been_there + counts.save;
  if (total === 0 && replyCount === 0) return null;

  return (
    <View style={styles.reactionBar}>
      {counts.helpful > 0 && (
        <View style={styles.reactionChip}>
          <Text style={[styles.reactionEmoji]}>🙏</Text>
          <Text style={[styles.reactionCount, { color: muted }]}>{counts.helpful}</Text>
        </View>
      )}
      {counts.been_there > 0 && (
        <View style={styles.reactionChip}>
          <Text style={[styles.reactionEmoji]}>📍</Text>
          <Text style={[styles.reactionCount, { color: muted }]}>{counts.been_there}</Text>
        </View>
      )}
      {counts.save > 0 && (
        <View style={styles.reactionChip}>
          <Text style={[styles.reactionEmoji]}>🔖</Text>
          <Text style={[styles.reactionCount, { color: muted }]}>{counts.save}</Text>
        </View>
      )}
      <View style={{ flex: 1 }} />
      {replyCount > 0 && (
        <View style={styles.reactionChip}>
          <Ionicons name="chatbubble-outline" size={12} color={muted} />
          <Text style={[styles.reactionCount, { color: muted }]}>{replyCount}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Card variants ──────────────────────────────────────────────────

function VisualCard({ item, onPress, isDark, colors }: { item: PostListItem; onPress: () => void; isDark: boolean; colors: any }) {
  const topic = COMMUNITY_TOPICS.find((t) => t.value === item.post.category);
  const tc = TOPIC_COLORS[item.post.category];
  const badgeBg = tc ? (isDark ? tc.darkBg : tc.bg) : colors.primaryContainer;
  const badgeText = tc ? (isDark ? tc.darkText : tc.text) : colors.onPrimaryContainer;

  return (
    <Pressable onPress={onPress} style={[styles.visualCard, { backgroundColor: isDark ? "#1A1A1A" : "#FFF", borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
      <View style={styles.visualImageWrap}>
        <HeroImage storageId={item.post.photos[0]} height={220} />
        <View style={styles.visualOverlay}>
          <View style={[styles.topicBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.topicBadgeText, { color: badgeText }]}>
              {topic?.emoji ?? "🔧"} {topic?.label ?? item.post.category}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.visualBody}>
        <Text style={[styles.visualTitle, { color: colors.onBackground }]} numberOfLines={2}>
          {item.post.title}
        </Text>
        {item.post.postType === "spot" && item.post.location && (
          <View style={styles.spotLocationRow}>
            <Ionicons name="location" size={13} color={colors.primary} />
            <Text style={[styles.spotLocationText, { color: colors.primary }]} numberOfLines={1}>
              {item.post.location.name}
            </Text>
            {item.post.rating != null && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingText}>{item.post.rating}</Text>
              </View>
            )}
          </View>
        )}
        {item.post.postType === "spot" && item.post.amenities && item.post.amenities.length > 0 && (
          <View style={styles.amenityRow}>
            {item.post.amenities.slice(0, 5).map((a) => {
              const amenity = SPOT_AMENITIES.find((s) => s.value === a);
              return amenity ? (
                <Text key={a} style={styles.amenityEmoji}>{amenity.emoji}</Text>
              ) : null;
            })}
          </View>
        )}
        <AuthorRow author={item.author} timestamp={item.post.createdAt} />
        <ReactionBar counts={item.reactionCounts} replyCount={item.replyCount} />
      </View>
    </Pressable>
  );
}

function MeetupCard({ item, onPress, isDark, colors }: { item: PostListItem; onPress: () => void; isDark: boolean; colors: any }) {
  const tc = TOPIC_COLORS["meetups"];
  const accentBg = isDark ? tc.darkBg : tc.bg;
  const accentText = isDark ? tc.darkText : tc.text;
  const cardBg = isDark ? "#1A1A1A" : "#FFF";

  return (
    <Pressable onPress={onPress} style={[styles.meetupCard, { backgroundColor: cardBg, borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
      <View style={styles.meetupHeader}>
        <View style={[styles.meetupDateBadge, { backgroundColor: accentBg }]}>
          <Ionicons name="calendar-outline" size={14} color={accentText} />
          <Text style={[styles.meetupDateText, { color: accentText }]}>
            {formatMeetupDate(item.post.meetupDate)}
          </Text>
        </View>
        <View style={[styles.topicBadge, { backgroundColor: accentBg }]}>
          <Text style={[styles.topicBadgeText, { color: accentText }]}>🤝 Meetup</Text>
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: colors.onBackground }]} numberOfLines={2}>
        {item.post.title}
      </Text>
      {item.post.location && (
        <View style={styles.spotLocationRow}>
          <Ionicons name="location" size={13} color={colors.primary} />
          <Text style={[styles.spotLocationText, { color: colors.primary }]} numberOfLines={1}>
            {item.post.location.name}
          </Text>
        </View>
      )}
      <Text style={[styles.preview, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
        {item.post.content}
      </Text>
      {(item.rsvpCount > 0 || item.rsvpAvatars.length > 0) && (
        <View style={styles.rsvpRow}>
          <View style={styles.rsvpAvatars}>
            {item.rsvpAvatars.slice(0, 3).map((u, i) => u && (
              <View key={u._id} style={[styles.rsvpAvatarWrap, { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i }]}>
                <Avatar user={u as any} size={24} />
              </View>
            ))}
          </View>
          <Text style={[styles.rsvpText, { color: colors.onSurfaceVariant }]}>
            {item.rsvpCount} going{item.post.maxAttendees ? ` · ${item.post.maxAttendees} max` : ""}
          </Text>
        </View>
      )}
      <AuthorRow author={item.author} timestamp={item.post.createdAt} compact />
    </Pressable>
  );
}

function TipCard({ item, onPress, isDark, colors }: { item: PostListItem; onPress: () => void; isDark: boolean; colors: any }) {
  const cardBg = isDark ? "#1A1A1A" : "#FFF";

  return (
    <Pressable onPress={onPress} style={[styles.tipCard, { backgroundColor: cardBg, borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
      <View style={styles.tipIconWrap}>
        <Text style={styles.tipIcon}>💡</Text>
      </View>
      <View style={styles.tipBody}>
        <Text style={[styles.tipTitle, { color: colors.onBackground }]} numberOfLines={2}>
          {item.post.title}
        </Text>
        <Text style={[styles.tipPreview, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
          {item.post.content}
        </Text>
        <View style={styles.tipFooter}>
          <Avatar user={item.author} size={18} />
          <Text style={[styles.tipAuthor, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {item.author?.name ?? "Unknown"}
          </Text>
          <View style={{ flex: 1 }} />
          <ReactionBar counts={item.reactionCounts} replyCount={item.replyCount} />
        </View>
      </View>
    </Pressable>
  );
}

function StandardCard({ item, onPress, isDark, colors }: { item: PostListItem; onPress: () => void; isDark: boolean; colors: any }) {
  const topic = COMMUNITY_TOPICS.find((t) => t.value === item.post.category);
  const tc = TOPIC_COLORS[item.post.category];
  const badgeBg = tc ? (isDark ? tc.darkBg : tc.bg) : colors.primaryContainer;
  const badgeText = tc ? (isDark ? tc.darkText : tc.text) : colors.onPrimaryContainer;
  const cardBg = isDark ? "#1A1A1A" : "#FFF";

  return (
    <Pressable onPress={onPress} style={[styles.standardCard, { backgroundColor: cardBg, borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
      <View style={styles.cardTopRow}>
        <View style={[styles.topicBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.topicBadgeText, { color: badgeText }]}>
            {topic?.emoji ?? "❓"} {topic?.label ?? item.post.category}
          </Text>
        </View>
        {item.post.location && (
          <View style={styles.inlineLocation}>
            <Ionicons name="location-outline" size={11} color={colors.onSurfaceVariant} />
            <Text style={[styles.inlineLocationText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {item.post.location.name}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.cardTitle, { color: colors.onBackground }]} numberOfLines={2}>
        {item.post.title}
      </Text>
      <Text style={[styles.preview, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
        {item.post.content}
      </Text>
      {item.post.photos.length > 0 && (
        <View style={styles.heroImageWrapper}>
          <HeroImage storageId={item.post.photos[0]} height={180} />
        </View>
      )}
      <AuthorRow author={item.author} timestamp={item.post.createdAt} />
      <ReactionBar counts={item.reactionCounts} replyCount={item.replyCount} />
    </Pressable>
  );
}

// ─── Main screen ────────────────────────────────────────────────────

export default function CommunityScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>("recent");

  const recentPosts = useQuery(api.posts.getPosts, { category: selectedTopic ?? undefined }) as PostListItem[] | undefined;
  const trendingPosts = useQuery(api.posts.getTrendingPosts) as PostListItem[] | undefined;

  const posts = feedMode === "trending" ? trendingPosts : recentPosts;
  const data = useMemo(() => posts ?? [], [posts]);
  const selectedLabel = selectedTopic
    ? COMMUNITY_TOPICS.find((t) => t.value === selectedTopic)?.label ?? "Topic"
    : "All";

  const isLoading = posts === undefined;

  if (isLoading) {
    return (
      <AnimatedScreen>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Campfire</Text>
          </View>
          <View style={{ paddingTop: insets.top + 88 }}>
            <CommunitySkeleton />
          </View>
        </View>
      </AnimatedScreen>
    );
  }

  const navigateToPost = (postId: string) => {
    hapticButtonPress();
    router.push(`/(app)/community/${postId}`);
  };

  return (
    <AnimatedScreen>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Campfire</Text>
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
          <View>
            {/* Feed mode toggle */}
            <View style={styles.feedToggleRow}>
              <Pressable
                onPress={() => { hapticSelection(); setFeedMode("recent"); }}
                style={[styles.feedToggle, feedMode === "recent" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <Ionicons name="time-outline" size={16} color={feedMode === "recent" ? colors.primary : colors.onSurfaceVariant} />
                <Text style={[styles.feedToggleText, { color: feedMode === "recent" ? colors.primary : colors.onSurfaceVariant }]}>Recent</Text>
              </Pressable>
              <Pressable
                onPress={() => { hapticSelection(); setFeedMode("trending"); }}
                style={[styles.feedToggle, feedMode === "trending" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <Ionicons name="trending-up-outline" size={16} color={feedMode === "trending" ? colors.primary : colors.onSurfaceVariant} />
                <Text style={[styles.feedToggleText, { color: feedMode === "trending" ? colors.primary : colors.onSurfaceVariant }]}>Trending</Text>
              </Pressable>
            </View>
            {/* Topic filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <Pressable
                onPress={() => { hapticSelection(); setSelectedTopic(null); }}
                style={[styles.filterChip, { backgroundColor: selectedTopic === null ? colors.primary : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") }]}
              >
                <Text style={[styles.filterText, { color: selectedTopic === null ? "white" : colors.onBackground }]}>All</Text>
              </Pressable>
              {COMMUNITY_TOPICS.map((topic) => {
                const isSelected = selectedTopic === topic.value;
                return (
                  <Pressable
                    key={topic.value}
                    onPress={() => { hapticSelection(); setSelectedTopic(topic.value); }}
                    style={[styles.filterChip, { backgroundColor: isSelected ? colors.primary : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") }]}
                  >
                    <Text style={[styles.filterText, { color: isSelected ? "white" : colors.onBackground }]}>
                      {topic.emoji} {topic.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bonfire-outline" size={56} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>
              No posts yet{selectedTopic ? ` in ${selectedLabel}` : ""}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.onSurfaceVariant }]}>
              Start the conversation — share a spot, ask a question, or drop a tip.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const onPress = () => navigateToPost(item.post._id);

          // Visual-first cards for showcase/spot with photos
          if (isVisualPost(item.post)) {
            return <VisualCard item={item} onPress={onPress} isDark={isDark} colors={colors} />;
          }

          // Meetup cards
          if (item.post.postType === "meetup") {
            return <MeetupCard item={item} onPress={onPress} isDark={isDark} colors={colors} />;
          }

          // Tip cards — compact
          if (item.post.postType === "tip") {
            return <TipCard item={item} onPress={onPress} isDark={isDark} colors={colors} />;
          }

          // Standard cards for questions, gear, road intel, etc.
          return <StandardCard item={item} onPress={onPress} isDark={isDark} colors={colors} />;
        }}
      />
    </View>
    </AnimatedScreen>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

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
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
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
  listContent: {
    paddingHorizontal: 20,
  },

  // Feed toggle
  feedToggleRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
  },
  feedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  feedToggleText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Filter chips
  filterRow: {
    paddingBottom: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Author row
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "700",
  },
  dotSeparator: {
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  authorMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  authorMeta: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Reaction bar
  reactionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Shared
  topicBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: 4,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroImageWrapper: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    borderRadius: 12,
  },
  inlineLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  inlineLocationText: {
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },

  // Visual card
  visualCard: {
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  visualImageWrap: {
    position: "relative",
  },
  visualOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  visualBody: {
    padding: 16,
  },
  visualTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  spotLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  spotLocationText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(245,158,11,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
  },
  amenityRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  amenityEmoji: {
    fontSize: 14,
  },

  // Meetup card
  meetupCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  meetupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  meetupDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  meetupDateText: {
    fontSize: 12,
    fontWeight: "700",
  },
  rsvpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  rsvpAvatars: {
    flexDirection: "row",
  },
  rsvpAvatarWrap: {
    borderWidth: 2,
    borderColor: "#1A1A1A",
    borderRadius: 14,
  },
  rsvpText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Tip card
  tipCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipIcon: {
    fontSize: 20,
  },
  tipBody: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  tipPreview: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  tipFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  tipAuthor: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Standard card
  standardCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
