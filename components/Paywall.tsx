import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColors } from "@/lib/theme";
import { useSubscription } from "@/hooks/useSubscription";

interface PaywallProps {
  onClose: () => void;
  /** Optional contextual message shown at the top (e.g. "You've reached the free limit") */
  message?: string;
}

/* ── Gold accent ── */
const GOLD = "#D4A04A";
const GOLD_DARK = "#B8882E";

/* ── Feature rows ── */
const FEATURES: { label: string; free: string | null; pro: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Daily likes", free: "5 per day", pro: "Unlimited", icon: "heart-outline" },
  { label: "Route stops", free: "1–2 stops", pro: "Unlimited", icon: "navigate-outline" },
  { label: "Route planning", free: "2 weeks ahead", pro: "6 months ahead", icon: "calendar-outline" },
  { label: "Saved routes", free: "1 route", pro: "Unlimited", icon: "map-outline" },
  { label: "Profile boost", free: null, pro: "Priority visibility", icon: "trending-up-outline" },
];

export function Paywall({ onClose, message }: PaywallProps) {
  const insets = useSafeAreaInsets();
  const { offerings, purchasePackage, restorePurchases, loading } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"ANNUAL" | "MONTHLY">("ANNUAL");

  const currentOffering = offerings?.current;
  const packages = currentOffering?.availablePackages ?? [];
  const annualPkg = packages.find((p) => p.packageType === "ANNUAL");
  const monthlyPkg = packages.find((p) => p.packageType === "MONTHLY");
  const activePkg = selectedPlan === "ANNUAL" ? annualPkg : monthlyPkg;

  const handlePurchase = async () => {
    if (!activePkg) return;
    setPurchasing(true);
    try {
      const success = await purchasePackage(activePkg);
      if (success) {
        Alert.alert(
          "Welcome to Pro! 🎉",
          "All limits have been removed. Enjoy the full Zelani experience.",
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
    <LinearGradient
      colors={[AppColors.background.dark, "#1A1510", AppColors.background.dark]}
      style={styles.container}
    >
      {/* Warm glow — same as sign-in */}
      <View style={styles.glow} />

      {/* Close */}
      <Pressable
        onPress={onClose}
        style={[styles.closeButton, { top: insets.top + 12 }]}
        hitSlop={16}
      >
        <View style={styles.closeCircle}>
          <Ionicons name="close" size={20} color="#999" />
        </View>
      </Pressable>

      {/* Content — vertically centred, no scroll needed */}
      <View style={[styles.content, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}>

        {/* ─── Hero ─── */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroSection}>
          {/* Diamond icon */}
          <LinearGradient
            colors={[GOLD, GOLD_DARK]}
            style={styles.iconBadge}
          >
            <Ionicons name="diamond" size={28} color="#fff" />
          </LinearGradient>

          <Text style={styles.heroTitle}>Zelani Pro</Text>
          <Text style={styles.heroSubtitle}>
            {message || "Unlock the full experience — go further, match more."}
          </Text>
        </Animated.View>

        {/* ─── Features ─── */}
        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={f.label} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon} size={18} color={GOLD} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <View style={styles.featureValues}>
                  {f.free ? (
                    <Text style={styles.featureFree}>{f.free}</Text>
                  ) : (
                    <Text style={styles.featureFreeNone}>—</Text>
                  )}
                  <Ionicons name="arrow-forward" size={12} color="#555" style={{ marginHorizontal: 8 }} />
                  <Text style={styles.featurePro}>{f.pro}</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ─── Plan selector + CTA ─── */}
        <Animated.View entering={FadeIn.delay(450).duration(400)} style={styles.ctaArea}>
          {loading ? (
            <ActivityIndicator size="small" color={GOLD} style={{ marginVertical: 20 }} />
          ) : packages.length > 0 ? (
            <>
              {/* Plan pills */}
              <View style={styles.planRow}>
                {annualPkg && (
                  <Pressable
                    onPress={() => setSelectedPlan("ANNUAL")}
                    style={[
                      styles.planPill,
                      selectedPlan === "ANNUAL" && styles.planPillActive,
                    ]}
                  >
                    <Text style={[styles.planPillLabel, selectedPlan === "ANNUAL" && styles.planPillLabelActive]}>
                      Yearly
                    </Text>
                    <Text style={[styles.planPillPrice, selectedPlan === "ANNUAL" && styles.planPillPriceActive]}>
                      {annualPkg.product.priceString}
                    </Text>
                    {selectedPlan === "ANNUAL" && (
                      <View style={styles.saveBadge}>
                        <Text style={styles.saveBadgeText}>SAVE 24%</Text>
                      </View>
                    )}
                  </Pressable>
                )}
                {monthlyPkg && (
                  <Pressable
                    onPress={() => setSelectedPlan("MONTHLY")}
                    style={[
                      styles.planPill,
                      selectedPlan === "MONTHLY" && styles.planPillActive,
                    ]}
                  >
                    <Text style={[styles.planPillLabel, selectedPlan === "MONTHLY" && styles.planPillLabelActive]}>
                      Monthly
                    </Text>
                    <Text style={[styles.planPillPrice, selectedPlan === "MONTHLY" && styles.planPillPriceActive]}>
                      {monthlyPkg.product.priceString}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* CTA */}
              <Pressable
                style={[styles.ctaButton, { opacity: purchasing ? 0.6 : 1 }]}
                onPress={handlePurchase}
                disabled={purchasing}
              >
                <LinearGradient
                  colors={[GOLD, GOLD_DARK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaGradient}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.ctaText}>Continue with Pro</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            /* Store unavailable */
            <View style={styles.storeNotice}>
              <Ionicons name="cloud-offline-outline" size={18} color="#777" />
              <Text style={styles.storeNoticeText}>
                Unable to connect to the store. Please try again later.
              </Text>
            </View>
          )}

          {/* Footer links */}
          <View style={styles.footerRow}>
            <Pressable onPress={handleRestore} disabled={purchasing}>
              <Text style={styles.footerLink}>Restore Purchases</Text>
            </Pressable>
            <Text style={styles.footerDot}>·</Text>
            <Text style={styles.footerMuted}>Cancel anytime</Text>
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    top: -100,
    alignSelf: "center",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(212,160,74,0.10)",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    zIndex: 10,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },

  /* ── Hero ── */
  heroSection: {
    alignItems: "center",
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 32,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },

  /* ── Features ── */
  featureList: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  featureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(212,160,74,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextWrap: {
    flex: 1,
  },
  featureLabel: {
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    color: "#E0DDD8",
    marginBottom: 2,
  },
  featureValues: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureFree: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: "#666",
  },
  featureFreeNone: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: "#444",
  },
  featurePro: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    color: GOLD,
  },

  /* ── CTA area ── */
  ctaArea: {
    gap: 14,
  },

  /* Plan pills */
  planRow: {
    flexDirection: "row",
    gap: 10,
  },
  planPill: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
  },
  planPillActive: {
    borderColor: GOLD,
    borderWidth: 1.5,
    backgroundColor: "rgba(212,160,74,0.08)",
  },
  planPillLabel: {
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
    color: "#777",
    marginBottom: 4,
  },
  planPillLabelActive: {
    color: "#CCC",
  },
  planPillPrice: {
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    color: "#999",
  },
  planPillPriceActive: {
    color: "#FFFFFF",
  },
  saveBadge: {
    backgroundColor: GOLD,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  saveBadgeText: {
    color: "#fff",
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    letterSpacing: 0.5,
  },

  /* CTA button */
  ctaButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  ctaText: {
    color: "#fff",
    fontFamily: "Outfit_700Bold",
    fontSize: 17,
  },

  /* Store notice */
  storeNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
  storeNoticeText: {
    flex: 1,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  /* Footer */
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  footerLink: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: "#777",
    textDecorationLine: "underline",
  },
  footerDot: {
    color: "#555",
    fontSize: 13,
  },
  footerMuted: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: "#555",
  },
});
