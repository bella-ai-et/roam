import React, { useMemo } from "react";
import { Text, View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme, AppColors } from "@/lib/theme";
import { RouteOverlapAvatar } from "@/components/syncs/RouteOverlapAvatar";
import { SyncConversationRow } from "@/components/syncs/SyncConversationRow";
import { AnimatedScreen } from "@/components/ui/AnimatedScreen";
import { SyncsSkeleton } from "@/components/ui/Skeleton";

type SyncEntry = {
  match: Doc<"matches">;
  otherUser: Doc<"users"> | null;
  lastMessage: Doc<"messages"> | null;
  unreadCount: number;
  syncStatus: string;
  syncLocation: string;
  syncDaysUntil: number | null;
  movingTo: string | null;
};

type RouteOverlap = {
  matchId: string;
  otherUser: Doc<"users"> | null;
  overlapLocation: string;
  syncStatus: string;
} | null;

function EmptySyncs() {
  const { colors } = useAppTheme();
  return (
    <View style={styles.emptyState}>
      <Ionicons name="swap-horizontal-outline" size={64} color={colors.onSurfaceVariant} />
      <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>No syncs yet</Text>
      <Text style={[styles.emptyDescription, { color: colors.onSurfaceVariant }]}>
        Start swiping on the Discover tab to find nomads on your route!
      </Text>
    </View>
  );
}

export default function RoutesScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const syncs = useQuery(
    api.syncs.getSyncsForUser,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  ) as SyncEntry[] | undefined;

  const routeOverlaps = useQuery(
    api.syncs.getNewRouteOverlaps,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  ) as RouteOverlap[] | undefined;

  const isLoading = syncs === undefined && routeOverlaps === undefined;
  const allSyncs = useMemo(() => syncs ?? [], [syncs]);
  const overlaps = useMemo(() => (routeOverlaps ?? []).filter(Boolean) as NonNullable<RouteOverlap>[], [routeOverlaps]);

  // Conversations = syncs with messages
  const conversations = useMemo(
    () => allSyncs.filter((s) => s.lastMessage),
    [allSyncs]
  );

  const navigateToChat = (matchId: string) => {
    hapticButtonPress();
    router.push(`/(app)/chat/${matchId}` as never);
  };

  if (isLoading) {
    return (
      <AnimatedScreen>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Syncs</Text>
            </View>
          </View>
          <View style={{ paddingTop: insets.top + 100 }}>
            <SyncsSkeleton />
          </View>
        </View>
      </AnimatedScreen>
    );
  }

  return (
    <AnimatedScreen>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Syncs</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[
              styles.headerButton,
              {
                backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              },
            ]}
          >
            <Ionicons name="map-outline" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
          <Pressable
            style={[
              styles.headerButton,
              {
                backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              },
            ]}
          >
            <Ionicons name="search-outline" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {allSyncs.length === 0 && overlaps.length === 0 ? (
          <EmptySyncs />
        ) : (
          <>
            {/* New Route Overlaps Section */}
            {overlaps.length > 0 && (
              <View style={styles.overlapsSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                    NEW ROUTE OVERLAPS
                  </Text>
                  <View style={[styles.newDot, { backgroundColor: AppColors.accentOrange }]} />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.overlapsScroll}
                >
                  {overlaps.map((item) => (
                    <RouteOverlapAvatar
                      key={item.matchId}
                      user={item.otherUser}
                      overlapLocation={item.overlapLocation}
                      onPress={() => navigateToChat(item.matchId)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Conversations Section */}
            {conversations.length > 0 && (
              <View style={styles.conversationsSection}>
                <Text style={[styles.sectionLabel, styles.conversationsLabel, { color: colors.onSurfaceVariant }]}>
                  CONVERSATIONS
                </Text>
                {conversations.map((item) => (
                  <SyncConversationRow
                    key={item.match._id}
                    otherUser={item.otherUser}
                    lastMessage={item.lastMessage}
                    unreadCount={item.unreadCount}
                    syncStatus={item.syncStatus}
                    syncLocation={item.syncLocation}
                    syncDaysUntil={item.syncDaysUntil}
                    movingTo={item.movingTo}
                    onPress={() => navigateToChat(item.match._id)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  overlapsSection: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  newDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overlapsScroll: {
    paddingHorizontal: 24,
    gap: 20,
  },
  conversationsSection: {
    flex: 1,
  },
  conversationsLabel: {
    paddingHorizontal: 24,
    marginBottom: 16,
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
