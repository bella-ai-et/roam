import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/lib/theme";

type RouteOverlapAvatarProps = {
  user: Doc<"users"> | null;
  overlapLocation: string;
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

export function RouteOverlapAvatar({ user, overlapLocation, onPress }: RouteOverlapAvatarProps) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(user?.photos?.[0]);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  const imageUri = remote ? normalized : photoUrl;
  const initials = getInitials(user?.name);

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
        <View style={[styles.pinBadge, { backgroundColor: colors.background, borderColor: colors.outline }]}>
          <Ionicons name="location" size={10} color="#D27C5C" />
        </View>
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
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
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
