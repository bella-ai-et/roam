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
] as const;
export type BuildCategory = (typeof BUILD_CATEGORIES)[number]["value"];
