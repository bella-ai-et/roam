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

## Phase 0: Foundation 

### Goals
- Establish backend verification system
- Create debug tools
- **Migrate chat to GetStream SDK** (fixes all existing chat UI/UX issues)
- Fix pre-existing keyboard issues in other screens
- **No user-facing changes** (chat looks the same, just better)

### Chat Migration to GetStream

#### Why Migrate Now?
The current Convex-based chat has multiple issues:
- Keyboard covering input
- Message rendering performance
- Real-time sync edge cases
- Complex custom implementation

GetStream Chat SDK solves all of these out-of-the-box. Migrating in Phase 0:
- ✅ Fixes chat issues before adding application complexity
- ✅ Reduces maintenance burden
- ✅ Better UX for approved users immediately
- ✅ Professional chat experience for new users post-approval

#### GetStream Setup

**1. Install Dependencies**
```bash
npm install stream-chat-react-native stream-chat-expo
expo install @stream-io/flat-list-mvcp expo-file-system expo-image-manipulator expo-image-picker expo-media-library react-native-gesture-handler react-native-reanimated react-native-svg
```

**2. GetStream Configuration**
**File: `lib/getstream.ts` (new file)**

```typescript
import { StreamChat } from 'stream-chat';

const API_KEY = process.env.EXPO_PUBLIC_GETSTREAM_API_KEY!;

// Singleton instance
let chatClient: StreamChat | null = null;

export function getStreamChatClient() {
  if (!chatClient) {
    chatClient = StreamChat.getInstance(API_KEY);
  }
  return chatClient;
}

export async function connectStreamUser(userId: string, userName: string, userImage?: string) {
  const client = getStreamChatClient();
  
  // Get token from your backend
  // For now, using development token (replace with server-side generation)
  const token = client.devToken(userId);
  
  await client.connectUser(
    {
      id: userId,
      name: userName,
      image: userImage,
    },
    token
  );
  
  return client;
}

export async function disconnectStreamUser() {
  const client = getStreamChatClient();
  await client.disconnectUser();
}
```

**3. Environment Setup**
**File: `.env.local`**
```
EXPO_PUBLIC_GETSTREAM_API_KEY=your_getstream_key
```

Get your API key from: https://getstream.io/dashboard/

**4. Stream Provider Setup**
**File: `providers/StreamChatProvider.tsx` (new file)**

```typescript
import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, OverlayProvider } from 'stream-chat-react-native';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { connectStreamUser, disconnectStreamUser, getStreamChatClient } from '@/lib/getstream';
import { ActivityIndicator, View } from 'react-native';
import { useAppTheme } from '@/lib/theme';

export function StreamChatProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useCurrentUser();
  const { colors } = useAppTheme();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setupChat() {
      if (!currentUser?._id) {
        setIsReady(false);
        return;
      }

      try {
        const chatClient = await connectStreamUser(
          currentUser._id,
          currentUser.name || 'User',
          currentUser.photos?.[0] // First photo as avatar
        );
        setClient(chatClient);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to connect Stream chat:', error);
        setIsReady(false);
      }
    }

    setupChat();

    return () => {
      if (client) {
        disconnectStreamUser();
      }
    };
  }, [currentUser?._id]);

  if (!isReady || !client) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <OverlayProvider>
      <Chat client={client}>
        {children}
      </Chat>
    </OverlayProvider>
  );
}
```

**5. Update App Providers**
**File: `providers/index.tsx`**

```typescript
import { StreamChatProvider } from './StreamChatProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProvider>
        <ThemeProvider>
          <StreamChatProvider>
            {children}
          </StreamChatProvider>
        </ThemeProvider>
      </ConvexProvider>
    </ClerkProvider>
  );
}
```

#### New Chat Screen Implementation

**File: `app/(app)/chat/[id].tsx` (complete rewrite)**

