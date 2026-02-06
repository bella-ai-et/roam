import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  FlatList,
  Animated as RNAnimated,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { differenceInYears, format, parseISO } from "date-fns";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { DiscoveryCard } from "@/components/discovery";
import { GlassButton, GlassChip, GlassHeader } from "@/components/glass";
import { AdaptiveGlassView } from "@/lib/glass";
import { AppColors, useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  CARD_WIDTH,
  INTERESTS,
  ROTATION_ANGLE,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  SWIPE_THRESHOLD,
  VAN_TYPES,
} from "@/lib/constants";
import { hapticButtonPress } from "@/lib/haptics";

type RouteMatch = {
  user: Doc<"users">;
  overlaps: {
    locationName: string;
    dateRange: { start: string; end: string };
    distance: number;
  }[];
  score: number;
  sharedInterests: string[];
};

const CONFETTI_COLORS = [AppColors.primary, AppColors.secondary, AppColors.accent, "#FF6B6B", "#6C5CE7"];

function formatOverlapDate(value: string) {
  const parsed = parseISO(value);
  return format(parsed, "MMM d");
}

function formatOverlapRange(start: string, end: string) {
  return `${formatOverlapDate(start)} – ${formatOverlapDate(end)}`;
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

function StorageImage({
  storageId,
  style,
  iconSize,
}: {
  storageId?: string;
  style: any;
  iconSize: number;
}) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(storageId);
  const isRemote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !isRemote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  if (isRemote && normalized) {
    return <Image source={{ uri: normalized }} style={style} contentFit="cover" />;
  }

  if (!photoUrl) {
    return (
      <View style={[style, styles.photoPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="image-outline" size={iconSize} color={colors.onSurfaceVariant} />
      </View>
    );
  }

  return <Image source={{ uri: photoUrl }} style={style} contentFit="cover" />;
}

function AvatarImage({ storageId, size }: { storageId?: string; size: number }) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(storageId);
  const isRemote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !isRemote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  if (isRemote && normalized) {
    return (
      <Image
        source={{ uri: normalized }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
      />
    );
  }

  if (!photoUrl) {
    return (
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceVariant },
        ]}
      >
        <Ionicons name="person" size={size * 0.45} color={colors.onSurfaceVariant} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: photoUrl }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      contentFit="cover"
    />
  );
}

