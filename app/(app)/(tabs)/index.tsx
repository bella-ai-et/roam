import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  View,
  Platform,
  StyleSheet,
  Pressable,
  Modal,
  Animated as RNAnimated,
  Alert,
} from "react-native";
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
import { format } from "date-fns";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ExpandedCard, PreviewCard, RouteComparisonModal } from "@/components/discovery";
import { GlassButton } from "@/components/glass";
import { AppColors, useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  CARD_WIDTH,
  ROTATION_ANGLE,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  SWIPE_THRESHOLD,
} from "@/lib/constants";
import { hapticButtonPress } from "@/lib/haptics";
import { useSubscription } from "@/hooks/useSubscription";
import { Paywall } from "@/components/Paywall";

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

function MatchCelebration({
  visible,
  matchedUser,
  matchId,
  onClose,
}: {
  visible: boolean;
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
  const [expanded, setExpanded] = useState(false);
  const [matchState, setMatchState] = useState<{ user: Doc<"users">; matchId: Id<"matches"> } | null>(null);
  const [applyingDemoRoute, setApplyingDemoRoute] = useState(false);
  const [likesPaywallVisible, setLikesPaywallVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const translateX = useSharedValue(0);
  const isSwipingRef = useSharedValue(false);
  const activeMatchRef = useRef<RouteMatch | null>(null);

  const availableMatches = useMemo(() => matches ?? [], [matches]);
  const activeMatch = availableMatches[activeIndex];

  useEffect(() => {
    setActiveIndex(0);
    setExpanded(false);
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

        setExpanded(false);
        setActiveIndex((prev) => prev + 1);

        requestAnimationFrame(() => {
          translateX.value = withTiming(0, { duration: 0 });
        });

        if (result?.matched) {
          setMatchState({ user: match.user, matchId: result.matchId as Id<"matches"> });
        }
      } catch (err: any) {
        if (err?.message?.includes("DAILY_LIKES_LIMIT")) {
          // Reset card position and show paywall
          translateX.value = withTiming(0, { duration: 200 });
          setLikesPaywallVisible(true);
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
      Alert.alert("Demo route applied", `${seedMessage} Your route is set to Abu Dhabi \u2192 Dubai Marina.`);
    } catch (error) {
      Alert.alert("Could not apply demo route", "Please try again.");
    } finally {
      setApplyingDemoRoute(false);
    }
  };

  const tabBarHeight = (Platform.OS === "android" ? 64 : 56) + insets.bottom;

  // ─── Pan gesture ───
  // activeOffsetX: don't claim the touch until 15px of horizontal movement.
  // This lets taps (map widget, photo zones, info area) register cleanly.
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((event) => {
      if (!isSwipingRef.value) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (isSwipingRef.value) return;

      const velocity = event.velocityX;
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD || velocity > 800;
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD || velocity < -800;

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
        // Snap back — swipe wasn't far enough
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      }
    });

  // Card tilt + translate — the primary swipe feedback
  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolate.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // LIKE / NOPE overlay badges — appear as card tilts
  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.6], [0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  const nopeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.6, 0], [1, 0], Extrapolate.CLAMP);
    return { opacity };
  });

  const stack = useMemo(() => {
    const visible = availableMatches.slice(activeIndex, activeIndex + 3);
    return visible.map((match, index) => ({ match, depth: index, isTop: index === 0 }));
  }, [availableMatches, activeIndex]);

  // ─── Render: Empty state ───
  if (!activeMatch) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <MatchCelebration
          visible={Boolean(matchState)}
          matchedUser={matchState?.user}
          matchId={matchState?.matchId}
          onClose={() => setMatchState(null)}
        />
      </View>
    );
  }

  // ─── Render: Expanded profile view ───
  if (expanded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Discover</Text>
        </View>
        <View style={[styles.expandedContent, { paddingBottom: 0 }]}>
          <ExpandedCard
            match={activeMatch}
            onCollapse={() => setExpanded(false)}
            onLike={() => triggerSwipe("like")}
            onReject={() => triggerSwipe("reject")}
            bottomInset={0}
            onExpandMap={() => setMapModalVisible(true)}
          />
        </View>
        <MatchCelebration
          visible={Boolean(matchState)}
          matchedUser={matchState?.user}
          matchId={matchState?.matchId}
          onClose={() => setMatchState(null)}
        />
        <RouteComparisonModal
          visible={mapModalVisible}
          onClose={() => setMapModalVisible(false)}
          theirRoute={activeMatch.user.currentRoute}
          myRoute={currentUser?.currentRoute}
          overlaps={activeMatch.overlaps}
          theirName={activeMatch.user.name}
          theirPhotoId={activeMatch.user.photos?.[0]}
          myPhotoId={currentUser?.photos?.[0]}
        />
      </View>
    );
  }

  // ─── Render: Preview card stack (swipeable) ───
  // No header in preview — card fills the space between status bar and tab bar (matching design)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.cardStack}>
          {stack
            .slice()
            .reverse()
            .map(({ match, depth, isTop }) => {
              const translateY = depth * 10;
              const scale = 1 - depth * 0.04;

              if (isTop) {
                return (
                  <GestureDetector key={match.user._id} gesture={panGesture}>
                    <Animated.View
                      style={[
                        styles.cardContainer,
                        { transform: [{ translateY }, { scale }] },
                        cardStyle,
                      ]}
                    >
                      <PreviewCard
                        match={match}
                        onExpand={() => setExpanded(true)}
                        onLike={() => triggerSwipe("like")}
                        onReject={() => triggerSwipe("reject")}
                        isTopCard={true}
                        onExpandMap={() => setMapModalVisible(true)}
                      />
                      {/* LIKE overlay badge */}
                      <Animated.View style={[styles.overlayBadge, styles.likeBadge, likeOverlayStyle]}>
                        <Text style={[styles.overlayText, { color: "#4ade80" }]}>LIKE</Text>
                      </Animated.View>
                      {/* NOPE overlay badge */}
                      <Animated.View style={[styles.overlayBadge, styles.nopeBadge, nopeOverlayStyle]}>
                        <Text style={[styles.overlayText, { color: "#f87171" }]}>NOPE</Text>
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
                    { transform: [{ translateY }, { scale }] },
                  ]}
                >
                  <PreviewCard
                    match={match}
                    onExpand={() => {}}
                    onLike={() => {}}
                    onReject={() => {}}
                  />
                </View>
              );
            })}
        </View>
      </View>
      <MatchCelebration
        visible={Boolean(matchState)}
        matchedUser={matchState?.user}
        matchId={matchState?.matchId}
        onClose={() => setMatchState(null)}
      />
      <Modal visible={likesPaywallVisible} animationType="slide" presentationStyle="pageSheet">
        <Paywall
          message="You've used all your free likes for today"
          onClose={() => setLikesPaywallVisible(false)}
        />
      </Modal>
      <RouteComparisonModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        theirRoute={activeMatch?.user.currentRoute}
        myRoute={currentUser?.currentRoute}
        overlaps={activeMatch?.overlaps}
        theirName={activeMatch?.user.name}
        theirPhotoId={activeMatch?.user.photos?.[0]}
        myPhotoId={currentUser?.photos?.[0]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  expandedContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
  cardStack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 0,
  },
  cardContainer: {
    position: "absolute",
    width: CARD_WIDTH,
  },
  overlayBadge: {
    position: "absolute",
    top: 60,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  likeBadge: {
    left: 24,
    borderColor: "#4ade80",
    transform: [{ rotate: "-20deg" }],
  },
  nopeBadge: {
    right: 24,
    borderColor: "#f87171",
    transform: [{ rotate: "20deg" }],
  },
  overlayText: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
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
