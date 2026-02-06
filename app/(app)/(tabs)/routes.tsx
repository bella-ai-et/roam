import React, { useMemo, useState } from "react";
import { Text, View, StyleSheet, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { GlassHeader } from "@/components/glass";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AdaptiveGlassView } from "@/lib/glass";
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

function MatchCard({
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
  const overlapLocation = getOverlapLocation(currentUser, otherUser);
  const lastMessageText = item.lastMessage?.content ?? "Say hi! 👋";
  const hasUnread = item.unreadCount > 0;

  return (
    <Pressable onPress={onPress}>
      <AdaptiveGlassView style={styles.card}>
        <View style={styles.cardRow}>
          <MatchAvatar user={otherUser} />
          <View style={styles.cardInfo}>
            <Text style={[styles.name, { color: colors.onBackground }]}>
              {otherUser?.name ?? "Unknown"}
            </Text>
            <Text style={[styles.overlap, { color: colors.onSurfaceVariant }]}>
              Paths cross near {overlapLocation}
            </Text>
            <Text
              style={[
                styles.preview,
                { color: hasUnread ? colors.onBackground : colors.onSurfaceVariant },
                hasUnread && styles.previewUnread,
              ]}
              numberOfLines={1}
            >
              {lastMessageText}
            </Text>
          </View>
          {hasUnread ? (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </AdaptiveGlassView>
    </Pressable>
  );
}

function MapPlaceholder() {
  const { colors } = useAppTheme();
  return (
    <View style={styles.emptyState}>
      <View style={styles.mapIconRow}>
        <Ionicons name="map-outline" size={56} color={colors.primary} />
        <Ionicons name="location" size={28} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>Interactive map coming soon</Text>
      <Text style={[styles.emptyDescription, { color: colors.onSurfaceVariant }]}>
        This will show your route and all matched routes on a single map.
      </Text>
    </View>
  );
}

function EmptyMatches() {
  const { colors } = useAppTheme();
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconRow}>
        <Ionicons name="people-outline" size={48} color={colors.primary} />
        <Ionicons name="help-circle-outline" size={32} color={colors.primary} />
      </View>
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
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const matches = useQuery(
    api.messages.getMatchesWithLastMessage,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  ) as MatchWithLastMessage[] | undefined;

  const data = useMemo(() => matches ?? [], [matches]);

  const toggle = (
    <View style={styles.toggleRow}>
      <Pressable
        onPress={() => setViewMode("list")}
        style={[styles.togglePill, viewMode === "list" ? { backgroundColor: colors.primary } : { borderColor: colors.primary }]}
      >
        <Text style={[styles.toggleText, { color: viewMode === "list" ? colors.onPrimary : colors.primary }]}>List</Text>
      </Pressable>
      <Pressable
        onPress={() => setViewMode("map")}
        style={[styles.togglePill, viewMode === "map" ? { backgroundColor: colors.primary } : { borderColor: colors.primary }]}
      >
        <Text style={[styles.toggleText, { color: viewMode === "map" ? colors.onPrimary : colors.primary }]}>Map</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="Routes" rightContent={toggle} />
      {viewMode === "map" ? (
        <View style={[styles.content, { paddingTop: insets.top + 90 }]}>
          <MapPlaceholder />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.match._id}
          renderItem={({ item }) => (
            <MatchCard
              item={item}
              currentUser={currentUser}
              onPress={() => {
                hapticButtonPress();
                router.push(`/(app)/chat/${String(item.match._id)}` as never);
              }}
            />
          )}
          ListEmptyComponent={<EmptyMatches />}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: insets.top + 90 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "700",
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
  overlap: {
    fontSize: 13,
    marginTop: 4,
  },
  preview: {
    fontSize: 14,
    marginTop: 6,
  },
  previewUnread: {
    fontWeight: "600",
  },
  unreadBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  emptyIconRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
    marginBottom: 16,
  },
  mapIconRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 280,
  },
});
