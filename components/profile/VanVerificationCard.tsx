import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import Animated, { FadeInDown, FadeIn, ZoomIn } from "react-native-reanimated";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useAppTheme } from "@/lib/theme";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hapticSelection, hapticSuccess } from "@/lib/haptics";
import { api } from "@/convex/_generated/api";

export function VanVerificationCard() {
  const { isDark } = useAppTheme();
  const { currentUser } = useCurrentUser();
  const { pickImage, uploadPhoto } = usePhotoPicker({ aspect: [3, 4], quality: 0.8 });
  const updateProfile = useMutation(api.users.updateProfile);
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const isVerified = !!currentUser?.vanPhotoUrl;

  const handleUpload = async () => {
    if (!currentUser?._id) return;
    try {
      setUploading(true);
      hapticSelection();
      const image = await pickImage();
      if (!image) { setUploading(false); return; }
      const storageId = await uploadPhoto(image);
      setLocalUri(image.uri);
      await updateProfile({ userId: currentUser._id, vanPhotoUrl: storageId });
      hapticSuccess();
    } catch {
      Alert.alert("Error", "Failed to upload van photo.");
    } finally {
      setUploading(false);
    }
  };

  // ── Already verified ──
  if (isVerified && !localUri) {
    return (
      <Animated.View
        entering={FadeInDown.delay(300).duration(500).springify().damping(18)}
        style={[styles.card, isDark ? styles.cardDark : styles.verifyCardLight]}
      >
        <View style={styles.completedRow}>
          <Animated.View entering={ZoomIn.delay(500).duration(400)} style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.completedTitle, isDark && { color: "#6EE7B7" }]}>
              Van Verified
            </Text>
            <Text style={[styles.completedSubtitle, isDark && { color: "#6B8068" }]}>
              Your van photo is on file — you're all set!
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ── Just uploaded — pending review ──
  if (localUri) {
    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.card, isDark ? styles.cardDark : styles.verifyCardLight]}
      >
        <View style={styles.submittedRow}>
          <Image source={{ uri: localUri }} style={styles.thumbnail} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
              Photo Submitted
            </Text>
            <Text style={[styles.cardDescription, isDark && styles.cardDescDark]}>
              We'll review it shortly — thanks for helping keep our community trusted!
            </Text>
          </View>
        </View>
        <View style={styles.submittedStatusRow}>
          <View style={styles.submittedDot} />
          <Text style={styles.submittedStatusText}>Under review</Text>
        </View>
      </Animated.View>
    );
  }

  // ── Not verified — upload prompt ──
  return (
    <Animated.View
      entering={FadeInDown.delay(350).duration(500).springify().damping(18)}
      style={[styles.card, isDark ? styles.cardDark : styles.verifyCardLight]}
    >
      {/* Icon badge */}
      <View style={[styles.iconBadge, styles.verifyIconBg]}>
        <Ionicons name="shield-checkmark-outline" size={22} color="#0D9488" />
      </View>

      <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
        Verify Your Van
      </Text>
      <Text style={[styles.cardDescription, isDark && styles.cardDescDark]}>
        A quick photo of your van helps us verify your identity and speeds up approval.
      </Text>

      <Pressable
        onPress={handleUpload}
        disabled={uploading}
        style={[styles.ctaButton, styles.verifyCta, uploading && styles.ctaDisabled]}
      >
        <Ionicons name="camera-outline" size={18} color="#fff" />
        <Text style={styles.ctaText}>
          {uploading ? "Uploading..." : "Upload Van Photo"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  /* Card base */
  card: {
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  verifyCardLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6F5F3",
  },

  /* Icon badge */
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  verifyIconBg: {
    backgroundColor: "#CCFBF1",
  },

  /* Card text */
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.3,
  },
  cardTitleDark: {
    color: "#F0EDE8",
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5F7A6E",
    fontWeight: "400",
  },
  cardDescDark: {
    color: "#8DA898",
  },

  /* CTA button */
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    marginTop: 4,
  },
  verifyCta: {
    backgroundColor: "#0D9488",
  },
  ctaDisabled: {
    opacity: 0.55,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  /* Completed state */
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  completedBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 2,
  },
  completedSubtitle: {
    fontSize: 13,
    color: "#6B8068",
    lineHeight: 18,
  },

  /* Submitted state */
  submittedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  submittedStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },
  submittedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F5A623",
  },
  submittedStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B8860B",
  },
});
