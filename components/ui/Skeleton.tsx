import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";

interface SkeletonProps {
  /** Width of the skeleton block */
  width?: number | `${number}%`;
  /** Height of the skeleton block */
  height?: number;
  /** Border radius (default 8) */
  radius?: number;
  /** Additional style overrides */
  style?: ViewStyle;
}

/**
 * A single skeleton block with a subtle pulse animation.
 * Lightweight — uses opacity pulse instead of gradient shimmer
 * to avoid extra native dependencies.
 */
export function Skeleton({ width, height = 16, radius = 8, style }: SkeletonProps) {
  const { isDark } = useAppTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);

  const baseColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const highlightColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.11)";

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(pulse.value, [0, 1], [0.4, 1]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: baseColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ─── Preset skeleton layouts ────────────────────────────────────────

/** Skeleton for a community post card */
export function PostCardSkeleton() {
  const { isDark } = useAppTheme();
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";

  return (
    <View style={[presets.postCard, { backgroundColor: cardBg }]}>
      <Skeleton width={100} height={24} radius={8} />
      <Skeleton width="90%" height={20} radius={6} style={{ marginTop: 14 }} />
      <Skeleton width="70%" height={16} radius={6} style={{ marginTop: 8 }} />
      <Skeleton width="100%" height={14} radius={6} style={{ marginTop: 8 }} />
      <View style={presets.postCardBottom}>
        <View style={presets.row}>
          <Skeleton width={32} height={32} radius={16} />
          <Skeleton width={80} height={14} radius={6} />
        </View>
        <Skeleton width={50} height={12} radius={6} />
      </View>
    </View>
  );
}

/** Skeleton for the community screen (header + cards) */
export function CommunitySkeleton() {
  return (
    <View style={presets.container}>
      {/* Filter chips */}
      <View style={[presets.row, { gap: 10, marginBottom: 20 }]}>
        <Skeleton width={50} height={36} radius={18} />
        <Skeleton width={90} height={36} radius={18} />
        <Skeleton width={80} height={36} radius={18} />
        <Skeleton width={70} height={36} radius={18} />
      </View>
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </View>
  );
}

/** Skeleton for a single sync/conversation row */
function SyncRowSkeleton() {
  return (
    <View style={presets.syncRow}>
      <Skeleton width={52} height={52} radius={26} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="60%" height={16} radius={6} />
        <Skeleton width="85%" height={13} radius={6} />
      </View>
      <Skeleton width={40} height={12} radius={6} />
    </View>
  );
}

/** Skeleton for the syncs screen */
export function SyncsSkeleton() {
  return (
    <View style={presets.container}>
      {/* Overlap avatars row */}
      <Skeleton width={120} height={11} radius={4} style={{ marginBottom: 16 }} />
      <View style={[presets.row, { gap: 20, marginBottom: 28 }]}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ alignItems: "center", gap: 6 }}>
            <Skeleton width={56} height={56} radius={28} />
            <Skeleton width={48} height={10} radius={4} />
          </View>
        ))}
      </View>
      {/* Conversations */}
      <Skeleton width={130} height={11} radius={4} style={{ marginBottom: 16 }} />
      <SyncRowSkeleton />
      <SyncRowSkeleton />
      <SyncRowSkeleton />
      <SyncRowSkeleton />
    </View>
  );
}

/** Skeleton for the profile screen */
export function ProfileSkeleton() {
  return (
    <View style={[presets.container, { alignItems: "center" }]}>
      {/* Avatar */}
      <Skeleton width={100} height={100} radius={50} style={{ marginBottom: 12 }} />
      {/* Name */}
      <Skeleton width={160} height={22} radius={8} style={{ marginBottom: 6 }} />
      {/* Subtitle */}
      <Skeleton width={120} height={14} radius={6} style={{ marginBottom: 24 }} />
      {/* Tab bar */}
      <View style={[presets.row, { gap: 32, marginBottom: 20, width: "100%" }]}>
        <Skeleton width={70} height={14} radius={6} />
        <Skeleton width={70} height={14} radius={6} />
        <Skeleton width={50} height={14} radius={6} />
      </View>
      {/* Route cards */}
      <Skeleton width="100%" height={80} radius={12} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={80} radius={12} style={{ marginBottom: 12 }} />
    </View>
  );
}

/** Skeleton for the discover screen */
export function DiscoverSkeleton() {
  return (
    <View style={[presets.container, { alignItems: "center", justifyContent: "center", flex: 1 }]}>
      <Skeleton width="92%" height={480} radius={20} />
    </View>
  );
}

const presets = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  postCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  postCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
});
