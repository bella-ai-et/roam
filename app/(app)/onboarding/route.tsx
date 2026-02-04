import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { format } from "date-fns";

import { GlassHeader, GlassButton, GlassInput, GlassDatePicker } from "@/components/glass";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppTheme } from "@/lib/theme";
import { setOnboardingField, getOnboardingData, OnboardingData } from "@/lib/onboardingState";
import { hapticSelection, hapticSuccess, hapticError } from "@/lib/haptics";
import { AdaptiveGlassView } from "@/lib/glass";

type RouteStop = OnboardingData["currentRoute"][0];

export default function RouteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const existingData = getOnboardingData();
  const [stops, setStops] = useState<RouteStop[]>(existingData.currentRoute || []);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Add stop form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newArrival, setNewArrival] = useState<Date | undefined>();
  const [newDeparture, setNewDeparture] = useState<Date | undefined>();

  useEffect(() => {
    // If we have no stops, try to get current location automatically
    if (stops.length === 0) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      let locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode.length > 0) {
          const { city, region, country } = reverseGeocode[0];
          locationName = [city, region].filter(Boolean).join(", ") || country || locationName;
        }
      } catch (e) {
        console.log("Reverse geocoding failed", e);
      }

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const newStop: RouteStop = {
        location: {
          latitude,
          longitude,
          name: locationName
        },
        arrivalDate: format(today, "MM/dd/yyyy"),
        departureDate: format(nextWeek, "MM/dd/yyyy")
      };

      setStops([newStop]);
      hapticSuccess();
    } catch (error) {
      console.log("Error getting location", error);
      Alert.alert("Could not get current location");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleAddStop = () => {
    if (!newLocationName || !newArrival || !newDeparture) {
      hapticError();
      return;
    }

    const newStop: RouteStop = {
      location: {
        latitude: 0, // Placeholder as we don't have geocoding for manual input yet
        longitude: 0,
        name: newLocationName
      },
      arrivalDate: format(newArrival, "MM/dd/yyyy"),
      departureDate: format(newDeparture, "MM/dd/yyyy")
    };

    setStops([...stops, newStop]);
    setNewLocationName("");
    setNewArrival(undefined);
    setNewDeparture(undefined);
    setShowAddForm(false);
    hapticSuccess();
  };

  const removeStop = (index: number) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
    hapticSelection();
  };

  const handleContinue = () => {
    if (stops.length === 0) return;
    setOnboardingField("currentRoute", stops);
    router.push("/(app)/onboarding/complete"); 
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader
        title="Your Route"
        leftContent={
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
        }
      />

      <ScrollView 
        contentContainerStyle={[
          styles.content, 
          { paddingTop: insets.top + 60, paddingBottom: 100 }
        ]}
      >
        <ProgressBar current={6} total={8} />

        <Text style={[styles.subtitle, { color: colors.onSurface }]}>
          Where are you headed?
        </Text>
        
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          This is how we find your matches. Add where you are now and where you're going.
        </Text>

        {/* Current Location / Stops Timeline */}
        <View style={styles.timelineContainer}>
          {stops.map((stop, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                {index < stops.length - 1 && (
                  <View style={[styles.line, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
                )}
              </View>
              
              <AdaptiveGlassView style={styles.stopCard}>
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
            </View>
          ))}
          
          {stops.length === 0 && !loadingLocation && (
            <Pressable 
              style={[styles.emptyState, { borderColor: "rgba(255,255,255,0.1)" }]}
              onPress={getCurrentLocation}
            >
              <Ionicons name="locate" size={24} color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                Tap to detect current location
              </Text>
            </Pressable>
          )}

           {loadingLocation && (
             <View style={styles.loadingContainer}>
               <Text style={{ color: colors.onSurfaceVariant }}>Detecting location...</Text>
             </View>
           )}
        </View>

        {/* Add Stop Button or Form */}
        {!showAddForm ? (
          <Pressable 
            style={[styles.addStopButton, { backgroundColor: "rgba(255,255,255,0.05)" }]}
            onPress={() => {
              setShowAddForm(true);
              hapticSelection();
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.addStopText, { color: colors.primary }]}>Add a Stop</Text>
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
                  onChange={setNewArrival}
                  placeholder="Arrival"
                  label="Arrival"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <GlassDatePicker
                  value={newDeparture}
                  onChange={setNewDeparture}
                  placeholder="Departure"
                  label="Departure"
                  containerStyle={{ marginBottom: 0 }}
                  minimumDate={newArrival}
                />
              </View>
            </View>

            <View style={styles.formActions}>
              <Pressable 
                onPress={() => setShowAddForm(false)} 
                style={styles.cancelButton}
              >
                <Text style={{ color: colors.onSurfaceVariant }}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                onPress={handleAddStop}
                style={[styles.addButton, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: "#FFF", fontWeight: "600" }}>Add</Text>
              </Pressable>
            </View>
          </AdaptiveGlassView>
        )}

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <GlassButton
          title="Continue"
          onPress={handleContinue}
          disabled={stops.length === 0}
        />
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
  timelineContainer: {
    marginBottom: 24,
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
    marginTop: 24, // Align with card center roughly
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
  },
  emptyText: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
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
  dateRow: {
    flexDirection: "row",
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
