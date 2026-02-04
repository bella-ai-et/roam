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
import { BUILD_CATEGORIES, VAN_TYPES } from "@/lib/constants";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type PostWithReplies = {
  post: Doc<"posts">;
  author: Doc<"users"> | null;
  replies: Array<{ reply: Doc<"replies">; author: Doc<"users"> | null }>;
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

function Avatar({ user, size }: { user: Doc<"users"> | null; size: number }) {
  const { colors } = useAppTheme();
  const photoUrl = useQuery(
    api.files.getUrl,
    user?.photos?.[0] ? { storageId: user.photos[0] as Id<"_storage"> } : "skip"
  );

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  }

  const initials = getInitials(user?.name);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryContainer }}>
      <Text style={{ fontSize: size * 0.42, fontWeight: "700", color: colors.onPrimaryContainer }}>{initials}</Text>
    </View>
  );
}

function PhotoPreview({ storageId, width, height }: { storageId: string; width: number; height: number }) {
  const photoUrl = useQuery(
    api.files.getUrl,
    storageId ? { storageId: storageId as Id<"_storage"> } : "skip"
  );

  if (!photoUrl) {
    return <View style={{ width, height, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.08)" }} />;
  }

  return <Image source={{ uri: photoUrl }} style={{ width, height, borderRadius: 12 }} contentFit="cover" />;
}

export default function CommunityPostScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const params = useLocalSearchParams<{ id?: string }>();
  const postId = typeof params.id === "string" ? (params.id as Id<"posts">) : undefined;

  const postData = useQuery(api.posts.getPost, postId ? { postId } : "skip") as PostWithReplies | null | undefined;
  const upvotePost = useMutation(api.posts.upvotePost);
  const addReply = useMutation(api.posts.addReply);
  const upvoteReply = useMutation(api.posts.upvoteReply);
  const markHelpful = useMutation(api.posts.markHelpful);

  const [postUpvoted, setPostUpvoted] = useState(false);
  const [replyUpvotes, setReplyUpvotes] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState("");

  const canSend = replyText.trim().length > 0;
  const isPostAuthor = postData?.post.authorId === currentUser?._id;

  const category = useMemo(
    () => BUILD_CATEGORIES.find((entry) => entry.value === postData?.post.category),
    [postData?.post.category]
  );

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

  const postVan = postData.post.vanType ? VAN_TYPES.find((type) => type.value === postData.post.vanType) : null;
  const postUpvoteCount = postData.post.upvotes + (postUpvoted ? 1 : 0);

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding">
      <AdaptiveGlassView style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.outline }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.headerSide}>
            <Ionicons name="chevron-back" size={22} color={colors.onBackground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={[styles.headerBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.headerBadgeText, { color: colors.onPrimaryContainer }]}>
                {category?.emoji ?? "🛠️"} {category?.label ?? postData.post.category}
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
        <View style={[styles.categoryBadge, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.categoryText, { color: colors.onPrimaryContainer }]}>
            {category?.emoji ?? "🛠️"} {category?.label ?? postData.post.category}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.onBackground }]}>{postData.post.title}</Text>

        <View style={styles.authorRow}>
          <Avatar user={postData.author} size={32} />
          <Text style={[styles.authorName, { color: colors.onBackground }]}>{postData.author?.name ?? "Unknown"}</Text>
          {postVan && (
            <View style={[styles.vanBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.vanText, { color: colors.onSurfaceVariant }]}>
                {postVan.emoji} {postVan.label}
              </Text>
            </View>
          )}
          {postData.author?.vanVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.like} />
              <Text style={[styles.verifiedText, { color: colors.like }]}>✓</Text>
            </View>
          )}
          <Text style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
            • {formatPostTime(postData.post.createdAt)}
          </Text>
        </View>

        <Text style={[styles.contentText, { color: colors.onBackground }]}>{postData.post.content}</Text>

        {postData.post.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScroll}>
            {postData.post.photos.map((photo) => (
              <PhotoPreview key={photo} storageId={photo} width={200} height={140} />
            ))}
          </ScrollView>
        )}

        <Pressable
          onPress={() => {
            if (postUpvoted) return;
            hapticButtonPress();
            setPostUpvoted(true);
            upvotePost({ postId: postData.post._id });
          }}
          style={styles.upvoteButton}
        >
          <Ionicons
            name={postUpvoted ? "arrow-up-circle" : "arrow-up"}
            size={18}
            color={postUpvoted ? colors.primary : colors.onSurfaceVariant}
          />
          <Text style={[styles.upvoteText, { color: colors.onSurfaceVariant }]}>{postUpvoteCount}</Text>
        </Pressable>

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
                <Text style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                  • {formatPostTime(reply.createdAt)}
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
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
  },
  vanBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 14,
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
  timeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  contentText: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 23,
  },
  photoScroll: {
    marginTop: 14,
    gap: 10,
  },
  upvoteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  upvoteText: {
    fontSize: 14,
    fontWeight: "600",
  },
  replyTitle: {
    marginTop: 22,
    fontSize: 17,
    fontWeight: "600",
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
    fontWeight: "600",
  },
  replyContent: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
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
