# Safe Implementation Plan: Invitation-Only Product Transition

## Document Purpose

This plan provides a **phased, low-risk approach** to transforming the current open-access app into an invitation-only, safety-first community platform. Each phase is designed to be **reversible**, **testable**, and **non-breaking** to existing functionality.

---

## Current Architecture Analysis

### What Works Well (Keep As-Is)
- ✅ Clerk authentication flow (`app/(auth)/`)
- ✅ Convex backend with strong typing
- ✅ Core UI components (GlassButton, GlassInput, etc.)
- ✅ Photo upload system
- ✅ Route matching logic
- ✅ Discovery card swipe mechanics
- ✅ Chat functionality
- ✅ Profile system

### Known Issues (Pre-Existing)
These existed **before** any changes and should be fixed carefully:

1. **Keyboard Covering Inputs**
   - **Root Cause**: Inconsistent use of `KeyboardAvoidingView`
   - **Locations**: Chat screen, some onboarding screens
   - **Why It Happens**: Android/iOS handle keyboards differently; fixed positioning conflicts with keyboard behavior

2. **Input State Management**
   - Some screens have button states that don't properly reflect input validity
   - Example: Continue buttons active when required fields empty

3. **SafeAreaInsets Usage**
   - Inconsistent application across screens
   - Can cause bottom elements to be hidden on devices with different insets

### Current User Flow
```
Sign Up → Onboarding (9 steps) → Full App Access
```

**Problems with this:**
- No verification step
- No application review
- Immediate access to sensitive user data
- No distinction between applicant and member states

---

## Risk Analysis: Why the Previous Implementation Failed

### Critical Mistakes in Previous Approach

1. **Changed too much at once**
   - Tried to overhaul auth, onboarding, and verification simultaneously
   - No fallback or incremental rollout

2. **UI/Backend State Mismatch**
   - Added verification status to backend
   - But didn't properly gate UI based on that status
   - Result: Verified users still saw onboarding

3. **Keyboard Issues Worsened**
   - Changed layout structure without testing keyboard behavior
   - Fixed positioning broke on screens that previously worked
   - `KeyboardAvoidingView` removed or incorrectly configured

4. **No Debug Bypass**
   - Couldn't test post-verification flows
   - Got stuck in "application pending" state during development

5. **Button State Logic**
   - Form validation logic disconnected from UI state
   - Continue buttons active even with invalid inputs

---

## New Strategy: Phased Implementation

### Core Principle
**Add, don't replace. Test each layer before adding the next.**

### Phase Sequence
```
Phase 0: Foundation (Backend & Debug Tools)
    ↓
Phase 1: Application Status System
    ↓
Phase 2: Pending State UI
    ↓
Phase 3: Onboarding Redesign
    ↓
Phase 4: Access Control
    ↓
Phase 5: Polish & Production
```

Each phase is **independently deployable** and **reversible**.

---

## Phase 0: Foundation (Week 1)

### Goals
- Establish backend verification system
- Create debug tools
- Fix pre-existing keyboard issues
- **No user-facing changes**

### Backend Changes

#### 1. User Schema Extension
**File: `convex/schema.ts`**

Add new fields to `users` table:
```typescript
applicationStatus: v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("under_review")
),
applicationSubmittedAt: v.optional(v.number()),
approvedAt: v.optional(v.number()),
rejectedAt: v.optional(v.number()),
rejectionReason: v.optional(v.string()),
inviteCode: v.optional(v.string()),
socialLinks: v.optional(v.object({
  instagram: v.optional(v.string()),
  tiktok: v.optional(v.string()),
  other: v.optional(v.string()),
})),
```

**Migration Strategy:**
- Existing users automatically get `applicationStatus: "approved"`
- `approvedAt` set to their creation date
- This ensures **zero disruption** to current users

#### 2. New Convex Functions
**File: `convex/applications.ts` (new file)**

```typescript
// Query: Get user's application status
export const getApplicationStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Returns full application state
  }
});

// Mutation: Submit application
export const submitApplication = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Sets status to "pending"
    // Records submission timestamp
  }
});

// DEBUG ONLY: Auto-approve
export const debugAutoApprove = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Debug endpoint not available");
    }
    // Instantly approve user
  }
});
```

#### 3. Debug Environment Setup
**File: `.env.local` (new file)**
```
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_ENABLE_AUTO_APPROVE=true
```

