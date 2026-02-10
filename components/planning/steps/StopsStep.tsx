import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import * as LocationAPI from "expo-location";
import { GlassInput, GlassButton, GlassDatePicker } from "@/components/glass";
import { useAppTheme, AppColors } from "@/lib/theme";
import { AdaptiveGlassView } from "@/lib/glass";
import { hapticSelection, hapticSuccess, hapticError } from "@/lib/haptics";
import { Doc } from "@/convex/_generated/dataModel";

type RouteStop = NonNullable<Doc<"users">["currentRoute"]>[number];

interface StopsStepProps {
  extraStops: RouteStop[];
  onChangeExtraStops: (stops: RouteStop[]) => void;
  isPro: boolean;
  maxStopovers: number;
  maxDate: Date;
  onShowPaywall?: (msg: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StopsStep({
  extraStops,
  onChangeExtraStops,
  isPro,
  maxStopovers,
  maxDate,
  onShowPaywall,
  onNext,
  onBack,
}: StopsStepProps) {
  const { colors } = useAppTheme();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newArrival, setNewArrival] = useState<Date | undefined>();
  const [newDeparture, setNewDeparture] = useState<Date | undefined>();
  const [addingStop, setAddingStop] = useState(false);

  const geocodeLocation = async (name: string) => {
    try {
      const results = await LocationAPI.geocodeAsync(name);
      if (results.length > 0) {
        return { latitude: results[0].latitude, longitude: results[0].longitude };
      }
    } catch (error) {
      console.log("Geocoding failed", error);
    }
    return { latitude: 0, longitude: 0 };
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

  const handleAddStop = async () => {
    if (!newLocationName || !newArrival || !newDeparture) {
      hapticError();
      return;
    }

    if (!isPro && extraStops.length >= maxStopovers) {
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

    onChangeExtraStops([...extraStops, newStop]);
    setNewLocationName("");
    setNewArrival(undefined);
    setNewDeparture(undefined);
    setShowAddForm(false);
    setAddingStop(false);
    hapticSuccess();
  };

  const removeStop = (index: number) => {
    onChangeExtraStops(extraStops.filter((_, idx) => idx !== index));
    hapticSelection();
  };

  const handleShowAddForm = () => {
    if (!isPro && extraStops.length >= maxStopovers) {
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={[styles.headline, { color: colors.onSurface }]}>
            Any stops along{"\n"}the way?
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Add intermediate stops if your route has multiple legs. This is optional.
          </Text>
        </Animated.View>

        {!isPro && (
          <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.limitRow}>
            <Ionicons name="information-circle-outline" size={16} color={colors.onSurfaceVariant} />
            <Text style={[styles.limitText, { color: colors.onSurfaceVariant }]}>
              {extraStops.length}/{maxStopovers} stop{maxStopovers !== 1 ? "s" : ""} on free plan
            </Text>
          </Animated.View>
        )}

        {extraStops.length === 0 && !showAddForm && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <View style={[styles.emptyState, { borderColor: colors.outline }]}>
              <Ionicons name="trail-sign-outline" size={28} color={colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                No stops — going direct
              </Text>
            </View>
          </Animated.View>
        )}

        {extraStops.map((stop, index) => (
          <Animated.View
            key={`${stop.location.name}-${index}`}
            entering={FadeInUp.duration(300)}
            layout={Layout.springify()}
          >
            <AdaptiveGlassView style={styles.stopCard}>
              <View style={styles.stopHeader}>
                <View style={styles.stopInfo}>
                  <Ionicons name="location" size={16} color={colors.primary} />
                  <Text style={[styles.stopName, { color: colors.onSurface }]}>
                    {stop.location.name}
                  </Text>
                </View>
                <Pressable onPress={() => removeStop(index)} hitSlop={10}>
                  <Ionicons name="close-circle" size={20} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>
              <Text style={[styles.stopDates, { color: colors.onSurfaceVariant }]}>
                {stop.arrivalDate} – {stop.departureDate}
              </Text>
            </AdaptiveGlassView>
          </Animated.View>
        ))}

        {showAddForm ? (
          <Animated.View entering={FadeInDown.duration(300)}>
            <AdaptiveGlassView style={styles.addForm}>
              <Text style={[styles.formTitle, { color: colors.onSurface }]}>New stop</Text>
              <GlassInput
                value={newLocationName}
                onChangeText={setNewLocationName}
                placeholder="City or location name"
                icon={<Ionicons name="location-outline" size={20} color={colors.onSurfaceVariant} />}
                autoFocus
              />
              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <GlassDatePicker
                    value={newArrival}
                    onChange={(d) => enforceDateLimit(d, setNewArrival)}
                    placeholder="From"
                    label="From"
                    containerStyle={{ marginBottom: 0 }}
                    maximumDate={isPro ? undefined : maxDate}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <GlassDatePicker
                    value={newDeparture}
                    onChange={(d) => enforceDateLimit(d, setNewDeparture)}
                    placeholder="Until"
                    label="Until"
                    containerStyle={{ marginBottom: 0 }}
                    minimumDate={newArrival}
                    maximumDate={isPro ? undefined : maxDate}
                  />
                </View>
              </View>
              <View style={styles.formActions}>
                <Pressable onPress={() => setShowAddForm(false)} style={styles.cancelButton}>
                  <Text style={{ color: colors.onSurfaceVariant, fontWeight: "500" }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddStop}
                  style={[styles.addButton, { backgroundColor: colors.primary }, addingStop && { opacity: 0.6 }]}
                  disabled={addingStop}
                >
                  <Text style={{ color: "#FFF", fontWeight: "600" }}>
                    {addingStop ? "Adding..." : "Add"}
                  </Text>
                </Pressable>
              </View>
            </AdaptiveGlassView>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400).delay(350)}>
            <Pressable
              onPress={handleShowAddForm}
              style={[styles.addStopButton, { borderColor: colors.primary }]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.addStopText, { color: colors.primary }]}>
                Add a stop
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      <View style={styles.footer}>
        <GlassButton title="Continue" onPress={onNext} />
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
    gap: 12,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  limitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  limitText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyState: {
    padding: 28,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  stopCard: {
    padding: 16,
    borderRadius: 16,
  },
  stopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  stopInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: "600",
  },
  stopDates: {
    fontSize: 13,
    marginLeft: 24,
  },
  addStopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  addStopText: {
    fontSize: 15,
    fontWeight: "600",
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
  dateRow: {
    flexDirection: "row",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  cancelButton: {
    padding: 8,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    gap: 12,
    alignItems: "center",
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
