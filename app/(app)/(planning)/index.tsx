import React, { useState } from "react";
import { Modal } from "react-native";
import { RoutePlanner } from "@/components/planning/RoutePlanner";
import { useSubscription } from "@/hooks/useSubscription";
import { Paywall } from "@/components/Paywall";

export default function FirstRouteSetupScreen() {
  const { isPro } = useSubscription();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | undefined>();

  return (
    <>
      <RoutePlanner
        isPro={isPro}
        title="Set Up Your Route"
        onComplete={() => {
          // Route saved → Convex reactivity updates the profile query →
          // _layout.tsx sees hasRoute = true → automatically switches to (tabs)
        }}
        onShowPaywall={(msg) => {
          setPaywallMessage(msg);
          setPaywallVisible(true);
        }}
      />
      <Modal visible={paywallVisible} animationType="slide" presentationStyle="pageSheet">
        <Paywall
          message={paywallMessage}
          onClose={() => setPaywallVisible(false)}
        />
      </Modal>
    </>
  );
}