**File: `lib/constants.ts`**
```typescript
export const DEBUG_MODE = process.env.EXPO_PUBLIC_DEBUG_MODE === "true";
export const ENABLE_AUTO_APPROVE = process.env.EXPO_PUBLIC_ENABLE_AUTO_APPROVE === "true";
```

### UI Fixes (Pre-Existing Issues)

#### Fix 1: Keyboard Behavior - Chat Screen
**File: `app/(app)/chat/[id].tsx`**

**Current Problem:**
- `KeyboardAvoidingView` wraps both messages and input
- Input bar can be hidden behind keyboard on Android

**Solution:**
```typescript
// Replace current structure with:
<View style={styles.container}>
  <Header />
  
  <KeyboardAvoidingView 
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
  >
    <FlatList
      data={messages}
      inverted
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      // Critical: Let FlatList handle keyboard automatically
    />
    
    <View style={styles.inputBar}>
      <TextInput />
      <SendButton />
    </View>
  </KeyboardAvoidingView>
</View>
```

**Key Changes:**
- Remove nested `KeyboardAvoidingView`
- Let `FlatList` handle keyboard with `keyboardShouldPersistTaps`
- Input bar stays in DOM flow, not fixed position
- Use `keyboardDismissMode="interactive"` for smooth UX

#### Fix 2: Onboarding Input Coverage
**File: `app/(app)/onboarding/route.tsx`**

**Current Problem:**
- Complex form with multiple TextInputs
- Keyboard covers lower inputs
- Fixed footer overlaps keyboard

**Solution:**
```typescript
<KeyboardAvoidingView 
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
>
  <ScrollView
    contentContainerStyle={[
      styles.content,
      // Dynamic padding based on keyboard state
      { paddingBottom: insets.bottom + 200 }
    ]}
    keyboardShouldPersistTaps="handled"
  >
    {/* Form content */}
  </ScrollView>
  
  {/* Footer should NOT be position: "absolute" */}
  <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
    <GlassButton />
  </View>
</KeyboardAvoidingView>
```

**Key Changes:**
- Adequate `paddingBottom` on scroll content
- Footer in flow, not absolute
- Proper keyboard behavior prop on ScrollView

### Debug Tools UI

#### Debug Panel Component
**File: `components/debug/DebugPanel.tsx` (new file)**

```typescript
export function DebugPanel() {
  const { currentUser } = useCurrentUser();
  const autoApprove = useMutation(api.applications.debugAutoApprove);
  
  if (!DEBUG_MODE || !ENABLE_AUTO_APPROVE) return null;
  
  return (
    <View style={styles.debugPanel}>
      <Text>DEBUG MODE</Text>
      <Text>Status: {currentUser?.applicationStatus}</Text>
      
      <Pressable 
        onPress={() => autoApprove({ userId: currentUser._id })}
        style={styles.debugButton}
      >
        <Text>🚀 Auto-Approve</Text>
      </Pressable>
    </View>
  );
}
```

**Usage:** Add to `app/(app)/_layout.tsx` temporarily

### Testing Checklist for Phase 0

- [ ] Existing users can still log in
- [ ] Existing users see no UI changes
- [ ] New users get `applicationStatus: "pending"` on creation
- [ ] Debug auto-approve works in dev environment
- [ ] Debug panel not visible in production build
- [ ] Keyboard no longer covers chat input
- [ ] Keyboard no longer covers onboarding inputs
- [ ] All existing features still work

**Risk Level:** 🟢 Low (additive changes only)

---

## Phase 1: Application Status System (Week 2)

### Goals
- Create application status tracking
- Build pending state detection
- **Still no user-facing changes for approved users**

### Backend Logic

#### 1. Application Status Hook
**File: `hooks/useApplicationStatus.ts` (new file)**

```typescript
export function useApplicationStatus() {
  const { currentUser } = useCurrentUser();
  
  const applicationData = useQuery(
    api.applications.getApplicationStatus,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  
  return {
    status: applicationData?.applicationStatus ?? "pending",
    isPending: applicationData?.applicationStatus === "pending",
    isApproved: applicationData?.applicationStatus === "approved",
    isRejected: applicationData?.applicationStatus === "rejected",
    isUnderReview: applicationData?.applicationStatus === "under_review",
    submittedAt: applicationData?.applicationSubmittedAt,
    approvedAt: applicationData?.approvedAt,
  };
}
```

