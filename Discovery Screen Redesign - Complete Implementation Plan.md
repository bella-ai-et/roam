# Discovery Screen Redesign – Refined Implementation Plan

## Overview

This plan covers the **app-wide** redesign of Roam’s UI/UX, with the Discovery screen as the primary reference. Theme, typography, and design tokens apply across the entire app (Discover, Syncs, Community, Profile, onboarding, auth). The app has **no existing users**, so no data migration is required.

---

## Scope & Assumptions

| Item | Decision |
|------|----------|
| **Theme scope** | App-wide (all screens use new palette, background, font) |
| **Existing users** | None; no migration strategy needed |
| **Map for mini route widget** | **Expo Maps** (Android Maps SDK; use `expo-maps` or equivalent) |
| **Font** | Outfit (see Phase 1 for loading details) |

---

## Design Analysis

**Design tokens (app-wide):**

| Token | Value | Usage |
|-------|--------|--------|
| Primary | `#D27C5C` (Earthy Terracotta) | Replaces `#E8724A`; CTAs, active states, interest tags |
| Background light | `#F9F6F2` (Creamy Paper) | Replaces `#FFFFFF`; default app background |
| Background dark | `#121212` (Deep Slate) | Dark mode background |
| Accent orange | `#E89B74` | Overlap highlight, journey stop accent |
| Accent green | `#74A48A` | Success / positive states if needed |
| Font | Outfit | App-wide typography |
| Card radius | 40px (2.5rem) | Discovery cards and consistent surfaces |
| Photo section height | 320px | Discovery card hero area |

**Material3:** Keep using `@pchmn/expo-material3-theme`; set `SEED_COLOR` to `#D27C5C` so generated theme aligns with the new primary. Ensure `AppColors` and `useAppTheme()` use the new background and semantic colors so glass and other components pick them up app-wide.

---

## Phase 1: Theme & Design System Updates (App-Wide)

**File: `lib/theme.ts`**
- Set `SEED_COLOR` to `#D27C5C`.
- Update `AppColors`: primary `#D27C5C`, `background.light` → `#F9F6F2`, `background.dark` → `#121212`, add `accentOrange` (`#E89B74`), `accentGreen` (`#74A48A`).
- Ensure `useAppTheme()` exposes these and uses new backgrounds for light/dark so all screens get Creamy Paper / Deep Slate.

**File: `lib/constants.ts`**
- Add `TRAVEL_STYLES` (e.g. Vanlife, Off-roading, Overlanding, Road trips, Minimalist, etc.) with optional emoji/icon for UI.
- Add any new interests that fit the nomadic/lifestyle focus (e.g. Specialty Coffee, Solar Tech if not already present).
- Add discovery UI constants: `DISCOVERY_CARD_RADIUS = 40`, `DISCOVERY_PHOTO_HEIGHT = 320`, `ACTION_BUTTON_REJECT_SIZE = 72`, `ACTION_BUTTON_LIKE_SIZE = 80`.

**New file: `lib/fonts.ts`**
- Define which Outfit weights to load (e.g. 300, 400, 500, 600, 700).
- Export a `loadAppFonts()` (or similar) that uses `expo-font` to load Outfit (from Google Fonts via `@expo-google-fonts/outfit`, or local assets, or other Expo-compatible source).
- Export font family name constant(s) for use in styles (e.g. `FONT_FAMILY_OUTFIT`).
- Document fallback: if load fails, fall back to system sans-serif so the app still renders.

**File: `app/_layout.tsx`**
- Before rendering app (e.g. using `useFonts` or `loadAppFonts()` + splash), load Outfit; optionally keep splash visible until fonts are ready.
- Apply loaded font to root (e.g. via context or default text style) so it’s app-wide.

**Other app-wide touchpoints**
- Replace hardcoded `#E8724A` / old background references in glass components, auth screens, and any shared UI so the whole app uses the new theme.

