# Zelani — Technical Documentation

> **App name:** Zelani (formerly Roam)
> **Package:** `com.abeldesu.zelani`
> **Platform target:** Android (Google Play) — iOS deferred
> **Framework:** React Native (Expo SDK 55) with Expo Router

---

## 1. High-Level Architecture Overview

### 1.1 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | React Native + Expo | RN 0.83 / Expo 55 |
| **Navigation** | Expo Router (file-based) | 55.0.0-preview.7 |
| **Authentication** | Clerk (`@clerk/clerk-expo`) | ^2.19.21 |
| **Backend / Database** | Convex (real-time serverless) | ^1.31.7 |
| **Monetization** | RevenueCat (`react-native-purchases`) | ^9.7.6 |
| **Maps** | Google Maps via `expo-maps` | ~55.0.5 |
| **Animations** | React Native Reanimated | ~4.2.1 |
| **Gestures** | React Native Gesture Handler | ~2.30.0 |
| **Fonts** | Outfit (via `@expo-google-fonts/outfit`) | ^0.4.3 |
| **Theming** | Material 3 dynamic color + custom `AppColors` | — |

### 1.2 Project Structure

```
roam/
├── app/                        # Expo Router file-based routes
│   ├── _layout.tsx             # Root layout — auth guard, providers
│   ├── (auth)/                 # Unauthenticated routes
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   └── (app)/                  # Authenticated routes
│       ├── _layout.tsx         # 4-state routing logic
│       ├── onboarding/         # New user onboarding flow
│       ├── (pending)/          # Awaiting approval (invite code)
│       ├── (planning)/         # First-route setup (RoutePlanner)
│       ├── (tabs)/             # Main app (Discover, Syncs, Campfire, Profile)
│       ├── edit-*.tsx          # Profile edit screens (modal)
│       ├── profile/[userId].tsx
│       ├── chat/[id].tsx
│       └── community/          # Post detail & create
├── components/
│   ├── discovery/              # Discovery card system
│   ├── glass/                  # Glassmorphism UI components
│   ├── onboarding/             # Onboarding step components
│   ├── planning/               # Route planner components
│   └── Paywall.tsx             # Pro subscription paywall modal
├── convex/                     # Convex backend (queries, mutations, schema)
│   ├── schema.ts               # Database schema
│   ├── users.ts                # User CRUD, approval, route, subscription
│   ├── posts.ts                # Campfire posts, reactions, RSVPs
│   ├── messages.ts             # Chat messaging
│   └── files.ts                # File/image storage
├── hooks/
│   ├── useCurrentUser.ts       # Current Clerk user helper
│   ├── useSubscription.ts      # RevenueCat context consumer
│   └── usePhotoPicker.ts       # Image picker helper
├── lib/
│   ├── auth.ts                 # Clerk token cache (SecureStore)
│   ├── constants.ts            # App-wide constants & plan limits
│   ├── fonts.ts                # Outfit font map
│   ├── theme.ts                # AppColors, useAppTheme
│   └── glass.tsx               # Glass effect detection
├── providers/
│   ├── index.tsx               # AppProviders — wraps all providers
│   ├── ClerkProvider.tsx        # Clerk auth provider
│   ├── ConvexProvider.tsx       # Convex real-time DB provider
│   ├── RevenueCatProvider.tsx   # RevenueCat subscription provider
│   └── ThemeProvider.tsx        # Navigation theme (dark/light)
└── app.config.ts               # Expo config (plugins, keys, permissions)
```

### 1.3 Provider Hierarchy

All providers are composed in `providers/index.tsx` and wrapped around the entire app in the root layout:

```
GestureHandlerRootView
  └── ClerkProvider              (authentication)
        └── ConvexProvider       (real-time database, uses Clerk auth)
              └── RevenueCatProvider  (subscription state)
                    └── ThemeProvider      (dark/light navigation theme)
                          └── {children}
```

**Key detail:** `ConvexProviderWithClerk` bridges Clerk's auth tokens into Convex, enabling authenticated server queries without extra config.

### 1.4 Routing & Navigation

#### Root Layout (`app/_layout.tsx`)

Uses Expo Router's `Stack.Protected` guards:

- **Not signed in** → `(auth)` group (sign-in / sign-up)
- **Signed in** → `(app)` group

#### App Layout (`app/(app)/_layout.tsx`) — 4-State Routing

After authentication, the app determines user state via a Convex query and redirects:

| State | Condition | Route |
|---|---|---|
| **Onboarding** | No profile or `onboardingComplete !== true` | `/onboarding` |
| **Pending** | Onboarding done but `applicationStatus !== "approved"` | `/(pending)` |
| **Planning** | Approved but no `currentRoute` set | `/(planning)` |
| **Full access** | Approved + has route | `/(tabs)` |

This routing is **fully reactive** — powered by Convex's real-time subscriptions. When an admin approves a user or a user saves their first route, the layout re-evaluates and transitions automatically with no restart needed.