#### 2. Access Control Helper
**File: `lib/access.ts` (new file)**

```typescript
export function hasAppAccess(user: Doc<"users"> | null | undefined): boolean {
  if (!user) return false;
  
  // Legacy users (no status) = approved
  if (!user.applicationStatus) return true;
  
  // Only approved users have access
  return user.applicationStatus === "approved";
}

export function canViewDiscovery(user: Doc<"users"> | null | undefined): boolean {
  return hasAppAccess(user);
}

export function canViewSyncs(user: Doc<"users"> | null | undefined): boolean {
  return hasAppAccess(user);
}

export function canViewCommunity(user: Doc<"users"> | null | undefined): boolean {
  return hasAppAccess(user);
}
```

**Why This Matters:**
- Centralized access logic
- Easy to test
- Easy to extend (e.g., role-based permissions later)
- **Not yet enforced in UI** (next phase)

### Testing Checklist for Phase 1

- [ ] `useApplicationStatus` returns correct status
- [ ] `hasAppAccess` returns true for existing users
- [ ] `hasAppAccess` returns true for auto-approved debug users
- [ ] `hasAppAccess` returns false for pending users
- [ ] No UI changes yet
- [ ] All existing functionality intact

**Risk Level:** 🟢 Low (logic layer, no enforcement yet)

---

## Phase 2: Pending State UI (Week 3)

### Goals
- Create "Application Pending" screen
- **Do not block approved users**
- Test with debug mode only

### New Screen: Application Pending

**File: `app/(app)/application-pending.tsx` (new file)**

```typescript
export default function ApplicationPendingScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, submittedAt } = useApplicationStatus();
  const autoApprove = useMutation(api.applications.debugAutoApprove);
  const { currentUser } = useCurrentUser();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}>
        
        {/* Status Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="hourglass-outline" size={64} color={colors.primary} />
        </View>
        
        {/* Main Message */}
        <Text style={[styles.title, { color: colors.onBackground }]}>
          Application Submitted
        </Text>
        
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          Thanks for applying to Roam! We review all applications carefully to keep our community safe.
        </Text>
        
        <Text style={[styles.timeline, { color: colors.onSurfaceVariant }]}>
          Most applications are reviewed within 24-48 hours.
        </Text>
        
        {/* Application Summary */}
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: colors.onBackground }]}>
            Your Application
          </Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
              Submitted:
            </Text>
            <Text style={[styles.value, { color: colors.onBackground }]}>
              {submittedAt ? format(new Date(submittedAt), "MMM d, yyyy") : "Recently"}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
              Status:
            </Text>
            <Text style={[styles.value, { color: colors.primary }]}>
              {status === "pending" ? "Pending Review" : 
               status === "under_review" ? "Under Review" : "Pending"}
            </Text>
          </View>
        </View>
        
        {/* Actions */}
        <View style={styles.actions}>
          <GlassButton
            title="View My Application"
            onPress={() => router.push("/(app)/application-review")}
            variant="secondary"
          />
          
          <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>
            You can edit your application to improve your chances of approval.
          </Text>
        </View>
        
        {/* Debug Tool */}
        {DEBUG_MODE && ENABLE_AUTO_APPROVE && (
          <View style={styles.debugSection}>
            <Text style={styles.debugLabel}>DEBUG MODE</Text>
            <GlassButton
              title="🚀 Auto-Approve (Debug)"
              onPress={() => {
                if (currentUser?._id) {
                  autoApprove({ userId: currentUser._id });
                }
              }}
            />
          </View>
        )}
        
      </ScrollView>
    </View>
  );
}
```

### Application Review Screen (Editable View)

**File: `app/(app)/application-review.tsx` (new file)**

Shows the user their submitted application with ability to edit certain fields to improve approval chances.

```typescript
export default function ApplicationReviewScreen() {
  const { currentUser } = useCurrentUser();
  const { status } = useApplicationStatus();
  const router = useRouter();
  
  // Show all their submitted data
  // Allow editing bio, social links, additional photos
  // Show helpful tips for approval
  
  return (
    <ScrollView>
      <Text>Profile Photos</Text>
      {/* Display their submitted photos */}
      
      <Text>About You</Text>
      {/* Their bio */}
      
      <Text>Travel Style</Text>
      {/* Their selected styles */}
      
      <Text>Social Links</Text>
      {/* Instagram, TikTok - EDITABLE */}
      
      <GlassButton title="Update Application" onPress={handleUpdate} />
      <GlassButton title="Back" onPress={() => router.back()} variant="secondary" />
    </ScrollView>
  );
}
```

