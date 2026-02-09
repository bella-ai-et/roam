# Roam UI/UX Update — Detailed Implementation Plan

## Current State Summary

### Architecture
- **Auth**: Clerk (sign-in/sign-up) → `app/(auth)/`
- **Root layout** (`app/_layout.tsx`): `Stack.Protected` guards — signed-out → `(auth)`, signed-in → `(app)`
- **App layout** (`app/(app)/_layout.tsx`): Queries `users.getByClerkId`. If no profile → shows `onboarding` stack. If profile exists → shows `(tabs)` + edit screens
- **Tabs** (`app/(app)/(tabs)/_layout.tsx`): 4 tabs — Discover, Syncs, Community, Profile
- **Backend**: Convex with `users` table (no `applicationStatus` field), plus `swipes`, `matches`, `messages`, `posts`, `replies`

### Current User Flow
```
Sign Up → Clerk session created → (app) layout loads
  → No profile in DB → onboarding stack shown
    → welcome.tsx ("Get Started" button)
    → profile.tsx (name, DOB, gender, photos — creates user in DB via createProfile)
    → travel-styles.tsx
    → verification.tsx (van photo)
    → looking-for.tsx
    → interests.tsx
    → van-details.tsx
    → route.tsx (travel route)
    → complete.tsx ("Start Exploring" → navigates to (tabs))
  → Profile exists → full (tabs) shown immediately
```

### Key Observations
1. **No application/approval concept exists** — once onboarding completes, user gets full access
2. **The `(apply)` and `(pending)` route groups exist but are empty** — scaffolded but not implemented
3. **The `users` table has no `applicationStatus` field** — needs to be added
4. **Profile is created mid-onboarding** (at the `profile.tsx` step) — this means `hasProfile` becomes `true` before onboarding finishes, but the layout currently only checks `profile !== null`
5. **Discovery reads from the same `users` table** — profile data is already the source of truth for discovery cards
6. **The `complete.tsx` screen** currently says "You are all set!" and navigates directly to tabs

---

## What Needs to Change

### Problem → Solution Map

| # | Current Behavior | New Behavior | Files Affected |
|---|---|---|---|
| 1 | Welcome screen says "Get Started" | Says **"Apply to Join"** | `onboarding/welcome.tsx` |
| 2 | `complete.tsx` says "You are all set!" and goes to tabs | Says **"Application Submitted"** and navigates to pending profile-only experience | `onboarding/complete.tsx` |
| 3 | No `applicationStatus` on user | Add `applicationStatus` field: `"pending"` \| `"approved"` \| `"rejected"` | `convex/schema.ts`, `convex/users.ts` |
| 4 | `(app)/_layout.tsx` routes: no profile → onboarding, has profile → tabs | Three states: no profile → onboarding, profile + pending → **(pending)** layout, profile + approved → **(tabs)** | `app/(app)/_layout.tsx` |
| 5 | All 4 tabs always visible | Pending users see **only Profile** (no tab bar). Approved users see all 4 tabs | `app/(app)/(pending)/_layout.tsx` (new), `app/(app)/(tabs)/_layout.tsx` (unchanged) |
| 6 | No pending experience | Clean profile-only view while application is under review | `app/(app)/(pending)/` (new screens) |
| 7 | Discovery shows all users | Discovery should **only show approved users** | `convex/routeMatching.ts` |

---

## Implementation Plan — Step by Step

### Phase 1: Backend — Add Application Status

#### Step 1.1: Update Convex Schema
**File**: `convex/schema.ts`

Add `applicationStatus` to the `users` table:
```ts
applicationStatus: v.optional(v.string()), // "pending" | "approved" | "rejected"
```

This is `v.optional` so existing users (who were created before this change) won't break. They'll be treated as `"approved"` by default (grandfathered in).

#### Step 1.2: Update `createProfile` Mutation
**File**: `convex/users.ts`

When a new profile is created during onboarding, set:
```ts
applicationStatus: "pending"
```

This happens in the `createProfile` mutation handler. The field should be set automatically (not passed from the client) to prevent spoofing.

#### Step 1.3: Add `approveUser` Admin Mutation
**File**: `convex/users.ts`

Add a new mutation:
```ts
export const approveUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { applicationStatus: "approved" });
  },
});
```

This will be called by an admin (dashboard, script, or future admin panel). For now, it just needs to exist.

