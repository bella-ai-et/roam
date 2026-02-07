import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors, useAppTheme } from "@/lib/theme";

interface PathVisibilitySheetProps {
  visible: boolean;
  currentVisibility: string;
  onClose: () => void;
  onSelect: (visibility: string) => void;
}

const OPTIONS = [
  {
    value: "everyone",
    label: "Everyone",
    description: "All users on the platform can see your route",
    icon: "globe-outline" as const,
  },
  {
    value: "verified_syncs",
    label: "Verified Syncs Only",
    description: "Only verified van lifers can see your route",
    icon: "shield-checkmark-outline" as const,
  },
  {
    value: "private",
    label: "Private",
    description: "Your route is hidden from Discovery",
    icon: "lock-closed-outline" as const,
  },
];

export function PathVisibilitySheet({
  visible,
  currentVisibility,
  onClose,
  onSelect,
}: PathVisibilitySheetProps) {
  const { colors, isDark } = useAppTheme();

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
          <Text style={[styles.title, { color: colors.onBackground }]}>Path Visibility</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Choose who can see your planned journey
          </Text>

          <View style={styles.options}>
            {OPTIONS.map((opt) => {
              const isSelected = currentVisibility === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                  style={[
                    styles.option,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? `${AppColors.primary}20`
                          : `${AppColors.primary}10`
                        : isDark
                          ? colors.surfaceVariant
                          : "#f8fafc",
                      borderColor: isSelected ? AppColors.primary : "transparent",
                    },
                  ]}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={isSelected ? AppColors.primary : colors.onSurfaceVariant}
                    />
                    <View style={styles.optionText}>
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? AppColors.primary : colors.onBackground,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionDesc, { color: colors.onSurfaceVariant }]}>
                        {opt.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={AppColors.primary} />
                  )}
                </Pressable>
              );
            })}
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
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