```typescript
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Channel, MessageInput, MessageList, useAttachmentPickerContext } from 'stream-chat-react-native';
import { useAppTheme } from '@/lib/theme';
import { getStreamChatClient } from '@/lib/getstream';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { Channel as StreamChannel } from 'stream-chat';

export default function ChatScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const matchId = params.id;
  const { currentUser } = useCurrentUser();
  
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function setupChannel() {
      if (!matchId || !currentUser?._id) return;

      try {
        const client = getStreamChatClient();
        
        // Channel ID based on match ID
        const channelId = `match-${matchId}`;
        
        // Get or create channel
        const newChannel = client.channel('messaging', channelId, {
          name: 'Match Chat',
          members: [currentUser._id], // Other user added when they connect
        });

        await newChannel.watch();
        setChannel(newChannel);
        setLoading(false);
      } catch (error) {
        console.error('Failed to setup channel:', error);
        setLoading(false);
      }
    }

    setupChannel();
  }, [matchId, currentUser?._id]);

  if (loading || !channel) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Channel channel={channel}>
        <MessageList
          // All keyboard issues are handled automatically
          // All message rendering optimized
          // All real-time sync handled by GetStream
        />
        <MessageInput />
      </Channel>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

**That's it!** GetStream handles:
- ✅ Keyboard avoiding automatically
- ✅ Message rendering and virtualization
- ✅ Real-time sync
- ✅ Typing indicators
- ✅ Read receipts
- ✅ File uploads
- ✅ Message reactions
- ✅ Reply threading
- ✅ All UI/UX best practices

#### Theme Customization (Optional)

**File: `lib/getstream-theme.ts` (new file)**

```typescript
import { DeepPartial, Theme } from 'stream-chat-react-native';
import { AppColors } from './theme';

export const streamChatTheme: DeepPartial<Theme> = {
  colors: {
    accent_blue: AppColors.primary,
    accent_green: AppColors.like,
    accent_red: AppColors.reject,
    bg_gradient_start: AppColors.background.light,
    bg_gradient_end: AppColors.background.light,
    black: '#000000',
    blue_alice: AppColors.primaryContainer,
    border: AppColors.outline,
    grey: AppColors.surfaceVariant,
    grey_gainsboro: AppColors.surface,
    grey_whisper: AppColors.background.light,
    modal_shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow_icon: '#00000080',
    targetedMessageBackground: AppColors.primaryContainer,
    transparent: 'transparent',
    white: '#FFFFFF',
    white_smoke: AppColors.surface,
    white_snow: AppColors.background.light,
  },
  messageSimple: {
    content: {
      containerInner: {
        borderRadius: 16,
      },
    },
  },
};
```

**Usage in `StreamChatProvider`:**
```typescript
<Chat client={client} style={streamChatTheme}>
  {children}
</Chat>
```

#### Backend: Match-to-Channel Sync

**File: `convex/matches.ts` (update existing)**

Add function to sync matches with GetStream:

```typescript
export const syncMatchToStream = internalMutation({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return;

    // Call your backend endpoint that creates GetStream channel
    // and adds both users as members
    
    // For now, channels are created on-demand when first user opens chat
  },
});
```

#### Migration Strategy from Convex Messages

**Option 1: Clean Slate (Recommended)**
- Don't migrate old messages
- GetStream starts fresh
- Old messages still in Convex but read-only
- Add banner: "We upgraded our chat! Previous messages are in your archive."

**Option 2: Migration Script (If needed)**
```typescript
// File: scripts/migrate-messages.ts
async function migrateMessagesToGetStream() {
  // For each match:
  //   1. Get all Convex messages
  //   2. Create GetStream channel
  //   3. Import messages via GetStream API
  //   4. Mark as migrated
}
```

**Recommendation:** Start fresh. Old chats are likely not critical for MVP.

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

#### Fix: Onboarding Input Coverage
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

**Note:** Chat keyboard issues are completely solved by GetStream SDK.

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

#### GetStream Chat
- [ ] GetStream SDK installed successfully
- [ ] Chat provider initializes without errors
- [ ] Users can connect to GetStream
- [ ] Messages send and receive in real-time
- [ ] Keyboard behavior works perfectly (automatic)
- [ ] No chat input visibility issues
- [ ] Message list renders smoothly
- [ ] Typing indicators work
- [ ] User avatars display correctly
- [ ] Theme matches app design
- [ ] Can create new channels for new matches
- [ ] Can resume existing conversations

#### Application System
- [ ] Existing users can still log in
- [ ] Existing users see no UI changes (except better chat)
- [ ] New users get `applicationStatus: "pending"` on creation
- [ ] Debug auto-approve works in dev environment
- [ ] Debug panel not visible in production build

#### Keyboard Fixes (Other Screens)
- [ ] Keyboard no longer covers onboarding inputs
- [ ] All existing features still work

#### Old Chat System
- [ ] Old Convex messages queries still work (read-only)
- [ ] Migration decision made (clean slate vs. import)
- [ ] Users notified of chat upgrade (if applicable)

**Risk Level:** 🟡 Medium (chat system replacement, but isolated)

---

## GetStream Deep Dive: Implementation Details

### Why GetStream Solves Your Chat Problems

Your current chat issues:
1. ❌ Keyboard covers input on Android
2. ❌ Message list performance with many messages
3. ❌ Scroll-to-bottom behavior inconsistent
4. ❌ Real-time sync occasionally drops messages
5. ❌ Custom implementation requires ongoing maintenance

GetStream solutions:
1. ✅ Automatic keyboard handling (iOS & Android)
2. ✅ Virtualized message list (handles 10,000+ messages)
3. ✅ Smart scrolling (auto-scroll on new message, manual scroll detection)
4. ✅ Guaranteed message delivery with offline queueing
5. ✅ Maintained by GetStream team, not you

### GetStream Architecture

```
Your App
    ↓