function PhotoCarousel({ photos }: { photos: string[] }) {
  const { colors } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  if (photos.length === 0) {
    return (
      <View style={[styles.modalPhoto, styles.photoPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="camera-outline" size={36} color={colors.onSurfaceVariant} />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={photos}
        keyExtractor={(item, index) => `${item}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <StorageImage storageId={item} style={styles.modalPhoto} iconSize={32} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      <View style={styles.dotsRow}>
        {photos.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              {
                backgroundColor: index === activeIndex ? colors.primary : colors.onSurfaceVariant,
                opacity: index === activeIndex ? 1 : 0.35,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function CircleActionButton({
  label,
  color,
  size,
  onPress,
}: {
  label: string;
  color: string;
  size: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ width: size, height: size }}>
      <AdaptiveGlassView style={[styles.actionButton, { borderRadius: size / 2 }]}>
        <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      </AdaptiveGlassView>
    </Pressable>
  );
}

function MatchCelebration({
  visible,
  currentUser,
  matchedUser,
  matchId,
  onClose,
}: {
  visible: boolean;
  currentUser?: Doc<"users">;
  matchedUser?: Doc<"users">;
  matchId?: Id<"matches">;
  onClose: () => void;
}) {
  const router = useRouter();
  const confettiRefs = useRef(
    Array.from({ length: 20 }).map(() => ({
      translateY: new RNAnimated.Value(-100),
      left: Math.random() * (SCREEN_WIDTH - 40),
      size: 6 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: 3200 + Math.random() * 2400,
      delay: Math.random() * 800,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    const animations = confettiRefs.map((confetti) =>
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.delay(confetti.delay),
          RNAnimated.timing(confetti.translateY, {
            toValue: SCREEN_HEIGHT + 120,
            duration: confetti.duration,
            useNativeDriver: true,
          }),
          RNAnimated.timing(confetti.translateY, {
            toValue: -120,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
    );
    animations.forEach((animation) => animation.start());
    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [confettiRefs, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.matchOverlay}>
        {confettiRefs.map((confetti, index) => (
          <RNAnimated.View
            key={`confetti-${index}`}
            style={[
              styles.confetti,
              {
                width: confetti.size,
                height: confetti.size,
                backgroundColor: confetti.color,
                left: confetti.left,
                transform: [{ translateY: confetti.translateY }],
              },
            ]}
          />
        ))}
        <View style={styles.matchContent}>
          <View style={styles.matchAvatars}>
            <AvatarImage storageId={currentUser?.photos?.[0]} size={80} />
            <AvatarImage storageId={matchedUser?.photos?.[0]} size={80} />
          </View>
          <Text style={styles.matchTitle}>It&apos;s a Match!</Text>
          <Text style={styles.matchSubtitle}>
            You and {matchedUser?.name ?? "someone"} are on overlapping routes!
          </Text>
          <View style={styles.matchButtons}>
            <GlassButton
              title="Send Message"
              onPress={() => {
                if (matchId) {
                  onClose();
                  router.push(`/(app)/chat/${String(matchId)}` as never);
                }
              }}
              style={styles.matchButton}
            />
            <Pressable onPress={onClose} style={styles.keepSwipingButton}>
              <Text style={styles.keepSwipingText}>Keep Swiping</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function DiscoverScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const matches = useQuery(
    api.routeMatching.findRouteMatches,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  ) as RouteMatch[] | undefined;
  const recordSwipe = useMutation(api.swipes.recordSwipe);
  const resetSwipes = useMutation(api.swipes.resetSwipes);
  const updateRoute = useMutation(api.users.updateRoute);
  const seedDemoProfiles = useMutation((api as any).seed.seed);
  const [activeIndex, setActiveIndex] = useState(0);
  const [profileModal, setProfileModal] = useState<RouteMatch | null>(null);
  const [matchState, setMatchState] = useState<{ user: Doc<"users">; matchId: Id<"matches"> } | null>(null);
  const [applyingDemoRoute, setApplyingDemoRoute] = useState(false);
  const translateX = useSharedValue(0);
  const isSwipingRef = useSharedValue(false);
  const activeMatchRef = useRef<RouteMatch | null>(null);

  const availableMatches = useMemo(() => matches ?? [], [matches]);
  const activeMatch = availableMatches[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
    translateX.value = 0;
  }, [matches, translateX]);

  useEffect(() => {
    activeMatchRef.current = activeMatch ?? null;
  }, [activeMatch]);

  const handleSwipeComplete = useCallback(
    async (action: "like" | "reject") => {
      const match = activeMatchRef.current;
      if (!match || !currentUser?._id) {
        isSwipingRef.value = false;
        return;
      }
      
      hapticButtonPress();
      
      try {
        const result = await recordSwipe({
          swiperId: currentUser._id,
          swipedId: match.user._id,
          action,
        });
        
        // Move to next card
        setActiveIndex((prev) => prev + 1);
        
        // Reset translateX using withTiming with 0 duration for instant, synchronized reset
        requestAnimationFrame(() => {
          translateX.value = withTiming(0, { duration: 0 });
        });
        
        if (result?.matched) {
          setMatchState({ user: match.user, matchId: result.matchId as Id<"matches"> });
        }
      } finally {
        isSwipingRef.value = false;
      }
    },
    [currentUser?._id, recordSwipe, isSwipingRef, translateX]
  );

  const triggerSwipe = useCallback(
    (action: "like" | "reject") => {
      if (isSwipingRef.value) return;
      isSwipingRef.value = true;
      
      const direction = action === "like" ? 1 : -1;
      translateX.value = withTiming(
        SCREEN_WIDTH * 1.5 * direction,
        { duration: 300 },
        (finished) => {
          if (finished) {
            runOnJS(handleSwipeComplete)(action);
          } else {
            isSwipingRef.value = false;
          }
        }
      );
    },
    [translateX, isSwipingRef, handleSwipeComplete]
  );

  const applyDemoRoute = async () => {
    if (!currentUser?._id) return;
    setApplyingDemoRoute(true);
    try {
      const seedResult = await seedDemoProfiles({});
      await resetSwipes({ userId: currentUser._id });
      const now = new Date();
      const in7 = new Date(now);
      in7.setDate(now.getDate() + 7);
      const in14 = new Date(now);
      in14.setDate(now.getDate() + 14);
      const start = format(now, "MM/dd/yyyy");
      const mid = format(in7, "MM/dd/yyyy");
      const end = format(in14, "MM/dd/yyyy");

      await updateRoute({
        userId: currentUser._id,
        route: [
          {
            location: { latitude: 24.4539, longitude: 54.3773, name: "Abu Dhabi" },
            arrivalDate: start,
            departureDate: mid,
            role: "origin",
            intent: "planned",
            destinationType: "adventure",
          },
          {
            location: { latitude: 25.0804, longitude: 55.1403, name: "Dubai Marina" },
            arrivalDate: mid,
            departureDate: end,
            role: "destination",
            intent: "planned",
            destinationType: "adventure",
          },
        ],
      });
      const seededCount =
        seedResult && typeof seedResult === "object" && "inserted" in seedResult
          ? Number(seedResult.inserted)
          : undefined;
      const seedMessage =
        typeof seededCount === "number"
          ? `Seeded ${seededCount} profiles.`
          : "Seeded demo profiles.";
      Alert.alert("Demo route applied", `${seedMessage} Your route is set to Abu Dhabi → Dubai Marina.`);
    } catch (error) {
      Alert.alert("Could not apply demo route", "Please try again.");
    } finally {
      setApplyingDemoRoute(false);
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Ensure we start from center position
      if (Math.abs(translateX.value) > 10) {
        translateX.value = 0;
      }
    })
    .onUpdate((event) => {
      if (!isSwipingRef.value) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (isSwipingRef.value) return;
      
      const velocity = event.velocityX;
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD || velocity > 500;
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD || velocity < -500;
      
      if (shouldSwipeRight) {
        isSwipingRef.value = true;
        translateX.value = withTiming(
          SCREEN_WIDTH * 1.5,
          { duration: 300 },
          (finished) => {
            if (finished) {
              runOnJS(handleSwipeComplete)("like");
            } else {
              isSwipingRef.value = false;
            }
          }
        );
      } else if (shouldSwipeLeft) {
        isSwipingRef.value = true;
        translateX.value = withTiming(
          -SCREEN_WIDTH * 1.5,
          { duration: 300 },
          (finished) => {
            if (finished) {
              runOnJS(handleSwipeComplete)("reject");
            } else {
              isSwipingRef.value = false;
            }
          }
        );
      } else {
        // Return to center with spring animation
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolate.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate}deg` },
        { scale: 1 },
      ],
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  const nopeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolate.CLAMP);
    return { opacity };
  });

  const stack = useMemo(() => {
    const visible = availableMatches.slice(activeIndex, activeIndex + 3);
    return visible.map((match, index) => ({ match, depth: index, isTop: index === 0 }));
  }, [availableMatches, activeIndex]);

  const renderStack = () => {
    if (!activeMatch) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={64} color={colors.onSurfaceVariant} />
          <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>No nomads nearby</Text>
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            No one on your route right now. Try adding more stops or checking back later.
          </Text>
          <View style={styles.emptyButton}>
            <GlassButton title="Update Your Route" onPress={() => router.push("/(app)/(tabs)/profile")} />
          </View>
          <View style={styles.emptyButton}>
            <GlassButton
              title="Use Demo Route"
              variant="secondary"
              loading={applyingDemoRoute}
              onPress={applyDemoRoute}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cardStack}>
        {stack
          .slice()
          .reverse()
          .map(({ match, depth, isTop }) => {
            const translateY = depth * 12;
            const scale = 1 - depth * 0.03;

            if (isTop) {
              return (
                <GestureDetector
                  key={match.user._id}
                  gesture={panGesture}
                >
                  <Animated.View
                    style={[
                      styles.cardContainer,
                      { transform: [{ translateY }, { scale }] },
                      cardStyle,
                    ]}
                  >
                    <DiscoveryCard match={match} onPress={() => setProfileModal(match)} />
                    <Animated.View style={[styles.overlayBadge, styles.likeBadge, likeOverlayStyle]}>
                      <Text style={[styles.overlayText, { color: colors.like }]}>LIKE</Text>
                    </Animated.View>
                    <Animated.View style={[styles.overlayBadge, styles.nopeBadge, nopeOverlayStyle]}>
                      <Text style={[styles.overlayText, { color: colors.reject }]}>NOPE</Text>
                    </Animated.View>
                  </Animated.View>
                </GestureDetector>
              );
            }

            return (
              <View
                key={match.user._id}
                style={[
                  styles.cardContainer,
                  {
                    transform: [{ translateY }, { scale }],
                  },
                ]}
              >
                <DiscoveryCard match={match} onPress={() => setProfileModal(match)} />
              </View>
            );
          })}
      </View>
    );
  };

  const renderProfileModal = () => {
    if (!profileModal) return null;
    const user = profileModal.user;
    const age = user.dateOfBirth ? differenceInYears(new Date(), new Date(user.dateOfBirth)) : undefined;
    const vanType = VAN_TYPES.find((type) => type.value === user.vanType);

    return (
      <Modal visible transparent animationType="slide">
        <View style={styles.profileOverlay}>
          <View style={[styles.profileModal, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <PhotoCarousel photos={user.photos ?? []} />
              <View style={styles.profileHeader}>
                <Text style={[styles.profileName, { color: colors.onBackground }]}>
                  {user.name}
                  {typeof age === "number" ? `, ${age}` : ""}
                </Text>
                {user.vanVerified && (
                  <View style={styles.verifiedRow}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.like} />
                    <Text style={[styles.verifiedText, { color: colors.like }]}>Verified</Text>
                  </View>
                )}
              </View>

              <View style={styles.profileSection}>
                <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Route Overlaps</Text>
                <View style={styles.overlapList}>
                  {profileModal.overlaps.map((overlap, index) => (
                    <View key={`${overlap.locationName}-${index}`} style={styles.overlapItem}>
                      <Ionicons name="location" size={14} color={colors.primary} />
                      <View style={styles.overlapDetails}>
                        <Text style={[styles.overlapLocation, { color: colors.onBackground }]}>
                          {overlap.locationName}
                        </Text>
                        <Text style={[styles.overlapSubtext, { color: colors.onSurfaceVariant }]}>
                          {formatOverlapRange(overlap.dateRange.start, overlap.dateRange.end)} · {overlap.distance} km apart
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.profileSection}>
                <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Bio</Text>
                <Text style={[styles.profileBio, { color: colors.onSurfaceVariant }]}>
                  {user.bio ?? "No bio yet."}
                </Text>
              </View>

              <View style={styles.profileSection}>
                <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Interests</Text>
                <View style={styles.chipRow}>
                  {(user.interests ?? []).map((interest) => {
                    const match = INTERESTS.find((item) => item.name === interest);
                    return (
                      <GlassChip
                        key={interest}
                        label={interest}
                        emoji={match?.emoji}
                        selected
                        onPress={() => {}}
                        disabled
                      />
                    );
                  })}
                </View>
              </View>

              <View style={styles.profileSection}>
                <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>Van</Text>
                <AdaptiveGlassView style={styles.vanCard}>
                  <View style={styles.vanRow}>
                    <Text style={styles.vanEmoji}>{vanType?.emoji ?? "🚐"}</Text>
                    <Text style={[styles.vanLabel, { color: colors.onBackground }]}>
                      {vanType?.label ?? "Van type not set"}
                    </Text>
                  </View>
                </AdaptiveGlassView>
              </View>
            </ScrollView>
            <View style={styles.profileActions}>
              <CircleActionButton
                label="✕"
                color={colors.reject}
                size={56}
                onPress={() => {
                  setProfileModal(null);
                  triggerSwipe("reject");
                }}
              />
              <CircleActionButton
                label="♡"
                color={colors.like}
                size={60}
                onPress={() => {
                  setProfileModal(null);
                  triggerSwipe("like");
                }}
              />
            </View>
            <Pressable onPress={() => setProfileModal(null)} style={styles.profileClose}>
              <Ionicons name="close" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="Discover" />
      <View style={[styles.content, { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 16 }]}>
        {renderStack()}
        {activeMatch && (
          <View style={styles.actionsRow}>
            <CircleActionButton
              label="✕"
              color={colors.reject}
              size={56}
              onPress={() => triggerSwipe("reject")}
            />
            <CircleActionButton
              label="♡"
              color={colors.like}
              size={60}
              onPress={() => triggerSwipe("like")}
            />
          </View>
        )}
      </View>
      {renderProfileModal()}
      <MatchCelebration
        visible={Boolean(matchState)}
        currentUser={currentUser ?? undefined}
        matchedUser={matchState?.user}
        matchId={matchState?.matchId}
        onClose={() => setMatchState(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cardStack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    position: "absolute",
    width: CARD_WIDTH,
  },
  overlayBadge: {
    position: "absolute",
    top: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 12,
  },
  likeBadge: {
    left: 20,
    borderColor: "#4CD964",
    transform: [{ rotate: "-15deg" }],
  },
  nopeBadge: {
    right: 20,
    borderColor: "#FF3B30",
    transform: [{ rotate: "15deg" }],
  },
  overlayText: {
    fontSize: 20,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 24,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 24,
    width: "100%",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  profileOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  profileModal: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  modalPhoto: {
    width: SCREEN_WIDTH,
    height: 360,
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
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  profileName: {
    fontSize: 26,
    fontWeight: "800",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: "600",
  },
  profileSection: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
  },
  overlapList: {
    gap: 12,
  },
  overlapItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overlapDetails: {
    flex: 1,
  },
  overlapLocation: {
    fontSize: 15,
    fontWeight: "700",
  },
  overlapSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  profileBio: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  vanCard: {
    borderRadius: 18,
    padding: 16,
  },
  vanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vanEmoji: {
    fontSize: 20,
  },
  vanLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  profileActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    padding: 20,
  },
  profileClose: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 6,
  },
  matchOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,10,10,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  matchContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  matchAvatars: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -8,
  },
  matchTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  matchSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 10,
  },
  matchButtons: {
    width: "100%",
    gap: 16,
    marginTop: 32,
    paddingHorizontal: 20,
  },
  matchButton: {
    height: 52,
  },
  keepSwipingButton: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  keepSwipingText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  confetti: {
    position: "absolute",
    top: -40,
    borderRadius: 999,
  },
});