---

## Phase 2: Schema & Data Updates

**File: `convex/schema.ts`**
- Add to `users`: `travelStyles: v.optional(v.array(v.string()))`, `lifestyleLabel: v.optional(v.string())`.

**File: `convex/users.ts`**
- In `createProfile`: add optional `travelStyles`, `lifestyleLabel` to args and insert.
- In `updateProfile`: add optional `travelStyles`, `lifestyleLabel` to args and patch.

No migration steps required (no existing users).

---

## Phase 3: Discovery Card Components

**Data / logic (to implement in screen or route-matching layer):**
- **Journey stops:** Derive from the shown user’s `currentRoute` (and optionally current user’s route). Order by arrival date; first stop = “Start” (origin), last = “Destination”, rest = “Stop 1”, “Stop 2”, etc.
- **Overlap stop:** Use existing route-matching result: the overlap(s) from `findRouteMatches` (location + date range). The stop that matches the overlap location/date is the “Overlap” card in the horizontal timeline (orange accent + ring). If multiple overlaps, pick the primary one (e.g. first) for the card.

**New file: `components/discovery/DiscoveryCard.tsx`**
- Single card: photo carousel (top), mini map (top-right), gradient + user info, “Paths cross in [Location]” badge, bio quote, interest tags, journey stops strip, travel style tags.
- Use `DISCOVERY_CARD_RADIUS`, `DISCOVERY_PHOTO_HEIGHT`, theme colors (terracotta, creamy background, accent orange for overlap).
- Photo carousel: dots indicator **top center**; dots style (e.g. white with opacity for inactive).
- “Paths cross in [Location]”: compass icon + location name; below it, date range + “Within Xkm” from route match overlap.

**New file: `components/discovery/JourneyStopsTimeline.tsx`**
- Horizontal scroll (e.g. `ScrollView` or `FlatList`), snap optional.
- Props: list of stops (with label, location name, date, type: `start` | `stop` | `overlap` | `destination`).
- Per stop card: ~144px wide, rounded; Start = gray bg; normal/future = white/surface; Overlap = accent orange bg + highlight ring; show “START”, “Stop N”, “Overlap”, “Destination” and location/date as in design.

**New file: `components/discovery/MiniRouteMap.tsx`**
- **Map:** Use **Expo Maps** (Android Maps). Small view (e.g. 112×112px), rounded corners, optional border.
- **Data:** Draw a simple path (polyline) from the user’s `currentRoute` coordinates (in order). Style: dashed line (terracotta) if the map API supports it; otherwise solid.
- **Avatar:** Small user avatar thumbnail overlay (e.g. bottom-right or as specified in design).
- **Expand:** Tap/icon opens full-screen map (new screen or modal using same Expo Maps); show same route + optional pins for stops.
- **Fallback:** If Expo Maps isn’t available on a platform or fails, show a placeholder (e.g. “Map unavailable” or static illustration) so the card still works.

**New file (optional): `components/discovery/PathsCrossBadge.tsx`**
- Reusable “Paths cross in [Location]” + date range + distance block with compass icon; used inside `DiscoveryCard` (and optionally in profile modal).

---

## Phase 4: Action Buttons

**New file: `components/discovery/ActionButtons.tsx`**
- Reject: 72px circle, white (or surface) background, shadow, X icon.
- Like: 80px circle, terracotta background, stronger shadow/glow (`shadowColor` primary).
- Position: fixed above tab bar (e.g. `bottom: tabBarHeight + padding`), centered horizontally.
- Callbacks: `onReject`, `onLike` passed from parent (Discovery screen).

---

## Phase 5: Main Discovery Screen Rewrite

