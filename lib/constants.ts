import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
export const CARD_WIDTH = SCREEN_WIDTH - 32;
export const CARD_SPACING = 12;
export const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
export const ROTATION_ANGLE = 15;

/** Discovery UI – card radius, photo height, action button sizes */
export const DISCOVERY_CARD_RADIUS = 40;
export const DISCOVERY_PHOTO_HEIGHT = 320;
export const ACTION_BUTTON_REJECT_SIZE = 72;
export const ACTION_BUTTON_LIKE_SIZE = 80;
export const JOURNEY_STOP_CARD_WIDTH = 144;
export const MINI_MAP_SIZE = 112;

export const INTERESTS = [
  { name: "Hiking", emoji: "🥾" },
  { name: "Rock Climbing", emoji: "🧗" },
  { name: "Skiing", emoji: "⛷️" },
  { name: "Surfing", emoji: "🏄" },
  { name: "Mountain Biking", emoji: "🚵" },
  { name: "Kayaking", emoji: "🛶" },
  { name: "Photography", emoji: "📸" },
  { name: "Cooking", emoji: "🍳" },
  { name: "Music", emoji: "🎵" },
  { name: "Reading", emoji: "📚" },
  { name: "Yoga", emoji: "🧘" },
  { name: "Fishing", emoji: "🎣" },
  { name: "Stargazing", emoji: "🌌" },
  { name: "Trail Running", emoji: "🏃" },
  { name: "Campfires", emoji: "🔥" },
  { name: "Wildlife", emoji: "🦅" },
  { name: "Diving", emoji: "🤿" },
  { name: "Backpacking", emoji: "🎒" },
  { name: "Skateboarding", emoji: "🛹" },
  { name: "Swimming", emoji: "🏊" },
  { name: "Specialty Coffee", emoji: "☕" },
  { name: "Solar Tech", emoji: "🔌" },
] as const;

/** Travel styles for discovery and onboarding (e.g. Vanlife, Off-roading) */
export const TRAVEL_STYLES = [
  { value: "vanlife", label: "Vanlife", emoji: "🚐" },
  { value: "offroading", label: "Off-roading", emoji: "🏔️" },
  { value: "overlanding", label: "Overlanding", emoji: "🗺️" },
  { value: "roadtrips", label: "Road trips", emoji: "🛣️" },
  { value: "minimalist", label: "Minimalist", emoji: "🧘" },
  { value: "digital_nomad", label: "Digital nomad", emoji: "💻" },
  { value: "boondocking", label: "Boondocking", emoji: "🌲" },
  { value: "camping", label: "Camping", emoji: "⛺" },
] as const;
export type TravelStyle = (typeof TRAVEL_STYLES)[number]["value"];

export const INTEREST_NAMES = INTERESTS.map((i) => i.name);
export type InterestName = (typeof INTEREST_NAMES)[number];
export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 6;

export const VAN_TYPES = [
  { value: "sprinter", label: "Sprinter", emoji: "🚐" },
  { value: "promaster", label: "Promaster", emoji: "🚌" },
  { value: "transit", label: "Transit", emoji: "🚐" },
  { value: "diy", label: "DIY Build", emoji: "🔧" },
  { value: "rv", label: "RV / Motorhome", emoji: "🏕️" },
  { value: "truck", label: "Truck + Camper", emoji: "🛻" },
  { value: "skoolie", label: "Skoolie", emoji: "🚌" },
  { value: "other", label: "Other", emoji: "🚗" },
] as const;
export type VanType = (typeof VAN_TYPES)[number]["value"];

export const VAN_BUILD_STATUSES = [
  { value: "living", label: "Living full-time", emoji: "🏠" },
  { value: "building", label: "Currently building", emoji: "🔨" },
  { value: "planning", label: "Planning my build", emoji: "📐" },
] as const;
export type VanBuildStatus = (typeof VAN_BUILD_STATUSES)[number]["value"];

export const LOOKING_FOR_OPTIONS = [
  { value: "dating", label: "Dating", emoji: "💛" },
  { value: "friends", label: "Friends", emoji: "🤝" },
  { value: "vanhelp", label: "Van Help", emoji: "🔧" },
] as const;
export type LookingFor = (typeof LOOKING_FOR_OPTIONS)[number]["value"];

