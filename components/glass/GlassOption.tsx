import React from "react";
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";
import { hapticSelection } from "@/lib/haptics";

interface GlassOptionProps {
  label: string;
  emoji: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  multiSelect?: boolean;
}

export function GlassOption({
  label,
  emoji,
  description,
  selected = false,
  onPress,
  style,
  multiSelect,
}: GlassOptionProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    hapticSelection();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={[styles.wrapper, style]}>
      <AdaptiveGlassView
        style={[
          styles.container,
          {
            borderColor: selected ? colors.primary : "rgba(0,0,0,0.1)",
            borderWidth: selected ? 2 : 1,
          },
        ]}
        fallbackColor={selected ? colors.primaryContainer : undefined}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: colors.onSurface }]}>
            {label}
          </Text>
          {description && (
            <Text
              style={[
                styles.description,
                { color: colors.onSurfaceVariant },
              ]}
            >
              {description}
            </Text>
          )}
        </View>

        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={colors.primary}
          />
        )}
      </AdaptiveGlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
  },
  container: {
    padding: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  emoji: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
  },
});
