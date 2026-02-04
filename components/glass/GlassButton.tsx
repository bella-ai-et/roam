import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AdaptiveGlassView } from "@/lib/glass";
import { useAppTheme } from "@/lib/theme";
import { hapticButtonPress } from "@/lib/haptics";

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function GlassButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: GlassButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    hapticButtonPress();
    onPress();
  };

  const renderContent = () => (
    <>
      {loading ? (
        <Text style={[styles.text, styles.primaryText]}>...</Text>
      ) : (
        <Text
          style={[
            styles.text,
            variant === "primary"
              ? styles.primaryText
              : { color: colors.onBackground },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </>
  );

  if (variant === "primary") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={[
          styles.container,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={["#E8724A", "#D45A2E"]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderContent()}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={[
        styles.container,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <AdaptiveGlassView
        style={styles.secondaryContainer}
        glassEffectStyle="regular"
      >
        {renderContent()}
      </AdaptiveGlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    width: "100%",
  },
  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 28,
  },
  text: {
    fontSize: 17,
    fontWeight: "700",
  },
  primaryText: {
    color: "#FFFFFF",
  },
  disabled: {
    opacity: 0.5,
  },
});
