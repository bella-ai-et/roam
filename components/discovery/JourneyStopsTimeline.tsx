import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";
import { JOURNEY_STOP_CARD_WIDTH } from "@/lib/constants";
import { AppColors } from "@/lib/theme";

export type JourneyStopType = "start" | "stop" | "overlap" | "destination";

export interface JourneyStopItem {
  type: JourneyStopType;
  locationName: string;
  dateLabel: string;
  subLabel: string;
}

interface JourneyStopsTimelineProps {
  stops: JourneyStopItem[];
}

export function JourneyStopsTimeline({ stops }: JourneyStopsTimelineProps) {
  const { colors, isDark } = useAppTheme();

  if (stops.length === 0) return null;

  let stopNumber = 0;
  const getStopTitle = (type: JourneyStopType) => {
    switch (type) {
      case "start":
        return "START";
      case "destination":
        return "DESTINATION";
      case "overlap":
        return "OVERLAP";
      default:
        stopNumber += 1;
        return `STOP ${stopNumber}`;
    }
  };

  const renderCard = (stop: JourneyStopItem, index: number, useFlex: boolean) => {
    const isOverlap = stop.type === "overlap";
    const isStart = stop.type === "start";
    const title = getStopTitle(stop.type);

    return (
      <View
        key={`${stop.locationName}-${index}`}
        style={[
          useFlex ? styles.stopCardFlex : styles.stopCard,
          isStart && {
            backgroundColor: isDark ? colors.surfaceVariant : "#f1f5f9",
            borderColor: isDark ? colors.outline : "#e2e8f0",
          },
          !isStart && !isOverlap && {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.outline : "#e2e8f0",
          },
          isOverlap && {
            backgroundColor: isDark ? "rgba(232,155,116,0.2)" : "rgba(232,155,116,0.12)",
            borderWidth: 2,
            borderColor: "rgba(232,155,116,0.5)",
          },
        ]}
      >
        {isOverlap && (
          <View style={[styles.overlapBadge, { backgroundColor: AppColors.accentOrange }]}>
            <Ionicons name="location" size={10} color="#fff" />
          </View>
        )}
        <Text
          style={[
            styles.stopTitle,
            isStart && { color: colors.onSurfaceVariant },
            !isStart && !isOverlap && { color: colors.primary },
            isOverlap && { color: AppColors.accentOrange },
          ]}
        >
          {title}
        </Text>
        <Text style={[styles.locationName, { color: colors.onSurface }]} numberOfLines={1}>
          {stop.locationName}
        </Text>
        <Text style={[styles.subLabel, { color: colors.onSurfaceVariant }]}>
          {stop.subLabel}
        </Text>
      </View>
    );
  };

  // Adaptive: 1-2 stops fill the width, 3+ stops scroll horizontally
  const useFlex = stops.length <= 2;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
        JOURNEY STOPS
      </Text>
      {useFlex ? (
        <View style={styles.flexRow}>
          {stops.map((stop, index) => renderCard(stop, index, true))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scroll}
          nestedScrollEnabled
        >
          {stops.map((stop, index) => renderCard(stop, index, false))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  scroll: {
    marginHorizontal: -8,
  },
  scrollContent: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  flexRow: {
    flexDirection: "row",
    gap: 12,
  },
  stopCard: {
    width: JOURNEY_STOP_CARD_WIDTH,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  stopCardFlex: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  overlapBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  stopTitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationName: {
    fontSize: 14,
    fontWeight: "700",
  },
  subLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
