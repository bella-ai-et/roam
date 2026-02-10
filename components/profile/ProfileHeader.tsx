import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAppTheme, AppColors } from "@/lib/theme";
import { VAN_TYPES } from "@/lib/constants";

function isRemoteUrl(value?: string) {
  if (!value) return false;
  const t = value.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function normalizePhoto(value?: string) {
  if (!value) return undefined;
  return value.replace(/`/g, "").trim();
}

interface ProfileHeaderProps {
  name: string;
  isApproved?: boolean;
  vanModel?: string;
  vanType?: string;
  nomadSinceYear?: number;
  photoStorageId?: string;
  onEditPhoto: () => void;
}

export function ProfileHeader({
  name,
  isApproved,
  vanModel,
  vanType,
  nomadSinceYear,
  photoStorageId,
  onEditPhoto,
}: ProfileHeaderProps) {
  const { colors } = useAppTheme();

  const normalized = normalizePhoto(photoStorageId);
  const isRemote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !isRemote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  const imageUri = isRemote ? normalized : photoUrl;

  // Build subtitle: "Mercedes Sprinter '22 • Nomad for 3 yrs"
  const vanLabel = vanModel || VAN_TYPES.find((t) => t.value === vanType)?.label;
  const nomadYears =
    nomadSinceYear != null
      ? Math.max(0, new Date().getFullYear() - nomadSinceYear)
      : undefined;
  const nomadText =
    nomadYears != null
      ? nomadYears === 0
        ? "New nomad"
        : nomadYears === 1
          ? "Nomad for 1 yr"
          : `Nomad for ${nomadYears} yrs`
      : undefined;

  const subtitleParts = [vanLabel, nomadText].filter(Boolean);
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(" • ") : undefined;

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatarRing, { borderColor: `${AppColors.primary}20` }]}>
          <View style={styles.avatarBorder}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="person" size={48} color={colors.onSurfaceVariant} />
              </View>
            )}
          </View>
        </View>
        <Pressable
          onPress={onEditPhoto}
          style={[styles.editButton, { backgroundColor: AppColors.primary }]}
        >
          <Ionicons name="pencil" size={14} color="#fff" />
        </Pressable>
      </View>

      {/* Name + verified */}
      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: colors.onBackground }]}>{name}</Text>
        {isApproved && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color="#3797F0"
            style={styles.verifiedIcon}
          />
        )}
      </View>

      {/* Subtitle */}
      {subtitle && (
        <View style={styles.subtitleRow}>
          <Ionicons name="bus-outline" size={14} color={colors.onSurfaceVariant} />
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBorder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: "#fff",
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
});
