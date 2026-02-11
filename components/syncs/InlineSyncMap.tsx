import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform, LayoutAnimation, UIManager } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme, AppColors } from "@/lib/theme";
import {
  buildMapData,
  fitCameraToBounds,
  findSharedStops,
  findCrossingPoints,
  adaptiveRadius,
  MINI_MAP_STYLE,
  MAP_COLORS,
  MapErrorBoundary,
  type RouteStop,
  type Coordinates,
} from "@/components/discovery/mapUtils";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function getGoogleMaps(): typeof import("expo-maps").GoogleMaps | undefined {
  if (Platform.OS !== "android") return undefined;
  try {
    return require("expo-maps").GoogleMaps;
  } catch {
    return undefined;
  }
}

const MAP_HEIGHT = 140;

interface InlineSyncMapProps {
  myRoute?: RouteStop[];
  theirRoute?: RouteStop[];
  syncLocation?: string;
  visible: boolean;
}

export function InlineSyncMap({ myRoute, theirRoute, syncLocation, visible }: InlineSyncMapProps) {
  const { colors, isDark } = useAppTheme();
  const [mapLoaded, setMapLoaded] = useState(false);

  const myMapData = useMemo(() => (myRoute ? buildMapData(myRoute) : null), [myRoute]);
  const theirMapData = useMemo(() => (theirRoute ? buildMapData(theirRoute) : null), [theirRoute]);

  const camera = useMemo(() => {
    const allCoords = [
      ...(myMapData?.polylineCoords ?? []),
      ...(theirMapData?.polylineCoords ?? []),
    ];
    return allCoords.length > 0 ? fitCameraToBounds(allCoords) : null;
  }, [myMapData, theirMapData]);

  const GMaps = getGoogleMaps();

  const allCoords = useMemo(() => [
    ...(myMapData?.polylineCoords ?? []),
    ...(theirMapData?.polylineCoords ?? []),
  ], [myMapData, theirMapData]);

  const sharedStops = useMemo(
    () => (myRoute && theirRoute ? findSharedStops(myRoute, theirRoute) : []),
    [myRoute, theirRoute]
  );

  const crossingPts = useMemo(
    () => (myMapData && theirMapData
      ? findCrossingPoints(myMapData.polylineCoords, theirMapData.polylineCoords)
      : []),
    [myMapData, theirMapData]
  );

  if (!visible || (!myMapData && !theirMapData) || !camera) return null;

  const radius = adaptiveRadius(allCoords);

  const polylines: any[] = [];
  if (myMapData) {
    polylines.push({
      id: "my-route",
      coordinates: myMapData.polylineCoords,
      color: MAP_COLORS.myRoute,
      width: 5,
    });
  }
  if (theirMapData) {
    polylines.push({
      id: "their-route",
      coordinates: theirMapData.polylineCoords,
      color: MAP_COLORS.theirRoute,
      width: 4,
    });
  }

  // Markers: origin + destination only (clean, not cluttered)
  const markers: any[] = [];
  if (myMapData) {
    markers.push({
      id: "my-origin",
      coordinates: { latitude: myMapData.origin.latitude, longitude: myMapData.origin.longitude },
      title: `You: ${myMapData.origin.name}`,
      snippet: "Start",
      tintColor: MAP_COLORS.myRoute,
    });
    markers.push({
      id: "my-dest",
      coordinates: { latitude: myMapData.destination.latitude, longitude: myMapData.destination.longitude },
      title: `You: ${myMapData.destination.name}`,
      snippet: "End",
      tintColor: MAP_COLORS.myRoute,
    });
  }
  if (theirMapData) {
    markers.push({
      id: "their-origin",
      coordinates: { latitude: theirMapData.origin.latitude, longitude: theirMapData.origin.longitude },
      title: `Them: ${theirMapData.origin.name}`,
      snippet: "Start",
      tintColor: MAP_COLORS.theirRoute,
    });
    markers.push({
      id: "their-dest",
      coordinates: { latitude: theirMapData.destination.latitude, longitude: theirMapData.destination.longitude },
      title: `Them: ${theirMapData.destination.name}`,
      snippet: "End",
      tintColor: MAP_COLORS.theirRoute,
    });
  }
  sharedStops.forEach((s, i) => {
    markers.push({
      id: `shared-${i}`,
      coordinates: s.coordinate,
      title: `Shared: ${s.myStopName === s.theirStopName ? s.myStopName : `${s.myStopName} / ${s.theirStopName}`}`,
      tintColor: MAP_COLORS.sharedStop,
    });
  });

  // Highlight circles for shared stops & crossings
  const circles: any[] = [];
  sharedStops.forEach((s, i) => {
    circles.push({
      id: `shared-circle-${i}`,
      coordinates: s.coordinate,
      radius: radius * 1.4,
      color: MAP_COLORS.sharedStopFill,
      strokeColor: MAP_COLORS.sharedStop,
      strokeWidth: 2,
    });
  });
  crossingPts.forEach((pt, i) => {
    circles.push({
      id: `crossing-circle-${i}`,
      coordinates: pt,
      radius: radius * 1.0,
      color: MAP_COLORS.crossingFill,
      strokeColor: MAP_COLORS.crossing,
      strokeWidth: 2,
    });
  });

  // Origin/destination highlight circles — filled = start, ring = end
  if (myMapData) {
    circles.push({
      id: "my-origin-glow",
      coordinates: { latitude: myMapData.origin.latitude, longitude: myMapData.origin.longitude },
      radius: radius * 0.8,
      color: "rgba(8,145,178,0.25)",
      strokeColor: MAP_COLORS.myRoute,
      strokeWidth: 2,
    });
    circles.push({
      id: "my-dest-glow",
      coordinates: { latitude: myMapData.destination.latitude, longitude: myMapData.destination.longitude },
      radius: radius * 0.8,
      color: "transparent",
      strokeColor: MAP_COLORS.myRoute,
      strokeWidth: 2,
    });
  }
  if (theirMapData) {
    circles.push({
      id: "their-origin-glow",
      coordinates: { latitude: theirMapData.origin.latitude, longitude: theirMapData.origin.longitude },
      radius: radius * 0.8,
      color: "rgba(225,29,72,0.25)",
      strokeColor: MAP_COLORS.theirRoute,
      strokeWidth: 2,
    });
    circles.push({
      id: "their-dest-glow",
      coordinates: { latitude: theirMapData.destination.latitude, longitude: theirMapData.destination.longitude },
      radius: radius * 0.8,
      color: "transparent",
      strokeColor: MAP_COLORS.theirRoute,
      strokeWidth: 2,
    });
  }

  const hasShared = sharedStops.length > 0;
  const hasCrossing = crossingPts.length > 0;

  return (
    <View style={[styles.container, { borderColor: isDark ? colors.outline : "rgba(210,124,92,0.15)" }]}>
      {/* Route summary — instantly shows who is who */}
      <View
        style={[
          styles.routeSummary,
          {
            backgroundColor: isDark ? colors.surface : "#fff",
            borderBottomColor: isDark ? colors.outline : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        {myMapData && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryLineSwatch, { backgroundColor: MAP_COLORS.myRoute }]} />
            <Text
              style={[styles.summaryText, { color: colors.onBackground }]}
              numberOfLines={1}
            >
              You: {myMapData.origin.name} → {myMapData.destination.name}
            </Text>
          </View>
        )}
        {theirMapData && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryLineSwatch, { backgroundColor: MAP_COLORS.theirRoute }]} />
            <Text
              style={[styles.summaryText, { color: colors.onBackground }]}
              numberOfLines={1}
            >
              Them: {theirMapData.origin.name} → {theirMapData.destination.name}
            </Text>
          </View>
        )}
        {hasShared && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryDot, { backgroundColor: MAP_COLORS.sharedStop }]} />
            <Text
              style={[styles.summaryText, { color: MAP_COLORS.sharedStop, fontWeight: "700" }]}
              numberOfLines={1}
            >
              Same stop{sharedStops.length > 1 ? "s" : ""}: {sharedStops.map((s) => s.myStopName).join(", ")}
            </Text>
          </View>
        )}
        {hasCrossing && !hasShared && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryDot, { backgroundColor: MAP_COLORS.crossing }]} />
            <Text
              style={[styles.summaryText, { color: MAP_COLORS.crossing, fontWeight: "700" }]}
              numberOfLines={1}
            >
              Routes cross
            </Text>
          </View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
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
                polylines={polylines}
                markers={markers}
                circles={circles}
                onMapLoaded={() => setMapLoaded(true)}
              />
            </View>

            {/* Soft vignette */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={["rgba(0,0,0,0.05)", "transparent", "transparent", "rgba(0,0,0,0.08)"]}
                locations={[0, 0.1, 0.88, 1]}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  routeSummary: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryLineSwatch: {
    width: 14,
    height: 3.5,
    borderRadius: 2,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 10.5,
    fontWeight: "600",
    flex: 1,
  },
  mapWrapper: {
    height: MAP_HEIGHT,
    position: "relative",
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
