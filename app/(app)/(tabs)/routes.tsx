import React, { useMemo } from "react";
import { Text, View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { format, isToday, isYesterday } from "date-fns";
import { GlassHeader } from "@/components/glass";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

type MatchWithLastMessage = {
  match: Doc<"matches">;
  otherUser: Doc<"users"> | null;
  lastMessage: Doc<"messages"> | null;
  unreadCount: number;
};

const DISTANCE_THRESHOLD_KM = 150;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 <= e2 && s2 <= e1;
}

function getOverlapLocation(currentUser?: Doc<"users"> | null, otherUser?: Doc<"users"> | null) {
  if (!currentUser?.currentRoute || !otherUser?.currentRoute) {
    return otherUser?.currentRoute?.[0]?.location?.name ?? "Unknown";
  }
  for (const myStop of currentUser.currentRoute) {
    for (const theirStop of otherUser.currentRoute) {
      const dist = haversineDistance(
        myStop.location.latitude,
        myStop.location.longitude,
        theirStop.location.latitude,
        theirStop.location.longitude
      );
      if (
        dist <= DISTANCE_THRESHOLD_KM &&
        datesOverlap(myStop.arrivalDate, myStop.departureDate, theirStop.arrivalDate, theirStop.departureDate)
      ) {
        return myStop.location.name || theirStop.location.name || "Unknown";
      }
    }
  }
  return otherUser.currentRoute?.[0]?.location?.name ?? "Unknown";
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

function MatchAvatar({ user }: { user: Doc<"users"> | null }) {
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

function formatMessageTime(timestamp?: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

function NewMatchAvatar({
  user,
  onPress,
}: {
  user: Doc<"users"> | null;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(user?.photos?.[0]);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  const imageUri = remote ? normalized : photoUrl;
  const initials = getInitials(user?.name);

  return (
    <Pressable onPress={onPress} style={styles.newMatchItem}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.newMatchAvatar} contentFit="cover" />
      ) : (
        <View style={[styles.newMatchAvatar, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.newMatchInitials, { color: colors.onPrimaryContainer }]}>
            {initials}
          </Text>
        </View>
      )}
      <View style={[styles.newMatchBorder, { borderColor: colors.primary }]} />
      <Text style={[styles.newMatchName, { color: colors.onBackground }]} numberOfLines={1}>
        {user?.name?.split(" ")[0] ?? ""}
      </Text>
    </Pressable>
  );
}

function ConversationRow({
  item,
  currentUser,
  onPress,
}: {
  item: MatchWithLastMessage;
  currentUser?: Doc<"users"> | null;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const otherUser = item.otherUser;
  const lastMessageText = item.lastMessage?.content ?? "Say hi! 👋";
  const hasUnread = item.unreadCount > 0;
  const timeText = formatMessageTime(item.lastMessage?.createdAt);

  return (
    <Pressable onPress={onPress} style={[styles.conversationRow, { borderBottomColor: colors.outline }]}>
      <MatchAvatar user={otherUser} />
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text
            style={[
              styles.conversationName,
              { color: colors.onBackground },
              hasUnread && styles.conversationNameUnread,
            ]}
            numberOfLines={1}
          >
            {otherUser?.name ?? "Unknown"}
          </Text>
          <Text style={[styles.conversationTime, { color: colors.onSurfaceVariant }]}>
            {timeText}
          </Text>
        </View>
        <View style={styles.conversationPreviewRow}>
          <Text
            style={[
              styles.conversationPreview,
              { color: hasUnread ? colors.onBackground : colors.onSurfaceVariant },
              hasUnread && styles.conversationPreviewUnread,
            ]}
            numberOfLines={1}
          >
            {lastMessageText}
          </Text>
          {hasUnread ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function EmptyMatches() {
  const { colors } = useAppTheme();
  return (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.onSurfaceVariant} />
      <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>No matches yet</Text>
      <Text style={[styles.emptyDescription, { color: colors.onSurfaceVariant }]}>
        Start swiping on the Discover tab to find nomads on your route!
      </Text>
    </View>
  );
}

export default function RoutesScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const matches = useQuery(
    api.messages.getMatchesWithLastMessage,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  ) as MatchWithLastMessage[] | undefined;

  const allMatches = useMemo(() => matches ?? [], [matches]);
  
  // New matches = those without any messages yet
  const newMatches = useMemo(
    () => allMatches.filter((m) => !m.lastMessage),
    [allMatches]
  );
  
  // Conversations = those with messages, sorted by most recent
  const conversations = useMemo(
    () =>
      allMatches
        .filter((m) => m.lastMessage)
        .sort((a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0)),
    [allMatches]
  );

  const navigateToChat = (matchId: string) => {
    hapticButtonPress();
    router.push(`/(app)/chat/${matchId}` as never);
  };

  const renderNewMatchesSection = () => {
    if (newMatches.length === 0) return null;
    return (
      <View style={styles.newMatchesSection}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>New Matches</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.newMatchesScroll}
        >
          {newMatches.map((item) => (
            <NewMatchAvatar
              key={item.match._id}
              user={item.otherUser}
              onPress={() => navigateToChat(item.match._id)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderContent = () => {
    if (allMatches.length === 0) {
      return <EmptyMatches />;
    }

    return (
      <>
        {renderNewMatchesSection()}
        {conversations.length > 0 && (
          <View style={styles.messagesSection}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Messages</Text>
            {conversations.map((item) => (
              <ConversationRow
                key={item.match._id}
                item={item}
                currentUser={currentUser}
                onPress={() => navigateToChat(item.match._id)}
              />
            ))}
          </View>
        )}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="Matches" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  newMatchesSection: {
    marginBottom: 24,
  },
  newMatchesScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  newMatchItem: {
    alignItems: "center",
    width: 72,
  },
  newMatchAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  newMatchBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
  },
  newMatchInitials: {
    fontSize: 22,
    fontWeight: "700",
  },
  newMatchName: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  messagesSection: {
    flex: 1,
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "700",
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 14,
  },
  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  conversationNameUnread: {
    fontWeight: "700",
  },
  conversationTime: {
    fontSize: 13,
    marginLeft: 8,
  },
  conversationPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  conversationPreview: {
    fontSize: 14,
    flex: 1,
  },
  conversationPreviewUnread: {
    fontWeight: "600",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 20,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    maxWidth: 280,
  },
});
