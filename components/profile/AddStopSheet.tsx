import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors, useAppTheme } from "@/lib/theme";
import { GlassInput, GlassDatePicker, GlassButton } from "@/components/glass";

interface AddStopSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (stop: {
    locationName: string;
    latitude: number;
    longitude: number;
    arrivalDate: string;
    departureDate: string;
    notes: string;
    status: string;
  }) => void;
}

export function AddStopSheet({ visible, onClose, onSave }: AddStopSheetProps) {
  const { colors, isDark } = useAppTheme();
  const [locationName, setLocationName] = useState("");
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>();
  const [departureDate, setDepartureDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("next");

  const handleSave = () => {
    if (!locationName.trim()) return;
    if (!arrivalDate || !departureDate) return;

    const formatDate = (d: Date) => {
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    };

    onSave({
      locationName: locationName.trim(),
      latitude: 0,
      longitude: 0,
      arrivalDate: formatDate(arrivalDate),
      departureDate: formatDate(departureDate),
      notes: notes.trim(),
      status,
    });

    // Reset
    setLocationName("");
    setArrivalDate(undefined);
    setDepartureDate(undefined);
    setNotes("");
    setStatus("next");
  };

  const STATUS_OPTIONS = [
    { value: "next", label: "Next Stop" },
    { value: "destination", label: "Destination" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={[styles.title, { color: colors.onBackground }]}>Add Stop</Text>

            <View style={styles.field}>
              <GlassInput
                label="Location"
                placeholder="e.g. Lisbon, Portugal"
                value={locationName}
                onChangeText={setLocationName}
              />
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <GlassDatePicker
                  label="Arrival"
                  value={arrivalDate}
                  onChange={setArrivalDate}
                />
              </View>
              <View style={styles.dateField}>
                <GlassDatePicker
                  label="Departure"
                  value={departureDate}
                  onChange={setDepartureDate}
                  minimumDate={arrivalDate}
                />
              </View>
            </View>

            <View style={styles.field}>
              <GlassInput
                label="Notes (optional)"
                placeholder="What are you doing here?"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Stop Type</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setStatus(opt.value)}
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          status === opt.value
                            ? `${AppColors.primary}20`
                            : colors.surfaceVariant,
                        borderColor:
                          status === opt.value ? AppColors.primary : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            status === opt.value
                              ? AppColors.primary
                              : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.buttonRow}>
              <GlassButton
                title="Add Stop"
                onPress={handleSave}
                disabled={!locationName.trim() || !arrivalDate || !departureDate}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  keyboardView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    gap: 10,
  },
  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  buttonRow: {
    marginTop: 8,
  },
});
