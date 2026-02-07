import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SYNC_STATUS_CONFIG } from "@/lib/constants";

type SyncStatusBadgeProps = {
  status: string;
  location?: string;
  daysUntil?: number | null;
  movingTo?: string | null;
};

export function SyncStatusBadge({ status, location, daysUntil, movingTo }: SyncStatusBadgeProps) {
  const config = SYNC_STATUS_CONFIG[status];
  if (!config || status === "none") return null;

  let label = "";
  switch (status) {
    case "crossing":
      label = daysUntil != null ? `Crossing in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}` : "Crossing soon";
      break;
    case "same_stop":
      label = location ? `Same Stop: ${location}` : "Same Stop";
      break;
    case "syncing":
      label = location ? `Syncing in ${location}` : "Syncing";
      break;
    case "departed":
      label = daysUntil != null ? `Departed ${daysUntil}d ago` : "Departed";
      break;
    default:
      return null;
  }

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
        <Ionicons
          name={config.icon as any}
          size={12}
          color={config.textColor}
        />
        <Text style={[styles.badgeText, { color: config.textColor }]}>
          {label.toUpperCase()}
        </Text>
      </View>
      {status === "departed" && movingTo ? (
        <View style={styles.movingToRow}>
          <Ionicons name="navigate" size={14} color="#D27C5C" />
          <Text style={styles.movingToText}>Moving to: {movingTo}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 50,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  movingToRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  movingToText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D27C5C",
  },
});