#### Step 1.4: Add `getApplicationStatus` Query
**File**: `convex/users.ts`

Add a query that returns just the status:
```ts
export const getApplicationStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.applicationStatus ?? "approved"; // existing users default to approved
  },
});
```

#### Step 1.5: Filter Discovery to Approved Users Only
**File**: `convex/routeMatching.ts`

In `findRouteMatches`, add to the candidate filter:
```ts
const applicationStatus = u.applicationStatus ?? "approved";
if (applicationStatus !== "approved") return false;
```

This ensures pending/rejected users never appear in anyone's discovery feed.

---

### Phase 2: Onboarding Flow Updates

#### Step 2.1: Welcome Screen — "Apply to Join"
**File**: `app/(app)/onboarding/welcome.tsx`

Changes:
- Button text: `"Get Started"` → `"Apply to Join"`
- Subtitle: `"Find your people on the road"` → consider updating to reinforce exclusivity (e.g., "An exclusive community for nomads on the road")
- Feature items can stay the same or be reworded slightly

This is a **one-line text change** for the button, plus optional copy updates.

#### Step 2.2: Complete Screen — "Application Submitted"
**File**: `app/(app)/onboarding/complete.tsx`

Current behavior:
- Shows green checkmark, "You are all set!", "Your Roam profile is live"
- Button: "Start Exploring" → navigates to `/(app)/(tabs)`

New behavior:
- Shows a different icon (e.g., paper plane or hourglass) with warm animation
- Title: **"Application Submitted"**
- Subtitle: **"We'll review your profile and get back to you soon. In the meantime, you can view and edit your profile."**
- Button: **"View My Profile"** → navigates to `/(app)/(pending)`
- The green checkmark should change to a warm/amber tone to indicate "in progress" rather than "done"

#### Step 2.3: Onboarding Flow Order (No Change Needed)
The current onboarding step order is fine:
1. Welcome (Apply to Join)
2. Profile (name, DOB, gender, photos)
3. Travel Styles
4. Verification (van photo)
5. Looking For
6. Interests
7. Van Details
8. Route
9. Complete (Application Submitted)

The profile is created at step 2 with `applicationStatus: "pending"`. All subsequent steps update the profile. The complete screen is the final confirmation.

---

### Phase 3: App Layout — Three-State Routing

#### Step 3.1: Update `(app)/_layout.tsx`
**File**: `app/(app)/_layout.tsx`

Current logic:
```
no profile → onboarding
has profile → (tabs) + edit screens
```

New logic:
```
no profile → onboarding
has profile + applicationStatus !== "approved" → (pending)
has profile + applicationStatus === "approved" → (tabs) + edit screens
```

Implementation:
```tsx
const hasProfile = profile !== null;
const isApproved = hasProfile && (profile.applicationStatus ?? "approved") === "approved";

return (
  <Stack screenOptions={{ headerShown: false }}>
    {!hasProfile && <Stack.Screen name="onboarding" />}
    {hasProfile && !isApproved && <Stack.Screen name="(pending)" />}
    {isApproved && <Stack.Screen name="(tabs)" />}
    {isApproved && <Stack.Screen name="edit-profile" ... />}
    {isApproved && <Stack.Screen name="settings" ... />}
    {isApproved && <Stack.Screen name="chat/[id]" ... />}
    {/* ... other approved-only screens */}

    {/* Edit screens available to pending users too */}
    {hasProfile && !isApproved && <Stack.Screen name="edit-profile" ... />}
    {hasProfile && !isApproved && <Stack.Screen name="settings" ... />}
    {hasProfile && !isApproved && <Stack.Screen name="edit-about" ... />}
    {hasProfile && !isApproved && <Stack.Screen name="edit-interests" ... />}
    {hasProfile && !isApproved && <Stack.Screen name="edit-photos" ... />}
    {hasProfile && !isApproved && <Stack.Screen name="edit-van" ... />}
    {hasProfile && !isApproved && <Stack.Screen name="edit-looking-for" ... />}
  </Stack>
);
```

**Key detail**: Pending users should be able to edit their profile (edit-about, edit-interests, edit-photos, etc.) but NOT access chat, community, or discovery.

---

### Phase 4: Pending Application Experience

#### Step 4.1: Create `(pending)/_layout.tsx`
**File**: `app/(app)/(pending)/_layout.tsx`