stream-chat-react-native (UI Components)
    ↓
stream-chat (Core SDK)
    ↓
GetStream Backend (WebSocket + REST)
    ↓
Your Users
```

**What stays in your backend (Convex):**
- Match creation
- Match status
- User profiles
- Application status
- Route matching

**What moves to GetStream:**
- Message storage
- Message delivery
- Typing indicators
- Read receipts
- Online/offline status
- File uploads (images, videos)

### Channel Types

GetStream uses "channel types" for different chat contexts:

**Recommended for Roam:**
```typescript
// 1-on-1 match chat
channel_type: "messaging"
channel_id: "match-{matchId}"

// Future: Group chats (meetups)
channel_type: "team"
channel_id: "meetup-{meetupId}"
```

### Message Events You Can Listen To

```typescript
// In your StreamChatProvider or chat screen:

channel.on('message.new', (event) => {
  // New message received
  // Update unread count in your Convex DB if needed
});

channel.on('message.read', (event) => {
  // Other user read messages
  // Could trigger notification or UI update
});

channel.on('typing.start', (event) => {
  // Other user started typing
  // Already handled by GetStream UI
});

channel.on('member.added', (event) => {
  // New member added to channel
  // Useful for group chats later
});
```

### Syncing GetStream with Convex

**When to create channel:**
```typescript
// In your match creation logic
export const createMatch = mutation({
  handler: async (ctx, args) => {
    // 1. Create match in Convex
    const matchId = await ctx.db.insert("matches", {
      user1: args.user1,
      user2: args.user2,
      status: "active",
      createdAt: Date.now(),
    });
    
    // 2. Create GetStream channel (via server action)
    await ctx.scheduler.runAfter(0, internal.stream.createChannel, {
      matchId,
      user1: args.user1,
      user2: args.user2,
    });
    
    return matchId;
  }
});
```

**Server action to create channel:**
```typescript
// convex/stream.ts
import { StreamChat } from 'stream-chat';
import { internalAction } from "./_generated/server";

export const createChannel = internalAction({
  args: {
    matchId: v.id("matches"),
    user1: v.id("users"),
    user2: v.id("users"),
  },
  handler: async (ctx, args) => {
    const serverClient = StreamChat.getInstance(
      process.env.GETSTREAM_API_KEY!,
      process.env.GETSTREAM_API_SECRET!
    );
    
    const channel = serverClient.channel(
      'messaging',
      `match-${args.matchId}`,
      {
        members: [args.user1, args.user2],
        created_by_id: args.user1,
      }
    );
    
    await channel.create();
  }
});
```

### Handling Unread Counts

GetStream tracks unread counts automatically, but you might want to show them in your Syncs tab:

```typescript
// In your Syncs screen
import { useChatContext } from 'stream-chat-react-native';

export default function SyncsScreen() {
  const { client } = useChatContext();
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!client) return;
    
    // Get total unread count
    const updateUnreadCount = () => {
      const count = client.user?.total_unread_count || 0;
      setUnreadCount(count);
    };
    
    updateUnreadCount();
    
    // Listen for changes
    client.on('notification.message_new', updateUnreadCount);
    client.on('notification.mark_read', updateUnreadCount);
    
    return () => {
      client.off('notification.message_new', updateUnreadCount);
      client.off('notification.mark_read', updateUnreadCount);
    };
  }, [client]);
  
  // Show badge on Syncs tab if unreadCount > 0
}
```

### File Uploads (Images, etc.)

GetStream handles file uploads automatically:

```typescript
// In MessageInput component (already built-in)
// Users can:
// - Tap camera icon
// - Take photo
// - Upload from gallery
// - All handled by GetStream

