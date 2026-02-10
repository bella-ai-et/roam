import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors, useAppTheme } from "@/lib/theme";
import { JourneyStopCard, type RouteStopData, type StopStatus } from "./JourneyStopCard";

interface RouteStop {
  location: { latitude: number; longitude: number; name: string };
  arrivalDate: string;
  departureDate: string;
  notes?: string;
  status?: string;
}

interface JourneyTimelineProps {
  stops: RouteStop[];
  onAddStop: () => void;
  onEditStop?: (index: number) => void;
}

function inferStatus(index: number, total: number, explicit?: string): StopStatus {
  if (explicit === "current" || explicit === "next" || explicit === "destination" || explicit === "completed") {
    return explicit;
  }
  if (index === 0) return "current";
  if (index === total - 1 && total > 1) return "destination";
  return "next";
}

export function JourneyTimeline({ stops, onAddStop, onEditStop }: JourneyTimelineProps) {
  const { colors, isDark } = useAppTheme();

  const stopData: RouteStopData[] = stops.map((stop, index) => ({
    locationName: stop.location.name,
    arrivalDate: stop.arrivalDate,
    departureDate: stop.departureDate,
    notes: stop.notes,
    status: inferStatus(index, stops.length, stop.status),
    syncsCount: index === 0 ? 3 : undefined,
    overlapsCount: index > 0 && index < stops.length - 1 ? 2 : undefined,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.onBackground }]}>Planned Journey</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Your upcoming path & stops
          </Text>
        </View>
        <Pressable
          onPress={onAddStop}
          style={[styles.addButton, { backgroundColor: `${AppColors.primary}15` }]}
        >
          <Ionicons name="map-outline" size={14} color={AppColors.primary} />
          <Text style={[styles.addButtonText, { color: AppColors.primary }]}>PLAN ROUTE</Text>
        </Pressable>
      </View>

      {/* Timeline */}
      {stops.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={40} color={colors.onSurfaceVariant} />
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            No stops planned yet. Add your first stop to start your journey!
          </Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {/* Dotted line */}
          <View style={styles.lineContainer}>
            <View style={[styles.dottedLine, { borderColor: AppColors.primary }]} />
          </View>

          {stopData.map((stop, index) => (
            <View key={`${stop.locationName}-${index}`} style={styles.stopRow}>
              {/* Dot / Icon */}
              <View style={styles.dotColumn}>
                {stop.status === "current" ? (
                  <View style={[styles.dotFilled, { backgroundColor: AppColors.primary }]}>
                    <Ionicons name="location" size={14} color="#fff" />
                  </View>
                ) : stop.status === "destination" ? (
                  <View
                    style={[
                      styles.dotHollow,
                      {
                        backgroundColor: isDark ? colors.surface : "#fff",
                        borderColor: isDark ? colors.outline : "#e2e8f0",
                      },
                    ]}
                  >
                    <Ionicons name="flag" size={12} color={colors.onSurfaceVariant} />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.dotHollow,
                      {
                        backgroundColor: isDark ? colors.surface : "#fff",
                        borderColor: isDark ? colors.outline : "#e2e8f0",
                      },
                    ]}
                  >
                    <Ionicons name="ellipse" size={8} color={colors.onSurfaceVariant} />
                  </View>
                )}
              </View>

              {/* Card */}
              <View style={styles.cardWrapper}>
                <JourneyStopCard
                  stop={stop}
                  onEdit={onEditStop ? () => onEditStop(index) : undefined}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 240,
  },
  timeline: {
    position: "relative",
    marginLeft: 8,
  },
  lineContainer: {
    position: "absolute",
    top: 20,
    bottom: 20,
    left: 13,
    width: 1,
  },
  dottedLine: {
    flex: 1,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    opacity: 0.4,
  },
  stopRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  dotColumn: {
    width: 28,
    alignItems: "center",
    paddingTop: 12,
    zIndex: 1,
  },
  dotFilled: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dotHollow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapper: {
    flex: 1,
  },
});
