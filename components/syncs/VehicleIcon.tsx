import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { VEHICLE_ICONS } from "@/lib/constants";

type VehicleIconProps = {
  vanType?: string | null;
  size?: number;
  color?: string;
};

export function VehicleIcon({ vanType, size = 14, color = "#94A3B8" }: VehicleIconProps) {
  if (!vanType) return null;

  const entry = VEHICLE_ICONS[vanType.toLowerCase()];
  const iconName = entry?.icon ?? "car-outline";

  return <Ionicons name={iconName as any} size={size} color={color} />;
}