export const GENDERS = [
  { value: "woman", label: "Woman", icon: "♀" },
  { value: "man", label: "Man", icon: "♂" },
  { value: "nonbinary", label: "Non-binary", icon: "⚧" },
] as const;
export type Gender = (typeof GENDERS)[number]["value"];

export const BUILD_CATEGORIES = [
  { value: "electrical", label: "Electrical", emoji: "⚡" },
  { value: "plumbing", label: "Plumbing", emoji: "💧" },
  { value: "solar", label: "Solar", emoji: "☀️" },
  { value: "interior", label: "Interior", emoji: "🛋️" },
  { value: "mechanical", label: "Mechanical", emoji: "🔧" },
  { value: "insulation", label: "Insulation", emoji: "🧱" },
  { value: "ventilation", label: "Ventilation", emoji: "💨" },
  { value: "showcase", label: "Showcase", emoji: "✨" },
  { value: "remote_work", label: "Remote Work", emoji: "💻" },
] as const;
export type BuildCategory = (typeof BUILD_CATEGORIES)[number]["value"];

/** Vehicle icon mapping for Syncs screen – maps vanType to Ionicons */
export const VEHICLE_ICONS: Record<string, { icon: string; label: string }> = {
  sprinter:  { icon: "bus-outline",     label: "Van" },
  promaster: { icon: "bus-outline",     label: "Van" },
  transit:   { icon: "bus-outline",     label: "Van" },
  diy:       { icon: "bus-outline",     label: "Van" },
  rv:        { icon: "bus-outline",     label: "RV" },
  truck:     { icon: "car-outline",     label: "Truck" },
  skoolie:   { icon: "bus-outline",     label: "Bus" },
  other:     { icon: "car-outline",     label: "Vehicle" },
};

/** Sync status types for route overlap badges */
export const SYNC_STATUS_CONFIG: Record<string, { bgColor: string; textColor: string; icon: string }> = {
  crossing:  { bgColor: "rgba(232,155,116,0.1)", textColor: "#E89B74", icon: "swap-horizontal" },
  same_stop: { bgColor: "rgba(92,157,155,0.1)",  textColor: "#5C9D9B", icon: "location" },
  syncing:   { bgColor: "rgba(232,155,116,0.1)", textColor: "#E89B74", icon: "swap-horizontal" },
  departed:  { bgColor: "rgba(148,163,184,0.1)", textColor: "#94A3B8", icon: "log-out-outline" },
};

/** Subscription plan limits */
export const FREE_PLAN = {
  maxStopovers: 1,
  maxRouteDays: 7,
  dailyLikes: 5,
} as const;

export const PRO_PLAN = {
  maxStopovers: Infinity,
  maxRouteDays: 180,
  dailyLikes: Infinity,
} as const;

export type PlanTier = "free" | "pro";

export function getPlanLimits(tier: PlanTier) {
  return tier === "pro" ? PRO_PLAN : FREE_PLAN;
}

export const CATEGORY_COLORS: Record<string, { bg: string; darkBg: string; text: string; darkText: string }> = {
  electrical: { bg: "#FFFBEB", darkBg: "rgba(245,158,11,0.12)", text: "#D97706", darkText: "#FBBF24" },
  plumbing:   { bg: "#EFF6FF", darkBg: "rgba(59,130,246,0.12)", text: "#2563EB", darkText: "#60A5FA" },
  solar:      { bg: "#FFF7ED", darkBg: "rgba(249,115,22,0.12)", text: "#EA580C", darkText: "#FB923C" },
  remote_work:{ bg: "#ECFDF5", darkBg: "rgba(16,185,129,0.12)", text: "#059669", darkText: "#34D399" },
  interior:   { bg: "#FDF2F8", darkBg: "rgba(236,72,153,0.12)", text: "#DB2777", darkText: "#F472B6" },
  mechanical: { bg: "#F5F3FF", darkBg: "rgba(139,92,246,0.12)", text: "#7C3AED", darkText: "#A78BFA" },
  insulation: { bg: "#FEF2F2", darkBg: "rgba(239,68,68,0.12)",  text: "#DC2626", darkText: "#F87171" },
  ventilation:{ bg: "#F0F9FF", darkBg: "rgba(14,165,233,0.12)", text: "#0284C7", darkText: "#38BDF8" },
  showcase:   { bg: "#FFFBEB", darkBg: "rgba(234,179,8,0.12)",  text: "#CA8A04", darkText: "#FACC15" },
};
