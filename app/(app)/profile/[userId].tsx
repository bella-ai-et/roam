import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppTheme, AppColors } from "@/lib/theme";
import { INTERESTS, TRAVEL_STYLES, LOOKING_FOR_OPTIONS, VAN_TYPES, VAN_BUILD_STATUSES, GENDERS } from "@/lib/constants";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { JourneyStopsTimeline } from "@/components/discovery/JourneyStopsTimeline";
import { InlineRouteMap } from "@/components/discovery/InlineRouteMap";
import { RouteComparisonModal } from "@/components/discovery/RouteComparisonModal";
import { buildJourneyStops } from "@/components/discovery/discoveryUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_HEIGHT = 420;

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

function ProfileImage({
  storageId,
  style,
}: {
  storageId?: string;
  style: object;
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
        <Ionicons name="image-outline" size={36} color={colors.onSurfaceVariant} />
      </View>
    );
  }
  return <Image source={{ uri: url }} style={style} contentFit="cover" />;
}

function TapPhotoViewer({
  photos,
  activeIndex,
  onChangeIndex,
}: {
  photos: string[];
  activeIndex: number;
  onChangeIndex: (i: number) => void;
}) {
  if (photos.length === 0) {
    return <ProfileImage storageId={undefined} style={styles.photoFill} />;
  }

  const handleTap = (side: "left" | "right") => {
    if (side === "left" && activeIndex > 0) {
      onChangeIndex(activeIndex - 1);
    } else if (side === "right" && activeIndex < photos.length - 1) {
      onChangeIndex(activeIndex + 1);
    }
  };

  return (
    <View style={styles.photoFill}>
      <ProfileImage storageId={photos[activeIndex]} style={StyleSheet.absoluteFill} />
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.tapZoneRow}>
          <Pressable style={styles.tapZoneLeft} onPress={() => handleTap("left")} />
          <Pressable style={styles.tapZoneRight} onPress={() => handleTap("right")} />
        </View>
      </View>
    </View>
  );
}

/* ─── Screen ─── */

