import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { format } from "date-fns";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hapticButtonPress } from "@/lib/haptics";
import { useAppTheme } from "@/lib/theme";

type MatchWithLastMessage = {
  match: Doc<"matches">;
  otherUser: Doc<"users"> | null;
  lastMessage: Doc<"messages"> | null;
  unreadCount: number;
};

function getInitials(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function isRemoteUrl(value?: string) {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function normalizePhotoValue(value?: string) {
  if (!value) return undefined;
  return value.replace(/`/g, "").trim();
}

function HeaderAvatar({ user }: { user: Doc<"users"> | null }) {
  const { colors } = useAppTheme();
  const normalized = normalizePhotoValue(user?.photos?.[0]);
  const remote = isRemoteUrl(normalized);
  const photoUrl = useQuery(
    api.files.getUrl,
    normalized && !remote ? { storageId: normalized as Id<"_storage"> } : "skip"
  );

  if (remote && normalized) {
    return <Image source={{ uri: normalized }} style={styles.headerAvatar} contentFit="cover" />;
  }

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={styles.headerAvatar} contentFit="cover" />;
  }

  const initials = getInitials(user?.name);
  return (
    <View style={[styles.headerAvatar, { backgroundColor: colors.primaryContainer }]}>
      <Text style={[styles.headerInitials, { color: colors.onPrimaryContainer }]}>{initials}</Text>
    </View>
  );
}

export default function ChatScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const params = useLocalSearchParams<{ id?: string }>();
  const matchId = typeof params.id === "string" ? (params.id as Id<"matches">) : undefined;
  const [messageText, setMessageText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const sendMessage = useMutation(api.messages.sendMessage);
  const markMessagesRead = useMutation(api.messages.markMessagesRead);

  const handleSend = useCallback(() => {
    if (!messageText.trim() || !matchId || !currentUser?._id) return;
    sendMessage({ matchId, senderId: currentUser._id, content: messageText.trim() });
    setMessageText("");
    hapticButtonPress();
  }, [messageText, matchId, currentUser?._id, sendMessage]);

  const messages = useQuery(api.messages.getMessages, matchId ? { matchId } : "skip");
  const matchEntries = useQuery(
    api.messages.getMatchesWithLastMessage,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  ) as MatchWithLastMessage[] | undefined;

  const matchEntry = useMemo(
    () => matchEntries?.find((entry) => entry.match._id === matchId) ?? null,
    [matchEntries, matchId]
  );

  const otherUser = matchEntry?.otherUser ?? null;

  useEffect(() => {
    if (matchId && currentUser?._id) {
      markMessagesRead({ matchId, readerId: currentUser._id });
    }
  }, [matchId, currentUser?._id, markMessagesRead]);

  const messageData = useMemo(
    () => (messages ? [...messages].sort((a, b) => b.createdAt - a.createdAt) : []),
    [messages]
  );

  const canSend = messageText.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.outline }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color={colors.onBackground} />
        </Pressable>
        <Pressable
          style={styles.headerCenter}
          onPress={() => {
            if (otherUser?._id) {
              router.push(`/(app)/profile/${otherUser._id}` as never);
            }
          }}
        >
          <HeaderAvatar user={otherUser} />
          <Text style={[styles.headerName, { color: colors.onBackground }]} numberOfLines={1}>
            {otherUser?.name ?? "Chat"}
          </Text>
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages + Input wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        enabled={Platform.OS === "ios" || isKeyboardVisible}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messageData}
          keyExtractor={(item) => item._id}
          inverted
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={styles.listContent}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          renderItem={({ item, index }) => {
            const isOwn = item.senderId === currentUser?._id;
            const previousMessage = messageData[index + 1];
            const nextMessage = messageData[index - 1];
            const isSameAsPrevious = previousMessage?.senderId === item.senderId;
            const showTimestamp = !nextMessage || nextMessage.senderId !== item.senderId;
            return (
              <View
                style={[
                  styles.messageRow,
                  {
                    alignItems: isOwn ? "flex-end" : "flex-start",
                    marginTop: isSameAsPrevious ? 4 : 8,
                  },
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isOwn
                      ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                      : { backgroundColor: colors.surfaceVariant, borderBottomLeftRadius: 4 },
                  ]}
                >
                  <Text style={[styles.messageText, { color: isOwn ? "white" : colors.onBackground }]}>
                    {item.content}
                  </Text>
                </View>
                {showTimestamp ? (
                  <Text
                    style={[
                      styles.timestamp,
                      { color: colors.onSurfaceVariant, alignSelf: isOwn ? "flex-end" : "flex-start" },
                    ]}
                  >
                    {format(new Date(item.createdAt), "h:mm a")}
                  </Text>
                ) : null}
              </View>
            );
          }}
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: colors.outline,
              backgroundColor: colors.background,
              paddingBottom: isKeyboardVisible ? 8 : insets.bottom,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Message..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.input, { color: colors.onBackground, backgroundColor: colors.surfaceVariant }]}
            multiline
            maxLength={800}
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            hitSlop={8}
            style={[styles.sendButton, { backgroundColor: canSend ? colors.primary : colors.surfaceVariant }]}
          >
            <Ionicons name="send" size={20} color={canSend ? colors.onPrimary : colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerSpacer: {
    width: 44,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    columnGap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInitials: {
    fontSize: 13,
    fontWeight: "700",
  },
  headerName: {
    fontSize: 17,
    fontWeight: "700",
  },
  keyboardAvoid: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageRow: {
    width: "100%",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxHeight: 120,
    minHeight: 44,
    borderRadius: 22,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
});
