import React, { useMemo, useRef, useState } from "react";
import { Text, View, StyleSheet, ScrollView, Pressable, FlatList } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { differenceInYears, format, parse } from "date-fns";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AdaptiveGlassView } from "@/lib/glass";
import { GlassButton, GlassChip } from "@/components/glass";
import { hapticButtonPress } from "@/lib/haptics";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { INTERESTS, SCREEN_WIDTH, VAN_BUILD_STATUSES, VAN_TYPES } from "@/lib/constants";

function isRemoteUrl(value?: string) {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function normalizePhotoValue(value?: string) {
  if (!value) return undefined;
  return value.replace(/`/g, "").trim();
}

function PhotoItem({ storageId }: { storageId: string }) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(storageId);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  if (remote && normalized) {
    return <Image source={{ uri: normalized }} style={styles.photo} contentFit="cover" />;
  }

  if (!photoUrl) {
    return (
      <View style={[styles.photoPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="image-outline" size={32} color={colors.onSurfaceVariant} />
      </View>
    );
  }

  return <Image source={{ uri: photoUrl }} style={styles.photo} contentFit="cover" />;
}

export default function ProfileScreen() { 
  const { colors } = useAppTheme();
  const { currentUser, clerkUser } = useCurrentUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const photos = currentUser?.photos ?? [];
  const displayName = currentUser?.name || clerkUser?.fullName || "Your Profile";
  const age = currentUser?.dateOfBirth ? differenceInYears(new Date(), new Date(currentUser.dateOfBirth)) : undefined;

  const vanType = useMemo(
    () => VAN_TYPES.find((type) => type.value === currentUser?.vanType),
    [currentUser?.vanType]
  );
  const vanBuildStatus = useMemo(
    () => VAN_BUILD_STATUSES.find((status) => status.value === currentUser?.vanBuildStatus),
    [currentUser?.vanBuildStatus]
  );
  const interests = useMemo(
    () =>
      (currentUser?.interests ?? []).map((interest) => {
        const match = INTERESTS.find((item) => item.name === interest);
        return { name: interest, emoji: match?.emoji };
      }),
    [currentUser?.interests]
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActivePhotoIndex(viewableItems[0].index);
    }
  }).current;

  const handleSignOut = () => {
    hapticButtonPress();
    signOut();
  };

  const handleEditProfile = () => {
    hapticButtonPress();
    router.push("/(app)/edit-profile");
  };

  const formatRouteDate = (value: string) => {
    const parsed = parse(value, "MM/dd/yyyy", new Date());
    if (Number.isNaN(parsed.getTime())) return value;
    return format(parsed, "MMM d");
  };

  const formatDateRange = (arrival: string, departure: string) => {
    const start = formatRouteDate(arrival);
    const end = formatRouteDate(departure);
    return `${start} – ${end}`;
  };

  const lookingForChips = useMemo(() => {
    const values = currentUser?.lookingFor ?? [];
    return values.map((value) => {
      if (value === "dating") {
        return { value, label: "Dating", color: colors.primary, textColor: "#FFFFFF" };
      }
      if (value === "friends") {
        return { value, label: "Friends", color: "#4ECDC4", textColor: "#FFFFFF" };
      }
      if (value === "van_help" || value === "vanhelp") {
        return { value, label: "Van Help", color: "#F4D03F", textColor: "#1A1A1A" };
      }
      return { value, label: value, color: colors.surfaceVariant, textColor: colors.onSurfaceVariant };
    });
  }, [currentUser?.lookingFor, colors.primary, colors.onSurfaceVariant, colors.surfaceVariant]);

  const routeStops = currentUser?.currentRoute ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.carouselWrapper}>
          {photos.length > 0 ? (
            <FlatList
              data={photos}
              keyExtractor={(item, index) => `${item}-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <PhotoItem storageId={item} />}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
            />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="camera-outline" size={36} color={colors.onSurfaceVariant} />
            </View>
          )}

          {photos.length > 0 && (
            <View style={styles.dotsRow}>
              {photos.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === activePhotoIndex
                          ? colors.primary
                          : colors.onSurfaceVariant,
                      opacity: index === activePhotoIndex ? 1 : 0.35,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.onBackground }]}>{displayName}</Text>
          {typeof age === "number" && (
            <Text style={[styles.age, { color: colors.onSurfaceVariant }]}>{age}</Text>
          )}
        </View>

        {currentUser?.vanVerified ? (
          <View style={styles.verifiedRow}>
            <Ionicons name="shield-checkmark" size={14} color={colors.like} />
            <Text style={[styles.verifiedText, { color: colors.like }]}>Verified</Text>
          </View>
        ) : (
          <Pressable onPress={() => {}} hitSlop={10} style={styles.verifyLink}>
            <Text style={[styles.verifyText, { color: colors.primary }]}>Verify your van →</Text>
          </Pressable>
        )}

        <View style={styles.section}>
          {currentUser?.bio ? (
            <Text style={[styles.bio, { color: colors.onSurfaceVariant }]}>{currentUser.bio}</Text>
          ) : (
            <Text style={[styles.bioMuted, { color: colors.onSurfaceVariant }]}>
              Add a bio to your profile
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Interests</Text>
          <View style={styles.chipRow}>
            {interests.map((interest) => (
              <GlassChip
                key={interest.name}
                label={interest.name}
                emoji={interest.emoji}
                selected
                onPress={() => {}}
                disabled
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AdaptiveGlassView style={styles.vanCard}>
            <View style={styles.vanRow}>
              <View style={styles.vanLabelRow}>
                <Text style={styles.vanEmoji}>{vanType?.emoji ?? "🚐"}</Text>
                <Text style={[styles.vanLabel, { color: colors.onBackground }]}>
                  {vanType?.label ?? "Van type not set"}
                </Text>
              </View>
              <Text style={[styles.vanStatus, { color: colors.onSurfaceVariant }]}>
                {vanBuildStatus?.label ?? "Build status not set"}
              </Text>
            </View>
          </AdaptiveGlassView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Current Route</Text>
        {routeStops.length > 0 ? (
            <View style={styles.routeList}>
              {routeStops.map((stop, index) => (
                <View key={`${stop.location.name}-${index}`} style={styles.routeRow}>
                  <View style={styles.routeLeft}>
                    <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                    {index < routeStops.length - 1 && (
                      <View style={[styles.routeLine, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <View style={styles.routeContent}>
                    <Text style={[styles.routeLocation, { color: colors.onBackground }]}>
                      {stop.location.name}
                    </Text>
                    <Text style={[styles.routeDates, { color: colors.onSurfaceVariant }]}>
                      {formatDateRange(stop.arrivalDate, stop.departureDate)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.routeEmpty, { color: colors.onSurfaceVariant }]}>
              No route set — add one to find matches
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Looking For</Text>
          <View style={styles.lookingForRow}>
            {lookingForChips.map((chip) => (
              <View key={chip.value} style={[styles.lookingForChip, { backgroundColor: chip.color }]}>
                <Text style={[styles.lookingForText, { color: chip.textColor }]}>{chip.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <GlassButton title="Edit Profile" variant="secondary" onPress={handleEditProfile} />
        </View>

        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
} 

const styles = StyleSheet.create({ 
  container: { flex: 1 },
  content: {
    paddingHorizontal: 24,
  },
  carouselWrapper: {
    marginHorizontal: -24,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: 360,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  photoPlaceholder: {
    width: SCREEN_WIDTH,
    height: 360,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
  },
  age: {
    fontSize: 20,
    fontWeight: "600",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: "600",
  },
  verifyLink: {
    marginTop: 8,
  },
  verifyText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    marginTop: 20,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },
  bioMuted: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  vanCard: {
    borderRadius: 18,
    padding: 20,
  },
  vanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vanLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vanEmoji: {
    fontSize: 20,
  },
  vanLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
  vanStatus: {
    fontSize: 14,
    fontWeight: "600",
  },
  routeList: {
    gap: 16,
  },
  routeRow: {
    flexDirection: "row",
  },
  routeLeft: {
    alignItems: "center",
    width: 18,
    marginRight: 12,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  routeLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    opacity: 0.6,
  },
  routeContent: {
    flex: 1,
  },
  routeLocation: {
    fontSize: 16,
    fontWeight: "700",
  },
  routeDates: {
    fontSize: 14,
    marginTop: 4,
  },
  routeEmpty: {
    fontSize: 14,
  },
  lookingForRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  lookingForChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  lookingForText: {
    fontSize: 13,
    fontWeight: "600",
  },
  signOutButton: {
    marginTop: 16,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
