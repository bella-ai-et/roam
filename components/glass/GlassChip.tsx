import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";
import { hapticSelection } from "@/lib/haptics";

interface GlassChipProps {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function GlassChip({
  label,
  emoji,
  selected = false,
  onPress,
  disabled = false,
  style,
}: GlassChipProps) {
  const { colors } = useAppTheme();

  const handlePress = () => {
    if (disabled) return;
    hapticSelection();
    onPress();
  };

  const content = (
    <Text
      style={[
        styles.text,
        {
          color: selected ? "#FFFFFF" : colors.onBackground,
        },
      ]}
    >
      {emoji ? `${emoji} ${label}` : label}
    </Text>
  );

  if (selected) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.container,
          { backgroundColor: colors.primary },
          disabled && styles.disabled,
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.wrapper,
        disabled && styles.disabled,
        style,
      ]}
    >
      <AdaptiveGlassView
        style={styles.container}
        glassEffectStyle="regular"
      >
        {content}
      </AdaptiveGlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 50,
    overflow: "hidden",
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
