import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { AdaptiveGlassView } from "@/lib/glass";
import { COMMUNITY_TOPICS, TOPIC_COLORS, SPOT_AMENITIES } from "@/lib/constants";
import { hapticButtonPress, hapticSelection } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// ─── Types ──────────────────────────────────────────────────────────

type PostWithReplies = {
  post: Doc<"posts">;
  author: Doc<"users"> | null;
  replies: Array<{ reply: Doc<"replies">; author: Doc<"users"> | null }>;
  reactionCounts: { helpful: number; been_there: number; save: number };
  myReactions: string[];
  rsvpCount: number;
  rsvpUsers: Array<{ _id: string; name: string; photos: string[] } | null>;
  myRsvp: boolean;
};

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
    return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date(dateStr));
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

function getAuthorLocation(author: Doc<"users"> | null): string | null {
  if (!author?.currentRoute?.length) return null;
  return author.currentRoute[0].location.name;
}

function getNomadYears(author: Doc<"users"> | null): string | null {
  if (!author?.nomadSinceYear) return null;
  const years = new Date().getFullYear() - author.nomadSinceYear;
  if (years < 1) return "New nomad";
  return `${years}y on the road`;
}

// ─── Sub-components ─────────────────────────────────────────────────

function Avatar({ user, size }: { user: Doc<"users"> | null; size: number }) {
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
      <Text style={{ fontSize: size * 0.42, fontWeight: "700", color: colors.onPrimaryContainer }}>{initials}</Text>
    </View>
  );
}

function PhotoPreview({ storageId, width, height }: { storageId: string; width: number; height: number }) {
  const normalized = normalizePhotoValue(storageId);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );
  if (remote && normalized) {
    return <Image source={{ uri: normalized }} style={{ width, height, borderRadius: 12 }} contentFit="cover" />;
  }
  if (!photoUrl) {
    return <View style={{ width, height, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.08)" }} />;
  }
  return <Image source={{ uri: photoUrl }} style={{ width, height, borderRadius: 12 }} contentFit="cover" />;
}

// ─── Main screen ────────────────────────────────────────────────────