export default function UserProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string }>();
  const userId = typeof params.userId === "string" ? (params.userId as Id<"users">) : undefined;

  const user = useQuery(api.users.getById, userId ? { userId } : "skip");
  const { currentUser } = useCurrentUser();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingHeader, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.onBackground} />
          </Pressable>
        </View>
        <View style={styles.loadingCenter}>
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading profile...
          </Text>
        </View>
      </View>
    );
  }

  const photos = user.photos ?? [];
  const age =
    user.dateOfBirth != null
      ? Math.floor((Date.now() - user.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined;
  const displayName = `${user.name}${age != null ? `, ${age}` : ""}`;
  const lifestyleLabel = user.lifestyleLabel ?? "";

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

  const interestNames = (user.interests ?? []).slice(0, 6);

  const journeyStops = buildJourneyStops({
    user: { currentRoute: user.currentRoute },
    overlaps: [],
  });

  const travelStyleLabels = (user.travelStyles ?? []).map(
    (v) => TRAVEL_STYLES.find((t) => t.value === v)?.label ?? v
  );
  const travelStyleEmojis = (user.travelStyles ?? []).map(
    (v) => TRAVEL_STYLES.find((t) => t.value === v)?.emoji ?? "\uD83D\uDE90"
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Photo section */}
        <View style={styles.photoSection}>
          <TapPhotoViewer
            photos={photos}
            activeIndex={activePhotoIndex}
            onChangeIndex={setActivePhotoIndex}
          />

          {/* Photo dots */}
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

          {/* Gradient + name */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.photoGradient}
            pointerEvents="none"
          />
          <View style={styles.photoInfo} pointerEvents="none">
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{displayName}</Text>
              {user.vanVerified && (
                <Ionicons name="shield-checkmark" size={16} color="#93c5fd" style={{ marginLeft: 6 }} />
              )}
            </View>
            {lifestyleLabel ? (
              <Text style={styles.subtitleText}>{lifestyleLabel}</Text>
            ) : null}
            {vanInfoLine ? (
              <Text style={styles.subtitleText}>{"\uD83D\uDE90 " + vanInfoLine}</Text>
            ) : null}
          </View>

          {/* Back button overlay */}
          <View style={[styles.backOverlay, { top: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backBtnFloat,
                {
                  backgroundColor: isDark ? "rgba(18,18,18,0.7)" : "rgba(255,255,255,0.85)",
                },
              ]}
            >
              <Ionicons name="chevron-back" size={22} color={isDark ? "#fff" : "#000"} />
            </Pressable>
          </View>
        </View>

        {/* Bio */}
        {user.bio ? (
          <View style={styles.section}>
            <View style={[styles.bioBox, { backgroundColor: isDark ? colors.surfaceVariant : "#f8fafc" }]}>
              <Text style={[styles.bioText, { color: isDark ? colors.onSurface : "#334155" }]}>
                &ldquo;{user.bio}&rdquo;
              </Text>
            </View>
          </View>
        ) : null}

        {/* Interests */}
        {interestNames.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>INTERESTS</Text>
            <View style={styles.pillRow}>
              {interestNames.map((name) => {
                const meta = INTERESTS.find((item) => item.name === name);
                return (
                  <View
                    key={name}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isDark
                          ? "rgba(210,124,92,0.2)"
                          : "rgba(210,124,92,0.1)",
                      },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: colors.primary }]}>
                      {meta?.emoji ? `${meta.emoji} ` : ""}{name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Journey stops */}
        {journeyStops.length > 0 && (
          <View style={styles.section}>
            <JourneyStopsTimeline stops={journeyStops} />
          </View>
        )}

        {/* Route map */}
        {user.currentRoute && user.currentRoute.length > 0 && (
          <View style={styles.section}>
            <InlineRouteMap
              route={user.currentRoute}
              onExpand={() => setMapModalVisible(true)}
            />
          </View>
        )}

        {/* Looking for */}
        {(user.lookingFor ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>LOOKING FOR</Text>
            <View style={styles.pillRow}>
              {(user.lookingFor ?? []).map((v) => {
                const meta = LOOKING_FOR_OPTIONS.find((o) => o.value === v);
                return (
                  <View
                    key={v}
                    style={[styles.lookingForPill, { backgroundColor: isDark ? "rgba(232,155,116,0.15)" : "rgba(232,155,116,0.1)" }]}
                  >
                    <Text style={styles.lookingForEmoji}>{meta?.emoji ?? "\uD83D\uDC9B"}</Text>
                    <Text style={[styles.lookingForLabel, { color: AppColors.primary }]}>
                      {meta?.label ?? v.replace("_", " ")}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* About (gender + van details) */}
        {(user.gender || user.vanType || user.vanBuildStatus) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>ABOUT</Text>
            <View style={[styles.aboutBox, { backgroundColor: isDark ? colors.surfaceVariant : "#f8fafc" }]}>
              {user.gender && (
                <View style={styles.aboutRow}>
                  <Ionicons name="person-outline" size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.aboutText, { color: colors.onSurface }]}>
                    {GENDERS.find((g) => g.value === user.gender)?.label ?? user.gender}
                  </Text>
                </View>
              )}
              {user.vanType && (
                <View style={styles.aboutRow}>
                  <Ionicons name="car-outline" size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.aboutText, { color: colors.onSurface }]}>
                    {VAN_TYPES.find((t) => t.value === user.vanType)?.label ?? user.vanType}
                  </Text>
                </View>
              )}
              {user.vanBuildStatus && (
                <View style={styles.aboutRow}>
                  <Ionicons name="construct-outline" size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.aboutText, { color: colors.onSurface }]}>
                    {VAN_BUILD_STATUSES.find((s) => s.value === user.vanBuildStatus)?.label ?? user.vanBuildStatus}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Socials */}
        {(user.socialLinks?.instagram || user.socialLinks?.tiktok) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>SOCIALS</Text>
            <View style={styles.pillRow}>
              {user.socialLinks.instagram && (
                <Pressable
                  style={[styles.socialChip, { backgroundColor: isDark ? colors.surfaceVariant : "#fdf2f8" }]}
                  onPress={() => Linking.openURL(`https://instagram.com/${user.socialLinks!.instagram}`)}
                >
                  <Ionicons name="logo-instagram" size={16} color="#E1306C" />
                  <Text style={[styles.socialHandle, { color: colors.onSurface }]}>@{user.socialLinks.instagram}</Text>
                </Pressable>
              )}
              {user.socialLinks.tiktok && (
                <Pressable
                  style={[styles.socialChip, { backgroundColor: isDark ? colors.surfaceVariant : "#f0f0f0" }]}
                  onPress={() => Linking.openURL(`https://tiktok.com/@${user.socialLinks!.tiktok}`)}
                >
                  <Ionicons name="logo-tiktok" size={16} color={isDark ? "#fff" : "#000"} />
                  <Text style={[styles.socialHandle, { color: colors.onSurface }]}>@{user.socialLinks.tiktok}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Travel styles */}
        {travelStyleLabels.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>TRAVEL STYLE</Text>
            <View style={styles.pillRow}>
              {travelStyleLabels.map((label, i) => (
                <View
                  key={label}
                  style={[styles.travelPill, { backgroundColor: isDark ? colors.surfaceVariant : "#f1f5f9" }]}
                >
                  <Text style={styles.travelEmoji}>{travelStyleEmojis[i] ?? "\uD83D\uDE90"}</Text>
                  <Text style={[styles.travelText, { color: colors.onSurfaceVariant }]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Route comparison modal */}
      <RouteComparisonModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        theirRoute={user.currentRoute}
        myRoute={currentUser?.currentRoute}
        theirName={user.name}
        theirPhotoId={user.photos?.[0]}
        myPhotoId={currentUser?.photos?.[0]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "600",
  },
  photoSection: {
    height: PHOTO_HEIGHT,
    position: "relative",
  },
  photoFill: {
    width: "100%",
    height: "100%",
  },
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
    top: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  photoGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  photoInfo: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitleText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  backOverlay: {
    position: "absolute",
    left: 16,
  },
  backBtnFloat: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  bioBox: {
    borderRadius: 16,
    padding: 16,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  travelPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  travelEmoji: {
    fontSize: 16,
  },
  travelText: {
    fontSize: 13,
    fontWeight: "600",
  },
  lookingForPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  lookingForEmoji: {
    fontSize: 14,
  },
  lookingForLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  aboutBox: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aboutText: {
    fontSize: 14,
    fontWeight: "600",
  },
  socialChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  socialHandle: {
    fontSize: 13,
    fontWeight: "600",
  },
});
