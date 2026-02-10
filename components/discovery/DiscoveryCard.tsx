import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
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
  CARD_WIDTH,
  DISCOVERY_CARD_RADIUS,
  DISCOVERY_PHOTO_HEIGHT,
  INTERESTS,
  SCREEN_HEIGHT,
  TRAVEL_STYLES,
} from "@/lib/constants";
import { JourneyStopsTimeline } from "./JourneyStopsTimeline";
import { MiniRouteMap } from "./MiniRouteMap";
import { InlineRouteMap } from "./InlineRouteMap";
import { PathsCrossBadge } from "./PathsCrossBadge";
import { buildJourneyStops } from "./discoveryUtils";

/* ─── Helpers ─── */

function isRemoteUrl(value?: string) {
  if (!value) return false;
  const t = value.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function normalizePhoto(value?: string) {
  if (!value) return undefined;
  return value.replace(/`/g, "").trim();
}

function formatPreviewDate(value: string) {
  try {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return value;
  }
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

  const imgStyle = { width: size, height: size, borderRadius: size / 2 };
  if (isRemote && normalized) {
    return <Image source={{ uri: normalized }} style={imgStyle} contentFit="cover" />;
  }
  if (!url) {
    return (
      <View style={[imgStyle, { backgroundColor: colors.surfaceVariant, alignItems: "center" as const, justifyContent: "center" as const }]}>
        <Ionicons name="person" size={size * 0.5} color={colors.onSurfaceVariant} />
      </View>
    );
  }
  return <Image source={{ uri: url }} style={imgStyle} contentFit="cover" />;
}

/** Tap-zone photo browser: tap left half = prev, tap right half = next. No horizontal scroll. */
function TapPhotoViewer({
  photos,
  activeIndex,
  onChangeIndex,
  photoStyle,
}: {
  photos: string[];
  activeIndex: number;
  onChangeIndex: (i: number) => void;
  photoStyle: object;
}) {
  if (photos.length === 0) {
    return <DiscoveryImage storageId={undefined} style={photoStyle} />;
  }

  const handleTap = (side: "left" | "right") => {
    if (side === "left" && activeIndex > 0) {
      onChangeIndex(activeIndex - 1);
    } else if (side === "right" && activeIndex < photos.length - 1) {
      onChangeIndex(activeIndex + 1);
    }
  };

  return (
    <View style={photoStyle}>
      <DiscoveryImage storageId={photos[activeIndex]} style={StyleSheet.absoluteFill} />
      {/* Invisible tap zones */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.tapZoneRow}>
          <Pressable style={styles.tapZoneLeft} onPress={() => handleTap("left")} />
          <Pressable style={styles.tapZoneRight} onPress={() => handleTap("right")} />
        </View>
      </View>
    </View>
  );
}

/* ─── Types ─── */

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
    vanModel?: string;
    nomadSinceYear?: number;
    currentRoute?: Array<{
      location: { latitude: number; longitude: number; name: string };
      arrivalDate: string;
      departureDate: string;
      status?: string;
      notes?: string;
    }>;
  };
  overlaps: Array<{
    locationName: string;
    dateRange: { start: string; end: string };
    distance: number;
  }>;
  sharedInterests: string[];
};

/* ═══════════════════════════════════════════════════════════
   Preview Card (Image 1)
   - Full-bleed photo, tap left/right to browse
   - Mini map top-right (decorative, future map feature)
   - Name + lifestyle over gradient at bottom
   - Like/dislike buttons inside card at very bottom
   ═══════════════════════════════════════════════════════════ */

interface PreviewCardProps {
  match: RouteMatch;
  onLike: () => void;
  onReject: () => void;
  onExpand: () => void;
  isTopCard?: boolean;
  onExpandMap?: () => void;
}

export function PreviewCard({ match, onLike, onReject, onExpand, isTopCard = false, onExpandMap }: PreviewCardProps) {
  const { colors } = useAppTheme();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const user = match.user;
  const photos = user.photos ?? [];
  const age =
    user.dateOfBirth != null
      ? Math.floor((Date.now() - user.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined;
  const displayName = `${user.name}${age != null ? `, ${age}` : ""}`;
  const lifestyleLabel = user.lifestyleLabel ?? "";
  const overlap = match.overlaps?.[0];
  const travelTitle = overlap ? `Paths cross in ${overlap.locationName}` : "";
  const travelMeta = overlap
    ? `${formatPreviewDate(overlap.dateRange.start)} — ${formatPreviewDate(
        overlap.dateRange.end
      )} • Within ${Math.round(overlap.distance)}km`
    : "";

  return (
    <View style={styles.previewCard}>
      {/* Full-bleed photo with tap zones */}
      <TapPhotoViewer
        photos={photos}
        activeIndex={activePhotoIndex}
        onChangeIndex={setActivePhotoIndex}
        photoStyle={StyleSheet.absoluteFill}
      />

      {/* Photo dots – top center */}
      {photos.length > 1 && (
        <View style={styles.dotsRow} pointerEvents="none">
          {photos.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: "#fff", opacity: i === activePhotoIndex ? 1 : 0.4 },
              ]}
            />
          ))}
        </View>
      )}

      {/* Mini map – top right */}
      <View style={styles.miniMapWrap} pointerEvents="box-none">
        <MiniRouteMap
          route={user.currentRoute}
          isTopCard={isTopCard}
          onExpand={onExpandMap}
        />
      </View>

      {/* Gradient overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.75)"]}
        locations={[0, 0.55, 1]}
        style={styles.previewGradient}
        pointerEvents="none"
      />

      {/* Name + lifestyle – tapping opens expanded view */}
      <Pressable style={styles.previewInfoRow} onPress={onExpand}>
        <View style={styles.previewNameRow}>
          <Text style={styles.previewName}>{displayName}</Text>
          {user.vanVerified && (
            <Ionicons name="shield-checkmark" size={20} color="#93c5fd" style={{ marginLeft: 8 }} />
          )}
        </View>
        {overlap ? (
          <View style={styles.previewTravelBlock}>
            <View style={styles.previewTravelRow}>
              <Ionicons name="compass" size={16} color="rgba(255,255,255,0.95)" />
              <Text style={styles.previewTravelTitle} numberOfLines={1}>
                {travelTitle}
              </Text>
            </View>
            <Text style={styles.previewTravelMeta} numberOfLines={1}>
              {travelMeta}
            </Text>
          </View>
        ) : null}
        {lifestyleLabel ? (
          <Text style={styles.previewLifestyle}>{lifestyleLabel}</Text>
        ) : null}
      </Pressable>

      {/* Action buttons – inside card at bottom */}
      <View style={styles.previewButtons}>
        <Pressable
          onPress={onReject}
          style={({ pressed }) => [
            styles.previewRejectBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.background,
              transform: [{ scale: pressed ? 0.9 : 1 }],
            },
          ]}
        >
          <Ionicons name="close" size={32} color={colors.onSurfaceVariant} />
        </Pressable>
        <Pressable
          onPress={onLike}
          style={({ pressed }) => [
            styles.previewLikeBtn,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: pressed ? 0.9 : 1 }],
            },
          ]}
        >
          <Ionicons name="heart" size={30} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════
   Expanded Card (Image 2)
   - Smaller photo section (320px) with tap browsing
   - "Paths cross in..." badge
   - Bio quote block
   - Interest pills
   - Journey stops (adaptive: fill or scroll)
   - Travel style pills
   - Each section is a clear visual block
   ═══════════════════════════════════════════════════════════ */

interface ExpandedCardProps {
  match: RouteMatch;
  onCollapse: () => void;
  onLike: () => void;
  onReject: () => void;
  bottomInset?: number;
  onExpandMap?: () => void;
}

export function ExpandedCard({ match, onCollapse, onLike, onReject, bottomInset = 0, onExpandMap }: ExpandedCardProps) {
  const { colors, isDark } = useAppTheme();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const user = match.user;
  const photos = user.photos ?? [];
  const overlap = match.overlaps[0];
  const age =
    user.dateOfBirth != null
      ? Math.floor((Date.now() - user.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined;
  const displayName = `${user.name}${age != null ? `, ${age}` : ""}`;
  const lifestyleLabel = user.lifestyleLabel ?? "";

  // Van info line for expanded view
  const vanModel = user.vanModel;
  const nomadYears =
    user.nomadSinceYear != null
      ? Math.max(0, new Date().getFullYear() - user.nomadSinceYear)
      : undefined;
  const nomadText =
    nomadYears != null
      ? nomadYears === 0
        ? "New nomad"
        : nomadYears === 1
          ? "Nomad for 1 yr"
          : `Nomad for ${nomadYears} yrs`
      : undefined;
  const vanInfoParts = [vanModel, nomadText].filter(Boolean);
  const vanInfoLine = vanInfoParts.length > 0 ? vanInfoParts.join(" \u2022 ") : "";

  const interestNames =
    match.sharedInterests.length >= 3
      ? match.sharedInterests.slice(0, 3)
      : [...(user.interests ?? []), ...match.sharedInterests]
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 3);

  const journeyStops = buildJourneyStops(match as Parameters<typeof buildJourneyStops>[0]);
  const travelStyleLabels = (user.travelStyles ?? []).map(
    (v) => TRAVEL_STYLES.find((t) => t.value === v)?.label ?? v
  );
  const travelStyleEmojis = (user.travelStyles ?? []).map(
    (v) => TRAVEL_STYLES.find((t) => t.value === v)?.emoji ?? "\u{1F690}"
  );

  return (
    <View style={[styles.expandedCard, { backgroundColor: isDark ? colors.surface : AppColors.background.light }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 + bottomInset }}
        nestedScrollEnabled
      >
        {/* ── Photo section ── */}
        <View style={styles.expandedPhotoSection}>
          <View style={styles.expandedPhotoFrame}>
            <TapPhotoViewer
              photos={photos}
              activeIndex={activePhotoIndex}
              onChangeIndex={setActivePhotoIndex}
              photoStyle={styles.expandedPhotoFill}
            />

            {/* Dots */}
            {photos.length > 1 && (
              <View style={styles.dotsRow} pointerEvents="none">
                {photos.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: "#fff", opacity: i === activePhotoIndex ? 1 : 0.4 },
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Mini map */}
            <View style={styles.miniMapWrap} pointerEvents="box-none">
              <MiniRouteMap
                route={user.currentRoute}
                isTopCard={true}
                onExpand={onExpandMap}
              />
            </View>

            {/* Gradient + name */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.expandedPhotoGradient}
              pointerEvents="none"
            />
            <Pressable style={styles.expandedPhotoInfo} onPress={onCollapse}>
              <View style={styles.previewNameRow}>
                <Text style={styles.previewName}>{displayName}</Text>
                {user.vanVerified && (
                  <Ionicons name="shield-checkmark" size={16} color="#93c5fd" style={{ marginLeft: 6 }} />
                )}
              </View>
              {lifestyleLabel ? (
                <Text style={styles.previewLifestyle}>{lifestyleLabel}</Text>
              ) : null}
              {vanInfoLine ? (
                <Text style={styles.previewLifestyle}>{"\uD83D\uDE90 " + vanInfoLine}</Text>
              ) : null}
            </Pressable>
          </View>
        </View>

        {/* ── Section: Paths cross ── */}
        {overlap && (
          <View style={styles.section}>
            <PathsCrossBadge
              locationName={overlap.locationName}
              dateRangeStart={overlap.dateRange.start}
              dateRangeEnd={overlap.dateRange.end}
              distanceKm={overlap.distance}
            />
          </View>
        )}

        {/* ── Section: Bio ── */}
        {user.bio ? (
          <View style={styles.section}>
            <View style={[styles.bioBox, { backgroundColor: isDark ? colors.surfaceVariant : "#f8fafc" }]}>
              <Text style={[styles.bioText, { color: isDark ? colors.onSurface : "#334155" }]}>
                &ldquo;{user.bio}&rdquo;
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Section: Interests ── */}
        {interestNames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.interestRow}>
              {interestNames.map((name) => {
                const meta = INTERESTS.find((item) => item.name === name);
                return (
                  <View
                    key={name}
                    style={[
                      styles.interestPill,
                      {
                        backgroundColor: isDark
                          ? "rgba(210,124,92,0.2)"
                          : "rgba(210,124,92,0.1)",
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
          </View>
        )}

        {/* ── Section: Journey stops ── */}
        {journeyStops.length > 0 && (
          <View style={styles.section}>
            <JourneyStopsTimeline stops={journeyStops} />
          </View>
        )}

        {/* ── Section: Route map ── */}
        {user.currentRoute && user.currentRoute.length > 0 && (
          <View style={styles.section}>
            <InlineRouteMap
              route={user.currentRoute}
              onExpand={onExpandMap}
            />
          </View>
        )}

        {/* ── Section: Travel styles ── */}
        {travelStyleLabels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.travelStylesRow}>
              {travelStyleLabels.map((label, i) => (
                <View
                  key={label}
                  style={[styles.travelStylePill, { backgroundColor: isDark ? colors.surfaceVariant : "#f1f5f9" }]}
                >
                  <Text style={styles.travelStyleEmoji}>{travelStyleEmojis[i] ?? "\u{1F690}"}</Text>
                  <Text style={[styles.travelStyleText, { color: colors.onSurfaceVariant }]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed action buttons at bottom */}
      <View style={[styles.expandedActions, { bottom: bottomInset }]}>
        <Pressable
          onPress={onReject}
          style={({ pressed }) => [
            styles.previewRejectBtn,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.outline : "#f1f5f9",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 8,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          <Ionicons name="close" size={32} color={colors.onSurfaceVariant} />
        </Pressable>
        <Pressable
          onPress={onLike}
          style={({ pressed }) => [
            styles.previewLikeBtn,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 24,
              elevation: 12,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          <Ionicons name="heart" size={30} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Legacy wrapper ─── */

interface DiscoveryCardProps {
  match: RouteMatch;
  onPress: () => void;
  onExpandMap?: () => void;
}

export function DiscoveryCard({ match, onPress }: DiscoveryCardProps) {
  return <PreviewCard match={match} onExpand={onPress} onLike={onPress} onReject={onPress} />;
}

/* ═══════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════ */

const PREVIEW_CARD_HEIGHT = SCREEN_HEIGHT * 0.78;

const styles = StyleSheet.create({
  /* ── Preview card ── */
  previewCard: {
    width: CARD_WIDTH,
    height: PREVIEW_CARD_HEIGHT,
    borderRadius: DISCOVERY_CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  previewGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PREVIEW_CARD_HEIGHT * 0.5,
    pointerEvents: "none",
  },
  previewInfoRow: {
    position: "absolute",
    bottom: 110,
    left: 28,
    right: 28,
  },
  previewNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  previewLifestyle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    marginTop: 4,
  },
  previewTravelBlock: {
    marginTop: 8,
  },
  previewTravelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewTravelTitle: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "800",
  },
  previewTravelMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
    fontWeight: "600",
    marginTop: 4,
  },
  previewButtons: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
  },
  previewRejectBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLikeBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Expanded card ── */
  expandedCard: {
    flex: 1,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
    borderColor: "transparent",
  },
  expandedPhotoSection: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  expandedPhotoFrame: {
    width: "100%",
    height: DISCOVERY_PHOTO_HEIGHT,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  expandedPhotoFill: {
    width: "100%",
    height: DISCOVERY_PHOTO_HEIGHT,
  },
  expandedPhotoGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  expandedPhotoInfo: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
  },
  expandedActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 34,
    paddingTop: 12,
    paddingBottom: 16,
  },

  /* ── Section wrapper for expanded view ── */
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  /* ── Shared ── */
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  tapZoneRow: {
    flex: 1,
    flexDirection: "row",
  },
  tapZoneLeft: {
    flex: 1,
  },
  tapZoneRight: {
    flex: 1,
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
  bioBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  bioText: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
  },
  interestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  interestPillText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  travelStylesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  travelStylePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  travelStyleEmoji: {
    fontSize: 14,
  },
  travelStyleText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