### Conditional Routing Logic

**File: `app/(app)/_layout.tsx`**

**Current:**
```typescript
if (profile === undefined) {
  return <ActivityIndicator />;
}

const hasProfile = profile !== null;

return (
  <Stack>
    {!hasProfile && <Stack.Screen name="onboarding" />}
    {hasProfile && <Stack.Screen name="(tabs)" />}
    {/* other screens */}
  </Stack>
);
```

**Updated (Phase 2):**
```typescript
if (profile === undefined) {
  return <ActivityIndicator />;
}

const hasProfile = profile !== null;
const hasAccess = hasAppAccess(profile);

return (
  <Stack>
    {!hasProfile && <Stack.Screen name="onboarding" />}
    
    {/* NEW: Pending users see pending screen */}
    {hasProfile && !hasAccess && (
      <>
        <Stack.Screen name="application-pending" />
        <Stack.Screen name="application-review" />
      </>
    )}
    
    {/* Approved users see normal app */}
    {hasProfile && hasAccess && <Stack.Screen name="(tabs)" />}
    
    {/* Rest of screens */}
  </Stack>
);
```

**Critical:** This uses the `hasAppAccess` helper, so:
- Existing users (no status or `approved`) → see normal app
- Debug-approved users → see normal app
- New pending users → see pending screen

### Testing Checklist for Phase 2

- [ ] Existing users still see normal app (no status → approved)
- [ ] Debug-approved users see normal app
- [ ] Create new user → sees pending screen
- [ ] Pending screen shows correct status
- [ ] Debug auto-approve button works
- [ ] After debug approval, user redirected to normal app
- [ ] Application review screen accessible
- [ ] No crashes or navigation loops

**Risk Level:** 🟡 Medium (routing changes, but gated by status)

---

## Phase 3: Onboarding Redesign (Week 4)

### Goals
- Add "Apply to Join" entry point
- Redesign onboarding as application flow
- Add social links collection
- **Keep existing onboarding intact initially**

### Landing Screen Changes

**File: `app/(auth)/sign-in.tsx` and `sign-up.tsx`**

Add messaging:
```
"Apply to join our community of verified nomads"
```

Keep auth flow the same (Clerk email sign-up).

### New Onboarding Screens

#### 1. Welcome Screen Enhancement
**File: `app/(app)/onboarding/welcome.tsx`**

Change copy from:
```
"Get Started" → "Apply to Join"
```

Add subtext:
```
"Join a verified community of nomadic travelers"
```

#### 2. Social Links Screen (NEW)
**File: `app/(app)/onboarding/social-links.tsx` (new file)**

Add after `verification.tsx` in flow:

```typescript
export default function SocialLinksScreen() {
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [other, setOther] = useState("");
  
  const handleContinue = async () => {
    await updateProfile({
      userId: currentUser._id,
      socialLinks: {
        instagram: instagram.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
        other: other.trim() || undefined,
      }
    });
    router.push("/(app)/onboarding/looking-for");
  };
  
  return (
    <View>
      <ProgressBar current={4} total={10} /> {/* Adjust total */}
      
      <Text>Connect Your Socials (Optional)</Text>
      <Text>Help us verify you're a real nomad by sharing your Instagram or TikTok.</Text>
      
      <GlassInput
        label="Instagram Username"
        value={instagram}
        onChangeText={setInstagram}
        placeholder="@username"
      />
      
      <GlassInput
        label="TikTok Username"
        value={tiktok}
        onChangeText={setTiktok}
        placeholder="@username"
      />
      
      <GlassInput
        label="Other (Website, Blog, etc.)"
        value={other}
        onChangeText={setOther}
        placeholder="https://"
      />
      
      <Text>These are optional but help us approve your application faster.</Text>
      
      <GlassButton title="Continue" onPress={handleContinue} />
      <Pressable onPress={() => handleContinue()}>
        <Text>Skip for now</Text>
      </Pressable>
    </View>
  );
}
```

#### 3. Completion Screen Changes
**File: `app/(app)/onboarding/complete.tsx`**

**Current:**
```typescript
<Text>You are all set!</Text>
<GlassButton title="Start Exploring" onPress={handleStartExploring} />
```

