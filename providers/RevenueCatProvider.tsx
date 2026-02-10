import React, { createContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { useUser } from "@clerk/clerk-expo";

const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? "";
const API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? "";

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

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  // Derive Pro status from entitlements
  const isPro = customerInfo?.entitlements.active["zelani Premium"]?.isActive === true;

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
      return info.entitlements.active["zelani Premium"]?.isActive === true;
    } catch {
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info.entitlements.active["zelani Premium"]?.isActive === true;
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