// No custom code needed!
```

**File storage:**
- GetStream stores files on their CDN
- Automatic image compression
- Thumbnail generation
- Works offline (queued uploads)

### Push Notifications (Future Enhancement)

```typescript
// When ready to add push notifications:

// 1. Set up Firebase (Android) / APNS (iOS)
// 2. Get device token
// 3. Register with GetStream

import * as Notifications from 'expo-notifications';

async function registerPushToken() {
  const token = await Notifications.getExpoPushTokenAsync();
  
  const client = getStreamChatClient();
  await client.addDevice(token.data, 'expo');
}

// GetStream automatically sends push for:
// - New messages
// - Mentions
// - Reactions (if enabled)
```

### Custom Message Types (Future)

GetStream allows custom message types for special interactions:

```typescript
// Example: Share location
channel.sendMessage({
  text: "I'm here!",
  type: 'location',
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    name: "San Francisco",
  }
});

// Example: Share route
channel.sendMessage({
  text: "Check out my route!",
  type: 'route',
  route_id: routeId,
});
```

### Cost Optimization

**GetStream Pricing:**
- **Free**: Up to 25 Monthly Active Users (MAU)
- **Maker**: $99/mo, unlimited MAU, all features
- **Growth**: $499/mo, adds priority support

**For your MVP:**
- Start with Free tier (test with < 25 users)
- Upgrade to Maker when you launch ($99/mo is reasonable)
- MAU = users who send/receive at least 1 message per month

**Cost per user at scale:**
- 100 users = $0.99/user/month
- 1000 users = $0.099/user/month
- Very affordable compared to building/maintaining custom chat

### Testing GetStream Locally

**Development workflow:**
```bash
# 1. Sign up at getstream.io
# 2. Create app
# 3. Get API key + secret
# 4. Add to .env.local

EXPO_PUBLIC_GETSTREAM_API_KEY=your_key_here

# 5. Start app
npm start

# 6. Test chat between two users:
# - Device 1: User A
# - Device 2: User B (or simulator)
```

**Debug tools:**
GetStream Dashboard shows:
- All channels
- All messages
- Active users
- Message delivery status
- Webhook logs

### Migration from Convex Messages

**Step-by-step migration:**

1. **Keep old messages read-only:**
```typescript
// Don't delete old Convex messages table
// Users can view message history if needed
```

2. **Add migration banner:**
```typescript
// In chat screen
{isOldConvexChat && (
  <View style={styles.migrationBanner}>
    <Text>We upgraded our chat! 🎉</Text>
    <Text>Previous messages are archived.</Text>
    <Pressable onPress={viewArchive}>
      <Text>View Archive</Text>
    </Pressable>
  </View>
)}
```

3. **Optional: Import important messages:**
```typescript
// Script to import old messages to GetStream
async function importMessages(matchId: string) {
  const oldMessages = await db.query("messages")
    .filter(q => q.eq("matchId", matchId))
    .collect();
  
  const channel = client.channel('messaging', `match-${matchId}`);
  
  for (const msg of oldMessages) {
    await channel.sendMessage({
      text: msg.content,
      user_id: msg.senderId,
      created_at: new Date(msg.createdAt),
    });
  }
}
```

**Recommendation:** Don't import. Clean slate is cleaner.

### Rollback Plan for GetStream

If GetStream causes issues:

1. **Keep Convex messages table** (don't delete)
2. **Feature flag the chat provider:**
```typescript
const USE_GETSTREAM = process.env.EXPO_PUBLIC_USE_GETSTREAM === 'true';

<AppProviders>
  {USE_GETSTREAM ? (
    <StreamChatProvider>
      {children}
    </StreamChatProvider>
  ) : (
    {children}
  )}