**Updated:**
```typescript
<Text>Application Submitted!</Text>
<Text>We'll review your application and get back to you soon.</Text>
<GlassButton title="View Status" onPress={() => router.push("/(app)/application-pending")} />
```

**Also:** Call `submitApplication` mutation on this screen:
```typescript
useEffect(() => {
  if (currentUser?._id) {
    submitApplication({ userId: currentUser._id });
  }
}, [currentUser]);
```

### Onboarding Flow Update
**File: `app/(app)/onboarding/route.tsx`** (or wherever flow is controlled)

Old flow (9 steps):
```
welcome → profile → travel-styles → verification → looking-for → interests → van-details → route → complete
```

New flow (10 steps):
```
welcome → profile → travel-styles → verification → social-links (NEW) → looking-for → interests → van-details → route → complete
```

### Testing Checklist for Phase 3

- [ ] New user goes through updated flow
- [ ] Social links saved correctly
- [ ] Completion screen shows "Application Submitted"
- [ ] User redirected to pending screen after completion
- [ ] Debug auto-approve still works
- [ ] Existing users unaffected
- [ ] Progress bar shows correct step count

**Risk Level:** 🟡 Medium (onboarding flow changes)

---

## Phase 4: Access Control Enforcement (Week 5)

### Goals
- Enforce access restrictions on Discovery, Syncs, Community
- Add "locked" state indicators
- Graceful degradation for pending users

### Tab Navigation Changes

**File: `app/(app)/(tabs)/_layout.tsx`**

No changes to tab bar itself, but add conditional rendering in tab screens.

### Discovery Screen Lock

**File: `app/(app)/(tabs)/index.tsx`**

**Current:**
```typescript
export default function DiscoverScreen() {
  const { currentUser } = useCurrentUser();
  const matches = useQuery(api.routeMatching.findRouteMatches, ...);
  
  // Discovery UI
}
```

**Updated:**
```typescript
export default function DiscoverScreen() {
  const { currentUser } = useCurrentUser();
  const hasAccess = canViewDiscovery(currentUser);
  
  if (!hasAccess) {
    return <LockedDiscoveryState />;
  }
  
  const matches = useQuery(api.routeMatching.findRouteMatches, ...);
  
  // Normal discovery UI
}
```

**Component: `LockedDiscoveryState`**
```typescript
function LockedDiscoveryState() {
  const { colors } = useAppTheme();
  const router = useRouter();
  
  return (
    <View style={styles.lockedContainer}>
      <Ionicons name="lock-closed-outline" size={64} color={colors.primary} />
      <Text style={styles.lockedTitle}>Application Pending</Text>
      <Text style={styles.lockedText}>
        Discovery will be available once your application is approved.
      </Text>
      <GlassButton
        title="View Application Status"
        onPress={() => router.push("/(app)/application-pending")}
      />
    </View>
  );
}
```

### Syncs Screen Lock

**File: `app/(app)/(tabs)/routes.tsx`**

Same pattern:
```typescript
export default function RoutesScreen() {
  const { currentUser } = useCurrentUser();
  const hasAccess = canViewSyncs(currentUser);
  
  if (!hasAccess) {
    return <LockedSyncsState />;
  }
  
  // Normal syncs UI
}
```

### Community Screen Lock

**File: `app/(app)/(tabs)/community.tsx`**

Same pattern:
```typescript
export default function CommunityScreen() {
  const { currentUser } = useCurrentUser();
  const hasAccess = canViewCommunity(currentUser);
  
  if (!hasAccess) {
    return <LockedCommunityState />;
  }
  
  // Normal community UI
}
```

### Profile Screen Changes

**File: `app/(app)/(tabs)/profile.tsx`**

Profile is always accessible (users can view/edit their application), but:

**Add status banner at top:**
```typescript
{!hasAppAccess(currentUser) && (
  <View style={styles.statusBanner}>
    <Ionicons name="hourglass-outline" size={20} color={colors.primary} />
    <Text style={styles.statusText}>Application Pending</Text>
    <Pressable onPress={() => router.push("/(app)/application-pending")}>
      <Text style={styles.statusLink}>View Status</Text>
    </Pressable>
  </View>
)}
```

### Testing Checklist for Phase 4

- [ ] Approved users see normal app
- [ ] Pending users see locked states on Discovery/Syncs/Community
- [ ] Pending users can still access Profile
- [ ] Locked state screens render correctly
- [ ] "View Status" buttons navigate correctly
- [ ] Debug auto-approve unlocks all screens
- [ ] No crashes when switching between locked/unlocked states

