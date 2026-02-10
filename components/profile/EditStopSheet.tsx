import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parse, format } from "date-fns";
import { AppColors, useAppTheme } from "@/lib/theme";
import { GlassInput, GlassDatePicker, GlassButton } from "@/components/glass";
import { hapticSuccess, hapticError } from "@/lib/haptics";

interface RouteStop {
  location: { latitude: number; longitude: number; name: string };
  arrivalDate: string;
  departureDate: string;
  notes?: string;
  role?: string;
  intent?: string;
  destinationType?: string;
  status?: string;
}

interface EditStopSheetProps {
  visible: boolean;
  stop: RouteStop | null;
  stopIndex: number;
  onClose: () => void;
  onSave: (index: number, updated: RouteStop) => void;
  onDelete?: (index: number) => void;
}

function parseStopDate(value: string): Date | undefined {
  if (!value) return undefined;
  try {
    const parsed = parse(value, "MM/dd/yyyy", new Date());
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function EditStopSheet({
  visible,
  stop,
  stopIndex,
  onClose,
  onSave,
  onDelete,
}: EditStopSheetProps) {
  const { colors, isDark } = useAppTheme();

  const [locationName, setLocationName] = useState("");
  const [arrival, setArrival] = useState<Date | undefined>();
  const [departure, setDeparture] = useState<Date | undefined>();

  useEffect(() => {
    if (stop) {
      setLocationName(stop.location.name);
      setArrival(parseStopDate(stop.arrivalDate));
      setDeparture(parseStopDate(stop.departureDate));
    }
  }, [stop]);

  const roleLabel =
    stop?.role === "origin"
      ? "Starting Point"
      : stop?.role === "destination"
        ? "Destination"
        : "Stop";

  const handleSave = () => {
    if (!stop) return;
    if (!locationName.trim()) {
      hapticError();
      Alert.alert("Missing info", "Location name is required.");
      return;
    }
    if (!arrival || !departure) {
      hapticError();
      Alert.alert("Missing info", "Both dates are required.");
      return;
    }

    const updated: RouteStop = {
      ...stop,
      location: {
        ...stop.location,
        name: locationName.trim(),
      },
      arrivalDate: format(arrival, "MM/dd/yyyy"),
      departureDate: format(departure, "MM/dd/yyyy"),
    };

    onSave(stopIndex, updated);
    hapticSuccess();
    onClose();
  };

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert("Remove stop", `Remove "${locationName}" from your route?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          onDelete(stopIndex);
          onClose();
        },
      },
    ]);
  };

  const canDelete = stop?.role !== "destination" && onDelete;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: isDark ? colors.surface : "#fff" },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.outline }]} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.onBackground }]}>
              Edit {roleLabel}
            </Text>
            {canDelete && (
              <Pressable onPress={handleDelete} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={colors.error || "#ef4444"} />
              </Pressable>
            )}
          </View>

          <GlassInput
            value={locationName}
            onChangeText={setLocationName}
            placeholder="City, region, or place"
            label="Location"
            icon={<Ionicons name="location-outline" size={20} color={colors.onSurfaceVariant} />}
          />

          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <GlassDatePicker
                value={arrival}
                onChange={setArrival}
                placeholder="From"
                label="From"
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <GlassDatePicker
                value={departure}
                onChange={setDeparture}
                placeholder="Until"
                label="Until"
                containerStyle={{ marginBottom: 0 }}
                minimumDate={arrival}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <GlassButton
              title="Save Changes"
              onPress={handleSave}
            />
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.onSurfaceVariant }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  dateRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  actions: {
    marginTop: 24,
    gap: 12,
    alignItems: "center",
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