**File: `app/(app)/(tabs)/index.tsx`**
- Header: left-aligned “Discover” title (no need for heavy glass if design is minimal).
- Card stack: render `DiscoveryCard` for current match; pass route match data (user, overlaps, sharedInterests) and derived journey stops + overlap index.
- Swipe: keep existing gesture logic; swap in `DiscoveryCard` and new `ActionButtons`; keep LIKE/NOPE overlay badges during swipe (styled to match new theme).
- Empty state: same copy, styled with new background and primary color.
- Profile modal: still open from card tap; content updates in Phase 7.

---

## Phase 6: Tab Navigation Updates

**File: `app/(app)/(tabs)/_layout.tsx`**
- Rename “Routes” tab to **“Syncs”**; icon: chat bubble (e.g. `chat-bubble-outline` / `chatbubble`).
- Ensure active tint uses new primary (`#D27C5C`); tab bar background uses new app background (Creamy Paper / Deep Slate).
- Apply to both the native tabs path and the Android-optimized `Tabs` path.

---

## Phase 7: Profile Modal Updates

**In `app/(app)/(tabs)/index.tsx` (profile modal section):**
- Use full journey timeline (same data as Discovery card): reuse or adapt `JourneyStopsTimeline` with full list.
- Bio: show as quote box (same style as Discovery card).
- Interest tags: terracotta pills, consistent with Discovery.
- Travel style tags: from `user.travelStyles`; style to match design (e.g. gray pills with icon).
- Ensure modal background and text use app theme (Creamy Paper / Deep Slate).

---

## Phase 8: Onboarding Updates

**File: `app/(app)/onboarding/profile.tsx`**
- Add **lifestyle label** field (e.g. single line): “Vanlife • Remote Developer” style; save to `lifestyleLabel`.

**New file: `app/(app)/onboarding/travel-styles.tsx`**
- Multi-select for **travel styles** from `TRAVEL_STYLES`; save array to `travelStyles`.
- Use new theme (primary, background) and Outfit.

**File: `app/(app)/onboarding/_layout.tsx`**
- Add `travel-styles` step in the desired order (e.g. after profile, before route or completion).
- Ensure all onboarding screens use app-wide theme and font.

---

## Phase 9: Polish & Refinements

- **Spacing:** 16px card margins, consistent padding from design.
- **Animations:** Spring/swipe for cards; smooth transitions for modals and tab switch.
- **Dark mode:** Verify all new colors (background dark, surfaces, text) and the mini map placeholder in dark theme.
- **Responsiveness:** Card width, button positions, and font sizes across screen sizes.
- **Accessibility:** Touch targets (72/80px buttons), contrast for terracotta on Creamy Paper, and labels for icons (e.g. expand map, like, reject).

---

## Implementation Order

1. **Phase 1** – Theme & design system (app-wide)
2. **Phase 2** – Schema & Convex users
3. **Phase 3** – Discovery card (DiscoveryCard, JourneyStopsTimeline, MiniRouteMap, optional PathsCrossBadge)
4. **Phase 4** – ActionButtons
5. **Phase 5** – Main Discovery screen rewrite
6. **Phase 6** – Tab navigation (Routes → Syncs)
7. **Phase 7** – Profile modal
8. **Phase 8** – Onboarding (lifestyle label + travel-styles step)
9. **Phase 9** – Polish and testing

---

## Component Layout (Discovery)

```
components/discovery/
  ├── DiscoveryCard.tsx      # Main card
  ├── JourneyStopsTimeline.tsx
  ├── MiniRouteMap.tsx       # Expo Maps (Android Maps)
  ├── ActionButtons.tsx
  └── PathsCrossBadge.tsx    # Optional
```

---

## Summary of Refinements

- Theme and design system explicitly **app-wide**; no migration needed.
- **Expo Maps** specified for mini route map (and expand experience).
- **Font loading** detailed (Outfit, weights, fallback).
- **Journey stops & overlap** logic described (from `currentRoute` + route match).
- **Material3** and shared theme usage clarified.
- **Constants** and optional **PathsCrossBadge** added; implementation order and file structure confirmed.