#### Tab Navigator (`app/(app)/(tabs)/_layout.tsx`)

Four bottom tabs:

| Tab | Screen | Icon |
|---|---|---|
| **Discover** | `index.tsx` | Heart |
| **Syncs** | `routes.tsx` | Chat bubble |
| **Campfire** | `community.tsx` | Bonfire |
| **Profile** | `profile.tsx` | Person |

Uses `NativeTabs` (glass effect) on iOS and standard `Tabs` on Android.

### 1.5 Backend — Convex

Convex serves as the real-time serverless backend. All data is stored in Convex tables with automatic reactivity.

#### Database Schema (`convex/schema.ts`)

| Table | Purpose | Key Indexes |
|---|---|---|
| `users` | User profiles, routes, subscription tier, approval status | `by_clerkId` |
| `swipes` | Discovery like/dislike actions | `by_swiper`, `by_swiper_and_swiped` |
| `matches` | Mutual likes + sync status metadata | `by_user1`, `by_user2` |
| `messages` | Chat messages within matches | `by_match`, `by_match_created` |
| `posts` | Campfire posts (question, spot, tip, meetup, showcase) | `by_category`, `by_author`, `by_postType` |
| `replies` | Replies on posts | `by_post` |
| `reactions` | Post reactions (helpful, been_there, save) | `by_post`, `by_user`, `by_post_user` |
| `rsvps` | Meetup RSVPs | `by_post`, `by_user`, `by_post_user` |

### 1.6 Authentication Flow

1. User opens app → Clerk checks auth state via `useAuth()`
2. If not signed in → `(auth)` screens (sign-in / sign-up via Clerk)
3. Clerk token is cached in `expo-secure-store` (see `lib/auth.ts`)
4. On sign-in → `ConvexProviderWithClerk` automatically passes Clerk JWT to Convex
5. Convex query `users.getByClerkId` resolves the user profile

### 1.7 Application Approval Model

New users go through an **Apply to Join** flow:

1. Complete onboarding → profile is created with `applicationStatus: "pending"`
2. User lands in `(pending)` route group — profile-only view with invite code entry
3. Valid invite code (`approveWithInviteCode` mutation) or admin approval (`approveUser` mutation) sets `applicationStatus: "approved"`
4. Convex reactivity automatically transitions user to `(planning)` or `(tabs)`

Existing users are grandfathered as approved via `?? "approved"` fallback.

### 1.8 Environment Variables

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk authentication |
| `EXPO_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `CONVEX_DEPLOYMENT` | Convex deployment identifier |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat iOS API key |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` | RevenueCat Android API key |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps (scoped to `com.abeldesu.zelani`) |

---

## 2. RevenueCat Integration & Monetization Setup

### 2.1 Overview

Zelani uses a **freemium model** with a single premium tier called **"Zelani Pro"**. RevenueCat manages subscription billing, entitlement verification, and cross-platform receipt validation.

**Core principle:** The Pro subscription only limits *activity* (stopovers, date range, daily likes). It **never blocks screens** — users are never forced through a paywall to access core app features.

### 2.2 Architecture

```
RevenueCatProvider (Context)
  ├── Configures SDK with platform API key
  ├── Identifies user with Clerk ID (Purchases.logIn)
  ├── Fetches offerings (subscription packages)
  ├── Listens for real-time subscription changes
  └── Exposes: isPro, offerings, purchasePackage(), restorePurchases()
        │
        ▼
useSubscription() hook
  └── Consumed by Paywall.tsx and any screen that checks Pro status
```

### 2.3 Provider Implementation (`providers/RevenueCatProvider.tsx`)

#### Initialization Sequence

1. **Load fallback** — reads `zelani_pro_fallback` from `expo-secure-store` (handles TestStore edge case)
2. **Configure SDK** — selects API key by platform (`EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` or `_ANDROID`), calls `Purchases.configure()`
3. **Identify user** — once Clerk user is available, calls `Purchases.logIn(clerkUserId)` to link RevenueCat customer to Clerk identity
4. **Fetch offerings** — retrieves available subscription packages
5. **Listen for updates** — `addCustomerInfoUpdateListener` keeps `isPro` reactive

#### Entitlement ID

```
ENTITLEMENT_ID = "zelani Pro"
```

The provider checks `customerInfo.entitlements.active["zelani Pro"].isActive` to determine Pro status.

#### Pro Status Derivation

```typescript
const isPro = hasActiveEntitlement(customerInfo) || proFallback;
```

Two sources of truth:
- **Primary:** RevenueCat entitlement is active in `CustomerInfo`
- **Fallback:** Local `SecureStore` flag (`zelani_pro_fallback`) — handles TestStore limitation where a successful purchase doesn't reflect in `CustomerInfo`

#### Context Value Exposed

