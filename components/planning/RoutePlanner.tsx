import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Alert, ActivityIndicator, Pressable, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { format, parse, addDays } from "date-fns";
import { useMutation } from "convex/react";

import { useAppTheme } from "@/lib/theme";
import { hapticSelection, hapticSuccess, hapticError } from "@/lib/haptics";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { FREE_PLAN, PRO_PLAN } from "@/lib/constants";

import { StepIndicator } from "./StepIndicator";
import { DestinationStep } from "./steps/DestinationStep";
import { TimingStep } from "./steps/TimingStep";
import { StartingPointStep } from "./steps/StartingPointStep";
import { StopsStep } from "./steps/StopsStep";
import { ReviewStep } from "./steps/ReviewStep";

type RouteStop = NonNullable<Doc<"users">["currentRoute"]>[number];
type RouteIntent = "planned" | "preference";
type DestinationType = "commute" | "visit" | "work" | "seasonal" | "adventure";
type StopRole = "origin" | "stop" | "destination";

const TOTAL_STEPS = 5;

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

  // ── Step state ──
  const [step, setStep] = useState(0);
  const directionRef = useRef<"forward" | "back">("forward");
  const isFirstRender = useRef(true);
  const SCREEN_W = Dimensions.get("window").width;
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Jump off-screen in the travel direction, then spring to 0
    translateX.value = directionRef.current === "forward" ? SCREEN_W : -SCREEN_W;
    translateX.value = withSpring(0, { damping: 20, stiffness: 180, mass: 0.8 });
  }, [step]);

  const stepAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // ── Route data ──
  const [originName, setOriginName] = useState("");
  const [originCoords, setOriginCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [originArrival, setOriginArrival] = useState<Date | undefined>();
  const [originDeparture, setOriginDeparture] = useState<Date | undefined>();

  const [destinationName, setDestinationName] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationArrival, setDestinationArrival] = useState<Date | undefined>();
  const [destinationDeparture, setDestinationDeparture] = useState<Date | undefined>();

  const [routeIntent, setRouteIntent] = useState<RouteIntent>("planned");
  const [destinationType, setDestinationType] = useState<DestinationType>("adventure");
  const [extraStops, setExtraStops] = useState<RouteStop[]>([]);
  const [savingRoute, setSavingRoute] = useState(false);

  // ── Hydrate from existing route ──
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

  // ── Navigation ──
  const goNext = useCallback(() => {
    hapticSelection();
    directionRef.current = "forward";
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    hapticSelection();
    directionRef.current = "back";
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((target: number) => {
    hapticSelection();
    directionRef.current = target < step ? "back" : "forward";
    setStep(target);
  }, [step]);

  // ── Geocoding ──
  const geocodeLocation = async (name: string) => {
    try {
      const results = await Location.geocodeAsync(name);
      if (results.length > 0) {
        return { latitude: results[0].latitude, longitude: results[0].longitude };
      }
    } catch (error) {
      console.log("Geocoding failed", error);
    }
    return { latitude: 0, longitude: 0 };
  };

  // ── Build & Save ──
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

  const handleSave = async () => {
    const trimmedOrigin = originName.trim();
    const trimmedDestination = destinationName.trim();

    if (!trimmedDestination || !destinationArrival || !destinationDeparture) {
      hapticError();
      Alert.alert("Missing info", "Destination and dates are required.");
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

    if (originStop) compiledStops.push(originStop);
    compiledStops.push(...extraStops);

    const destinationStop = await buildStop({
      name: trimmedDestination,
      coords: destinationCoords,
      arrival: destinationArrival,
      departure: destinationDeparture,
      role: "destination",
      intent: routeIntent,
      destinationType,
    });

    if (destinationStop) compiledStops.push(destinationStop);

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
      hapticSuccess();
      onComplete();
    } catch (err: any) {
      const msg = err?.message || "Failed to save your route.";
      Alert.alert("Error", msg);
    } finally {
      setSavingRoute(false);
    }
  };

  // ── Loading state ──
  if (currentUser === undefined) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Step rendering ──
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <DestinationStep
            destinationName={destinationName}
            onChangeDestination={setDestinationName}
            onNext={goNext}
          />
        );
      case 1:
        return (
          <TimingStep
            arrival={destinationArrival}
            departure={destinationDeparture}
            onChangeArrival={setDestinationArrival}
            onChangeDeparture={setDestinationDeparture}
            isPro={isPro}
            maxDate={maxDate}
            onShowPaywall={onShowPaywall}
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 2:
        return (
          <StartingPointStep
            originName={originName}
            onChangeOriginName={setOriginName}
            originCoords={originCoords}
            onChangeOriginCoords={setOriginCoords}
            originArrival={originArrival}
            originDeparture={originDeparture}
            onChangeOriginArrival={setOriginArrival}
            onChangeOriginDeparture={setOriginDeparture}
            isPro={isPro}
            maxDate={maxDate}
            onShowPaywall={onShowPaywall}
            onNext={goNext}
            onSkip={goNext}
            onBack={goBack}
          />
        );
      case 3:
        return (
          <StopsStep
            extraStops={extraStops}
            onChangeExtraStops={setExtraStops}
            isPro={isPro}
            maxStopovers={limits.maxStopovers}
            maxDate={maxDate}
            onShowPaywall={onShowPaywall}
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 4:
        return (
          <ReviewStep
            destinationName={destinationName}
            destinationArrival={destinationArrival}
            destinationDeparture={destinationDeparture}
            originName={originName}
            originArrival={originArrival}
            originDeparture={originDeparture}
            extraStops={extraStops}
            saving={savingRoute}
            onSave={handleSave}
            onBack={goBack}
            onEditStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerArea, { paddingTop: insets.top + 12 }]}>
        {(onBack || step > 0) && (
          <Pressable
            onPress={step > 0 ? goBack : onBack}
            style={styles.headerBackButton}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        )}
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
      </View>

      <View style={styles.stepWrapper}>
        <Animated.View style={[styles.stepContainer, stepAnimStyle]}>
          {renderStep()}
        </Animated.View>
      </View>

      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 32,
    paddingBottom: 8,
    alignItems: "center",
  },
  headerBackButton: {
    position: "absolute",
    left: 24,
    bottom: 12,
    zIndex: 10,
  },
  stepWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  stepContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
