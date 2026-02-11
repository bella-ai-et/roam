import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/lib/theme";
import { hapticButtonPress } from "@/lib/haptics";

type RouteOverlapAvatarProps = {
  user: Doc<"users"> | null;
  overlapLocation: string;
  onPress: () => void;
  onMapPress?: () => void;
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

function PulsingRing() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { transform: [{ scale }], opacity },
      ]}
    />
  );
}

export function RouteOverlapAvatar({ user, overlapLocation, onPress, onMapPress }: RouteOverlapAvatarProps) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(user?.photos?.[0]);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  const imageUri = remote ? normalized : photoUrl;
  const initials = getInitials(user?.name);

  const handleMapPress = () => {
    hapticButtonPress();
    onMapPress?.();
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.avatarWrapper}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.initials, { color: colors.onPrimaryContainer }]}>{initials}</Text>
          </View>
        )}
        <Pressable
          onPress={onMapPress ? handleMapPress : undefined}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={[styles.pinBadge, { backgroundColor: colors.background, borderColor: "rgba(210,124,92,0.3)" }]}
        >
          <PulsingRing />
          <Ionicons name="map" size={10} color="#D27C5C" />
        </Pressable>
      </View>
      <Text style={[styles.name, { color: colors.onBackground }]} numberOfLines={1}>
        {user?.name?.split(" ")[0] ?? ""}
      </Text>
      <Text style={styles.location} numberOfLines={1}>
        {overlapLocation}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 76,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  initials: {
    fontSize: 20,
    fontWeight: "700",
  },
  pinBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowColor: "#D27C5C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 2,
  },
  pulseRing: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(210,124,92,0.3)",
  },
  name: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  location: {
    fontSize: 10,
    fontWeight: "500",
    color: "#D27C5C",
    marginTop: 2,
    textAlign: "center",
  },
});
