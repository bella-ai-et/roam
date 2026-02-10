import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";
import { useAppTheme, AppColors } from "@/lib/theme";
import { GlassButton, GlassInput } from "@/components/glass";

interface ReviewStepProps {
  name: string;
  dob: Date | undefined;
  gender: string;
  localPhotos: { id: string; uri: string }[];
  lookingFor: string[];
  travelStyles: string[];
  interests: string[];
  vanType: string | undefined;
  vanBuildStatus: string | undefined;
  lifestyleLabel: string;
  onChangeLifestyleLabel: (label: string) => void;
  saving: boolean;
  onSubmit: () => void;
}

export function ReviewStep({
  name,
  dob,
  gender,
  localPhotos,
  lookingFor,
  travelStyles,
  interests,
  vanType,
  vanBuildStatus,
  lifestyleLabel,
  onChangeLifestyleLabel,
  saving,
  onSubmit,
}: ReviewStepProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: 120 }]}
      >
        <Animated.Text
          entering={FadeInDown.delay(100).duration(500)}
          style={[styles.headline, { color: colors.onSurface }]}
        >
          You're all set
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(200).duration(500)}
          style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
        >
          Review your profile before submitting
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
          {/* Photo strip */}
          {localPhotos.length > 0 && (
            <View style={styles.photoStrip}>
              {localPhotos.slice(0, 3).map((p) => (
                <Image key={p.id} source={{ uri: p.uri }} style={styles.thumbPhoto} contentFit="cover" />
              ))}
              {localPhotos.length > 3 && (
                <View style={[styles.morePhotos, { backgroundColor: colors.primary }]}>
                  <Text style={styles.morePhotosText}>+{localPhotos.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          {/* Name + Gender */}
          <Text style={[styles.cardName, { color: colors.onSurface }]}>{name}</Text>
          <Text style={[styles.cardDetail, { color: colors.onSurfaceVariant }]}>
            {gender && gender.charAt(0).toUpperCase() + gender.slice(1).replace("_", "-")}
            {dob ? ` · ${format(dob, "MMM d, yyyy")}` : ""}
          </Text>

          {/* Looking For */}
          {lookingFor.length > 0 && (
            <View style={styles.tagRow}>
              {lookingFor.map((v) => (
                <View key={v} style={[styles.tag, { backgroundColor: `${AppColors.primary}20` }]}>
                  <Text style={[styles.tagText, { color: AppColors.primary }]}>{v.replace("_", " ")}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Travel styles + interests */}
          {travelStyles.length > 0 && (
            <View style={styles.tagRow}>
              {travelStyles.map((v) => (
                <View key={v} style={[styles.tag, { backgroundColor: `${colors.accentTeal}20` }]}>
                  <Text style={[styles.tagText, { color: colors.accentTeal }]}>{v}</Text>
                </View>
              ))}
            </View>
          )}

          {interests.length > 0 && (
            <View style={styles.tagRow}>
              {interests.map((v) => (
                <View key={v} style={[styles.tag, { backgroundColor: `${colors.accentGreen}20` }]}>
                  <Text style={[styles.tagText, { color: colors.accentGreen }]}>{v}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Van info */}
          {(vanType || vanBuildStatus) && (
            <View style={styles.vanRow}>
              <Ionicons name="car-outline" size={16} color={colors.onSurfaceVariant} />
              <Text style={[styles.cardDetail, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>
                {vanType}{vanBuildStatus ? ` · ${vanBuildStatus}` : ""}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Optional lifestyle label */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.labelSection}>
          <GlassInput
            label="Add a tagline (optional)"
            placeholder="Vanlife · Remote Developer"
            value={lifestyleLabel}
            onChangeText={onChangeLifestyleLabel}
          />
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <GlassButton
          title={saving ? "Submitting..." : "Submit Application"}
          onPress={onSubmit}
          loading={saving}
          disabled={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 32,
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  photoStrip: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  thumbPhoto: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  morePhotos: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  morePhotosText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  cardName: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 14,
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  vanRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  labelSection: {
    marginTop: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingTop: 16,
  },
});
