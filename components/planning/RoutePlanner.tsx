import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { format, parse, addDays } from "date-fns";
import { useMutation } from "convex/react";

import { GlassHeader, GlassButton, GlassInput, GlassDatePicker, GlassOption } from "@/components/glass";
import { useAppTheme, AppColors } from "@/lib/theme";
import { hapticSelection, hapticSuccess, hapticError } from "@/lib/haptics";
import { AdaptiveGlassView } from "@/lib/glass";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { FREE_PLAN, PRO_PLAN } from "@/lib/constants";

type RouteStop = NonNullable<Doc<"users">["currentRoute"]>[number];
type RouteIntent = "planned" | "preference";
type DestinationType = "commute" | "visit" | "work" | "seasonal" | "adventure";
type StopRole = "origin" | "stop" | "destination";

const routeIntentOptions: {
  value: RouteIntent;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: "planned",
    label: "Planned trip",
    emoji: "🧭",
    description: "You have dates and a clear travel plan.",
  },
  {
    value: "preference",
    label: "Preference",
    emoji: "🌤️",
    description: "Flexible, aspirational, or open-ended.",
  },
];

const destinationTypeOptions: {
  value: DestinationType;
  label: string;
  emoji: string;
  description: string;
}[] = [
  { value: "commute", label: "Commute", emoji: "🚗", description: "Regular travel between places." },
  { value: "visit", label: "Visit", emoji: "🏠", description: "Friends, family, or familiar stops." },
  { value: "work", label: "Work", emoji: "💼", description: "Projects, clients, or gigs." },
  { value: "seasonal", label: "Seasonal stay", emoji: "🌲", description: "A longer seasonal base." },
  { value: "adventure", label: "Adventure", emoji: "🏕️", description: "Exploring or new territory." },
];

interface RoutePlannerProps {
  onComplete: () => void;
  onBack?: () => void;
  isPro: boolean;
  /** Optional title override */
  title?: string;
  /** Show paywall when user hits a Pro limit */
  onShowPaywall?: (message: string) => void;
}

