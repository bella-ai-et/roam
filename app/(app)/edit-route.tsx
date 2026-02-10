import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Modal } from "react-native";
import { RoutePlanner } from "@/components/planning/RoutePlanner";
import { useSubscription } from "@/hooks/useSubscription";
import { Paywall } from "@/components/Paywall";

export default function EditRouteScreen() {
  const router = useRouter();
  const { isPro } = useSubscription();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | undefined>();

  return (
    <>
      <RoutePlanner
        isPro={isPro}
        onComplete={() => router.back()}
        onBack={() => router.back()}
        title="Plan Route"
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
