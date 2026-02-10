import React, { useMemo, useState } from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme, AppColors } from "@/lib/theme";
import { MINI_MAP_SIZE } from "@/lib/constants";
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

interface MiniRouteMapProps {
  /** The other person's route stops */
  route?: RouteStop[];
  /** Whether this is the top card in the stack (only top card gets real map) */
  isTopCard?: boolean;
  onExpand?: () => void;
}

/** Static fallback visual when real map isn't available */
function Placeholder({ surfaceColor }: { surfaceColor: string }) {
  return (
    <>
      <View style={[styles.placeholder, { backgroundColor: surfaceColor }]} />
      <View style={styles.pathLine}>
        <View style={[styles.pathSegment, { backgroundColor: AppColors.primary, opacity: 0.9 }]} />
        <View style={[styles.pathSegment, styles.pathSegment2, { backgroundColor: AppColors.primary, opacity: 0.6 }]} />
        <View style={[styles.pathSegment, styles.pathSegment3, { backgroundColor: AppColors.primary, opacity: 0.9 }]} />
      </View>
    </>
  );
}

/**
 * Small route map widget for the discovery card.
 * Shows a real GoogleMaps.View when route data is available and this is the top card.
 * Falls back to a placeholder visual otherwise.
 */
export function MiniRouteMap({ route, isTopCard = false, onExpand }: MiniRouteMapProps) {
  const { colors, isDark } = useAppTheme();
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapData = useMemo(() => (route ? buildMapData(route) : null), [route]);
  const camera = useMemo(
    () => (mapData ? fitCameraToBounds(mapData.polylineCoords) : null),
    [mapData]
  );

  // Lazy-load: only resolve the native module when we actually need to render a map
  const GMaps = isTopCard && mapData && camera ? getGoogleMaps() : undefined;

  return (
    <View style={[styles.container, { borderColor: colors.surface }]}>
      {GMaps && mapData && camera ? (
        <MapErrorBoundary
          fallback={<Placeholder surfaceColor={colors.surfaceVariant} />}
        >
          {/* pointerEvents="none" prevents the native map from swallowing touches */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <GMaps.View
              style={StyleSheet.absoluteFill}
              cameraPosition={{
                coordinates: camera.center,
                zoom: Math.max(camera.zoom - 1, 2),
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
                  width: 3,
                },
              ]}
              markers={[
                {
                  id: "origin",
                  coordinates: {
                    latitude: mapData.origin.latitude,
                    longitude: mapData.origin.longitude,
                  },
                },
                {
                  id: "destination",
                  coordinates: {
                    latitude: mapData.destination.latitude,
                    longitude: mapData.destination.longitude,
                  },
                },
              ]}
              onMapLoaded={() => setMapLoaded(true)}
            />
          </View>
        </MapErrorBoundary>
      ) : (
        <Placeholder surfaceColor={colors.surfaceVariant} />
      )}

      {/* Transparent overlay captures taps reliably — sits above the native map */}
      {onExpand && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onExpand}
        >
          <View style={[styles.expandButton, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
            <Ionicons name="expand-outline" size={14} color="#fff" />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: MINI_MAP_SIZE,
    height: MINI_MAP_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  pathLine: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
  },
  pathSegment: {
    position: "absolute",
    height: 2,
    borderRadius: 1,
    width: "40%",
    top: "70%",
    left: "10%",
    transform: [{ rotate: "-30deg" }],
  },
  pathSegment2: {
    width: "35%",
    top: "45%",
    left: "35%",
    transform: [{ rotate: "10deg" }],
  },
  pathSegment3: {
    width: "30%",
    top: "20%",
    left: "60%",
    transform: [{ rotate: "-20deg" }],
  },
  expandButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    padding: 4,
    borderRadius: 6,
  },
});
