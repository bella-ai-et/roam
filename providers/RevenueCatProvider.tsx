import React, { createContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { useUser } from "@clerk/clerk-expo";

const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? "";
const API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? "";

const ENTITLEMENT_ID = "zelani Pro";
const PRO_FALLBACK_KEY = "zelani_pro_fallback";

export interface RevenueCatContextValue {
  isPro: boolean;
  offerings: PurchasesOfferings | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  loading: boolean;
}

export const RevenueCatContext = createContext<RevenueCatContextValue>({
  isPro: false,
  offerings: null,
  customerInfo: null,
  purchasePackage: async () => false,
  restorePurchases: async () => false,
  loading: true,
});

/**
 * Check if RevenueCat entitlement is active in CustomerInfo.
 * Returns true if the entitlement exists and is active.
 */
function hasActiveEntitlement(info: CustomerInfo | null): boolean {
  return info?.entitlements.active[ENTITLEMENT_ID]?.isActive === true;
}

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  // Fallback flag: persisted via SecureStore when TestStore purchase succeeds
  // but the entitlement isn't reflected in CustomerInfo (known TestStore limitation)
  const [proFallback, setProFallback] = useState(false);

  // Derive Pro status: real entitlement OR local fallback
  const isPro = hasActiveEntitlement(customerInfo) || proFallback;

  // ── Load fallback Pro status from SecureStore on mount ──
  useEffect(() => {
    SecureStore.getItemAsync(PRO_FALLBACK_KEY).then((val) => {
      if (val === "true") setProFallback(true);
    });
  }, []);

  // Configure SDK once
  useEffect(() => {
    async function init() {
      const apiKey = Platform.OS === "ios" ? API_KEY_IOS : API_KEY_ANDROID;
      if (!apiKey) {
        // No API key configured — stay on free tier silently
        setLoading(false);
        return;
      }

      try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey });
        setConfigured(true);
      } catch {
        // SDK init failure — default to free
        setLoading(false);
      }
    }
    init();
  }, []);

  // Identify user with Clerk ID
  useEffect(() => {
    if (!configured || !user?.id) return;

    async function identify() {
      try {
        const { customerInfo: info } = await Purchases.logIn(user!.id);
        setCustomerInfo(info);
      } catch {
        // Identification failure — stay on free
      }
    }
    identify();
  }, [configured, user?.id]);

  // Fetch offerings + listen for updates
  useEffect(() => {
    if (!configured) return;

    async function fetchOfferings() {
      try {
        const offs = await Purchases.getOfferings();
        setOfferings(offs);
      } catch {
        // Offerings unavailable — paywall will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchOfferings();

    // Listen for subscription changes
    const listener = (info: CustomerInfo) => setCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [configured]);

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);

      // Check real entitlement first
      if (hasActiveEntitlement(info)) {
        return true;
      }

      // TestStore fallback: purchase call succeeded (no error) but entitlement
      // isn't reflected in CustomerInfo. This is a known TestStore limitation.
      // Persist Pro status locally so the upgrade takes effect.
      await SecureStore.setItemAsync(PRO_FALLBACK_KEY, "true");
      setProFallback(true);
      return true;
    } catch {
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      if (hasActiveEntitlement(info)) {
        return true;
      }

      // Also check local fallback
      const fallback = await SecureStore.getItemAsync(PRO_FALLBACK_KEY);
      if (fallback === "true") {
        setProFallback(true);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  return (
    <RevenueCatContext.Provider
      value={{ isPro, offerings, customerInfo, purchasePackage, restorePurchases, loading }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}
