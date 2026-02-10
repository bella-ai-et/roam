import React, { useMemo, useState, useCallback, useEffect } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useImage } from "expo-image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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

const MODAL_MAP_HEIGHT = SCREEN_HEIGHT * 0.55;

interface RouteComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  theirRoute?: RouteStop[];
  myRoute?: RouteStop[];
  overlaps?: Overlap[];
  theirName?: string;
  theirPhotoId?: string;
  myPhotoId?: string;
}

type HighlightedRoute = "their" | "my" | "overlap" | null;

function isRemoteUrl(value?: string) {
  if (!value) return false;
  const t = value.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function formatDate(value: string) {
  try {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return value;
  }
}

/** Build a readable route story like "Dubai → Abu Dhabi → Liwa Oasis" */
function buildRouteStory(route?: RouteStop[]): string {
  if (!route || route.length === 0) return "";
  const sorted = [...route].sort(
    (a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
  );
  const names = sorted.map((s) => s.location.name).filter(Boolean);
  // Deduplicate consecutive names
  const deduped = names.filter((n, i) => i === 0 || n !== names[i - 1]);
  return deduped.join("  →  ");
}

export function RouteComparisonModal({
  visible,
  onClose,
  theirRoute,
  myRoute,
  overlaps,
  theirName,
  theirPhotoId,
  myPhotoId,
}: RouteComparisonModalProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [highlighted, setHighlighted] = useState<HighlightedRoute>(null);

  // ─── Resolve profile photos for custom markers ───
  const theirPhotoNorm = theirPhotoId?.replace(/`/g, "").trim();
  const theirPhotoRemote = isRemoteUrl(theirPhotoNorm);
  const theirPhotoConvexUrl = useQuery(
    api.files.getUrl,
    theirPhotoRemote || !theirPhotoNorm ? "skip" : { storageId: theirPhotoNorm as Id<"_storage"> }
  );
  const theirPhotoUrl = theirPhotoRemote ? theirPhotoNorm : theirPhotoConvexUrl;

  const myPhotoNorm = myPhotoId?.replace(/`/g, "").trim();
  const myPhotoRemote = isRemoteUrl(myPhotoNorm);
  const myPhotoConvexUrl = useQuery(
    api.files.getUrl,
    myPhotoRemote || !myPhotoNorm ? "skip" : { storageId: myPhotoNorm as Id<"_storage"> }
  );
  const myPhotoUrl = myPhotoRemote ? myPhotoNorm : myPhotoConvexUrl;

  // Load profile photos as ImageRef for marker icons (expo-image caching)
  const theirMarkerIcon = useImage(theirPhotoUrl ?? "", { maxWidth: 56, maxHeight: 56 });
  const myMarkerIcon = useImage(myPhotoUrl ?? "", { maxWidth: 56, maxHeight: 56 });

  // Animation shared values
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);
  const mapScale = useSharedValue(0.93);
  const mapOpacity = useSharedValue(0);

  // Animate in — fluid springs (higher damping, lower stiffness = smoother)
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      setMapLoaded(false);
      setHighlighted(null);
      // Stagger: backdrop → sheet → map
      backdropOpacity.value = withTiming(1, { duration: 320 });
      sheetTranslateY.value = withSpring(0, { damping: 28, stiffness: 140 });
      // Map breathes in after sheet arrives
      setTimeout(() => {
        mapScale.value = withSpring(1, { damping: 24, stiffness: 130 });
        mapOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.ease) });
      }, 120);
    } else {
      // Animate out — smooth ease
      mapOpacity.value = withTiming(0, { duration: 200 });
      mapScale.value = withTiming(0.93, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
      sheetTranslateY.value = withTiming(
        SCREEN_HEIGHT,
        { duration: 340, easing: Easing.in(Easing.ease) },
        (finished) => {
          if (finished) runOnJS(setModalVisible)(false);
        }
      );
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const mapAnimStyle = useAnimatedStyle(() => ({
    opacity: mapOpacity.value,
    transform: [{ scale: mapScale.value }],
  }));

  const theirMapData = useMemo(
    () => (theirRoute ? buildMapData(theirRoute) : null),
    [theirRoute]
  );
  const myMapData = useMemo(
    () => (myRoute ? buildMapData(myRoute) : null),
    [myRoute]
  );

  const overlap = overlaps?.[0];

  // Route story text
  const theirStory = useMemo(() => buildRouteStory(theirRoute), [theirRoute]);

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

  // Build polylines array — width changes based on legend highlight
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
        width: highlighted === "their" ? 8 : highlighted != null ? 3 : 5,
      });
    }

    if (myMapData) {
      lines.push({
        id: "my-route",
        coordinates: myMapData.polylineCoords,
        color: MAP_COLORS.myRoute,
        width: highlighted === "my" ? 8 : highlighted != null ? 3 : 5,
      });
    }

    return lines;
  }, [theirMapData, myMapData, highlighted]);

  // Build markers array — with profile photo icons + auto-show callouts
  const markers = useMemo(() => {
    const m: {
      id: string;
      coordinates: { latitude: number; longitude: number };
      title?: string;
      snippet?: string;
      showCallout?: boolean;
      icon?: any;
    }[] = [];

    if (theirMapData) {
      m.push({
        id: "their-origin",
        coordinates: {
          latitude: theirMapData.origin.latitude,
          longitude: theirMapData.origin.longitude,
        },
        title: theirMapData.origin.name,
        snippet: theirName ? `${theirName}'s start` : "Their start",
        showCallout: true,
        ...(theirMarkerIcon ? { icon: theirMarkerIcon } : {}),
      });
      m.push({
        id: "their-dest",
        coordinates: {
          latitude: theirMapData.destination.latitude,
          longitude: theirMapData.destination.longitude,
        },
        title: theirMapData.destination.name,
        snippet: theirName ? `${theirName}'s destination` : "Their destination",
        ...(theirMarkerIcon ? { icon: theirMarkerIcon } : {}),
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
        snippet: "Your start",
        showCallout: true,
        ...(myMarkerIcon ? { icon: myMarkerIcon } : {}),
      });
      m.push({
        id: "my-dest",
        coordinates: {
          latitude: myMapData.destination.latitude,
          longitude: myMapData.destination.longitude,
        },
        title: myMapData.destination.name,
        snippet: "Your destination",
        ...(myMarkerIcon ? { icon: myMarkerIcon } : {}),
      });
    }

    return m;
  }, [theirMapData, myMapData, theirName, theirMarkerIcon, myMarkerIcon]);

  // Build circles array — with visible stroke for "paths cross" zone
  const circles = useMemo(() => {
    if (!overlapCenter || overlapRadius <= 0) return [];
    return [
      {
        id: "overlap-zone",
        center: overlapCenter,
        radius: overlapRadius,
        color: highlighted === "overlap" ? "rgba(232,155,116,0.35)" : MAP_COLORS.overlapFill,
        lineColor: MAP_COLORS.overlapStroke,
        lineWidth: highlighted === "overlap" ? 4 : 2,
      },
    ];
  }, [overlapCenter, overlapRadius, highlighted]);

  const hasData = camera && (theirMapData || myMapData);

  // Lazy-load: only resolve native module when modal is visible and has data
  const GMaps = modalVisible && hasData ? getGoogleMaps() : undefined;

  if (!modalVisible && !visible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Animated backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        {/* Animated half-sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? colors.surface : "#fff",
              paddingBottom: insets.bottom + 16,
            },
            sheetStyle,
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

          {/* Route story header */}
          {theirStory ? (
            <View style={styles.storyRow}>
              <Text style={[styles.storyLabel, { color: colors.onSurfaceVariant }]}>
                {theirName ? `${theirName.toUpperCase()}'S JOURNEY` : "THEIR JOURNEY"}
              </Text>
              <Text
                style={[styles.storyText, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {theirStory}
              </Text>
            </View>
          ) : null}

          {/* Animated map container */}
          <Animated.View style={[styles.mapContainer, mapAnimStyle]}>
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
          </Animated.View>

          {/* Interactive legend — tap to highlight corresponding route */}
          <View style={styles.legendRow}>
            {theirMapData && (
              <Pressable
                style={[
                  styles.legendItem,
                  highlighted === "their" && styles.legendItemActive,
                  highlighted === "their" && { backgroundColor: `${MAP_COLORS.theirRoute}18` },
                ]}
                onPress={() => setHighlighted((h) => (h === "their" ? null : "their"))}
              >
                <View style={[styles.legendDot, { backgroundColor: MAP_COLORS.theirRoute }]} />
                <Text style={[styles.legendLabel, { color: colors.onSurface }]}>
                  {theirName ? `${theirName}'s route` : "Their route"}
                </Text>
              </Pressable>
            )}
            {myMapData && (
              <Pressable
                style={[
                  styles.legendItem,
                  highlighted === "my" && styles.legendItemActive,
                  highlighted === "my" && { backgroundColor: `${MAP_COLORS.myRoute}18` },
                ]}
                onPress={() => setHighlighted((h) => (h === "my" ? null : "my"))}
              >
                <View style={[styles.legendDot, { backgroundColor: MAP_COLORS.myRoute }]} />
                <Text style={[styles.legendLabel, { color: colors.onSurface }]}>
                  Your route
                </Text>
              </Pressable>
            )}
            {overlap && overlapCenter && (
              <Pressable
                style={[
                  styles.legendItem,
                  highlighted === "overlap" && styles.legendItemActive,
                  highlighted === "overlap" && { backgroundColor: `${AppColors.accentOrange}18` },
                ]}
                onPress={() => setHighlighted((h) => (h === "overlap" ? null : "overlap"))}
              >
                <View style={[styles.legendDot, { backgroundColor: AppColors.accentOrange }]} />
                <Text style={[styles.legendLabel, { color: colors.onSurface }]}>
                  Paths cross
                </Text>
              </Pressable>
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
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
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
    paddingBottom: 4,
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
  storyRow: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  storyLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  storyText: {
    fontSize: 13,
    fontWeight: "600",
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
    paddingTop: 14,
    paddingBottom: 4,
    gap: 20,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  legendItemActive: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
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
