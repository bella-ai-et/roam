import { useContext } from "react";
import { RevenueCatContext, RevenueCatContextValue } from "@/providers/RevenueCatProvider";

export function useSubscription(): RevenueCatContextValue {
  return useContext(RevenueCatContext);
}
