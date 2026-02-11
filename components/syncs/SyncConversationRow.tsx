import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { format, isToday, isYesterday } from "date-fns";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/lib/theme";
import { hapticButtonPress } from "@/lib/haptics";
import { VehicleIcon } from "./VehicleIcon";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { InlineSyncMap } from "./InlineSyncMap";
import type { RouteStop } from "@/components/discovery/mapUtils";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SyncConversationRowProps = {
  otherUser: Doc<"users"> | null;
  lastMessage: Doc<"messages"> | null;
  unreadCount: number;
  syncStatus: string;
  syncLocation: string;
  syncDaysUntil: number | null;
  movingTo: string | null;
  myRoute?: RouteStop[];
  theirRoute?: RouteStop[];
  onPress: () => void;
};

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

function formatMessageTime(timestamp?: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isToday(date)) return format(date, "h:mm");
  if (isYesterday(date)) return "Yest.";
  return format(date, "EEE");
}

function ConversationAvatar({ user, isDeparted }: { user: Doc<"users"> | null; isDeparted: boolean }) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(user?.photos?.[0]);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  const imageUri = remote ? normalized : photoUrl;
  const initials = getInitials(user?.name);

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[styles.avatar, isDeparted && styles.avatarDeparted]}
        contentFit="cover"
      />
    );
  }

  return (
    <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }, isDeparted && styles.avatarDeparted]}>
      <Text style={[styles.avatarInitials, { color: colors.onPrimaryContainer }]}>{initials}</Text>
    </View>
  );
}

export function SyncConversationRow({
  otherUser,
  lastMessage,
  unreadCount,
  syncStatus,
  syncLocation,
  syncDaysUntil,
  movingTo,
  myRoute,
  theirRoute,
  onPress,
}: SyncConversationRowProps) {
  const { colors } = useAppTheme();
  const hasUnread = unreadCount > 0;
  const isDeparted = syncStatus === "departed";
  const lastMessageText = lastMessage?.content ?? "Say hi! 👋";
  const timeText = formatMessageTime(lastMessage?.createdAt);
  const [mapExpanded, setMapExpanded] = useState(false);

  const hasBadge = syncStatus !== "none" && syncStatus !== "";
  const hasRoutes = !!myRoute?.length || !!theirRoute?.length;

  const toggleMap = useCallback(() => {
    hapticButtonPress();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMapExpanded((prev) => !prev);
  }, []);

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={[styles.row, { borderBottomColor: mapExpanded ? "transparent" : colors.outline }]}
      >
        <ConversationAvatar user={otherUser} isDeparted={isDeparted} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.name,
                { color: colors.onBackground },
                hasUnread && styles.nameUnread,
              ]}
              numberOfLines={1}
            >
              {otherUser?.name ?? "Unknown"}
            </Text>
            <VehicleIcon vanType={otherUser?.vanType} />
          </View>
          <Text
            style={[
              styles.preview,
              { color: isDeparted ? colors.onSurfaceVariant : hasUnread ? colors.onBackground : colors.onSurfaceVariant },
              hasUnread && styles.previewUnread,
            ]}
            numberOfLines={1}
          >
            {lastMessageText}
          </Text>
          {hasBadge ? (
            <Pressable
              onPress={hasRoutes ? toggleMap : undefined}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={styles.badgeTouchable}
            >
              <SyncStatusBadge
                status={syncStatus}
                location={syncLocation}
                daysUntil={syncDaysUntil}
                movingTo={movingTo}
              />
              {hasRoutes && (
                <View style={[styles.mapPeekHint, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.mapPeekHintText, { color: colors.onSurfaceVariant }]}>
                    {mapExpanded ? "Hide map" : "Map"}
                  </Text>
                </View>
              )}
            </Pressable>
          ) : null}
        </View>
        <View style={styles.meta}>
          <Text style={[styles.time, { color: colors.onSurfaceVariant }]}>{timeText}</Text>
          {hasUnread ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          ) : null}
        </View>
      </Pressable>
      <InlineSyncMap
        myRoute={myRoute}
        theirRoute={theirRoute as RouteStop[] | undefined}
        syncLocation={syncLocation}
        visible={mapExpanded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarDeparted: {
    opacity: 0.8,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  nameUnread: {
    fontWeight: "800",
  },
  preview: {
    fontSize: 14,
    marginTop: 2,
  },
  previewUnread: {
    fontWeight: "600",
  },
  meta: {
    alignItems: "flex-end",
    gap: 8,
    marginLeft: 8,
  },
  time: {
    fontSize: 10,
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeTouchable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapPeekHint: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  mapPeekHintText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
