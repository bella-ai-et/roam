import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  StyleProp,
  ViewStyle,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";
import { GlassButton } from "./GlassButton";

interface GlassDatePickerProps {
  label?: string;
  value?: Date;
  onChange: (date: Date) => void;
  error?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  containerStyle?: StyleProp<ViewStyle>;
}

export function GlassDatePicker({
  label,
  value,
  onChange,
  error,
  placeholder = "Select date",
  minimumDate,
  maximumDate,
  containerStyle,
}: GlassDatePickerProps) {
  const { colors } = useAppTheme();
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
      if (selectedDate) {
        onChange(selectedDate);
      }
    } else {
      // iOS just updates the temp date in the modal
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmIOS = () => {
    onChange(tempDate);
    setShow(false);
  };

  const cancelIOS = () => {
    setShow(false);
  };

  const openPicker = () => {
    setTempDate(value || new Date());
    setShow(true);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
      )}

      <Pressable onPress={openPicker}>
        <AdaptiveGlassView
          style={[
            styles.container,
            {
              borderColor: show ? colors.primary : "rgba(0,0,0,0.1)",
              borderWidth: show ? 2 : 1,
            },
          ]}
        >
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={colors.onSurfaceVariant} 
            style={styles.icon} 
          />
          <Text
            style={[
              styles.text,
              { color: value ? colors.onBackground : colors.onSurfaceVariant },
            ]}
          >
            {value ? format(value, "MM/dd/yyyy") : placeholder}
          </Text>
        </AdaptiveGlassView>
      </Pressable>

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}

      {/* Android Picker */}
      {Platform.OS === "android" && show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* iOS Picker Modal */}
      {Platform.OS === "ios" && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={show}
          onRequestClose={cancelIOS}
        >
          <View style={styles.modalOverlay}>
            <AdaptiveGlassView style={styles.modalContent}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                textColor={colors.onSurface}
                themeVariant="dark" 
              />
              <View style={styles.modalButtons}>
                <GlassButton 
                  title="Cancel" 
                  onPress={cancelIOS} 
                  variant="secondary" 
                  style={{ flex: 1, marginRight: 8 }} 
                />
                <GlassButton 
                  title="Confirm" 
                  onPress={confirmIOS} 
                  style={{ flex: 1, marginLeft: 8 }} 
                />
              </View>
            </AdaptiveGlassView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  container: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
  },
  error: {
    fontSize: 13,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 24,
    width: "100%",
  },
});