**Risk Level:** 🟠 Medium-High (enforces access control)

---

## Phase 5: Polish & Production (Week 6)

### Goals
- Remove debug tools
- Add animations
- Final testing
- Deploy

### Cleanup

#### 1. Remove Debug Panel
**File: `app/(app)/_layout.tsx`**

Remove:
```typescript
<DebugPanel />
```

#### 2. Remove Debug Mutation
**File: `convex/applications.ts`**

Comment out or remove `debugAutoApprove` entirely.

#### 3. Environment Variables
Update `.env.production`:
```
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_ENABLE_AUTO_APPROVE=false
```

### Final Polish

#### 1. Add Transitions
When user is approved, show celebration:
```typescript
// In useApplicationStatus hook
useEffect(() => {
  if (previousStatus === "pending" && status === "approved") {
    // Show celebration modal
    // Then navigate to app
  }
}, [status]);
```

#### 2. Push Notifications (Future)
Stub for future implementation:
```typescript
// When application status changes
// Send push notification to user
```

#### 3. Loading States
Ensure all screens have proper loading states while checking application status.

### Pre-Launch Checklist

#### Backend
- [ ] All new fields in schema deployed
- [ ] Migration completed (existing users = approved)
- [ ] Application mutations tested
- [ ] Access control logic tested
- [ ] Debug mutations removed/disabled

#### Frontend
- [ ] Onboarding flow tested end-to-end
- [ ] Application pending screen tested
- [ ] Application review/edit tested
- [ ] Locked states tested (Discovery, Syncs, Community)
- [ ] Profile accessible for all users
- [ ] Auto-approval flow tested (debug mode)
- [ ] Real approval flow tested (manual status change)
- [ ] Rejection flow tested (manual status change)
- [ ] Navigation doesn't break
- [ ] No keyboard issues
- [ ] SafeAreaInsets correct on all screens

#### User Flows
- [ ] New user: Sign up → Onboarding → Application Submitted → Pending Screen
- [ ] Approved user: Normal app access
- [ ] Rejected user: See rejection reason + can reapply
- [ ] Existing user: Unaffected, immediate access

#### Edge Cases
- [ ] User logs out during pending state
- [ ] User logs back in after approval
- [ ] Multiple devices with same account
- [ ] Network errors during status checks
- [ ] Slow backend responses

---

## Rollback Strategy

If any phase fails:

### Phase 0 Rollback
- Remove new schema fields
- Remove debug tools
- Revert keyboard fixes if they cause issues

