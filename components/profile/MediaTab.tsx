import React from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAppTheme, AppColors } from "@/lib/theme";
import { SCREEN_WIDTH } from "@/lib/constants";

function isRemoteUrl(value?: string) {
  if (!value) return false;
  const t = value.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function normalizePhoto(value?: string) {
  if (!value) return undefined;
  return value.replace(/`/g, "").trim();
}

const GRID_GAP = 8;
const GRID_PADDING = 24;
const TILE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

function PhotoTile({ storageId }: { storageId: string }) {
  const { colors } = useAppTheme();
  const normalized = normalizePhoto(storageId);
  const isRemote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !isRemote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  if (isRemote && normalized) {
    return <Image source={{ uri: normalized }} style={styles.photo} contentFit="cover" />;
  }

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={styles.photo} contentFit="cover" />;
  }

  return (
    <View style={[styles.photo, styles.photoPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

interface MediaTabProps {
  photos: string[];
  onEditPhotos: () => void;
}

export function MediaTab({ photos, onEditPhotos }: MediaTabProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onBackground }]}>Photos</Text>
        <Pressable onPress={onEditPhotos} hitSlop={10}>
          <Text style={[styles.editLink, { color: AppColors.primary }]}>Edit</Text>
        </Pressable>
      </View>

      {photos.length === 0 ? (
        <Pressable onPress={onEditPhotos} style={styles.emptyState}>
          <View style={[styles.emptyBox, { borderColor: AppColors.primary, backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="camera" size={36} color={AppColors.primary} />
            <Text style={[styles.emptyText, { color: AppColors.primary }]}>Add Photos</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.grid}>
          {photos.map((photo, index) => (
            <View key={`${photo}-${index}`} style={styles.tile}>
              <PhotoTile storageId={photo} />
            </View>
          ))}
          {photos.length < 5 && (
            <Pressable onPress={onEditPhotos} style={styles.tile}>
              <View style={[styles.addTile, { borderColor: AppColors.primary, backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="add" size={28} color={AppColors.primary} />
              </View>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  editLink: {
    fontSize: 15,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 16,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  addTile: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
  },
  emptyBox: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
