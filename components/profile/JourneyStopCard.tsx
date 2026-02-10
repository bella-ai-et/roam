import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors, useAppTheme } from "@/lib/theme";

export type StopStatus = "current" | "next" | "destination" | "completed";

export interface RouteStopData {
  locationName: string;
  arrivalDate: string;
  departureDate: string;
  notes?: string;
  status: StopStatus;
  syncsCount?: number;
  overlapsCount?: number;
}

interface JourneyStopCardProps {
  stop: RouteStopData;
  onEdit?: () => void;
}

function formatDateRange(arrival: string, departure: string): string {
  try {
    const a = new Date(arrival);
    const d = new Date(departure);
    const aMonth = a.toLocaleDateString("en-US", { month: "short" });
    const aDay = a.getDate();
    const dMonth = d.toLocaleDateString("en-US", { month: "short" });
    const dDay = d.getDate();
    if (aMonth === dMonth) {
      return `${aMonth.toUpperCase()} ${aDay} - ${dDay}`;
    }
    return `${aMonth.toUpperCase()} ${aDay} - ${dMonth.toUpperCase()} ${dDay}`;
  } catch {
    return "";
  }
}

function formatMonth(date: string): string {
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  } catch {
    return "";
  }
}

export function JourneyStopCard({ stop, onEdit }: JourneyStopCardProps) {
  const { colors, isDark } = useAppTheme();
  const isCurrent = stop.status === "current";
  const isDestination = stop.status === "destination";

  const statusLabel =
    stop.status === "current"
      ? "CURRENTLY AT"
      : stop.status === "next"
        ? "NEXT STOP"
        : stop.status === "destination"
          ? "DESTINATION"
          : "COMPLETED";

  const statusColor =
    stop.status === "current" ? AppColors.accentTeal : colors.onSurfaceVariant;

  const dateText = isDestination
    ? formatMonth(stop.arrivalDate)
    : formatDateRange(stop.arrivalDate, stop.departureDate);

  return (
    <View
      style={[
        styles.card,
        isCurrent
          ? {
              backgroundColor: isDark ? colors.surface : "#fff",
              borderColor: isDark ? colors.outline : "#f1f5f9",
              borderStyle: "solid" as const,
            }
          : {
              backgroundColor: isDark ? `${colors.surface}80` : "rgba(255,255,255,0.5)",
              borderColor: isDark ? colors.outline : "#e2e8f0",
              borderStyle: "dashed" as const,
            },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          <Text
            style={[
              styles.locationName,
              {
                color: isCurrent
                  ? colors.onBackground
                  : isDark
                    ? colors.onSurfaceVariant
                    : "#475569",
              },
            ]}
          >
            {stop.locationName}
          </Text>
          {stop.notes && (
            <Text style={[styles.notes, { color: colors.onSurfaceVariant }]}>
              {isCurrent ? `"${stop.notes}"` : stop.notes}
            </Text>
          )}
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>{dateText}</Text>
          {onEdit && (
            <Pressable onPress={onEdit} hitSlop={10} style={styles.editButton}>
              <Ionicons name="pencil-outline" size={14} color={colors.onSurfaceVariant} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Syncs active (current stop) — placeholder */}
      {isCurrent && stop.syncsCount != null && stop.syncsCount > 0 && (
        <View style={styles.syncsRow}>
          <View style={styles.avatarStack}>
            <View style={[styles.miniAvatar, { backgroundColor: colors.surfaceVariant }]} />
            <View style={[styles.miniAvatar, styles.miniAvatarOverlap, { backgroundColor: colors.surfaceVariant }]} />
            <View style={[styles.miniAvatarCount, { backgroundColor: isDark ? colors.surfaceVariant : "#f1f5f9" }]}>
              <Text style={[styles.miniAvatarCountText, { color: colors.onSurfaceVariant }]}>
                +{Math.max(0, stop.syncsCount - 2)}
              </Text>
            </View>
          </View>
          <Text style={[styles.syncsText, { color: AppColors.accentOrange }]}>
            {stop.syncsCount} Syncs active
          </Text>
        </View>
      )}

      {/* Overlap detection (next stops) — placeholder */}
      {!isCurrent && !isDestination && stop.overlapsCount != null && stop.overlapsCount > 0 && (
        <View style={styles.overlapsRow}>
          <Ionicons name="shuffle" size={14} color={AppColors.accentTeal} />
          <Text style={[styles.overlapsText, { color: colors.onSurfaceVariant }]}>
            {stop.overlapsCount} upcoming path overlaps detected
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "700",
  },
  notes: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 4,
  },
  cardHeaderRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  editButton: {
    padding: 4,
  },
  dateText: {
    fontSize: 10,
    fontWeight: "700",
  },
  syncsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  avatarStack: {
    flexDirection: "row",
    marginRight: 8,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  miniAvatarOverlap: {
    marginLeft: -8,
  },
  miniAvatarCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    marginLeft: -8,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarCountText: {
    fontSize: 8,
    fontWeight: "700",
  },
  syncsText: {
    fontSize: 10,
    fontWeight: "700",
  },
  overlapsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  overlapsText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
