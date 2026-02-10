import React from "react";
import { AppColors } from "@/lib/theme";

/* ─── Types ─── */

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type RouteStop = {
  location: { latitude: number; longitude: number; name: string };
  arrivalDate: string;
  departureDate: string;
  status?: string;
  notes?: string;
  role?: string;
};

export type MapRouteData = {
  origin: { latitude: number; longitude: number; name: string };
  destination: { latitude: number; longitude: number; name: string };
  polylineCoords: Coordinates[];
};

export type Overlap = {
  locationName: string;
  dateRange: { start: string; end: string };
  distance: number;
};

/* ─── Data transforms ─── */

/**
 * Extract origin, destination, and ordered polyline coordinates from a route.
 * Returns null if the route has fewer than 2 stops.
 */
export function buildMapData(route: RouteStop[]): MapRouteData | null {
  if (!route || route.length === 0) return null;

  const sorted = [...route].sort(
    (a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
  );

  const originStop = sorted.find((s) => s.role === "origin") ?? sorted[0];
  const destinationStop = sorted.find((s) => s.role === "destination") ?? sorted[sorted.length - 1];

  // If only 1 stop, duplicate it so we still have a valid line
  const polylineCoords: Coordinates[] = sorted.map((s) => ({
    latitude: s.location.latitude,
    longitude: s.location.longitude,
  }));

  return {
    origin: {
      latitude: originStop.location.latitude,
      longitude: originStop.location.longitude,
      name: originStop.location.name,
    },
    destination: {
      latitude: destinationStop.location.latitude,
      longitude: destinationStop.location.longitude,
      name: destinationStop.location.name,
    },
    polylineCoords,
  };
}

/**
 * Compute a camera center + zoom that fits all provided coordinate arrays.
 * Returns { latitude, longitude } center and a zoom level.
 */
export function fitCameraToBounds(
  ...coordArrays: Coordinates[][]
): { center: Coordinates; zoom: number } {
  const all = coordArrays.flat();
  if (all.length === 0) {
    return { center: { latitude: 25, longitude: 55 }, zoom: 5 };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const c of all) {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLng) minLng = c.longitude;
    if (c.longitude > maxLng) maxLng = c.longitude;
  }

  const center: Coordinates = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
  };

  // Approximate zoom from the coordinate span
  const latDelta = maxLat - minLat;
  const lngDelta = maxLng - minLng;
  const maxDelta = Math.max(latDelta, lngDelta, 0.01); // avoid 0

  // Rough mapping: delta → zoom (tuned for small embedded maps)
  let zoom: number;
  if (maxDelta > 40) zoom = 2;
  else if (maxDelta > 20) zoom = 3;
  else if (maxDelta > 10) zoom = 4;
  else if (maxDelta > 5) zoom = 5;
  else if (maxDelta > 2) zoom = 6;
  else if (maxDelta > 1) zoom = 7;
  else if (maxDelta > 0.5) zoom = 8;
  else if (maxDelta > 0.2) zoom = 9;
  else if (maxDelta > 0.1) zoom = 10;
  else zoom = 11;

  return { center, zoom };
}

/**
 * Find the midpoint of the first overlap for circle visualization.
 * Uses the overlap's location name to find matching stops, or falls back
 * to the midpoint between the two closest stops across both routes.
 */
export function getOverlapCenter(
  myRoute: RouteStop[],
  theirRoute: RouteStop[],
  overlap: Overlap
): Coordinates | null {
  if (!overlap) return null;

  const overlapNameLower = overlap.locationName.toLowerCase();

  // Try to find the matching stop in either route
  const myMatch = myRoute.find(
    (s) => s.location.name.toLowerCase().includes(overlapNameLower) ||
           overlapNameLower.includes(s.location.name.toLowerCase())
  );
  const theirMatch = theirRoute.find(
    (s) => s.location.name.toLowerCase().includes(overlapNameLower) ||
           overlapNameLower.includes(s.location.name.toLowerCase())
  );

  if (myMatch && theirMatch) {
    return {
      latitude: (myMatch.location.latitude + theirMatch.location.latitude) / 2,
      longitude: (myMatch.location.longitude + theirMatch.location.longitude) / 2,
    };
  }

  if (myMatch) {
    return { latitude: myMatch.location.latitude, longitude: myMatch.location.longitude };
  }

  if (theirMatch) {
    return { latitude: theirMatch.location.latitude, longitude: theirMatch.location.longitude };
  }

  return null;
}

/**
 * Get the radius (in meters) for the overlap circle based on the overlap distance.
 * Minimum 20km radius for visibility, capped at 80km.
 */
export function getOverlapRadius(distanceKm: number): number {
  const base = Math.max(distanceKm, 20);
  return Math.min(base, 80) * 1000; // convert to meters
}

/* ─── Map style constants ─── */

/** Warm earthy style for the mini map widget (no roads, no POI — clean canvas) */
export const MINI_MAP_STYLE = JSON.stringify([
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#d4c5b5" }, { visibility: "on" }] },
  { featureType: "water", stylers: [{ color: "#c8dbd5" }] },
  { featureType: "landscape", stylers: [{ color: "#f5ede3" }] },
  { featureType: "landscape.natural.terrain", stylers: [{ color: "#e8ddd0" }] },
]);

/** Warm earthy style for the modal map — roads visible, no POI */
export const MODAL_MAP_STYLE = JSON.stringify([
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#e8ddd0" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9e8e7e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#d4b5a0" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#9e8e7e" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#c4b5a5" }] },
  { featureType: "water", stylers: [{ color: "#c8dbd5" }] },
  { featureType: "landscape", stylers: [{ color: "#f5ede3" }] },
  { featureType: "landscape.natural.terrain", stylers: [{ color: "#e8ddd0" }] },
]);

/* ─── Color constants for map elements ─── */

export const MAP_COLORS = {
  theirRoute: AppColors.primary,         // #D27C5C terracotta
  myRoute: AppColors.accentTeal,         // #5C9D9B teal
  overlapFill: "rgba(232,155,116,0.20)", // accentOrange at 20%
  overlapStroke: AppColors.accentOrange,  // #E89B74
} as const;

/* ─── Error boundary for native map views ─── */

interface MapErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
}

export class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("[MapErrorBoundary] Map render failed:", error.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
