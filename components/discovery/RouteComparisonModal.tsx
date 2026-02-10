import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme, AppColors } from "@/lib/theme";
import { SCREEN_HEIGHT } from "@/lib/constants";
import {
  buildMapData,
  fitCameraToBounds,
  getOverlapCenter,
  getOverlapRadius,
  MODAL_MAP_STYLE,
  MAP_COLORS,
  MapErrorBoundary,
  type RouteStop,
  type Overlap,
} from "./mapUtils";

/** Lazy-load expo-maps only when the modal actually needs to render a map */
function getGoogleMaps(): typeof import("expo-maps").GoogleMaps | undefined {
  if (Platform.OS !== "android") return undefined;
  try {
    return require("expo-maps").GoogleMaps;
  } catch {
    return undefined;
  }
}

const MODAL_MAP_HEIGHT = SCREEN_HEIGHT * 0.6;

interface RouteComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  theirRoute?: RouteStop[];
  myRoute?: RouteStop[];
  overlaps?: Overlap[];
  theirName?: string;
}

function formatDate(value: string) {
  try {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return value;
  }
}

export function RouteComparisonModal({
  visible,
  onClose,
  theirRoute,
  myRoute,
  overlaps,
  theirName,
}: RouteComparisonModalProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Reset map loaded state when modal opens
  const handleShow = useCallback(() => {
    setMapLoaded(false);
  }, []);

  const theirMapData = useMemo(
    () => (theirRoute ? buildMapData(theirRoute) : null),
    [theirRoute]
  );
  const myMapData = useMemo(
    () => (myRoute ? buildMapData(myRoute) : null),
    [myRoute]
  );

  const overlap = overlaps?.[0];

  // Camera that fits both routes
  const camera = useMemo(() => {
    const coordArrays: { latitude: number; longitude: number }[][] = [];
    if (theirMapData) coordArrays.push(theirMapData.polylineCoords);
    if (myMapData) coordArrays.push(myMapData.polylineCoords);
    if (coordArrays.length === 0) return null;
    return fitCameraToBounds(...coordArrays);
  }, [theirMapData, myMapData]);

  // Overlap circle
  const overlapCenter = useMemo(() => {
    if (!overlap || !myRoute || !theirRoute) return null;
    return getOverlapCenter(myRoute, theirRoute, overlap);
  }, [myRoute, theirRoute, overlap]);

  const overlapRadius = useMemo(
    () => (overlap ? getOverlapRadius(overlap.distance) : 0),
    [overlap]
  );

  // Build polylines array
  const polylines = useMemo(() => {
    const lines: {
      id: string;
      coordinates: { latitude: number; longitude: number }[];
      color: string;
      width: number;
    }[] = [];

    if (theirMapData) {
      lines.push({
        id: "their-route",
        coordinates: theirMapData.polylineCoords,
        color: MAP_COLORS.theirRoute,
        width: 4,
      });
    }

    if (myMapData) {
      lines.push({
        id: "my-route",
        coordinates: myMapData.polylineCoords,
        color: MAP_COLORS.myRoute,
        width: 4,
      });
    }

    return lines;
  }, [theirMapData, myMapData]);

  // Build markers array
  const markers = useMemo(() => {
    const m: {
      id: string;
      coordinates: { latitude: number; longitude: number };
      title?: string;
    }[] = [];

    if (theirMapData) {
      m.push({
        id: "their-origin",
        coordinates: {
          latitude: theirMapData.origin.latitude,
          longitude: theirMapData.origin.longitude,
        },
        title: theirMapData.origin.name,
      });
      m.push({
        id: "their-dest",
        coordinates: {
          latitude: theirMapData.destination.latitude,
          longitude: theirMapData.destination.longitude,
        },
        title: theirMapData.destination.name,
      });
    }

    if (myMapData) {
      m.push({
        id: "my-origin",
        coordinates: {
          latitude: myMapData.origin.latitude,
          longitude: myMapData.origin.longitude,
        },
        title: myMapData.origin.name,
      });
      m.push({
        id: "my-dest",
        coordinates: {
          latitude: myMapData.destination.latitude,
          longitude: myMapData.destination.longitude,
        },
        title: myMapData.destination.name,
      });
    }

    return m;
  }, [theirMapData, myMapData]);

  // Build circles array
  const circles = useMemo(() => {
    if (!overlapCenter || overlapRadius <= 0) return [];
    return [
      {
        id: "overlap-zone",
        center: overlapCenter,
        radius: overlapRadius,
        color: MAP_COLORS.overlapFill,
      },
    ];
  }, [overlapCenter, overlapRadius]);

  const hasData = camera && (theirMapData || myMapData);

  // Lazy-load: only resolve native module when modal is visible and has data
  const GMaps = visible && hasData ? getGoogleMaps() : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={handleShow}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Tap backdrop to close */}
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        {/* Half-sheet */}
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? colors.surface : "#fff",
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.outline }]} />
          </View>

          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.onSurfaceVariant} />
          </Pressable>

          {/* Map */}
          <View style={styles.mapContainer}>
            {hasData && GMaps ? (
              <MapErrorBoundary
                fallback={
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      styles.noMapFallback,
                      { backgroundColor: isDark ? colors.surfaceVariant : "#f0ede8" },
                    ]}
                  >
                    <Ionicons name="map-outline" size={36} color={colors.onSurfaceVariant} />
                    <Text style={[styles.noMapText, { color: colors.onSurfaceVariant }]}>
                      Map unavailable — rebuild required
                    </Text>
                  </View>
                }
              >
                <GMaps.View
                  style={StyleSheet.absoluteFill}
                  cameraPosition={{
                    coordinates: camera.center,
                    zoom: camera.zoom,
                  }}
                  colorScheme={
                    isDark && GMaps?.MapColorScheme
                      ? GMaps.MapColorScheme.DARK
                      : undefined
                  }
                  uiSettings={{
                    scrollGesturesEnabled: true,
                    zoomGesturesEnabled: true,
                    rotationGesturesEnabled: false,
                    tiltGesturesEnabled: false,
                    compassEnabled: false,
                    myLocationButtonEnabled: false,
                    mapToolbarEnabled: false,
                    zoomControlsEnabled: false,
                  }}
                  properties={{
                    mapStyleOptions: isDark ? undefined : { json: MODAL_MAP_STYLE },
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
              </MapErrorBoundary>
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  styles.noMapFallback,
                  { backgroundColor: isDark ? colors.surfaceVariant : "#f0ede8" },
                ]}
              >
                <Ionicons name="map-outline" size={36} color={colors.onSurfaceVariant} />
                <Text style={[styles.noMapText, { color: colors.onSurfaceVariant }]}>
                  Route data unavailable
                </Text>
              </View>
            )}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            {theirMapData && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: MAP_COLORS.theirRoute }]} />
                <Text style={[styles.legendLabel, { color: colors.onSurface }]}>
                  {theirName ? `${theirName}'s route` : "Their route"}
                </Text>
              </View>
            )}
            {myMapData && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: MAP_COLORS.myRoute }]} />
                <Text style={[styles.legendLabel, { color: colors.onSurface }]}>
                  Your route
                </Text>
              </View>
            )}
            {overlap && overlapCenter && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: AppColors.accentOrange }]} />
                <Text style={[styles.legendLabel, { color: colors.onSurface }]}>
                  Paths cross
                </Text>
              </View>
            )}
          </View>

          {/* Info strip */}
          {overlap && (
            <View style={[styles.infoStrip, { backgroundColor: isDark ? colors.surfaceVariant : "#f8f6f2" }]}>
              <View style={styles.infoRow}>
                <Ionicons name="compass" size={18} color={colors.primary} />
                <Text style={[styles.infoTitle, { color: colors.onSurface }]}>
                  Paths cross in {overlap.locationName}
                </Text>
              </View>
              <Text style={[styles.infoMeta, { color: colors.onSurfaceVariant }]}>
                {formatDate(overlap.dateRange.start)} — {formatDate(overlap.dateRange.end)}
                {"  •  "}Within {Math.round(overlap.distance)}km
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  mapContainer: {
    width: "100%",
    height: MODAL_MAP_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 0,
  },
  noMapFallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  noMapText: {
    fontSize: 13,
    fontWeight: "500",
  },
  legendRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 20,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoStrip: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  infoMeta: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    marginLeft: 26,
  },
});