export function RoutePlanner({
  onComplete,
  onBack,
  isPro,
  title = "Your Route",
  onShowPaywall,
}: RoutePlannerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const updateRoute = useMutation(api.users.updateRoute);

  const limits = isPro ? PRO_PLAN : FREE_PLAN;
  const maxDate = addDays(new Date(), limits.maxRouteDays);

  const existingStops = useMemo(() => currentUser?.currentRoute || [], [currentUser]);

  const [originName, setOriginName] = useState("");
  const [originCoords, setOriginCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [originArrival, setOriginArrival] = useState<Date | undefined>();
  const [originDeparture, setOriginDeparture] = useState<Date | undefined>();

  const [destinationName, setDestinationName] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationArrival, setDestinationArrival] = useState<Date | undefined>();
  const [destinationDeparture, setDestinationDeparture] = useState<Date | undefined>();

  const [routeIntent, setRouteIntent] = useState<RouteIntent | "">("");
  const [destinationType, setDestinationType] = useState<DestinationType | "">("");
  const [extraStops, setExtraStops] = useState<RouteStop[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showOriginSection, setShowOriginSection] = useState(false);

  useEffect(() => {
    if (!routeIntent) setRouteIntent("planned");
    if (!destinationType) setDestinationType("adventure");
  }, [destinationType, routeIntent]);

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newArrival, setNewArrival] = useState<Date | undefined>();
  const [newDeparture, setNewDeparture] = useState<Date | undefined>();
  const [addingStop, setAddingStop] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);

  useEffect(() => {
    if (existingStops.length === 0) return;

    const parseRouteDate = (value?: string) => {
      if (!value) return undefined;
      const parsed = parse(value, "MM/dd/yyyy", new Date());
      if (Number.isNaN(parsed.getTime())) return undefined;
      return parsed;
    };

    let originStop = existingStops.find((stop) => stop.role === "origin");
    let destinationStop = existingStops.find((stop) => stop.role === "destination");
    const remainingStops = existingStops.filter((stop) => stop !== originStop && stop !== destinationStop);

    if (!originStop && existingStops.length > 1) {
      originStop = existingStops[0];
    }

    if (!destinationStop && existingStops.length > 0) {
      destinationStop = existingStops[existingStops.length - 1];
    }

    if (originStop && destinationStop && originStop === destinationStop) {
      originStop = undefined;
    }

    if (originStop) {
      setOriginName(originStop.location.name);
      setOriginCoords({
        latitude: originStop.location.latitude,
        longitude: originStop.location.longitude,
      });
      setOriginArrival(parseRouteDate(originStop.arrivalDate));
      setOriginDeparture(parseRouteDate(originStop.departureDate));
      setShowOriginSection(true);
    }

    if (destinationStop) {
      setDestinationName(destinationStop.location.name);
      setDestinationCoords({
        latitude: destinationStop.location.latitude,
        longitude: destinationStop.location.longitude,
      });
      setDestinationArrival(parseRouteDate(destinationStop.arrivalDate));
      setDestinationDeparture(parseRouteDate(destinationStop.departureDate));
      if (destinationStop.intent === "planned" || destinationStop.intent === "preference") {
        setRouteIntent(destinationStop.intent);
      }
      if (
        destinationStop.destinationType === "commute" ||
        destinationStop.destinationType === "visit" ||
        destinationStop.destinationType === "work" ||
        destinationStop.destinationType === "seasonal" ||
        destinationStop.destinationType === "adventure"
      ) {
        setDestinationType(destinationStop.destinationType);
      }
    }

    setExtraStops(remainingStops);
  }, [existingStops]);

  const geocodeLocation = async (name: string) => {
    try {
      const results = await Location.geocodeAsync(name);
      if (results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }
    } catch (error) {
      console.log("Geocoding failed", error);
    }
    return { latitude: 0, longitude: 0 };
  };

  const formatReverseGeocode = (
    item: Location.LocationGeocodedAddress,
    fallback: string
  ) => {
    const rawParts = [
      item.name,
      item.street,
      item.district,
      item.subregion,
      item.city,
      item.region,
    ].filter(Boolean);
    const uniqueParts: string[] = [];
    rawParts.forEach((part) => {
      if (!uniqueParts.includes(part as string)) {
        uniqueParts.push(part as string);
      }
    });
    if (uniqueParts.length > 0) {
      return uniqueParts.join(", ");
    }
    return item.country || fallback;
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      let locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode.length > 0) {
          locationName = formatReverseGeocode(reverseGeocode[0], locationName);
        }
      } catch (error) {
        console.log("Reverse geocoding failed", error);
      }

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      setOriginName(locationName);
      setOriginCoords({ latitude, longitude });
      setOriginArrival((prev) => prev ?? today);
      setOriginDeparture((prev) => prev ?? nextWeek);
      hapticSuccess();
    } catch (error) {
      console.log("Error getting location", error);
      Alert.alert("Could not get current location");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleAddStop = async () => {
    if (!newLocationName || !newArrival || !newDeparture) {
      hapticError();
      return;
    }

    // Pro gate: check stopover limit
    if (!isPro && extraStops.length >= limits.maxStopovers) {
      hapticError();
      if (onShowPaywall) {
        onShowPaywall("Unlock unlimited stopovers with Pro");
      } else {
        Alert.alert("Stopover Limit", "Upgrade to Pro to add more stopovers.");
      }
      return;
    }

    setAddingStop(true);
    const trimmedName = newLocationName.trim();
    const coords = await geocodeLocation(trimmedName);

    const newStop: RouteStop = {
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: trimmedName,
      },
      arrivalDate: format(newArrival, "MM/dd/yyyy"),
      departureDate: format(newDeparture, "MM/dd/yyyy"),
      role: "stop",
    };

    setExtraStops((prev) => [...prev, newStop]);
    setNewLocationName("");
    setNewArrival(undefined);
    setNewDeparture(undefined);
    setShowAddForm(false);
    setAddingStop(false);
    hapticSuccess();
  };

  const removeStop = (index: number) => {
    setExtraStops((prev) => prev.filter((_, idx) => idx !== index));
    hapticSelection();
  };

  const buildStop = async ({
    name,
    coords,
    arrival,
    departure,
    role,
    intent,
    destinationType: destinationKind,
  }: {
    name: string;
    coords: { latitude: number; longitude: number } | null;
    arrival: Date | undefined;
    departure: Date | undefined;
    role: StopRole;
    intent?: RouteIntent;
    destinationType?: DestinationType;
  }) => {
    const trimmedName = name.trim();
    if (!trimmedName || !arrival || !departure) return null;
    const resolved = coords ?? (await geocodeLocation(trimmedName));
    return {
      location: {
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        name: trimmedName,
      },
      arrivalDate: format(arrival, "MM/dd/yyyy"),
      departureDate: format(departure, "MM/dd/yyyy"),
      role,
      intent,
      destinationType: destinationKind,
    };
  };

  // Pro gate: enforce date limit
  const enforceDateLimit = (date: Date | undefined, setter: (d: Date | undefined) => void) => {
    if (!date) return;
    if (date > maxDate && !isPro) {
      hapticError();
      if (onShowPaywall) {
        onShowPaywall("Plan further ahead with Pro");
      } else {
        Alert.alert("Date Limit", `Free plan allows planning up to ${limits.maxRouteDays} days ahead. Upgrade to Pro for longer planning.`);
      }
      setter(maxDate);
      return;
    }
    setter(date);
  };

  const handleContinue = async () => {
    const issues: string[] = [];
    const trimmedOrigin = originName.trim();
    const trimmedDestination = destinationName.trim();

    if (!trimmedDestination) {
      issues.push("Add the destination you actually want to go to.");
    }

    if (!destinationArrival || !destinationDeparture) {
      issues.push("Add arrival and departure dates for the destination.");
    }

    if ((originArrival || originDeparture) && !trimmedOrigin) {
      issues.push("Add a starting location name.");
    }

    if (trimmedOrigin && (!originArrival || !originDeparture)) {
      issues.push("Add arrival and departure dates for the starting location.");
    }

    if (issues.length > 0) {
      hapticError();
      Alert.alert("Complete your route", issues.join("\n"));
      return;
    }

    setSavingRoute(true);
    const compiledStops: RouteStop[] = [];

    const originStop = await buildStop({
      name: trimmedOrigin,
      coords: originCoords,
      arrival: originArrival,
      departure: originDeparture,
      role: "origin",
    });

    if (originStop) {
      compiledStops.push(originStop);
    }

    compiledStops.push(...extraStops);

    const destinationStop = await buildStop({
      name: trimmedDestination,
      coords: destinationCoords,
      arrival: destinationArrival,
      departure: destinationDeparture,
      role: "destination",
      intent: routeIntent as RouteIntent,
      destinationType: destinationType as DestinationType,
    });

    if (destinationStop) {
      compiledStops.push(destinationStop);
    }

    if (compiledStops.length === 0) {
      hapticError();
      Alert.alert("Add at least one stop to continue.");
      setSavingRoute(false);
      return;
    }

    if (!currentUser?._id) {
      setSavingRoute(false);
      return;
    }
    try {
      await updateRoute({ userId: currentUser._id, route: compiledStops });
      onComplete();
    } catch (err: any) {
      const msg = err?.message || "Failed to save your route.";
      Alert.alert("Error", msg);
    } finally {
      setSavingRoute(false);
    }
  };

  const previewStops = useMemo(() => {
    const list: RouteStop[] = [];
    if (originName && originArrival && originDeparture) {
      list.push({
        location: { latitude: originCoords?.latitude ?? 0, longitude: originCoords?.longitude ?? 0, name: originName },
        arrivalDate: format(originArrival, "MM/dd/yyyy"),
        departureDate: format(originDeparture, "MM/dd/yyyy"),
        role: "origin",
      });
    }
    list.push(...extraStops);
    if (destinationName && destinationArrival && destinationDeparture) {
      list.push({
        location: {
          latitude: destinationCoords?.latitude ?? 0,
          longitude: destinationCoords?.longitude ?? 0,
          name: destinationName,
        },
        arrivalDate: format(destinationArrival, "MM/dd/yyyy"),
        departureDate: format(destinationDeparture, "MM/dd/yyyy"),
        role: "destination",
      });
    }
    return list;
  }, [
    originName,
    originArrival,
    originDeparture,
    originCoords,
    destinationName,
    destinationArrival,
    destinationDeparture,
    destinationCoords,
    extraStops,
  ]);

  const renderStopLabel = (stop: RouteStop, stopNumber: number) => {
    if (stop.role === "origin") return "Start";
    if (stop.role === "destination") return "Destination";
    if (stopNumber <= 1) return "Stop";
    return `Stop ${stopNumber}`;
  };

  if (currentUser === undefined) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        title={title}
        leftContent={
          onBack ? (
            <Pressable onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: 120 },
        ]}
      >
        {/* Plan tier indicator */}
        <View style={styles.tierRow}>
          <View style={[styles.tierBadge, { backgroundColor: isPro ? `${AppColors.primary}20` : "rgba(255,255,255,0.08)" }]}>
            <Ionicons name={isPro ? "diamond" : "leaf-outline"} size={14} color={isPro ? AppColors.primary : colors.onSurfaceVariant} />
            <Text style={[styles.tierText, { color: isPro ? AppColors.primary : colors.onSurfaceVariant }]}>
              {isPro ? "PRO" : "FREE"}
            </Text>
          </View>
          {!isPro && (
            <Text style={[styles.limitHint, { color: colors.onSurfaceVariant }]}>
              {limits.maxStopovers} stopover  ·  {limits.maxRouteDays} day window
            </Text>
          )}
        </View>

        <Text style={[styles.subtitle, { color: colors.onSurface }]}>
          Where are you heading?
        </Text>
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          We match people based on intent, not just where you happen to be standing.
        </Text>

        <Pressable
          style={[styles.inlineButton, { borderColor: colors.outline }]}
          onPress={() => {
            setShowDetails((prev) => !prev);
            hapticSelection();
          }}
        >
          <Ionicons
            name={showDetails ? "options" : "options-outline"}
            size={18}
            color={colors.onSurfaceVariant}
          />
          <Text style={[styles.inlineButtonText, { color: colors.onSurfaceVariant }]}>
            {showDetails ? "Hide route details" : "Customize route details"}
          </Text>
        </Pressable>

      {showDetails && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Route intent</Text>
          {routeIntentOptions.map((option) => (
            <GlassOption
              key={option.value}
              label={option.label}
              emoji={option.emoji}
              description={option.description}
              selected={routeIntent === option.value}
              onPress={() => setRouteIntent(option.value)}
            />
          ))}
        </View>
      )}

      {showDetails && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            What does this destination represent?
          </Text>
          {destinationTypeOptions.map((option) => (
            <GlassOption
              key={option.value}
              label={option.label}
              emoji={option.emoji}
              description={option.description}
              selected={destinationType === option.value}
              onPress={() => setDestinationType(option.value)}
            />
          ))}
        </View>
      )}

      {!showOriginSection ? (
        <Pressable
          style={[styles.inlineButton, { borderColor: colors.primary }]}
          onPress={() => {
            setShowOriginSection(true);
            hapticSelection();
          }}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.primary} />
          <Text style={[styles.inlineButtonText, { color: colors.primary }]}>Add starting point (optional)</Text>
        </Pressable>
      ) : (
        <View style={styles.section}>
          <View style={styles.originHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: 0 }]}>Starting location</Text>
            <Pressable
              onPress={() => {
                setShowOriginSection(false);
                setOriginName("");
                setOriginCoords(null);
                setOriginArrival(undefined);
                setOriginDeparture(undefined);
              }}
              hitSlop={10}
            >
              <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.onSurfaceVariant }]}>
            Optional, but helpful when you know where you will be departing from.
          </Text>
          <GlassInput
            value={originName}
            onChangeText={setOriginName}
            placeholder="City, neighborhood, or landmark"
            icon={<Ionicons name="navigate-outline" size={20} color={colors.onSurfaceVariant} />}
          />
          <Pressable
            style={[styles.inlineButton, { borderColor: colors.primary }]}
            onPress={getCurrentLocation}
            disabled={loadingLocation}
          >
            <Ionicons name="locate-outline" size={18} color={colors.primary} />
            <Text style={[styles.inlineButtonText, { color: colors.primary }]}>
              {loadingLocation ? "Detecting location..." : "Use my current location"}
            </Text>
          </Pressable>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <GlassDatePicker
                value={originArrival}
                onChange={(d) => enforceDateLimit(d, setOriginArrival)}
                placeholder="Arrival"
                label="Arrival"
                containerStyle={{ marginBottom: 0 }}
                maximumDate={isPro ? undefined : maxDate}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <GlassDatePicker
                value={originDeparture}
                onChange={(d) => enforceDateLimit(d, setOriginDeparture)}
                placeholder="Departure"
                label="Departure"
                containerStyle={{ marginBottom: 0 }}
                minimumDate={originArrival}
                maximumDate={isPro ? undefined : maxDate}
              />
            </View>
          </View>
        </View>
      )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Destination</Text>
          <Text style={[styles.sectionDescription, { color: colors.onSurfaceVariant }]}
          >
            This should be the place you actually want to go.
          </Text>
          <GlassInput
            value={destinationName}
            onChangeText={setDestinationName}
            placeholder="City, region, or place"
            icon={<Ionicons name="flag-outline" size={20} color={colors.onSurfaceVariant} />}
          />
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <GlassDatePicker
                value={destinationArrival}
                onChange={(d) => enforceDateLimit(d, setDestinationArrival)}
                placeholder="Arrival"
                label="Arrival"
                containerStyle={{ marginBottom: 0 }}
                maximumDate={isPro ? undefined : maxDate}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <GlassDatePicker
                value={destinationDeparture}
                onChange={(d) => enforceDateLimit(d, setDestinationDeparture)}
                placeholder="Departure"
                label="Departure"
                containerStyle={{ marginBottom: 0 }}
                minimumDate={destinationArrival}
                maximumDate={isPro ? undefined : maxDate}
              />
            </View>
          </View>

          <View style={styles.presetRow}>
            <Pressable
              style={[styles.presetButton, { borderColor: colors.primary }]}
              onPress={() => {
                const start = new Date();
                const end = new Date(start);
                end.setDate(start.getDate() + 4);
                setDestinationArrival(start);
                setDestinationDeparture(end);
              }}
            >
              <Text style={[styles.presetText, { color: colors.primary }]}>This week</Text>
            </Pressable>
            <Pressable
              style={[styles.presetButton, { borderColor: colors.primary }]}
              onPress={() => {
                const start = new Date();
                start.setDate(start.getDate() + 7);
                const end = new Date(start);
                end.setDate(start.getDate() + 4);
                if (!isPro && end > maxDate) {
                  if (onShowPaywall) {
                    onShowPaywall("Plan further ahead with Pro");
                    return;
                  }
                }
                setDestinationArrival(start);
                setDestinationDeparture(end);
              }}
            >
              <Text style={[styles.presetText, { color: colors.primary }]}>Next week</Text>
            </Pressable>
            {isPro && (
              <Pressable
                style={[styles.presetButton, { borderColor: colors.primary }]}
                onPress={() => {
                  const start = new Date();
                  start.setDate(start.getDate() + 30);
                  const end = new Date(start);
                  end.setDate(start.getDate() + 7);
                  setDestinationArrival(start);
                  setDestinationDeparture(end);
                }}
              >
                <Text style={[styles.presetText, { color: colors.primary }]}>Next month</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Stops along the way</Text>
            {!isPro && (
              <Text style={[styles.limitBadge, { color: colors.onSurfaceVariant }]}>
                {extraStops.length}/{limits.maxStopovers}
              </Text>
            )}
          </View>
          <Text style={[styles.sectionDescription, { color: colors.onSurfaceVariant }]}>
            Add intermediate stops if you have a route with multiple legs.
          </Text>

          {extraStops.length > 0 ? (
            <View style={styles.stopList}>
              {extraStops.map((stop, index) => (
                <AdaptiveGlassView key={`${stop.location.name}-${index}`} style={styles.stopCard}>
                  <View style={styles.stopHeader}>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={16} color={colors.primary} />
                      <Text style={[styles.locationName, { color: colors.onSurface }]}>
                        {stop.location.name}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeStop(index)} hitSlop={10}>
                      <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
                    </Pressable>
                  </View>
                  <Text style={[styles.dates, { color: colors.onSurfaceVariant }]}>
                    {stop.arrivalDate} - {stop.departureDate}
                  </Text>
                </AdaptiveGlassView>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { borderColor: "rgba(255,255,255,0.1)" }]}>
              <Ionicons name="trail-sign-outline" size={24} color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                No intermediate stops yet
              </Text>
            </View>
          )}

          {!showAddForm ? (
            <Pressable
              style={[styles.addStopButton, { backgroundColor: "rgba(255,255,255,0.05)" }]}
              onPress={() => {
                if (!isPro && extraStops.length >= limits.maxStopovers) {
                  hapticError();
                  if (onShowPaywall) {
                    onShowPaywall("Unlock unlimited stopovers with Pro");
                  } else {
                    Alert.alert("Stopover Limit", "Upgrade to Pro to add more stopovers.");
                  }
                  return;
                }
                setShowAddForm(true);
                hapticSelection();
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.addStopText, { color: colors.primary }]}>Add an intermediate stop</Text>
            </Pressable>
          ) : (
            <AdaptiveGlassView style={styles.addForm}>
              <Text style={[styles.formTitle, { color: colors.onSurface }]}>New Stop</Text>

              <GlassInput
                value={newLocationName}
                onChangeText={setNewLocationName}
                placeholder="City, State or Location Name"
                icon={<Ionicons name="location-outline" size={20} color={colors.onSurfaceVariant} />}
              />

              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <GlassDatePicker
                    value={newArrival}
                    onChange={(d) => enforceDateLimit(d, setNewArrival)}
                    placeholder="Arrival"
                    label="Arrival"
                    containerStyle={{ marginBottom: 0 }}
                    maximumDate={isPro ? undefined : maxDate}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <GlassDatePicker
                    value={newDeparture}
                    onChange={(d) => enforceDateLimit(d, setNewDeparture)}
                    placeholder="Departure"
                    label="Departure"
                    containerStyle={{ marginBottom: 0 }}
                    minimumDate={newArrival}
                    maximumDate={isPro ? undefined : maxDate}
                  />
                </View>
              </View>

              <View style={styles.formActions}>
                <Pressable onPress={() => setShowAddForm(false)} style={styles.cancelButton}>
                  <Text style={{ color: colors.onSurfaceVariant }}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleAddStop}
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary },
                    addingStop && { opacity: 0.6 },
                  ]}
                  disabled={addingStop}
                >
                  <Text style={{ color: "#FFF", fontWeight: "600" }}>
                    {addingStop ? "Adding..." : "Add"}
                  </Text>
                </Pressable>
              </View>
            </AdaptiveGlassView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Route preview</Text>
          {previewStops.length > 0 ? (
            <View style={styles.timelineContainer}>
              {previewStops.map((stop, index) => {
                const stopNumber =
                  previewStops.filter(
                    (candidate, idx) =>
                      idx <= index && candidate.role !== "origin" && candidate.role !== "destination"
                  ).length || 1;
                return (
                  <View key={`${stop.location.name}-${index}`} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                      {index < previewStops.length - 1 && (
                        <View style={[styles.line, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
                      )}
                    </View>
                    <AdaptiveGlassView style={styles.stopCard}>
                      <View style={styles.stopHeader}>
                        <Text style={[styles.stopLabel, { color: colors.onSurfaceVariant }]}>
                          {renderStopLabel(stop, stopNumber)}
                        </Text>
                      </View>
                      <Text style={[styles.locationName, { color: colors.onSurface }]}>
                        {stop.location.name}
                      </Text>
                      <Text style={[styles.dates, { color: colors.onSurfaceVariant }]}>
                        {stop.arrivalDate} - {stop.departureDate}
                      </Text>
                    </AdaptiveGlassView>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyState, { borderColor: "rgba(255,255,255,0.1)" }]}>
              <Ionicons name="map-outline" size={24} color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                Fill out the route details to see your preview
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <GlassButton title="Save Route" onPress={handleContinue} loading={savingRoute} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  limitHint: {
    fontSize: 12,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  limitBadge: {
    fontSize: 13,
    fontWeight: "600",
  },
  originHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  inlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  inlineButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  dateRow: {
    flexDirection: "row",
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 13,
    fontWeight: "600",
  },
  stopList: {
    gap: 12,
    marginBottom: 12,
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: "center",
    width: 20,
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 24,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  stopCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  stopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  stopLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
  },
  dates: {
    fontSize: 13,
  },
  emptyState: {
    padding: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  addStopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  addStopText: {
    fontWeight: "600",
    fontSize: 15,
  },
  addForm: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  cancelButton: {
    padding: 8,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
});