export default function CommunityPostScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const params = useLocalSearchParams<{ id?: string }>();
  const postId = typeof params.id === "string" ? (params.id as Id<"posts">) : undefined;

  const postData = useQuery(
    api.posts.getPost,
    postId ? { postId, userId: currentUser?._id } : "skip"
  ) as PostWithReplies | null | undefined;

  const toggleReaction = useMutation(api.posts.toggleReaction);
  const toggleRsvp = useMutation(api.posts.toggleRsvp);
  const addReply = useMutation(api.posts.addReply);
  const upvoteReply = useMutation(api.posts.upvoteReply);
  const markHelpful = useMutation(api.posts.markHelpful);

  const [replyUpvotes, setReplyUpvotes] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState("");

  const canSend = replyText.trim().length > 0;
  const isPostAuthor = postData?.post.authorId === currentUser?._id;

  const topic = useMemo(
    () => COMMUNITY_TOPICS.find((entry) => entry.value === postData?.post.category),
    [postData?.post.category]
  );
  const tc = postData ? TOPIC_COLORS[postData.post.category] : null;

  if (postData === undefined) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!postData) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.onBackground }}>Post not found.</Text>
      </View>
    );
  }

  const badgeBg = tc ? (isDark ? tc.darkBg : tc.bg) : colors.primaryContainer;
  const badgeText = tc ? (isDark ? tc.darkText : tc.text) : colors.onPrimaryContainer;
  const muted = isDark ? "#8E8A85" : "#6B6560";
  const authorLocation = getAuthorLocation(postData.author);
  const nomadTenure = getNomadYears(postData.author);

  const handleReaction = (type: string) => {
    if (!currentUser?._id || !postId) return;
    hapticSelection();
    toggleReaction({ postId, userId: currentUser._id, type });
  };

  const handleRsvp = () => {
    if (!currentUser?._id || !postId) return;
    hapticButtonPress();
    toggleRsvp({ postId, userId: currentUser._id });
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding">
      <AdaptiveGlassView style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.outline }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.headerSide}>
            <Ionicons name="chevron-back" size={22} color={colors.onBackground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={[styles.headerBadge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.headerBadgeText, { color: badgeText }]}>
                {topic?.emoji ?? "❓"} {topic?.label ?? postData.post.category}
              </Text>
            </View>
          </View>
          <View style={styles.headerSide} />
        </View>
      </AdaptiveGlassView>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Topic badge */}
        <View style={[styles.topicBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.topicBadgeText, { color: badgeText }]}>
            {topic?.emoji ?? "❓"} {topic?.label ?? postData.post.category}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.onBackground }]}>{postData.post.title}</Text>

        {/* Author row — enriched */}
        <View style={styles.authorRow}>
          <Avatar user={postData.author} size={36} />
          <View style={{ flex: 1 }}>
            <View style={styles.authorNameRow}>
              <Text style={[styles.authorName, { color: colors.onBackground }]}>{postData.author?.name ?? "Unknown"}</Text>
              {postData.author?.vanVerified && (
                <Ionicons name="shield-checkmark" size={13} color={colors.like} style={{ marginLeft: 4 }} />
              )}
            </View>
            <View style={styles.authorMetaRow}>
              {authorLocation && (
                <Text style={[styles.authorMeta, { color: muted }]} numberOfLines={1}>
                  📍 {authorLocation}
                </Text>
              )}
              {nomadTenure && (
                <Text style={[styles.authorMeta, { color: muted }]}>
                  {authorLocation ? " · " : ""}{nomadTenure}
                </Text>
              )}
              <Text style={[styles.authorMeta, { color: muted }]}>
                {(authorLocation || nomadTenure) ? " · " : ""}{formatPostTime(postData.post.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Spot review metadata */}
        {postData.post.postType === "spot" && postData.post.location && (
          <View style={styles.spotMeta}>
            <View style={styles.spotLocationRow}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={[styles.spotLocationName, { color: colors.primary }]}>{postData.post.location.name}</Text>
            </View>
            {postData.post.rating != null && postData.post.rating > 0 && (
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= (postData.post.rating ?? 0) ? "star" : "star-outline"}
                    size={18}
                    color={star <= (postData.post.rating ?? 0) ? "#F59E0B" : muted}
                  />
                ))}
              </View>
            )}
            {postData.post.amenities && postData.post.amenities.length > 0 && (
              <View style={styles.amenityRow}>
                {postData.post.amenities.map((a) => {
                  const amenity = SPOT_AMENITIES.find((s) => s.value === a);
                  if (!amenity) return null;
                  return (
                    <View key={a} style={[styles.amenityChip, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}>
                      <Text style={styles.amenityEmoji}>{amenity.emoji}</Text>
                      <Text style={[styles.amenityLabel, { color: colors.onSurfaceVariant }]}>{amenity.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Meetup metadata */}
        {postData.post.postType === "meetup" && (
          <View style={styles.meetupMeta}>
            {postData.post.meetupDate && (
              <View style={[styles.meetupDateRow, { backgroundColor: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.1)" }]}>
                <Ionicons name="calendar" size={16} color="#D97706" />
                <Text style={styles.meetupDateText}>{formatMeetupDate(postData.post.meetupDate)}</Text>
              </View>
            )}
            {postData.post.location && (
              <View style={styles.spotLocationRow}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={[styles.spotLocationName, { color: colors.primary, fontSize: 14 }]}>{postData.post.location.name}</Text>
              </View>
            )}
            <Pressable onPress={handleRsvp} style={[styles.rsvpButton, { backgroundColor: postData.myRsvp ? colors.primary : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"), borderColor: postData.myRsvp ? colors.primary : colors.outline }]}>
              <Ionicons name={postData.myRsvp ? "checkmark-circle" : "hand-right-outline"} size={18} color={postData.myRsvp ? "white" : colors.onBackground} />
              <Text style={[styles.rsvpButtonText, { color: postData.myRsvp ? "white" : colors.onBackground }]}>
                {postData.myRsvp ? "Going!" : "I'm in"}
              </Text>
              <Text style={[styles.rsvpCount, { color: postData.myRsvp ? "rgba(255,255,255,0.7)" : muted }]}>
                {postData.rsvpCount} going{postData.post.maxAttendees ? ` / ${postData.post.maxAttendees}` : ""}
              </Text>
            </Pressable>
            {postData.rsvpUsers.length > 0 && (
              <View style={styles.rsvpAvatarRow}>
                {postData.rsvpUsers.slice(0, 6).map((u, i) => u && (
                  <View key={u._id} style={[styles.rsvpAvatarWrap, { marginLeft: i > 0 ? -6 : 0, zIndex: 6 - i }]}>
                    <Avatar user={u as any} size={28} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Content body */}
        <Text style={[styles.contentText, { color: colors.onBackground }]}>{postData.post.content}</Text>

        {/* Photos */}
        {postData.post.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
            {postData.post.photos.map((photo) => (
              <PhotoPreview key={photo} storageId={photo} width={220} height={160} />
            ))}
          </ScrollView>
        )}

        {/* Reaction buttons */}
        <View style={styles.reactionRow}>
          {[
            { type: "helpful", emoji: "🙏", label: "Helpful" },
            { type: "been_there", emoji: "📍", label: "Been There" },
            { type: "save", emoji: "🔖", label: "Save" },
          ].map(({ type, emoji, label }) => {
            const active = postData.myReactions.includes(type);
            const count = postData.reactionCounts[type as keyof typeof postData.reactionCounts];
            return (
              <Pressable
                key={type}
                onPress={() => handleReaction(type)}
                style={[
                  styles.reactionButton,
                  {
                    backgroundColor: active ? (isDark ? "rgba(210,124,92,0.15)" : "rgba(210,124,92,0.1)") : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"),
                    borderColor: active ? colors.primary : "transparent",
                  },
                ]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={[styles.reactionLabel, { color: active ? colors.primary : colors.onSurfaceVariant }]}>
                  {label}
                </Text>
                {count > 0 && (
                  <Text style={[styles.reactionCount, { color: active ? colors.primary : muted }]}>{count}</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Replies */}
        <Text style={[styles.replyTitle, { color: colors.onBackground }]}>
          Replies ({postData.replies.length})
        </Text>

        {postData.replies.map(({ reply, author }) => {
          const replyUpvoted = replyUpvotes[reply._id] ?? false;
          const replyUpvoteCount = reply.upvotes + (replyUpvoted ? 1 : 0);
          return (
            <AdaptiveGlassView key={reply._id} style={styles.replyCard}>
              <View style={styles.replyHeader}>
                <Avatar user={author} size={24} />
                <Text style={[styles.replyName, { color: colors.onBackground }]}>{author?.name ?? "Unknown"}</Text>
                <Text style={[styles.replyTime, { color: muted }]}>
                  · {formatPostTime(reply.createdAt)}
                </Text>
              </View>
              <Text style={[styles.replyContent, { color: colors.onBackground }]}>{reply.content}</Text>
              {reply.photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.replyPhotoRow}>
                  {reply.photos.map((photo) => (
                    <PhotoPreview key={photo} storageId={photo} width={80} height={60} />
                  ))}
                </ScrollView>
              )}
              <View style={styles.replyFooter}>
                <Pressable
                  onPress={() => {
                    if (replyUpvoted) return;
                    hapticButtonPress();
                    setReplyUpvotes((prev) => ({ ...prev, [reply._id]: true }));
                    upvoteReply({ replyId: reply._id });
                  }}
                  style={styles.replyUpvote}
                >
                  <Ionicons
                    name={replyUpvoted ? "arrow-up-circle" : "arrow-up"}
                    size={16}
                    color={replyUpvoted ? colors.primary : colors.onSurfaceVariant}
                  />
                  <Text style={[styles.replyMetaText, { color: colors.onSurfaceVariant }]}>{replyUpvoteCount}</Text>
                </Pressable>
                {reply.isHelpful ? (
                  <View style={styles.helpfulBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.like} />
                    <Text style={[styles.helpfulText, { color: colors.like }]}>Helpful</Text>
                  </View>
                ) : (
                  isPostAuthor && (
                    <Pressable
                      onPress={() => {
                        hapticButtonPress();
                        markHelpful({ replyId: reply._id });
                      }}
                    >
                      <Text style={[styles.markHelpfulText, { color: colors.primary }]}>Mark Helpful</Text>
                    </Pressable>
                  )
                )}
              </View>
            </AdaptiveGlassView>
          );
        })}
      </ScrollView>

      {/* Reply input bar */}
      <AdaptiveGlassView
        style={[
          styles.inputBar,
          { paddingBottom: insets.bottom + 10, borderTopColor: colors.outline },
        ]}
      >
        <TextInput
          value={replyText}
          onChangeText={setReplyText}
          placeholder="Write a reply..."
          placeholderTextColor={colors.onSurfaceVariant}
          style={[styles.input, { color: colors.onBackground }]}
          multiline
          maxLength={800}
        />
        <Pressable
          onPress={() => {
            if (!canSend || !postId || !currentUser?._id) return;
            addReply({ postId, authorId: currentUser._id, content: replyText.trim(), photos: [] });
            setReplyText("");
            hapticButtonPress();
          }}
          disabled={!canSend}
          style={[styles.sendButton, { opacity: canSend ? 1 : 0.4 }]}
        >
          <Ionicons name="send-outline" size={22} color={colors.primary} />
        </Pressable>
      </AdaptiveGlassView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  headerSide: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 20,
  },
  topicBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  topicBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 14,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorName: {
    fontSize: 15,
    fontWeight: "700",
  },
  authorMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    flexWrap: "wrap",
  },
  authorMeta: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Spot review
  spotMeta: {
    marginTop: 16,
    gap: 10,
  },
  spotLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  spotLocationName: {
    fontSize: 15,
    fontWeight: "600",
  },
  starRow: {
    flexDirection: "row",
    gap: 3,
  },
  amenityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  amenityEmoji: {
    fontSize: 13,
  },
  amenityLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Meetup
  meetupMeta: {
    marginTop: 16,
    gap: 10,
  },
  meetupDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  meetupDateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D97706",
  },
  rsvpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  rsvpCount: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: "auto",
  },
  rsvpAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rsvpAvatarWrap: {
    borderWidth: 2,
    borderColor: "#1A1A1A",
    borderRadius: 16,
  },

  // Content
  contentText: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 24,
  },
  photoScroll: {
    marginTop: 14,
    gap: 10,
  },

  // Reaction buttons
  reactionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  reactionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  reactionEmoji: {
    fontSize: 15,
  },
  reactionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Replies
  replyTitle: {
    marginTop: 24,
    fontSize: 17,
    fontWeight: "700",
  },
  replyCard: {
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  replyName: {
    fontSize: 13,
    fontWeight: "700",
  },
  replyTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  replyContent: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 21,
  },
  replyPhotoRow: {
    marginTop: 8,
    gap: 6,
  },
  replyFooter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  replyUpvote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replyMetaText: {
    fontSize: 13,
    fontWeight: "500",
  },
  helpfulBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  helpfulText: {
    fontSize: 12,
    fontWeight: "600",
  },
  markHelpfulText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Input bar
  inputBar: {
    paddingHorizontal: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    minHeight: 40,
    fontSize: 15,
    marginRight: 10,
    flex: 1,
  },
  sendButton: {
    alignSelf: "flex-end",
    marginTop: 6,
  },
});
