import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useAppTheme } from "@/lib/theme";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hapticSelection, hapticSuccess } from "@/lib/haptics";
import { api } from "@/convex/_generated/api";

export function VanVerificationCard() {
  const { colors } = useAppTheme();
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
      const image = await pickImage();
      if (!image) return;
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

  // Already verified — show completed state
  if (isVerified && !localUri) {
    return (
      <View style={[styles.card, styles.cardCompleted]}>
        <View style={styles.row}>
          <View style={[styles.iconCircle, styles.iconCompleted]}>
            <Ionicons name="checkmark-circle" size={20} color="#4CD964" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.completedTitle}>Van verified</Text>
            <Text style={styles.completedSubtitle}>Your van photo is on file</Text>
          </View>
        </View>
      </View>
    );
  }

  // Just uploaded — show submitted state
  if (localUri) {
    return (
      <View style={[styles.card, styles.cardSubmitted]}>
        <View style={styles.row}>
          <Image source={{ uri: localUri }} style={styles.thumbnail} contentFit="cover" />
          <View style={styles.textContainer}>
            <Text style={styles.submittedTitle}>Van photo submitted</Text>
            <Text style={styles.submittedSubtitle}>We'll review it shortly — thanks for helping keep our community safe!</Text>
          </View>
          <Ionicons name="time-outline" size={24} color="#F5A623" />
        </View>
      </View>
    );
  }

  // Not verified — show upload prompt
  return (
    <View style={[styles.card, { borderColor: "rgba(232,146,74,0.25)" }]}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: "rgba(232,146,74,0.18)" }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#E8924A" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Verify your van</Text>
          <Text style={styles.subtitle}>
            Upload a photo of your van to speed up your approval
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleUpload}
        disabled={uploading}
        style={styles.uploadButton}
      >
        <Ionicons name="camera-outline" size={18} color="#fff" />
        <Text style={styles.uploadButtonText}>
          {uploading ? "Uploading..." : "Upload Photo"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(232,146,74,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,146,74,0.25)",
    gap: 12,
  },
  cardCompleted: {
    backgroundColor: "rgba(76,217,100,0.08)",
    borderColor: "rgba(76,217,100,0.25)",
  },
  cardSubmitted: {
    backgroundColor: "rgba(245,166,35,0.08)",
    borderColor: "rgba(245,166,35,0.25)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCompleted: {
    backgroundColor: "rgba(76,217,100,0.18)",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E8924A",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "#C4813F",
    lineHeight: 17,
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4CD964",
    marginBottom: 2,
  },
  completedSubtitle: {
    fontSize: 12,
    color: "#3DAA50",
    lineHeight: 17,
  },
  submittedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F5A623",
    marginBottom: 2,
  },
  submittedSubtitle: {
    fontSize: 12,
    color: "#C4893F",
    lineHeight: 17,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8924A",
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
