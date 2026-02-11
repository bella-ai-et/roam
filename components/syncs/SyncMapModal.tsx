import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAppTheme, AppColors } from "@/lib/theme";
import { SYNC_STATUS_CONFIG } from "@/lib/constants";
import { hapticButtonPress } from "@/lib/haptics";
import {
  buildMapData,
  fitCameraToBounds,
  findSharedStops,
  findCrossingPoints,
  adaptiveRadius,
  MODAL_MAP_STYLE,
  MAP_COLORS,
  MapErrorBoundary,
  type RouteStop,
  type Coordinates,
  type SharedStop,
} from "@/components/discovery/mapUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getGoogleMaps(): typeof import("expo-maps").GoogleMaps | undefined {
  if (Platform.OS !== "android") return undefined;
  try {
    return require("expo-maps").GoogleMaps;
  } catch {
    return undefined;
  }
}

function isRemoteUrl(value?: string) {
  if (!value) return false;
  return value.trim().startsWith("http://") || value.trim().startsWith("https://");
}

function normalizePhotoValue(value?: string) {
  if (!value) return undefined;
  return value.replace(/`/g, "").trim();
}

const STATUS_PIN_COLORS: Record<string, string> = {
  same_stop: MAP_COLORS.sharedStop,
  syncing: MAP_COLORS.theirRoute,
  crossing: MAP_COLORS.crossing,
  departed: "#94A3B8",
  none: "#94A3B8",
};

type SyncPin = {
  matchId: string;
  otherUser: {
    _id: string;
    name: string;
    photos: string[];
    vanType?: string;
    currentRoute?: RouteStop[];
  };
  syncStatus: string;
  syncLocation: string;
};

type SelectedPin = SyncPin & { position: Coordinates };

interface SyncMapModalProps {
  visible: boolean;
  onClose: () => void;
}

function PinCard({
  pin,
  onMessage,
  onClose,
  colors,
}: {
  pin: SelectedPin;
  onMessage: () => void;
  onClose: () => void;
  colors: any;
}) {
  const normalized = normalizePhotoValue(pin.otherUser.photos?.[0]);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );
  const imageUri = remote ? normalized : photoUrl;
  const statusConfig = SYNC_STATUS_CONFIG[pin.syncStatus];

  return (
    <View style={[styles.pinCard, { backgroundColor: colors.background }]}>
      <Pressable onPress={onClose} hitSlop={8} style={styles.pinCardClose}>
        <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
      </Pressable>
      <View style={styles.pinCardRow}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.pinCardAvatar} contentFit="cover" />
        ) : (
          <View style={[styles.pinCardAvatar, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.pinCardInitials, { color: colors.onPrimaryContainer }]}>
              {pin.otherUser.name?.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.pinCardInfo}>
          <Text style={[styles.pinCardName, { color: colors.onBackground }]} numberOfLines={1}>
            {pin.otherUser.name}
          </Text>
          {statusConfig && pin.syncStatus !== "none" && (
            <View style={[styles.pinCardBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon as any} size={10} color={statusConfig.textColor} />
              <Text style={[styles.pinCardBadgeText, { color: statusConfig.textColor }]}>
                {pin.syncLocation || pin.syncStatus.replace("_", " ")}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={onMessage}
          style={[styles.pinCardMessageBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="chatbubble" size={16} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

export function SyncMapModal({ visible, onClose }: SyncMapModalProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useCurrentUser();

  const mapData = useQuery(
    api.syncs.getSyncMapData,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const [selectedPin, setSelectedPin] = useState<SelectedPin | null>(null);

  const GMaps = getGoogleMaps();

  const myRouteData = useMemo(
    () => (mapData?.myRoute ? buildMapData(mapData.myRoute as RouteStop[]) : null),
    [mapData?.myRoute]
  );

  // Collect all coordinates for camera fitting
  const allCoords = useMemo(() => {
    const coords: Coordinates[] = [];
    if (myRouteData) coords.push(...myRouteData.polylineCoords);
    for (const pin of (mapData?.pins ?? []) as SyncPin[]) {
      const route = pin.otherUser.currentRoute;
      if (route?.length) {
        const sorted = [...route].sort(
          (a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
        );
        // Just use first stop as the pin position
        coords.push({
          latitude: sorted[0].location.latitude,
          longitude: sorted[0].location.longitude,
        });
      }
    }
    return coords;
  }, [myRouteData, mapData?.pins]);

  const camera = useMemo(() => fitCameraToBounds(allCoords), [allCoords]);

  // Build polylines (my route + each match's route)
  const polylines = useMemo(() => {
    const lines: any[] = [];
    if (myRouteData) {
      lines.push({
        id: "my-route",
        coordinates: myRouteData.polylineCoords,
        color: MAP_COLORS.myRoute,
        width: 6,
      });
    }
    for (const pin of (mapData?.pins ?? []) as SyncPin[]) {
      const rd = pin.otherUser.currentRoute
        ? buildMapData(pin.otherUser.currentRoute as RouteStop[])
        : null;
      if (rd) {
        lines.push({
          id: `route-${pin.matchId}`,
          coordinates: rd.polylineCoords,
          color: MAP_COLORS.theirRoute,
          width: 4,
        });
      }
    }
    return lines;
  }, [myRouteData, mapData?.pins]);

  // Shared stops & crossings across all matches
  const { allSharedStops, allCrossings, allMatchCircles } = useMemo(() => {
    const shared: SharedStop[] = [];
    const crossings: Coordinates[] = [];
    const myRoute = mapData?.myRoute as RouteStop[] | undefined;
    const myRdLocal = myRouteData;

    for (const pin of (mapData?.pins ?? []) as SyncPin[]) {
      const theirRoute = pin.otherUser.currentRoute as RouteStop[] | undefined;
      if (!myRoute?.length || !theirRoute?.length) continue;

      shared.push(...findSharedStops(myRoute, theirRoute));

      const theirRd = buildMapData(theirRoute);
      if (myRdLocal && theirRd) {
        crossings.push(...findCrossingPoints(myRdLocal.polylineCoords, theirRd.polylineCoords));
      }
    }

    const radius = adaptiveRadius(allCoords);
    const circles: any[] = [];
    shared.forEach((s, i) => {
      circles.push({
        id: `shared-circle-${i}`,
        coordinates: s.coordinate,
        radius: radius * 1.5,
        color: MAP_COLORS.sharedStopFill,
        strokeColor: MAP_COLORS.sharedStop,
        strokeWidth: 2,
      });
    });
    crossings.forEach((pt, i) => {
      circles.push({
        id: `crossing-circle-${i}`,
        coordinates: pt,
        radius: radius * 1.0,
        color: MAP_COLORS.crossingFill,
        strokeColor: MAP_COLORS.crossing,
        strokeWidth: 2,
      });
    });

    // Origin/destination glow circles for my route
    if (myRdLocal) {
      circles.push({
        id: "my-origin-glow",
        coordinates: { latitude: myRdLocal.origin.latitude, longitude: myRdLocal.origin.longitude },
        radius: radius * 0.9,
        color: "rgba(8,145,178,0.22)",
        strokeColor: MAP_COLORS.myRoute,
        strokeWidth: 2,
      });
      circles.push({
        id: "my-dest-glow",
        coordinates: { latitude: myRdLocal.destination.latitude, longitude: myRdLocal.destination.longitude },
        radius: radius * 0.9,
        color: "transparent",
        strokeColor: MAP_COLORS.myRoute,
        strokeWidth: 2,
      });
    }

    return { allSharedStops: shared, allCrossings: crossings, allMatchCircles: circles };
  }, [mapData, myRouteData, allCoords]);

  // Build markers: my stops + each match's current stop + shared stops
  const markers = useMemo(() => {
    const m: any[] = [];

    // My stops along my route — with clear "You" prefix
    const myRoute = mapData?.myRoute as RouteStop[] | undefined;
    if (myRoute?.length) {
      const sorted = [...myRoute].sort(
        (a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
      );
      sorted.forEach((stop, i) => {
        const label = i === 0 ? "Start" : i === sorted.length - 1 ? "End" : `Stop ${i}`;
        m.push({
          id: `my-stop-${i}`,
          coordinates: { latitude: stop.location.latitude, longitude: stop.location.longitude },
          title: `You (${label}): ${stop.location.name}`,
          tintColor: MAP_COLORS.myRoute,
        });
      });
    }

    // Each match's current/first stop — with person's name
    for (const pin of (mapData?.pins ?? []) as SyncPin[]) {
      const route = pin.otherUser.currentRoute;
      if (!route?.length) continue;
      const sorted = [...route].sort(
        (a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
      );
      const currentStop = sorted.find((s) => {
        const arr = new Date(s.arrivalDate).getTime();
        const dep = new Date(s.departureDate).getTime();
        const now = Date.now();
        return arr <= now && dep >= now;
      }) ?? sorted[0];

      m.push({
        id: `pin-${pin.matchId}`,
        coordinates: {
          latitude: currentStop.location.latitude,
          longitude: currentStop.location.longitude,
        },
        title: `${pin.otherUser.name}: ${currentStop.location.name}`,
        tintColor: STATUS_PIN_COLORS[pin.syncStatus] ?? MAP_COLORS.theirRoute,
      });
    }

    // Shared stop markers (amber, prominent)
    allSharedStops.forEach((s, i) => {
      m.push({
        id: `shared-marker-${i}`,
        coordinates: s.coordinate,
        title: `Shared: ${s.myStopName === s.theirStopName ? s.myStopName : `${s.myStopName} / ${s.theirStopName}`}`,
        tintColor: MAP_COLORS.sharedStop,
      });
    });

    return m;
  }, [mapData, allSharedStops]);

  const handleMarkerPress = useCallback(
    (markerId: string) => {
      const matchId = markerId.replace("pin-", "");
      const pin = (mapData?.pins as SyncPin[] | undefined)?.find((p) => p.matchId === matchId);
      if (!pin) return;

      const route = pin.otherUser.currentRoute;
      if (!route?.length) return;
      const sorted = [...route].sort(
        (a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
      );
      const currentStop = sorted.find((s) => {
        const arr = new Date(s.arrivalDate).getTime();
        const dep = new Date(s.departureDate).getTime();
        const now = Date.now();
        return arr <= now && dep >= now;
      }) ?? sorted[0];

      setSelectedPin({
        ...pin,
        position: {
          latitude: currentStop.location.latitude,
          longitude: currentStop.location.longitude,
        },
      });
    },
    [mapData?.pins]
  );

  const navigateToChat = useCallback(
    (matchId: string) => {
      hapticButtonPress();
      onClose();
      setTimeout(() => {
        router.push(`/(app)/chat/${matchId}` as never);
      }, 300);
    },
    [router, onClose]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Map */}
        {GMaps ? (
          <MapErrorBoundary
            fallback={
              <View style={[styles.fallback, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="map-outline" size={48} color={colors.onSurfaceVariant} />
                <Text style={[styles.fallbackText, { color: colors.onSurfaceVariant }]}>
                  Map unavailable
                </Text>
              </View>
            }
          >
            <GMaps.View
              style={StyleSheet.absoluteFill}
              cameraPosition={{
                coordinates: camera.center,
                zoom: Math.max(camera.zoom - 0.5, 2),
              }}
              uiSettings={{
                scrollGesturesEnabled: true,
                zoomGesturesEnabled: true,
                rotationGesturesEnabled: true,
                tiltGesturesEnabled: false,
                compassEnabled: false,
                myLocationButtonEnabled: false,
                mapToolbarEnabled: false,
                zoomControlsEnabled: false,
              }}
              properties={{
                mapStyleOptions: { json: MODAL_MAP_STYLE },
                isMyLocationEnabled: false,
                isTrafficEnabled: false,
                isBuildingEnabled: false,
                isIndoorEnabled: false,
              }}
              polylines={polylines}
              markers={markers}
              circles={allMatchCircles}
              onMarkerClick={(event: any) => {
                const id = event?.id ?? event?.nativeEvent?.id;
                if (id) handleMarkerPress(id);
              }}
            />
          </MapErrorBoundary>
        ) : (
          <View style={[styles.fallback, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="map-outline" size={48} color={colors.onSurfaceVariant} />
            <Text style={[styles.fallbackText, { color: colors.onSurfaceVariant }]}>
              Map unavailable on this platform
            </Text>
          </View>
        )}

        {/* Header overlay */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={onClose}
            style={[
              styles.headerBtn,
              {
                backgroundColor: isDark ? "rgba(18,18,18,0.85)" : "rgba(255,255,255,0.9)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.onBackground} />
          </Pressable>
          <View
            style={[
              styles.headerTitle,
              {
                backgroundColor: isDark ? "rgba(18,18,18,0.85)" : "rgba(255,255,255,0.9)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              },
            ]}
          >
            <Text style={[styles.headerTitleText, { color: colors.onBackground }]}>
              Sync Map
            </Text>
            <Text style={[styles.headerSubtext, { color: colors.onSurfaceVariant }]}>
              {(mapData?.pins as SyncPin[] | undefined)?.length ?? 0} matches
            </Text>
          </View>
        </View>

        {/* Legend with route descriptions */}
        <View
          style={[
            styles.legend,
            {
              bottom: insets.bottom + 16,
              backgroundColor: isDark ? "rgba(18,18,18,0.9)" : "rgba(255,255,255,0.92)",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          {myRouteData && (
            <View style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: MAP_COLORS.myRoute }]} />
              <Text style={[styles.legendText, { color: colors.onBackground }]} numberOfLines={1}>
                You: {myRouteData.origin.name} → {myRouteData.destination.name}
              </Text>
            </View>
          )}
          <View style={styles.legendRow}>
            <View style={[styles.legendLine, { backgroundColor: MAP_COLORS.theirRoute }]} />
            <Text style={[styles.legendText, { color: colors.onBackground }]}>
              Matches ({(mapData?.pins as SyncPin[] | undefined)?.length ?? 0})
            </Text>
          </View>
          {allSharedStops.length > 0 && (
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: MAP_COLORS.sharedStop }]} />
              <Text style={[styles.legendText, { color: colors.onBackground }]}>Same Stop</Text>
            </View>
          )}
          {allCrossings.length > 0 && (
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: MAP_COLORS.crossing }]} />
              <Text style={[styles.legendText, { color: colors.onBackground }]}>Crossing</Text>
            </View>
          )}
        </View>

        {/* Selected pin card */}
        {selectedPin && (
          <View style={[styles.pinCardWrapper, { bottom: insets.bottom + 80 }]}>
            <PinCard
              pin={selectedPin}
              colors={colors}
              onClose={() => setSelectedPin(null)}
              onMessage={() => navigateToChat(selectedPin.matchId)}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  fallbackText: {
    fontSize: 15,
    fontWeight: "600",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: "800",
  },
  headerSubtext: {
    fontSize: 12,
    fontWeight: "600",
  },
  legend: {
    position: "absolute",
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLine: {
    width: 18,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pinCardWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  pinCard: {
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  pinCardClose: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 4,
  },
  pinCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pinCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pinCardInitials: {
    fontSize: 15,
    fontWeight: "700",
  },
  pinCardInfo: {
    flex: 1,
    gap: 4,
  },
  pinCardName: {
    fontSize: 15,
    fontWeight: "700",
  },
  pinCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 50,
    gap: 4,
  },
  pinCardBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  pinCardMessageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
