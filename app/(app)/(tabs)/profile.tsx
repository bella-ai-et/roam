import React from "react";
import ProfileScreenContent from "@/components/profile/ProfileScreenContent";
import { AnimatedScreen } from "@/components/ui/AnimatedScreen";

export default function ProfileScreen() { 
  return (
    <AnimatedScreen>
      <ProfileScreenContent />
    </AnimatedScreen>
  );
}