This is a **simple Stack layout with NO tab bar**:
```tsx
import { Stack } from "expo-router";

export default function PendingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

#### Step 4.2: Create `(pending)/index.tsx` — Profile-Only Screen
**File**: `app/(app)/(pending)/index.tsx`

This screen should:
- Show the **full Profile screen** (reuse the existing `ProfileScreen` component or import its content)
- Include a **subtle, non-intrusive banner** at the top: "Your application is under review"
- The banner should feel warm and intentional, not like an error or warning
- Settings gear should still be accessible
- All profile edit flows should work

**Implementation approach**: Rather than duplicating the entire profile screen, create a wrapper that:
1. Shows a small status banner
2. Renders the existing profile content below it

Alternatively, we can **reuse the exact same `profile.tsx` component** by extracting it into a shared component in `components/profile/` and importing it in both `(tabs)/profile.tsx` and `(pending)/index.tsx`.

**Recommended approach**: Extract `ProfileScreen` logic into a shared component `components/profile/ProfileScreenContent.tsx`, then:
- `(tabs)/profile.tsx` renders `<ProfileScreenContent />`
- `(pending)/index.tsx` renders `<PendingBanner />` + `<ProfileScreenContent />`

This keeps Profile as the single source of truth and avoids duplication.

#### Step 4.3: Pending Banner Design
The banner should be:
- Positioned at the top of the profile, below the status bar
- Warm amber/gold background (not red/error)
- Icon: hourglass or clock
- Text: "Your application is being reviewed"
- Optional: small "Learn more" link
- Dismissible? No — it should always be visible while pending
- Should NOT feel like an error state

---

### Phase 5: Approval → Full Access Transition

#### Step 5.1: Automatic Transition via Convex Reactivity
**No extra code needed for the transition itself.**

Because Convex queries are **reactive**, when an admin calls `approveUser`, the `getByClerkId` query in `(app)/_layout.tsx` will automatically re-fire. The `profile.applicationStatus` will change from `"pending"` to `"approved"`, and the layout will automatically switch from rendering `(pending)` to rendering `(tabs)`.

This is seamless — the user doesn't need to restart the app or pull to refresh. Convex's real-time subscriptions handle it.

#### Step 5.2: No Unnecessary Screens
Per the requirements, there should be no "Congratulations, you're approved!" interstitial. The tabs just appear naturally on the next render cycle.

---

### Phase 6: Profile ↔ Discovery Sync (Verification)

#### Step 6.1: Verify Data Consistency
The current implementation already uses the `users` table as the single source of truth:
- **Profile** reads from `useCurrentUser()` → `api.users.getByClerkId`
- **Discovery** reads from `api.routeMatching.findRouteMatches` → which reads `users` table directly
- Both use the same `Doc<"users">` type

**No structural changes needed here.** The data model is already consistent.

#### Step 6.2: Ensure Discovery Never Shows Incomplete Profiles
**File**: `convex/routeMatching.ts`

Add an additional filter to `findRouteMatches` candidates:
```ts
// Skip users with no photos (incomplete profile)
if (!u.photos || u.photos.length === 0) return false;
```

This is a safety net — if somehow a user gets approved before finishing their profile, they won't appear in discovery.

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `convex/schema.ts` | **EDIT** | Add `applicationStatus` field to `users` table |
| `convex/users.ts` | **EDIT** | Set `applicationStatus: "pending"` in `createProfile`, add `approveUser` mutation, add `getApplicationStatus` query |
| `convex/routeMatching.ts` | **EDIT** | Filter out non-approved users from discovery |
| `app/(app)/onboarding/welcome.tsx` | **EDIT** | "Get Started" → "Apply to Join" |
| `app/(app)/onboarding/complete.tsx` | **EDIT** | Redesign as "Application Submitted" screen, navigate to `(pending)` |
| `app/(app)/_layout.tsx` | **EDIT** | Add three-state routing: onboarding / pending / approved |
| `app/(app)/(pending)/_layout.tsx` | **CREATE** | Simple Stack layout, no tab bar |
| `app/(app)/(pending)/index.tsx` | **CREATE** | Profile-only view with pending banner |
| `components/profile/ProfileScreenContent.tsx` | **CREATE** | Extract shared profile content from `(tabs)/profile.tsx` |
| `app/(app)/(tabs)/profile.tsx` | **EDIT** | Refactor to use shared `ProfileScreenContent` |

---

## Implementation Order

Execute in this order to minimize breakage:

1. **Backend first** (Phase 1) — schema + mutations. Deploy to Convex. Existing users unaffected (field is optional, defaults to "approved").
2. **Extract shared profile component** (Phase 4.2) — refactor before adding new screens.
3. **Create (pending) screens** (Phase 4) — the new route group and screens.
4. **Update (app) layout routing** (Phase 3) — wire up three-state logic.
5. **Update onboarding screens** (Phase 2) — welcome + complete screen changes.
6. **Discovery filter** (Phase 1.5 + 6.2) — ensure only approved users appear.
7. **Test the full flow** end-to-end.

---

## Edge Cases to Handle

1. **Existing users with no `applicationStatus`**: Treated as `"approved"` via `?? "approved"` fallback. No migration needed.
2. **User signs out and signs back in while pending**: Clerk session restores → `(app)` layout loads → profile exists with `"pending"` → shows `(pending)` experience. Works correctly.
3. **User force-quits and reopens while pending**: Same as above — Convex query re-fires, status is still `"pending"`.
4. **Admin approves while user has app open**: Convex reactivity auto-updates the query → layout re-renders → tabs appear. No manual refresh needed.
5. **Profile created mid-onboarding**: Profile is created at step 2 (profile.tsx) with `applicationStatus: "pending"`. The `(app)/_layout.tsx` sees `hasProfile && !isApproved` but the user is still in the onboarding stack. We need to ensure the onboarding stack takes priority over the pending layout. **Solution**: Add an `onboardingComplete` field (boolean) to the user, or check if the route is already set (indicating onboarding finished). **Simpler solution**: Keep the current approach where `!hasProfile` shows onboarding, but also check `onboardingComplete` flag.

### Handling Edge Case #5 in Detail

Currently, `createProfile` is called at step 2 of 9 in onboarding. After that, `hasProfile` becomes `true`. The current layout would try to show `(pending)` instead of letting the user finish onboarding.

**Two options**:

**Option A — Add `onboardingComplete` flag to user schema**:
- Add `onboardingComplete: v.optional(v.boolean())` to schema
- Set it to `false` in `createProfile`
- Set it to `true` at the end of onboarding (in `complete.tsx` or in the route save step)
- Layout logic: `!hasProfile || !profile.onboardingComplete` → onboarding, `hasProfile && onboardingComplete && !isApproved` → pending, `isApproved` → tabs

**Option B — Move profile creation to end of onboarding**:
- Accumulate all data in local state / context during onboarding
- Call `createProfile` with all fields at the very end
- This is a bigger refactor since each step currently saves to DB incrementally

**Recommended: Option A** — minimal change, just one new boolean field. The incremental save approach is good UX (user doesn't lose progress if they quit mid-onboarding).

Updated schema addition:
```ts
onboardingComplete: v.optional(v.boolean()), // false during onboarding, true after
applicationStatus: v.optional(v.string()),   // "pending" | "approved" | "rejected"
```

Updated layout logic:
```ts
const hasProfile = profile !== null;
const onboardingDone = hasProfile && profile.onboardingComplete === true;
const isApproved = onboardingDone && (profile.applicationStatus ?? "approved") === "approved";

// Routing:
// !hasProfile || (hasProfile && !onboardingDone) → onboarding
// onboardingDone && !isApproved → (pending)
// isApproved → (tabs)
```

Updated `complete.tsx`:
- Before navigating away, call a mutation to set `onboardingComplete: true`
- Then navigate to `(pending)`

---

## Testing Checklist

- [ ] New user sign-up → sees "Apply to Join" on welcome screen
- [ ] Completes all onboarding steps → sees "Application Submitted"
- [ ] After submission → lands on profile-only view with pending banner
- [ ] Pending user can view their profile
- [ ] Pending user can edit profile (photos, bio, interests, etc.)
- [ ] Pending user cannot see Discover, Syncs, or Community tabs
- [ ] Pending user cannot navigate to chat or community URLs directly
- [ ] Existing users (no `applicationStatus`) get full access (grandfathered)
- [ ] Admin approves user → user automatically gets full tab bar (real-time)
- [ ] Approved user appears in other users' discovery feed
- [ ] Pending user does NOT appear in anyone's discovery feed
- [ ] User who quits mid-onboarding and returns → resumes onboarding (not stuck in pending)
- [ ] Profile data is consistent between Profile tab and Discovery cards
