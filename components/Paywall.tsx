import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme, AppColors } from "@/lib/theme";
import { useSubscription } from "@/hooks/useSubscription";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface PaywallProps {
  onClose: () => void;
  /** Optional contextual message shown at the top (e.g. "You've reached the free limit") */
  message?: string;
}

/* ── Premium gold accent for Pro elements ── */
const GOLD = "#D4A04A";
const GOLD_LIGHT = "#F5E6C8";
const GOLD_DARK = "#B8882E";

/* ── Comparison data ── */
const COMPARISON_ROWS = [
  { label: "Daily likes", free: "5", pro: "Unlimited", icon: "heart" as const },
  { label: "Route planning", free: "1–2 weeks", pro: "Up to 6 months", icon: "calendar" as const },
  { label: "Stops per route", free: "1–2", pro: "Unlimited", icon: "location" as const },
  { label: "Routes", free: "1 route", pro: "Unlimited", icon: "map" as const },
  { label: "Profile boost", free: "—", pro: "✓", icon: "trending-up" as const },
];

export function Paywall({ onClose, message }: PaywallProps) {
  const { colors, isDark } = useAppTheme();
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

  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
  const borderSubtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const proHighlight = isDark ? "rgba(212,160,74,0.12)" : "rgba(212,160,74,0.08)";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Close button */}
      <Pressable
        onPress={onClose}
        style={[styles.closeButton, { top: insets.top + 12 }]}
        hitSlop={16}
      >
        <View style={[styles.closeCircle, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)" }]}>
          <Ionicons name="close" size={22} color={colors.onSurface} />
        </View>
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ── */}
        <LinearGradient
          colors={isDark
            ? ["rgba(212,160,74,0.15)", "rgba(210,124,92,0.10)", "transparent"]
            : ["rgba(212,160,74,0.18)", "rgba(210,124,92,0.08)", "transparent"]
          }
          style={[styles.hero, { paddingTop: insets.top + 56 }]}
        >
          {/* Route illustration */}
          <View style={styles.routeIllustration}>
            <View style={styles.routeDots}>
              <View style={[styles.routeDot, { backgroundColor: colors.onSurfaceVariant }]} />
              <View style={[styles.routeLine, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)" }]} />
              <View style={[styles.routeDot, { backgroundColor: colors.onSurfaceVariant }]} />
              <View style={[styles.routeLine, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)" }]} />
              <View style={[styles.routeDotPro, { backgroundColor: GOLD }]}>
                <Ionicons name="star" size={10} color="#fff" />
              </View>
              <View style={[styles.routeLinePro, { backgroundColor: GOLD }]} />
              <View style={[styles.routeDotPro, { backgroundColor: GOLD }]}>
                <Ionicons name="star" size={10} color="#fff" />
              </View>
              <View style={[styles.routeLinePro, { backgroundColor: GOLD }]} />
              <View style={[styles.routeDotPro, { backgroundColor: GOLD }]}>
                <Ionicons name="star" size={10} color="#fff" />
              </View>
            </View>
            <View style={styles.routeLabels}>
              <Text style={[styles.routeLabelFree, { color: colors.onSurfaceVariant }]}>Free</Text>
              <Text style={[styles.routeLabelPro, { color: GOLD }]}>Pro</Text>
            </View>
          </View>

          {/* Pro badge */}
          <View style={[styles.proBadge, { backgroundColor: GOLD }]}>
            <Ionicons name="diamond" size={16} color="#fff" />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>

          <Text style={[styles.heroTitle, { color: colors.onSurface }]}>
            Go further.{"\n"}Match more.
          </Text>

          {message ? (
            <View style={[styles.limitBanner, { backgroundColor: isDark ? "rgba(232,155,116,0.15)" : "rgba(232,155,116,0.12)" }]}>
              <Ionicons name="alert-circle" size={18} color={AppColors.accentOrange} />
              <Text style={[styles.limitBannerText, { color: AppColors.accentOrange }]}>{message}</Text>
            </View>
          ) : (
            <Text style={[styles.heroSubtitle, { color: colors.onSurfaceVariant }]}>
              Plan ahead, add more stops, and unlock{"\n"}more matches along your route.
            </Text>
          )}
        </LinearGradient>

        {/* ── Boost Callout ── */}
        <View style={[styles.boostCard, { backgroundColor: proHighlight, borderColor: isDark ? "rgba(212,160,74,0.20)" : "rgba(212,160,74,0.25)" }]}>
          <View style={[styles.boostIconWrap, { backgroundColor: GOLD }]}>
            <Ionicons name="rocket" size={20} color="#fff" />
          </View>
          <View style={styles.boostTextWrap}>
            <Text style={[styles.boostTitle, { color: colors.onSurface }]}>Plan ahead = Profile boost</Text>
            <Text style={[styles.boostDesc, { color: colors.onSurfaceVariant }]}>
              Pro lets you plan months ahead — putting your profile in front of more travelers heading your way.
            </Text>
          </View>
        </View>

        {/* ── Free vs Pro Comparison ── */}
        <View style={styles.comparisonSection}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Free vs Pro</Text>

          <View style={[styles.comparisonCard, { backgroundColor: cardBg, borderColor: borderSubtle }]}>
            {/* Column headers */}
            <View style={[styles.compRow, styles.compHeader]}>
              <View style={styles.compLabelCol} />
              <View style={styles.compValueCol}>
                <Text style={[styles.compHeaderText, { color: colors.onSurfaceVariant }]}>Free</Text>
              </View>
              <View style={[styles.compValueCol, styles.compProCol, { backgroundColor: proHighlight }]}>
                <Text style={[styles.compHeaderText, { color: GOLD }]}>Pro</Text>
              </View>
            </View>

            {COMPARISON_ROWS.map((row, i) => (
              <View
                key={row.label}
                style={[
                  styles.compRow,
                  i < COMPARISON_ROWS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderSubtle },
                ]}
              >
                <View style={styles.compLabelCol}>
                  <Ionicons name={row.icon} size={16} color={colors.onSurfaceVariant} style={{ marginRight: 8 }} />
                  <Text style={[styles.compLabel, { color: colors.onSurface }]}>{row.label}</Text>
                </View>
                <View style={styles.compValueCol}>
                  <Text style={[styles.compFreeValue, { color: colors.onSurfaceVariant }]}>{row.free}</Text>
                </View>
                <View style={[styles.compValueCol, styles.compProCol, { backgroundColor: proHighlight }]}>
                  <Text style={[styles.compProValue, { color: isDark ? GOLD_LIGHT : GOLD_DARK }]}>{row.pro}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Plan Selector & CTA ── */}
        {loading ? (
          <ActivityIndicator size="large" color={GOLD} style={{ marginTop: 32 }} />
        ) : packages.length > 0 ? (
          <View style={styles.ctaSection}>
            {/* Plan toggle cards */}
            <View style={styles.planToggle}>
              {/* Yearly */}
              {annualPkg && (
                <Pressable
                  onPress={() => setSelectedPlan("ANNUAL")}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: selectedPlan === "ANNUAL" ? (isDark ? "rgba(212,160,74,0.12)" : "rgba(212,160,74,0.08)") : cardBg,
                      borderColor: selectedPlan === "ANNUAL" ? GOLD : borderSubtle,
                      borderWidth: selectedPlan === "ANNUAL" ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.planCardHeader}>
                    <View style={[styles.planRadio, selectedPlan === "ANNUAL" && { borderColor: GOLD }]}>
                      {selectedPlan === "ANNUAL" && <View style={[styles.planRadioInner, { backgroundColor: GOLD }]} />}
                    </View>
                    <Text style={[styles.planName, { color: colors.onSurface }]}>Yearly</Text>
                    <View style={[styles.saveBadge, { backgroundColor: GOLD }]}>
                      <Text style={styles.saveBadgeText}>SAVE 24%</Text>
                    </View>
                  </View>
                  <Text style={[styles.planPrice, { color: colors.onSurface }]}>
                    {annualPkg.product.priceString}
                    <Text style={[styles.planPeriod, { color: colors.onSurfaceVariant }]}> /year</Text>
                  </Text>
                  <Text style={[styles.planSubPrice, { color: colors.onSurfaceVariant }]}>
                    ≈ $7.58/mo
                  </Text>
                </Pressable>
              )}

              {/* Monthly */}
              {monthlyPkg && (
                <Pressable
                  onPress={() => setSelectedPlan("MONTHLY")}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: selectedPlan === "MONTHLY" ? (isDark ? "rgba(212,160,74,0.12)" : "rgba(212,160,74,0.08)") : cardBg,
                      borderColor: selectedPlan === "MONTHLY" ? GOLD : borderSubtle,
                      borderWidth: selectedPlan === "MONTHLY" ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.planCardHeader}>
                    <View style={[styles.planRadio, selectedPlan === "MONTHLY" && { borderColor: GOLD }]}>
                      {selectedPlan === "MONTHLY" && <View style={[styles.planRadioInner, { backgroundColor: GOLD }]} />}
                    </View>
                    <Text style={[styles.planName, { color: colors.onSurface }]}>Monthly</Text>
                  </View>
                  <Text style={[styles.planPrice, { color: colors.onSurface }]}>
                    {monthlyPkg.product.priceString}
                    <Text style={[styles.planPeriod, { color: colors.onSurfaceVariant }]}> /month</Text>
                  </Text>
                </Pressable>
              )}
            </View>

            {/* CTA Button */}
            <Pressable
              style={[styles.ctaButton, { opacity: purchasing ? 0.7 : 1 }]}
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
                  <>
                    <Ionicons name="diamond" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.ctaText}>
                      Upgrade to Pro
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Terms line */}
            <Text style={[styles.termsText, { color: colors.onSurfaceVariant }]}>
              Cancel anytime. Subscription renews automatically.
            </Text>
          </View>
        ) : (
          /* Offerings unavailable — store connection issue */
          <View style={styles.ctaSection}>
            <View style={[styles.storeNotice, { backgroundColor: cardBg, borderColor: borderSubtle }]}>
              <Ionicons name="cloud-offline-outline" size={22} color={colors.onSurfaceVariant} />
              <Text style={[styles.storeNoticeText, { color: colors.onSurfaceVariant }]}>
                Unable to connect to the store right now.{"\n"}Please check your connection and try again.
              </Text>
            </View>
            <Pressable
              style={styles.ctaButton}
              onPress={onClose}
            >
              <LinearGradient
                colors={[GOLD, GOLD_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>Close</Text>
              </LinearGradient>
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
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 0,
  },

  /* ── Hero ── */
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: "center",
  },
  routeIllustration: {
    marginBottom: 20,
    alignItems: "center",
  },
  routeDots: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 20,
    height: 2,
  },
  routeDotPro: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  routeLinePro: {
    width: 24,
    height: 2.5,
  },
  routeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 6,
    paddingHorizontal: 10,
  },
  routeLabelFree: {
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  routeLabelPro: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
    marginBottom: 16,
  },
  proBadgeText: {
    color: "#fff",
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 30,
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  limitBannerText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    flex: 1,
  },

  /* ── Boost Callout ── */
  boostCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    alignItems: "center",
  },
  boostIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  boostTextWrap: {
    flex: 1,
  },
  boostTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 15,
    marginBottom: 3,
  },
  boostDesc: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },

  /* ── Comparison ── */
  comparisonSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    marginBottom: 12,
  },
  comparisonCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  compHeader: {
    minHeight: 36,
  },
  compLabelCol: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingVertical: 10,
  },
  compValueCol: {
    flex: 0.7,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  compProCol: {
    borderTopRightRadius: 0,
  },
  compHeaderText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  compLabel: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
  },
  compFreeValue: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
  },
  compProValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 13,
  },

  /* ── Plan Toggle ── */
  ctaSection: {
    paddingHorizontal: 20,
  },
  planToggle: {
    gap: 10,
    marginBottom: 16,
  },
  planCard: {
    padding: 16,
    borderRadius: 16,
  },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(150,150,150,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planName: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 16,
    flex: 1,
  },
  saveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saveBadgeText: {
    color: "#fff",
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  planPrice: {
    fontFamily: "Outfit_700Bold",
    fontSize: 22,
    marginLeft: 30,
  },
  planPeriod: {
    fontFamily: "Outfit_400Regular",
    fontSize: 15,
  },
  planSubPrice: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    marginLeft: 30,
    marginTop: 2,
  },

  /* ── CTA Button ── */
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
    fontSize: 18,
  },
  termsText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },

  /* ── Store notice ── */
  storeNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  storeNoticeText: {
    flex: 1,
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },

  /* ── Restore ── */
  restoreButton: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 12,
  },
  restoreText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