### Phase 1 Rollback
- Remove application status hook
- Remove access control helpers
- Keep schema changes (they're additive)

### Phase 2 Rollback
- Remove pending screen
- Remove conditional routing in `_layout.tsx`
- Revert to direct tab access

### Phase 3 Rollback
- Remove social links screen
- Revert onboarding completion screen
- Remove `submitApplication` call

### Phase 4 Rollback
- Remove access control enforcement
- Remove locked state screens
- Keep everything else

### Phase 5 Rollback
- Re-enable debug tools
- Keep all other changes

---

## Why This Plan is Safer

### 1. Incremental Changes
Each phase adds one layer. If it breaks, rollback is simple.

### 2. Backward Compatibility
Existing users always have `approved` status, so they're never blocked.

### 3. Debug-First Approach
Debug tools built in Phase 0, so testing is possible throughout.

### 4. Separation of Concerns
- Backend changes (Phase 0-1)
- UI changes (Phase 2-3)
- Access enforcement (Phase 4)
- Polish (Phase 5)

Each layer is independent.

### 5. Pre-Existing Issue Fixes
Keyboard and input issues fixed in Phase 0, before adding complexity.

### 6. No Big Bang Deployment
Each phase can be deployed separately (with feature flags if needed).

---

## Architecture Decisions Explained

### Why Not Use Clerk Metadata?
- Convex is the source of truth for application state
- Easier to query and update
- Clerk is just auth, not application logic

### Why Status Enum Instead of Boolean?
- Extensible (can add "under_review", "waitlisted", etc.)
- Clear intent
- Easy to add new statuses later

### Why Separate Pending Screen vs. Disabled Tabs?
- Better UX (clear messaging)
- User knows exactly what's happening
- Prevents confusion ("Why can't I tap Discovery?")

### Why Allow Profile Access for Pending Users?
- Users need to see their application
- Users should be able to edit to improve approval chances
- Prevents feeling "locked out" entirely

---

## Future Enhancements (Post-Launch)

### 1. Admin Dashboard
- Web app to review applications
- See photos, bio, social links
- Approve/reject with one click
- Request more info from applicants

### 2. Automated Screening
- Check Instagram/TikTok for vanlife content
- Verify photos show actual vans/travel
- Flag suspicious applications

### 3. Invite Codes
- Existing members can invite new users
- Invited users skip review or get fast-tracked
- Track invitation source

### 4. Application Tiers
- "Express Review" for users with strong social presence
- "Standard Review" for everyone else
- "Flagged" for suspicious applications

### 5. Rejection Appeals
- Allow rejected users to reapply after 30 days
- Explain rejection reasons clearly
- Track appeal history

---

## Common Pitfalls to Avoid

### 1. Don't Touch Working Features
If Discovery, Chat, or Syncs work well, don't refactor them during this process.

### 2. Don't Over-Engineer
Start simple. Admin dashboard can come later.

### 3. Don't Ignore Android
Test on Android first (it's harder). iOS will be easier.

### 4. Don't Skip Debug Tools
You'll regret it when you can't test approval flows.

### 5. Don't Deploy All at Once
Deploy phases incrementally (with feature flags if possible).

### 6. Don't Forget Migration
Existing users MUST be auto-approved or the app breaks for them.

---

## Success Metrics

### Phase 0
- ✅ No regressions in existing features
- ✅ Keyboard issues resolved
- ✅ Debug tools functional

### Phase 1
- ✅ Application status tracked correctly
- ✅ Access control helpers return correct results

### Phase 2
- ✅ Pending users see pending screen
- ✅ Approved users see normal app
- ✅ No navigation loops

### Phase 3
- ✅ New users complete updated onboarding
- ✅ Applications submitted successfully
- ✅ Social links captured

### Phase 4
- ✅ Pending users locked out of Discovery/Syncs/Community
- ✅ Approved users have full access
- ✅ Profile accessible for all

### Phase 5
- ✅ Debug tools removed
- ✅ Production-ready
- ✅ No regressions

---

## Estimated Timeline

| Phase | Duration | Risk | Blocker? |
|-------|----------|------|----------|
| Phase 0 | 1 week | Low | No |
| Phase 1 | 1 week | Low | No |
| Phase 2 | 1 week | Medium | Yes (routing) |
| Phase 3 | 1 week | Medium | No |
| Phase 4 | 1 week | Medium-High | No |
| Phase 5 | 1 week | Low | No |

**Total: ~6 weeks**

Can be compressed if phases are combined, but **not recommended** for first implementation.

---

## Final Recommendations

### Do This First
1. Implement Phase 0 completely
2. Test thoroughly
3. Fix any keyboard issues before moving forward

### Do This Next
1. Add application status system (Phase 1)
2. Test with debug tools
3. Ensure existing users unaffected

### Do This Last
1. Enforce access control (Phase 4)
2. Only after all other phases stable

### Don't Do This
- ❌ Implement all phases at once
- ❌ Skip debug tools
- ❌ Ignore keyboard issues
- ❌ Forget to migrate existing users
- ❌ Deploy without testing rollback

---

## Questions to Answer Before Starting

1. **Who will review applications initially?**
   - Manual review? Automated? Both?

2. **What's the approval criteria?**
   - Must have van photos?
   - Must have social links?
   - Must have certain profile completeness?

3. **How will you handle rejections?**
   - Allow reapplication?
   - Provide feedback?
   - Ban permanently?

4. **What's the expected approval time?**
   - 24 hours? 48 hours? 1 week?

5. **Do you need invite codes for launch?**
   - Pre-approved users?
   - Friends & family?

---

## Conclusion

This plan is designed to be:
- ✅ **Incremental** (each phase is self-contained)
- ✅ **Reversible** (rollback strategy for each phase)
- ✅ **Testable** (debug tools built first)
- ✅ **Safe** (existing users unaffected)
- ✅ **Maintainable** (clear architecture decisions)

The previous implementation failed because it changed too much at once. This plan takes the opposite approach: **add one layer at a time, test thoroughly, then add the next layer.**

Start with Phase 0. Don't move to Phase 1 until Phase 0 is stable. This discipline prevents the cascading failures that happened before.

Good luck! 🚐✨