</AppProviders>
```

3. **Revert chat screen:**
```typescript
// Keep old chat screen in chat/[id].old.tsx
// Swap file names if rollback needed
```

4. **No data loss:**
   - Convex messages still exist
   - GetStream messages stay in GetStream
   - Can export from GetStream if needed

### GetStream Best Practices

✅ **Do:**
- Use server-side token generation in production
- Implement error boundaries around chat
- Test offline behavior thoroughly
- Set up webhook listeners for important events
- Use channel types appropriately
- Monitor GetStream dashboard for issues

❌ **Don't:**
- Use dev tokens in production
- Store sensitive data in message metadata
- Implement custom message rendering (use defaults)
- Try to sync every message to Convex (inefficient)
- Forget to disconnect user on logout

---

## Phase 1: Application Status System (Week 2-3)

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

**Important:** Syncs screen shows matches/conversations. With GetStream:
- Match list still comes from Convex (your matching logic)
- Clicking a match opens GetStream channel
- So this screen is **not** GetStream-dependent, just triggers chat

### Chat Access Control

**File: `app/(app)/chat/[id].tsx`**

Add access check:
```typescript
export default function ChatScreen() {
  const { currentUser } = useCurrentUser();
  const hasAccess = canViewSyncs(currentUser); // Chat requires sync access
  
  if (!hasAccess) {
    return <LockedChatState />;
  }
  
  // GetStream chat implementation
}
```

**GetStream Channel Members:**
When creating/accessing channels, ensure:
- Only approved users are added as members
- Pending users can't access any channels
- If user loses approval, remove from channels (edge case)
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
EXPO_PUBLIC_GETSTREAM_API_KEY=your_production_key
```

#### 4. GetStream Production Setup
- [ ] Create production GetStream app
- [ ] Update API key in environment
- [ ] Set up server-side token generation (replace `devToken`)
- [ ] Configure webhook URLs for message events
- [ ] Set up message moderation rules (optional)
- [ ] Configure file upload limits

**Server-Side Token Generation:**
```typescript
// Backend endpoint (Next.js API route, Convex action, etc.)
import { StreamChat } from 'stream-chat';

export async function generateStreamToken(userId: string) {
  const serverClient = StreamChat.getInstance(
    process.env.GETSTREAM_API_KEY!,
    process.env.GETSTREAM_API_SECRET!
  );
  
  const token = serverClient.createToken(userId);
  return token;
}
```

