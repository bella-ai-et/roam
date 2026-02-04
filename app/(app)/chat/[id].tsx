import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
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
import { AdaptiveGlassView } from "@/lib/glass";
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

function HeaderAvatar({ user }: { user: Doc<"users"> | null }) {
  const { colors } = useAppTheme();
  const photoUrl = useQuery(
    api.files.getUrl,
    user?.photos?.[0] ? { storageId: user.photos[0] as Id<"_storage"> } : "skip"
  );

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

  const markMessagesRead = useMutation(api.messages.markMessagesRead);
  const sendMessage = useMutation(api.messages.sendMessage);

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
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding">
      <AdaptiveGlassView style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.outline }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.headerSide}>
            <Ionicons name="chevron-back" size={22} color={colors.onBackground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <HeaderAvatar user={otherUser} />
            <Text style={[styles.headerName, { color: colors.onBackground }]}>
              {otherUser?.name ?? "Chat"}
            </Text>
          </View>
          <Pressable onPress={() => {}} style={styles.headerSide}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.onBackground} />
          </Pressable>
        </View>
      </AdaptiveGlassView>

      <FlatList
        data={messageData}
        keyExtractor={(item) => item._id}
        inverted
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
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

      <AdaptiveGlassView
        style={[
          styles.inputBar,
          { paddingBottom: insets.bottom + 10, borderTopColor: colors.outline },
        ]}
      >
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Message..."
          placeholderTextColor={colors.onSurfaceVariant}
          style={[styles.input, { color: colors.onBackground }]}
          multiline
          maxLength={800}
        />
        <Pressable
          onPress={() => {
            if (!canSend || !matchId || !currentUser?._id) return;
            sendMessage({ matchId, senderId: currentUser._id, content: messageText.trim() });
            setMessageText("");
            hapticButtonPress();
          }}
          disabled={!canSend}
          style={[styles.sendButton, { opacity: canSend ? 1 : 0.4 }]}
        >
          <Ionicons name="send-outline" size={22} color={colors.primary} />
        </Pressable>
      </AdaptiveGlassView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSide: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    columnGap: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInitials: {
    fontSize: 14,
    fontWeight: "700",
  },
  headerName: {
    fontSize: 17,
    fontWeight: "700",
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
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 6,
    paddingRight: 12,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
