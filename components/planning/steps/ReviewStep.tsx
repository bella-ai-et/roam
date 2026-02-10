import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Animated, { FadeInDown, FadeInLeft } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { format, parse } from "date-fns";
import { GlassButton } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";
import { AdaptiveGlassView } from "@/lib/glass";
import { Doc } from "@/convex/_generated/dataModel";

type RouteStop = NonNullable<Doc<"users">["currentRoute"]>[number];

interface ReviewStepProps {
  destinationName: string;
  destinationArrival: Date | undefined;
  destinationDeparture: Date | undefined;
  originName: string;
  originArrival: Date | undefined;
  originDeparture: Date | undefined;
  extraStops: RouteStop[];
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
  onEditStep: (step: number) => void;
}

function formatDateRange(arrival: Date | undefined, departure: Date | undefined): string {
  if (!arrival || !departure) return "";
  return `${format(arrival, "MMM d")} – ${format(departure, "MMM d, yyyy")}`;
}

function formatStopDateRange(arrivalStr: string, departureStr: string): string {
  try {
    const arrival = parse(arrivalStr, "MM/dd/yyyy", new Date());
    const departure = parse(departureStr, "MM/dd/yyyy", new Date());
    return `${format(arrival, "MMM d")} – ${format(departure, "MMM d, yyyy")}`;
  } catch {
    return `${arrivalStr} – ${departureStr}`;
  }
}

function TimelineNode({
  label,
  locationName,
  dateRange,
  isFirst,
  isLast,
  delay,
  onEdit,
}: {
  label: string;
  locationName: string;
  dateRange: string;
  isFirst: boolean;
  isLast: boolean;
  delay: number;
  onEdit?: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Animated.View
      entering={FadeInLeft.duration(350).delay(delay)}
      style={styles.timelineNode}
    >
      <View style={styles.timelineDotColumn}>
        {!isFirst && <View style={[styles.lineSegment, { backgroundColor: colors.outline }]} />}
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        {!isLast && <View style={[styles.lineSegment, { backgroundColor: colors.outline }]} />}
      </View>

      <Pressable onPress={onEdit} style={{ flex: 1 }} disabled={!onEdit}>
        <AdaptiveGlassView style={styles.nodeCard}>
          <View style={styles.nodeHeader}>
            <Text style={[styles.nodeLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
            {onEdit && (
              <Ionicons name="pencil-outline" size={14} color={colors.onSurfaceVariant} />
            )}
          </View>
          <Text style={[styles.nodeName, { color: colors.onSurface }]}>{locationName}</Text>
          {dateRange ? (
            <Text style={[styles.nodeDates, { color: colors.onSurfaceVariant }]}>{dateRange}</Text>
          ) : null}
        </AdaptiveGlassView>
      </Pressable>
    </Animated.View>
  );
}

export function ReviewStep({
  destinationName,
  destinationArrival,
  destinationDeparture,
  originName,
  originArrival,
  originDeparture,
  extraStops,
  saving,
  onSave,
  onBack,
  onEditStep,
}: ReviewStepProps) {
  const { colors } = useAppTheme();

  const hasOrigin = originName.trim().length > 0 && !!originArrival && !!originDeparture;

  const nodes: {
    label: string;
    name: string;
    dates: string;
    editStep?: number;
  }[] = [];

  if (hasOrigin) {
    nodes.push({
      label: "Start",
      name: originName,
      dates: formatDateRange(originArrival, originDeparture),
      editStep: 2,
    });
  }

  extraStops.forEach((stop, index) => {
    nodes.push({
      label: extraStops.length === 1 ? "Stop" : `Stop ${index + 1}`,
      name: stop.location.name,
      dates: formatStopDateRange(stop.arrivalDate, stop.departureDate),
      editStep: 3,
    });
  });

  nodes.push({
    label: "Destination",
    name: destinationName,
    dates: formatDateRange(destinationArrival, destinationDeparture),
    editStep: 0,
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={[styles.headline, { color: colors.onSurface }]}>
            Your route
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Everything looks good? Tap any stop to edit.
          </Text>
        </Animated.View>

        <View style={styles.timeline}>
          {nodes.map((node, index) => (
            <TimelineNode
              key={`${node.name}-${index}`}
              label={node.label}
              locationName={node.name}
              dateRange={node.dates}
              isFirst={index === 0}
              isLast={index === nodes.length - 1}
              delay={300 + index * 100}
              onEdit={node.editStep !== undefined ? () => onEditStep(node.editStep!) : undefined}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GlassButton title="Save Route" onPress={onSave} loading={saving} />
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.onSurfaceVariant }]}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 36,
  },
  timeline: {
    gap: 0,
  },
  timelineNode: {
    flexDirection: "row",
    minHeight: 90,
  },
  timelineDotColumn: {
    width: 24,
    alignItems: "center",
    marginRight: 14,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  lineSegment: {
    width: 2,
    flex: 1,
  },
  nodeCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  nodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  nodeLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nodeName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  nodeDates: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    gap: 12,
    alignItems: "center",
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
