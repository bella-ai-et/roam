import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import ProfileScreenContent from "@/components/profile/ProfileScreenContent";
import { VanVerificationCard } from "@/components/profile/VanVerificationCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/* ─── Status banner (thin, neutral) ─── */
function StatusBanner({ isDark }: { isDark: boolean }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      style={[styles.statusBanner, isDark && styles.statusBannerDark]}
    >
      <View style={[styles.statusDot, { backgroundColor: "#F5A623" }]} />
      <Text style={[styles.statusText, isDark && styles.statusTextDark]}>
        Your application is under review — you can edit your profile while you wait
      </Text>
    </Animated.View>
  );
}

/* ─── Invite Code Card (indigo "unlock" theme) ─── */
function InviteCodeCard() {
  const { currentUser } = useCurrentUser();
  const { isDark } = useAppTheme();
  const approveWithInviteCode = useMutation(api.users.approveWithInviteCode);

  const [expanded, setExpanded] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!inviteCode.trim() || !currentUser?._id) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await approveWithInviteCode({
        userId: currentUser._id,
        inviteCode: inviteCode.trim(),
      });
      setSubmitting(false);
    } catch {
      setErrorMsg("Invalid invite code. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(500).springify().damping(18)}
      style={[styles.card, isDark ? styles.cardDark : styles.inviteCardLight]}
    >
      {/* Icon badge */}
      <View style={[styles.iconBadge, styles.inviteIconBg]}>
        <Ionicons name="key-outline" size={22} color="#6C5CE7" />
      </View>

      <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
        Unlock Your Profile
      </Text>
      <Text style={[styles.cardDescription, isDark && styles.cardDescDark]}>
        Got an invite code from a friend? Skip the wait and get instant access.
      </Text>

      {!expanded ? (
        <Pressable
          style={[styles.ctaButton, styles.inviteCta]}
          onPress={() => setExpanded(true)}
        >
          <Ionicons name="sparkles" size={16} color="#fff" />
          <Text style={styles.ctaText}>Enter Invite Code</Text>
        </Pressable>
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={styles.inputArea}>
          <View
            style={[
              styles.inputWrap,
              isDark && styles.inputWrapDark,
              errorMsg && styles.inputWrapError,
            ]}
          >
            <Ionicons
              name="key-outline"
              size={16}
              color={errorMsg ? "#E74C3C" : "#6C5CE7"}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="Paste your code here"
              placeholderTextColor={isDark ? "#666" : "#B0AEC1"}
              value={inviteCode}
              onChangeText={(t) => {
                setInviteCode(t);
                if (errorMsg) setErrorMsg(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {errorMsg && (
            <Animated.Text entering={FadeIn.duration(200)} style={styles.errorText}>
              {errorMsg}
            </Animated.Text>
          )}

          <View style={styles.inputActions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => {
                setExpanded(false);
                setInviteCode("");
                setErrorMsg(null);
              }}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelText, isDark && { color: "#888" }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.submitBtn,
                styles.inviteSubmitBg,
                (!inviteCode.trim() || isSubmitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !inviteCode.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Unlock</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function PendingScreen() {
  const { isDark } = useAppTheme();

  return (
    <ProfileScreenContent
      headerContent={
        <View style={styles.headerContent}>
          <StatusBanner isDark={isDark} />
          <InviteCodeCard />
          <VanVerificationCard />
        </View>
      }
    />
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  headerContent: {
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  /* Status banner */
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFF9F0",
    borderWidth: 1,
    borderColor: "#F5DEB3",
  },
  statusBannerDark: {
    backgroundColor: "rgba(245,166,35,0.08)",
    borderColor: "rgba(245,166,35,0.18)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#8B7355",
    fontWeight: "500",
  },
  statusTextDark: {
    color: "#C4A265",
  },

  /* Shared card base */
  card: {
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  inviteCardLight: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0EEF9",
  },

  /* Icon badge */
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  inviteIconBg: {
    backgroundColor: "#EDE9FE",
  },

  /* Card text */
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.3,
  },
  cardTitleDark: {
    color: "#F0EDE8",
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B6580",
    fontWeight: "400",
  },
  cardDescDark: {
    color: "#9E9AA8",
  },

  /* CTA button */
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    marginTop: 4,
  },
  inviteCta: {
    backgroundColor: "#6C5CE7",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  /* Input area */
  inputArea: {
    gap: 12,
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0DCEF",
    backgroundColor: "#FAFAFF",
    paddingHorizontal: 14,
  },
  inputWrapDark: {
    backgroundColor: "rgba(108,92,231,0.06)",
    borderColor: "rgba(108,92,231,0.2)",
  },
  inputWrapError: {
    borderColor: "#E74C3C",
    backgroundColor: "rgba(231,76,60,0.04)",
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  inputDark: {
    color: "#F0EDE8",
  },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    fontWeight: "500",
    marginTop: -4,
    marginLeft: 4,
  },
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cancelBtn: {
    height: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B8598",
  },
  submitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteSubmitBg: {
    backgroundColor: "#6C5CE7",
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
