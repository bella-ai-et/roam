import React, { useMemo, useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme, AppColors } from "@/lib/theme";
import { MINI_MAP_SIZE } from "@/lib/constants";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
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
 * Features a pulsing glow border and frosted "Route" chip.
 */
export function MiniRouteMap({ route, isTopCard = false, onExpand }: MiniRouteMapProps) {
  const { colors, isDark } = useAppTheme();
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapData = useMemo(() => (route ? buildMapData(route) : null), [route]);
  const camera = useMemo(
    () => (mapData ? fitCameraToBounds(mapData.polylineCoords) : null),
    [mapData]
  );

  // Defer real map mount so it doesn't compete with the card transition animation.
  // Always start unmounted — setTimeout gives a reliable delay since Reanimated
  // animations run on the UI thread and don't register with InteractionManager.
  const [mapReady, setMapReady] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  useEffect(() => {
    if (isTopCard && !mapReady) {
      const timer = setTimeout(() => {
        if (mountedRef.current) setMapReady(true);
      }, 500);
      return () => clearTimeout(timer);
    } else if (!isTopCard) {
      setMapReady(false);
      setMapLoaded(false);
    }
  }, [isTopCard]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy-load: only resolve the native module when we actually need to render a map
  const GMaps = mapReady && mapData && camera ? getGoogleMaps() : undefined;
  const showRealMap = !!(GMaps && mapData && camera);

  // Pulsing glow animation for the border
  const glowOpacity = useSharedValue(0.4);
  useEffect(() => {
    if (showRealMap && onExpand) {
      glowOpacity.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [showRealMap, !!onExpand]);

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(210,124,92,${glowOpacity.value * 0.7})`,
    shadowOpacity: glowOpacity.value * 0.5,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          shadowColor: AppColors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 8,
          elevation: 6,
        },
        showRealMap && onExpand ? glowStyle : { borderColor: colors.surface },
      ]}
    >
      {showRealMap ? (
        <Animated.View entering={FadeIn.duration(400)} style={StyleSheet.absoluteFill}>
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

          {/* Soft vignette overlay — gives a "window into the journey" feel */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={["rgba(0,0,0,0.15)", "transparent", "transparent", "rgba(0,0,0,0.2)"]}
              locations={[0, 0.25, 0.7, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </MapErrorBoundary>
        {/* Keep placeholder visible until map has fully loaded */}
        {!mapLoaded && <Placeholder surfaceColor={colors.surfaceVariant} />}
        </Animated.View>
      ) : (
        <Placeholder surfaceColor={colors.surfaceVariant} />
      )}

      {/* Transparent overlay captures taps reliably — sits above the native map */}
      {onExpand && (
        <Pressable style={StyleSheet.absoluteFill} onPress={onExpand}>
          {/* Frosted "Route" chip — replaces generic expand icon */}
          <View style={styles.routeChip}>
            <Text style={styles.routeChipText}>Route ↗</Text>
          </View>
        </Pressable>
      )}
    </Animated.View>
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
  routeChip: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  routeChipText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
