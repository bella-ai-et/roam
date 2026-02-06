import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/lib/theme";
import { AppColors } from "@/lib/theme";
import {
  DISCOVERY_CARD_RADIUS,
  DISCOVERY_PHOTO_HEIGHT,
  INTERESTS,
  TRAVEL_STYLES,
} from "@/lib/constants";
import { JourneyStopsTimeline } from "./JourneyStopsTimeline";
import { MiniRouteMap } from "./MiniRouteMap";
import { PathsCrossBadge } from "./PathsCrossBadge";
import { buildJourneyStops } from "./discoveryUtils";

const CARD_WIDTH = Dimensions.get("window").width - 32;

function isRemoteUrl(value?: string) {
  if (!value) return false;
  const t = value.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function normalizePhoto(value?: string) {
  if (!value) return undefined;
  return value.replace(/`/g, "").trim();
}

function DiscoveryImage({
  storageId,
  style,
  iconSize = 36,
}: {
  storageId?: string;
  style: object;
  iconSize?: number;
}) {
  const { colors } = useAppTheme();
  const normalized = normalizePhoto(storageId);
  const isRemote = isRemoteUrl(normalized);
  const url = useQuery(
    api.files.getUrl,
    normalized && !isRemote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  if (isRemote && normalized) {
    return <Image source={{ uri: normalized }} style={style} contentFit="cover" />;
  }
  if (!url) {
    return (
      <View style={[style, styles.photoPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="image-outline" size={iconSize} color={colors.onSurfaceVariant} />
      </View>
    );
  }
  return <Image source={{ uri: url }} style={style} contentFit="cover" />;
}

function DiscoveryAvatar({ storageId, size }: { storageId?: string; size: number }) {
  const { colors } = useAppTheme();
  const normalized = normalizePhoto(storageId);
  const isRemote = isRemoteUrl(normalized);
  const url = useQuery(
    api.files.getUrl,
    normalized && !isRemote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  const style = { width: size, height: size, borderRadius: size / 2 };
  if (isRemote && normalized) {
    return <Image source={{ uri: normalized }} style={style} contentFit="cover" />;
  }
  if (!url) {
    return (
      <View style={[style, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="person" size={size * 0.5} color={colors.onSurfaceVariant} />
      </View>
    );
  }
  return <Image source={{ uri: url }} style={style} contentFit="cover" />;
}

export type RouteMatch = {
  user: {
    _id: Id<"users">;
    name: string;
    dateOfBirth?: number;
    photos?: string[];
    bio?: string;
    interests?: string[];
    travelStyles?: string[];
    lifestyleLabel?: string;
    vanVerified?: boolean;
    currentRoute?: Array<{
      location: { latitude: number; longitude: number; name: string };
      arrivalDate: string;
      departureDate: string;
    }>;
  };
  overlaps: Array<{
    locationName: string;
    dateRange: { start: string; end: string };
    distance: number;
  }>;
  sharedInterests: string[];
};

interface DiscoveryCardProps {
  match: RouteMatch;
  onPress: () => void;
  onExpandMap?: () => void;
}

export function DiscoveryCard({ match, onPress, onExpandMap }: DiscoveryCardProps) {
  const { colors, isDark } = useAppTheme();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActivePhotoIndex(viewableItems[0].index);
      }
    }
  ).current;

  const user = match.user;
  const photos = user.photos ?? [];
  const overlap = match.overlaps[0];
  const age =
    user.dateOfBirth != null
      ? Math.floor((Date.now() - user.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined;
  const displayName = `${user.name}${age != null ? `, ${age}` : ""}`;
  const lifestyleLabel = user.lifestyleLabel ?? "";

  const interestNames = match.sharedInterests.length >= 3
    ? match.sharedInterests.slice(0, 3)
    : [...(user.interests ?? []), ...match.sharedInterests]
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 3);

  const journeyStops = buildJourneyStops(match as Parameters<typeof buildJourneyStops>[0]);
  const travelStyleLabels = (user.travelStyles ?? []).map(
    (v) => TRAVEL_STYLES.find((t) => t.value === v)?.label ?? v
  );
  const travelStyleEmojis = (user.travelStyles ?? []).map(
    (v) => TRAVEL_STYLES.find((t) => t.value === v)?.emoji ?? "🚐"
  );

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: isDark ? colors.surface : AppColors.background.light }]}
    >
      {/* Photo section */}
      <View style={styles.photoSection}>
        {photos.length === 0 ? (
          <DiscoveryImage storageId={undefined} style={styles.photoFill} />
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => (
              <DiscoveryImage storageId={item} style={styles.photoFill} />
            )}
          />
        )}

        {/* Dots top center */}
        {photos.length > 1 && (
          <View style={styles.dotsRow}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: "#fff",
                    opacity: i === activePhotoIndex ? 1 : 0.4,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Mini map top right */}
        <View style={styles.miniMapWrap}>
          <MiniRouteMap
            avatarStorageId={photos[0]}
            avatarElement={<DiscoveryAvatar storageId={photos[0]} size={28} />}
            onExpand={onExpandMap}
          />
        </View>

        {/* Gradient + user info */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.photoGradient}
        />
        <View style={styles.photoTextRow}>
          <Text style={styles.photoName}>{displayName}</Text>
          {user.vanVerified && (
            <Ionicons name="shield-checkmark" size={18} color="#93c5fd" />
          )}
          {lifestyleLabel ? (
            <Text style={styles.lifestyleLabel}>{lifestyleLabel}</Text>
          ) : null}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {overlap && (
          <PathsCrossBadge
            locationName={overlap.locationName}
            dateRangeStart={overlap.dateRange.start}
            dateRangeEnd={overlap.dateRange.end}
            distanceKm={overlap.distance}
          />
        )}

        {user.bio ? (
          <View style={[styles.bioBox, { backgroundColor: isDark ? colors.surfaceVariant : "#f8fafc" }]}>
            <Text style={[styles.bioText, { color: colors.onSurface }]} numberOfLines={4}>
              "{user.bio}"
            </Text>
          </View>
        ) : null}

        {interestNames.length > 0 && (
          <View style={styles.interestRow}>
            {interestNames.map((name) => {
              const meta = INTERESTS.find((i) => i.name === name);
              return (
                <View
                  key={name}
                  style={[
                    styles.interestPill,
                    {
                      backgroundColor: isDark
                        ? "rgba(210,124,92,0.25)"
                        : "rgba(210,124,92,0.12)",
                    },
                  ]}
                >
                  <Text style={[styles.interestPillText, { color: colors.primary }]}>
                    {meta?.emoji ? `${meta.emoji} ` : ""}{name}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <JourneyStopsTimeline stops={journeyStops} />

        {travelStyleLabels.length > 0 && (
          <View style={styles.travelStylesRow}>
            {travelStyleLabels.map((label, i) => (
              <View
                key={label}
                style={[styles.travelStylePill, { backgroundColor: colors.surfaceVariant }]}
              >
                <Text style={styles.travelStyleEmoji}>{travelStyleEmojis[i] ?? "🚐"}</Text>
                <Text style={[styles.travelStyleText, { color: colors.onSurfaceVariant }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: DISCOVERY_CARD_RADIUS,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  photoSection: {
    height: DISCOVERY_PHOTO_HEIGHT,
    width: "100%",
  },
  photoFill: {
    width: CARD_WIDTH,
    height: DISCOVERY_PHOTO_HEIGHT,
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  dotsRow: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniMapWrap: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  photoGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  photoTextRow: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  photoName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  lifestyleLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  content: {
    padding: 24,
  },
  bioBox: {
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  bioText: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
  interestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  interestPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  interestPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  travelStylesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  travelStylePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  travelStyleEmoji: {
    fontSize: 12,
  },
  travelStyleText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
