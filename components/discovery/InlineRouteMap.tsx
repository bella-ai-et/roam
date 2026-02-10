import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme, AppColors } from "@/lib/theme";
import { CARD_WIDTH } from "@/lib/constants";
import {
  buildMapData,
  fitCameraToBounds,
  MINI_MAP_STYLE,
  MAP_COLORS,
  MapErrorBoundary,
  type RouteStop,
} from "./mapUtils";

/** Lazy-load expo-maps only when a map actually needs to render */
function getGoogleMaps(): typeof import("expo-maps").GoogleMaps | undefined {
  if (Platform.OS !== "android") return undefined;
  try {
    return require("expo-maps").GoogleMaps;
  } catch {
    return undefined;
  }
}

const INLINE_MAP_HEIGHT = 180;
const INLINE_MAP_WIDTH = CARD_WIDTH - 40; // matches section paddingHorizontal: 20

interface InlineRouteMapProps {
  route?: RouteStop[];
  onExpand?: () => void;
}

/**
 * Wider inline map for the expanded discovery profile.
 * Shows the person's route with a "Compare Routes" overlay.
 * Tapping opens the RouteComparisonModal.
 */
export function InlineRouteMap({ route, onExpand }: InlineRouteMapProps) {
  const { colors, isDark } = useAppTheme();
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapData = useMemo(() => (route ? buildMapData(route) : null), [route]);
  const camera = useMemo(
    () => (mapData ? fitCameraToBounds(mapData.polylineCoords) : null),
    [mapData]
  );

  const GMaps = mapData && camera ? getGoogleMaps() : undefined;

  if (!mapData || !camera) return null;

  // Build route story text
  const sorted = [...(route ?? [])].sort(
    (a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
  );
  const names = sorted.map((s) => s.location.name).filter(Boolean);
  const deduped = names.filter((n, i) => i === 0 || n !== names[i - 1]);
  const routeStory = deduped.join("  →  ");

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
        ROUTE MAP
      </Text>

      <Pressable
        style={[
          styles.container,
          { borderColor: isDark ? colors.outline : "rgba(210,124,92,0.2)" },
        ]}
        onPress={onExpand}
        disabled={!onExpand}
      >
        {GMaps ? (
          <MapErrorBoundary
            fallback={
              <View style={[styles.fallback, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.fallbackText, { color: colors.onSurfaceVariant }]}>
                  Map unavailable
                </Text>
              </View>
            }
          >
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <GMaps.View
                style={StyleSheet.absoluteFill}
                cameraPosition={{
                  coordinates: camera.center,
                  zoom: Math.max(camera.zoom - 0.5, 2),
                }}
                uiSettings={{
                  scrollGesturesEnabled: false,
                  zoomGesturesEnabled: false,
                  rotationGesturesEnabled: false,
                  tiltGesturesEnabled: false,
                  compassEnabled: false,
                  myLocationButtonEnabled: false,
                  mapToolbarEnabled: false,
                  zoomControlsEnabled: false,
                }}
                properties={{
                  mapStyleOptions: { json: MINI_MAP_STYLE },
                  isMyLocationEnabled: false,
                  isTrafficEnabled: false,
                  isBuildingEnabled: false,
                  isIndoorEnabled: false,
                }}
                polylines={[
                  {
                    id: "their-route",
                    coordinates: mapData.polylineCoords,
                    color: MAP_COLORS.theirRoute,
                    width: 4,
                  },
                ]}
                markers={[
                  {
                    id: "origin",
                    coordinates: {
                      latitude: mapData.origin.latitude,
                      longitude: mapData.origin.longitude,
                    },
                    title: mapData.origin.name,
                  },
                  {
                    id: "destination",
                    coordinates: {
                      latitude: mapData.destination.latitude,
                      longitude: mapData.destination.longitude,
                    },
                    title: mapData.destination.name,
                  },
                ]}
                onMapLoaded={() => setMapLoaded(true)}
              />
            </View>

            {/* Soft vignette */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={["rgba(0,0,0,0.1)", "transparent", "transparent", "rgba(0,0,0,0.15)"]}
                locations={[0, 0.2, 0.75, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </MapErrorBoundary>
        ) : (
          <View style={[styles.fallback, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.fallbackText, { color: colors.onSurfaceVariant }]}>
              Map unavailable
            </Text>
          </View>
        )}

        {/* Bottom gradient for text readability */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)"]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        {/* Route story text */}
        {routeStory ? (
          <View style={styles.storyOverlay} pointerEvents="none">
            <Text style={styles.storyText} numberOfLines={1}>
              {routeStory}
            </Text>
          </View>
        ) : null}

        {/* Compare Routes chip */}
        {onExpand && (
          <View style={styles.compareChip}>
            <Text style={styles.compareText}>Compare Routes ↗</Text>
          </View>
        )}
      </Pressable>
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
  container: {
    width: "100%",
    height: INLINE_MAP_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: "500",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  storyOverlay: {
    position: "absolute",
    bottom: 28,
    left: 12,
    right: 12,
  },
  storyText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  compareChip: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(210,124,92,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compareText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