Update `lib/getstream.ts`:
```typescript
export async function connectStreamUser(userId: string, userName: string, userImage?: string) {
  const client = getStreamChatClient();
  
  // Call your backend to get token
  const token = await fetch('/api/stream-token', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }).then(res => res.json());
  
  await client.connectUser(
    {
      id: userId,
      name: userName,
      image: userImage,
    },
    token
  );
  
  return client;
}
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
- [ ] GetStream production app created
- [ ] GetStream server-side token generation implemented
- [ ] GetStream webhooks configured (optional)

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

#### GetStream Chat
- [ ] Chat works for approved users
- [ ] Chat locked for pending users
- [ ] Messages send/receive in real-time
- [ ] Typing indicators work
- [ ] Read receipts work
- [ ] File uploads work
- [ ] Message reactions work (if enabled)
- [ ] Push notifications configured (optional)
- [ ] Channel creation on match works
- [ ] Both users can see same messages
- [ ] Old Convex messages archived/migrated
- [ ] No message loss during migration
- [ ] Chat performance tested with many messages
- [ ] Offline message queueing works

#### User Flows
- [ ] New user: Sign up → Onboarding → Application Submitted → Pending Screen
- [ ] Approved user: Normal app access + working chat
- [ ] Rejected user: See rejection reason + can reapply
- [ ] Existing user: Unaffected, immediate access + upgraded chat

#### Edge Cases
- [ ] User logs out during pending state
- [ ] User logs back in after approval
- [ ] Multiple devices with same account
- [ ] Network errors during status checks
- [ ] Slow backend responses
- [ ] GetStream connection failures (graceful degradation)
- [ ] Chat works offline (queued messages)
- [ ] User blocked/unblocked in GetStream

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

### Why GetStream for Chat?
**Problem:** Custom Convex chat had multiple issues:
- Keyboard handling complex
- Message virtualization needed optimization
- Real-time sync edge cases
- Maintenance burden high

**Solution:** GetStream SDK
- ✅ Battle-tested chat infrastructure
- ✅ All UI/UX issues solved out-of-the-box
- ✅ Professional features (typing, read receipts, reactions)
- ✅ Scales automatically
- ✅ Less code to maintain
- ✅ Better mobile UX by default

**Trade-off:** Additional service dependency, but worth it for production-ready chat.

### Why Migrate Chat in Phase 0?
- Fixes chat issues before adding application complexity
- Reduced risk (chat is isolated system)
- Better UX for all users (existing and new)
- One less problem to debug during later phases

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

### GetStream Channel Strategy
**Match ID → Channel ID mapping:**
```
matchId: "abc123" → channelId: "match-abc123"
```

**Why this works:**
- Deterministic (same match = same channel)
- No separate channel tracking needed
- Easy to debug (channel ID tells you the match)
- Works with GetStream's channel deduplication

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

| Phase | Duration | Risk | Blocker? | Notes |
|-------|----------|------|----------|-------|
| Phase 0 | 1.5-2 weeks | Medium | No | GetStream migration adds time, but fixes chat permanently |
| Phase 1 | 1 week | Low | No | Backend only, no UI impact |
| Phase 2 | 1 week | Medium | Yes (routing) | Critical routing changes |
| Phase 3 | 1 week | Medium | No | Onboarding additions |
| Phase 4 | 1 week | Medium-High | No | Access enforcement |
| Phase 5 | 1 week | Low | No | Polish & production prep |

**Total: ~7-8 weeks**

Can be compressed if phases are combined, but **not recommended** for first implementation.

**GetStream Impact:**
- Adds ~3-5 days to Phase 0
- Saves debugging time in later phases
- Eliminates chat-related issues permanently
- Worth the upfront investment

---

## Final Recommendations

### Do This First
1. **Set up GetStream account** (https://getstream.io)
2. Implement Phase 0 GetStream migration completely
3. Test chat thoroughly on both iOS and Android
4. Fix any remaining keyboard issues in onboarding
5. Ensure existing users can still use the app

### Do This Next
1. Add application status system (Phase 1)
2. Test with debug tools
3. Ensure existing users unaffected

### Do This Last
1. Enforce access control (Phase 4)
2. Only after all other phases stable

### Don't Do This
- ❌ Implement all phases at once
- ❌ Skip GetStream migration (chat issues will persist)
- ❌ Skip debug tools
- ❌ Ignore keyboard issues
- ❌ Forget to migrate existing users to "approved" status
- ❌ Deploy without testing rollback
- ❌ Use GetStream dev tokens in production

### GetStream Best Practices
- ✅ Test offline behavior (message queueing)
- ✅ Implement server-side token generation before production
- ✅ Set up webhook listeners for message events
- ✅ Configure message moderation rules
- ✅ Test with multiple devices
- ✅ Test with poor network conditions
- ✅ Implement error handling for connection failures

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

6. **GetStream Setup Questions:**
   - Which GetStream plan? (Free tier: 25 MAU, Maker: $99/mo unlimited MAU)
   - Do you need push notifications? (requires additional setup)
   - Do you need message moderation?
   - Do you need message translation? (premium feature)
   - How will you handle chat in rejected/suspended users?

7. **Message Migration Strategy:**
   - Clean slate (recommended) or import old messages?
   - How to notify users of chat upgrade?
   - Archive old Convex messages or delete?

---

## Conclusion

This plan is designed to be:
- ✅ **Incremental** (each phase is self-contained)
- ✅ **Reversible** (rollback strategy for each phase)
- ✅ **Testable** (debug tools built first)
- ✅ **Safe** (existing users unaffected)
- ✅ **Maintainable** (clear architecture decisions)
- ✅ **Production-Ready** (GetStream provides enterprise-grade chat)

### Key Improvements Over Previous Plan

**1. GetStream Chat Integration**
- Eliminates all chat UI/UX issues permanently
- Reduces maintenance burden
- Provides professional chat experience
- Handles keyboard, performance, real-time sync automatically

**2. Phase 0 Sets Foundation**
- Fixes all known issues before adding complexity
- GetStream migration isolated from application logic
- Debug tools ready from day one

**3. Incremental Rollout**
- Each phase adds one layer
- Easy to test and rollback
- No cascading failures

The previous implementation failed because it changed too much at once. This plan takes the opposite approach: **add one layer at a time, test thoroughly, then add the next layer.**

### Critical Success Factors

**For GetStream Migration:**
1. Set up GetStream account FIRST
2. Test chat thoroughly in isolation
3. Decide on message migration strategy
4. Implement server-side tokens before production
5. Test offline behavior

**For Application System:**
1. Start with Phase 0 (don't skip it)
2. Don't move to Phase 1 until Phase 0 is stable
3. Test with debug auto-approve throughout
4. Ensure existing users stay "approved"
5. Test all routing edge cases in Phase 2

This discipline prevents the cascading failures that happened before.

Good luck! 🚐💬✨