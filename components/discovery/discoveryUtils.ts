import { format, parseISO } from "date-fns";
import type { JourneyStopItem } from "./JourneyStopsTimeline";

type RouteStop = {
  location: { latitude: number; longitude: number; name: string };
  arrivalDate: string;
  departureDate: string;
};

type Overlap = {
  locationName: string;
  dateRange: { start: string; end: string };
  distance: number;
};

export type RouteMatchForStops = {
  user: { currentRoute?: RouteStop[] };
  overlaps: Overlap[];
};

/**
 * Build ordered journey stops from a route match for the timeline.
 * Marks the stop that matches the primary overlap (by location name) as type "overlap".
 */
export function buildJourneyStops(match: RouteMatchForStops): JourneyStopItem[] {
  const route = match.user.currentRoute ?? [];
  if (route.length === 0) return [];

  const sorted = [...route].sort(
    (a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
  );
  const overlap = match.overlaps[0];
  const overlapLocationLower = overlap?.locationName?.toLowerCase() ?? "";

  return sorted.map((stop, index) => {
    const isFirst = index === 0;
    const isLast = index === sorted.length - 1;
    const stopNameLower = stop.location.name?.toLowerCase() ?? "";
    const isOverlap =
      !!overlap &&
      (stopNameLower === overlapLocationLower ||
        overlapLocationLower.includes(stopNameLower) ||
        stopNameLower.includes(overlapLocationLower));

    let type: JourneyStopItem["type"] = "stop";
    if (isFirst) type = "start";
    else if (isLast) type = "destination";
    else if (isOverlap) type = "overlap";

    let subLabel: string;
    if (isFirst) subLabel = "Origin";
    else if (isLast) subLabel = "Destination";
    else {
      try {
        subLabel = format(parseISO(stop.arrivalDate), "MMM d");
      } catch {
        subLabel = stop.arrivalDate;
      }
    }

    let dateLabel = "";
    try {
      dateLabel = format(parseISO(stop.arrivalDate), "MMM d");
    } catch {
      dateLabel = stop.arrivalDate;
    }

    return {
      type,
      locationName: stop.location.name || "Unknown",
      dateLabel,
      subLabel,
    };
  });
}
