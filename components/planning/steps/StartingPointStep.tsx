import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { GlassInput, GlassButton, GlassDatePicker } from "@/components/glass";
import { useAppTheme } from "@/lib/theme";
import { hapticSelection, hapticSuccess, hapticError } from "@/lib/haptics";
import { AdaptiveGlassView } from "@/lib/glass";

interface StartingPointStepProps {
  originName: string;
  onChangeOriginName: (text: string) => void;
  originCoords: { latitude: number; longitude: number } | null;
  onChangeOriginCoords: (coords: { latitude: number; longitude: number } | null) => void;
  originArrival: Date | undefined;
  originDeparture: Date | undefined;
  onChangeOriginArrival: (d: Date | undefined) => void;
  onChangeOriginDeparture: (d: Date | undefined) => void;
  isPro: boolean;
  maxDate: Date;
  onShowPaywall?: (msg: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function StartingPointStep({
  originName,
  onChangeOriginName,
  originCoords,
  onChangeOriginCoords,
  originArrival,
  originDeparture,
  onChangeOriginArrival,
  onChangeOriginDeparture,
  isPro,
  maxDate,
  onShowPaywall,
  onNext,
  onSkip,
  onBack,
}: StartingPointStepProps) {
  const { colors } = useAppTheme();
  const [loadingLocation, setLoadingLocation] = useState(false);

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
    if (uniqueParts.length > 0) return uniqueParts.join(", ");
    return item.country || fallback;
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        hapticError();
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

      onChangeOriginName(locationName);
      onChangeOriginCoords({ latitude, longitude });
      if (!originArrival) onChangeOriginArrival(today);
      if (!originDeparture) onChangeOriginDeparture(nextWeek);
      hapticSuccess();
    } catch (error) {
      console.log("Error getting location", error);
      hapticError();
    } finally {
      setLoadingLocation(false);
    }
  };

  const enforceDateLimit = (
    date: Date | undefined,
    setter: (d: Date | undefined) => void
  ) => {
    if (!date) return;
    if (date > maxDate && !isPro) {
      hapticError();
      if (onShowPaywall) onShowPaywall("Plan further ahead with Pro");
      setter(maxDate);
      return;
    }
    setter(date);
  };

  const hasOrigin = originName.trim().length > 0;
  const canContinue = hasOrigin && !!originArrival && !!originDeparture;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={[styles.headline, { color: colors.onSurface }]}>
            Where are you{"\n"}now?
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Helps us find overlapping routes. You can skip this.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Pressable
            onPress={getCurrentLocation}
            disabled={loadingLocation}
            style={({ pressed }) => [
              styles.locationButton,
              {
                backgroundColor: `${colors.primary}10`,
                borderColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="locate" size={20} color={colors.primary} />
            )}
            <Text style={[styles.locationButtonText, { color: colors.primary }]}>
              {loadingLocation ? "Detecting location..." : "Use my current location"}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
          <Text style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <GlassInput
            value={originName}
            onChangeText={onChangeOriginName}
            placeholder="City, neighborhood, or landmark"
            icon={<Ionicons name="navigate-outline" size={20} color={colors.onSurfaceVariant} />}
          />
        </Animated.View>

        {hasOrigin && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <GlassDatePicker
                value={originArrival}
                onChange={(d) => enforceDateLimit(d, onChangeOriginArrival)}
                placeholder="From"
                label="From"
                containerStyle={{ marginBottom: 0 }}
                maximumDate={isPro ? undefined : maxDate}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <GlassDatePicker
                value={originDeparture}
                onChange={(d) => enforceDateLimit(d, onChangeOriginDeparture)}
                placeholder="Until"
                label="Until"
                containerStyle={{ marginBottom: 0 }}
                minimumDate={originArrival}
                maximumDate={isPro ? undefined : maxDate}
              />
            </View>
          </Animated.View>
        )}
      </View>

      <View style={styles.footer}>
        <GlassButton
          title="Continue"
          onPress={onNext}
          disabled={!canContinue}
        />
        <Pressable onPress={onSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.onSurfaceVariant }]}>
            Skip — I don't know yet
          </Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.onSurfaceVariant }]}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    paddingBottom: 60,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 36,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dateRow: {
    flexDirection: "row",
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    gap: 8,
    alignItems: "center",
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
