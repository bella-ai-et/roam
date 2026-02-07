import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";

type ActionButtonsProps = {
  onReject: () => void;
  onLike: () => void;
  bottomOffset?: number;
};

export function ActionButtons({ onReject, onLike, bottomOffset = 0 }: ActionButtonsProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View style={styles.row}>
        <Pressable
          onPress={onReject}
          style={({ pressed }) => [
            styles.rejectButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.background,
              shadowColor: "#000",
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Reject"
        >
          <Ionicons name="close" size={36} color={colors.onSurfaceVariant} />
        </Pressable>

        <Pressable
          onPress={onLike}
          style={({ pressed }) => [
            styles.likeButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Like"
        >
          <Ionicons name="heart" size={34} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  rejectButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  likeButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 26,
    elevation: 14,
  },
});
