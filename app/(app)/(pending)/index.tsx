import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileScreenContent from "@/components/profile/ProfileScreenContent";
import { VanVerificationCard } from "@/components/profile/VanVerificationCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function PendingBanner() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useCurrentUser();
  const approveWithInviteCode = useMutation(api.users.approveWithInviteCode);

  const [isInputVisible, setInputVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!inviteCode.trim()) return;
    if (!currentUser?._id) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      console.log("Submitting invite code:", inviteCode.trim());
      await approveWithInviteCode({
        userId: currentUser._id,
        inviteCode: inviteCode.trim(),
      });
      console.log("Mutation success");
      // The 4-state router in (app)/_layout.tsx will automatically redirect:
      // approved + no route → (planning) first-route setup screen
      // approved + has route → (tabs) full access
      setSubmitting(false);
    } catch (err) {
      console.error("Mutation failed:", err);
      setErrorMsg("Invalid invite code. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.banner, { marginTop: insets.top > 0 ? 0 : 8 }]}>
      <View style={styles.topRow}>
        <View style={styles.bannerIcon}>
          <Ionicons name="hourglass-outline" size={18} color="#B8860B" />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Application under review</Text>
          <Text style={styles.bannerSubtitle}>
            You can view and edit your profile while we review your application.
          </Text>
        </View>
      </View>

      {!isInputVisible ? (
        <TouchableOpacity 
          style={styles.inviteLinkButton} 
          onPress={() => setInputVisible(true)}
        >
          <Text style={styles.inviteLinkText}>Have an invite code?</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errorMsg ? styles.inputError : null]}
            placeholder="Enter invite code"
            placeholderTextColor="rgba(232, 146, 74, 0.5)"
            value={inviteCode}
            onChangeText={(text) => {
              setInviteCode(text);
              if (errorMsg) setErrorMsg(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setInputVisible(false);
                setInviteCode("");
                setErrorMsg(null);
              }}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting || !inviteCode.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
    </View>
  );
}

export default function PendingScreen() {
  return (
    <ProfileScreenContent
      headerContent={
        <>
          <PendingBanner />
          <VanVerificationCard />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(232, 146, 74, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(232, 146, 74, 0.25)",
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(232, 146, 74, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E8924A",
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#C4813F",
    lineHeight: 17,
  },
  inviteLinkButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  inviteLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E8924A",
    textDecorationLine: "underline",
  },
  inputContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 4,
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#5D4037",
    borderWidth: 1,
    borderColor: "rgba(232, 146, 74, 0.3)",
  },
  inputError: {
    borderColor: "#D32F2F",
    backgroundColor: "rgba(211, 47, 47, 0.05)",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  submitButton: {
    backgroundColor: "#E8924A",
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
  cancelButton: {
    height: 36,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#C4813F",
    fontSize: 13,
  },
  errorText: {
    fontSize: 12,
    color: "#D32F2F",
    marginTop: -4,
    marginLeft: 4,
  },
});
