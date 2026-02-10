import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme, AppColors } from "@/lib/theme";
import { useSubscription } from "@/hooks/useSubscription";

interface PaywallProps {
  onClose: () => void;
  /** Optional contextual message shown at the top (e.g. "You've reached the free limit") */
  message?: string;
}

const PRO_FEATURES = [
  { icon: "map-outline" as const, title: "Extended Route Planning", desc: "Plan up to 6 months ahead" },
  { icon: "location-outline" as const, title: "Unlimited Stopovers", desc: "Add as many stops as you want" },
  { icon: "heart-outline" as const, title: "More Daily Likes", desc: "Connect with more travelers" },
  { icon: "star-outline" as const, title: "Priority Matching", desc: "Get seen by more people on your route" },
];

export function Paywall({ onClose, message }: PaywallProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { offerings, purchasePackage, restorePurchases, loading } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);

  const currentOffering = offerings?.current;
  const packages = currentOffering?.availablePackages ?? [];

  const handlePurchase = async (pkg: (typeof packages)[number]) => {
    setPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        Alert.alert(
          "Welcome to Pro! 🎉",
          "All limits have been removed. Enjoy the full Roam experience.",
          [{ text: "Let's Go", onPress: onClose }]
        );
      }
    } catch {
      Alert.alert("Purchase Failed", "Something went wrong. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Alert.alert("Restored!", "Your Pro subscription has been restored.", [
          { text: "OK", onPress: onClose },
        ]);
      } else {
        Alert.alert("No Subscription Found", "We couldn't find an active subscription to restore.");
      }
    } catch {
      Alert.alert("Error", "Failed to restore purchases.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Close button */}
      <Pressable
        onPress={onClose}
        style={[styles.closeButton, { top: insets.top + 12 }]}
        hitSlop={16}
      >
        <Ionicons name="close" size={28} color={colors.onSurface} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.proBadge, { backgroundColor: AppColors.primary }]}>
            <Ionicons name="diamond" size={20} color="#fff" />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Unlock the full journey
          </Text>
          {message ? (
            <Text style={[styles.subtitle, { color: AppColors.accentOrange }]}>{message}</Text>
          ) : (
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Plan further, stop more, connect deeper.
            </Text>
          )}
        </View>

        {/* Features */}
        <View style={styles.features}>
          {PRO_FEATURES.map((f) => (
            <View key={f.title} style={[styles.featureRow, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}>
              <View style={[styles.featureIcon, { backgroundColor: `${AppColors.primary}20` }]}>
                <Ionicons name={f.icon} size={22} color={AppColors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.onSurface }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.onSurfaceVariant }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Packages / CTA */}
        {loading ? (
          <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 32 }} />
        ) : packages.length > 0 ? (
          <View style={styles.packages}>
            {packages.map((pkg) => (
              <Pressable
                key={pkg.identifier}
                style={[
                  styles.packageButton,
                  { backgroundColor: AppColors.primary, opacity: purchasing ? 0.7 : 1 },
                ]}
                onPress={() => handlePurchase(pkg)}
                disabled={purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.packageTitle}>
                      {pkg.product.title || "Pro"}
                    </Text>
                    <Text style={styles.packagePrice}>
                      {pkg.product.priceString} / {pkg.packageType === "ANNUAL" ? "year" : "month"}
                    </Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        ) : (
          /* No offerings available (e.g. dev environment without RevenueCat configured) */
          <View style={styles.packages}>
            <View style={[styles.devNotice, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}>
              <Ionicons name="construct-outline" size={20} color={colors.onSurfaceVariant} />
              <Text style={[styles.devNoticeText, { color: colors.onSurfaceVariant }]}>
                Subscriptions are not yet configured.{"\n"}You can continue on the free plan.
              </Text>
            </View>
            <Pressable
              style={[styles.packageButton, { backgroundColor: AppColors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.packageTitle}>Continue Free</Text>
            </Pressable>
          </View>
        )}

        {/* Restore */}
        <Pressable onPress={handleRestore} disabled={purchasing} style={styles.restoreButton}>
          <Text style={[styles.restoreText, { color: colors.onSurfaceVariant }]}>
            Restore Purchases
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  proBadgeText: {
    color: "#fff",
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  title: {
    fontFamily: "Outfit_700Bold",
    fontSize: 28,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  features: {
    gap: 12,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 16,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
  },
  packages: {
    gap: 12,
  },
  packageButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  packageTitle: {
    color: "#fff",
    fontFamily: "Outfit_700Bold",
    fontSize: 17,
  },
  packagePrice: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    marginTop: 2,
  },
  devNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  devNoticeText: {
    flex: 1,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  restoreButton: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 12,
  },
  restoreText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
