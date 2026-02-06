import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";

interface PathsCrossBadgeProps {
  locationName: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  distanceKm: number;
}

function formatDate(value: string) {
  try {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return value;
  }
}

export function PathsCrossBadge({
  locationName,
  dateRangeStart,
  dateRangeEnd,
  distanceKm,
}: PathsCrossBadgeProps) {
  const { colors } = useAppTheme();
  const dateText = `${formatDate(dateRangeStart)} — ${formatDate(dateRangeEnd)}`;
  const distanceText = `Within ${distanceKm}km`;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Ionicons name="compass" size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.onBackground }]}>
          Paths cross in {locationName}
        </Text>
      </View>
      <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
        {dateText} <Text style={styles.metaLight}>• {distanceText}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  metaLight: {
    fontWeight: "400",
  },
});