```typescript
interface RevenueCatContextValue {
  isPro: boolean;                                    // Is user on Pro tier
  offerings: PurchasesOfferings | null;              // Available packages
  customerInfo: CustomerInfo | null;                 // Raw RevenueCat customer info
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;  // Trigger purchase
  restorePurchases: () => Promise<boolean>;          // Restore existing purchase
  loading: boolean;                                  // SDK still initializing
}
```

### 2.4 Hook — `useSubscription()`

Simple context consumer (`hooks/useSubscription.ts`):

```typescript
export function useSubscription(): RevenueCatContextValue {
  return useContext(RevenueCatContext);
}
```

Any component can call `const { isPro, offerings } = useSubscription()` to check status or trigger purchases.

### 2.5 Subscription Plans & Limits

Defined in `lib/constants.ts`:

| Feature | Free Plan | Pro Plan |
|---|---|---|
| **Daily likes** | 5 per day | Unlimited |
| **Route stops (stopovers)** | 1 | Unlimited |
| **Route planning horizon** | 7 days ahead | 180 days (6 months) |
| **Saved routes** | 1 route | Unlimited |
| **Profile boost** | — | Priority visibility |

```typescript
const FREE_PLAN = { maxStopovers: 1, maxRouteDays: 7, dailyLikes: 5 };
const PRO_PLAN  = { maxStopovers: Infinity, maxRouteDays: 180, dailyLikes: Infinity };
```

The helper `getPlanLimits(tier)` returns the correct limits object based on `"free"` or `"pro"`.

### 2.6 Server-Side Enforcement

The `users.updateRoute` mutation in Convex enforces stopover limits server-side:

```typescript
const tier = user?.subscriptionTier ?? "free";
if (tier !== "pro") {
  const stopovers = route.filter((s) => s.role !== "origin" && s.role !== "destination");
  if (stopovers.length > 1) {
    throw new Error("Free plan allows only 1 stopover. Upgrade to Pro.");
  }
}
```

The `subscriptionTier` field on the `users` table (`"free"` | `"pro"`) is updated via the `updateSubscriptionTier` mutation.

### 2.7 Paywall UI (`components/Paywall.tsx`)

The paywall is a **full-screen modal** with a gold-themed gradient design:

#### When It Appears

The paywall is **never forced** as a mandatory step. It only appears as a modal when a free user hits a limit:
- Stopover limit in Route Planner
- Date range limit in Route Planner
- Daily likes limit on the Discovery screen

#### Features Displayed

| Feature | Free | Pro |
|---|---|---|
| Daily likes | 5 per day | Unlimited |
| Route stops | 1–2 stops | Unlimited |
| Route planning | 2 weeks ahead | 6 months ahead |
| Saved routes | 1 route | Unlimited |
| Profile boost | — | Priority visibility |

#### Plan Selection

- **Annual** and **Monthly** package pills — fetched from RevenueCat offerings
- Annual plan displays a "SAVE 24%" badge when selected
- Packages are dynamically resolved: `currentOffering.availablePackages` filtered by `ANNUAL` / `MONTHLY` type

#### Purchase Flow

1. User taps **"Continue with Pro"**
2. `purchasePackage(activePkg)` is called on the RevenueCat provider
3. On success → Alert: *"Welcome to Pro! All limits have been removed."* → paywall closes
4. On failure → Alert: *"Purchase Failed"*

#### Restore Flow

1. User taps **"Restore Purchases"**
2. `restorePurchases()` checks RevenueCat + local fallback
3. On success → Alert: *"Your Pro subscription has been restored."* → paywall closes
4. On failure → Alert: *"No Subscription Found"*

### 2.8 RevenueCat Dashboard Setup (Required)

To complete the monetization integration, the following must be configured in the **RevenueCat dashboard** (https://app.revenuecat.com):

1. **Project** — Create a project for Zelani
2. **App** — Register the Android app with package `com.abeldesu.zelani`
3. **Entitlement** — Create entitlement named exactly `zelani Pro`
4. **Products** — Link Google Play subscription products (monthly + annual) to the entitlement
5. **Offering** — Create a "default" offering containing both MONTHLY and ANNUAL packages
6. **API Keys** — Copy the Android public API key → set as `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` in `.env`

### 2.9 Data Flow Summary

```
User taps "Continue with Pro"
  │
  ▼
Paywall.tsx → purchasePackage(pkg)
  │
  ▼
RevenueCatProvider → Purchases.purchasePackage(pkg)
  │
  ├── Success + entitlement active → isPro = true
  ├── Success + no entitlement (TestStore) → SecureStore fallback → isPro = true
  └── Error → return false
  │
  ▼
isPro propagated via React Context
  │
  ▼
Components re-render: limits lifted, paywall dismissed
  │
  ▼
(Optional) updateSubscriptionTier mutation → persist tier in Convex
  └── Enables server-side enforcement of limits
```

---

*Last updated: February 2026*
