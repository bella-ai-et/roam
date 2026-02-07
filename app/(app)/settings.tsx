import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { useAppTheme, AppColors } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hapticButtonPress } from "@/lib/haptics";
import { api } from "@/convex/_generated/api";
import { PathVisibilitySheet } from "@/components/profile";

type SettingsRow = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: string;
};

type SettingsSection = {
  title: string;
  rows: SettingsRow[];
};

export default function SettingsScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { currentUser } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const [visibilitySheetVisible, setVisibilitySheetVisible] = useState(false);

  const pathVisibility = (currentUser as any)?.pathVisibility ?? "everyone";

  const handleChangeVisibility = async (visibility: string) => {
    if (!currentUser?._id) return;
    try {
      await updateProfile({ userId: currentUser._id, pathVisibility: visibility });
    } catch {
      Alert.alert("Error", "Failed to update visibility");
    }
  };

  const handleSignOut = () => {
    hapticButtonPress();
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    hapticButtonPress();
    Alert.alert(
      "Delete or Pause Account",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert("Coming Soon", "Account deletion will be available soon.");
          },
        },
      ]
    );
  };

  const placeholder = () => {
    hapticButtonPress();
    Alert.alert("Coming Soon", "This feature is not yet available.");
  };

  const sections: SettingsSection[] = [
    {
      title: "Account",
      rows: [
        {
          label: "Path Visibility",
          icon: "eye-outline",
          onPress: () => setVisibilitySheetVisible(true),
        },
        {
          label: "Notifications",
          icon: "notifications-outline",
          onPress: placeholder,
        },
        {
          label: "Blocked Users",
          icon: "ban-outline",
          onPress: placeholder,
        },
      ],
    },
    {
      title: "Legal",
      rows: [
        {
          label: "Privacy Policy",
          icon: "document-text-outline",
          onPress: () => Linking.openURL("https://roamapp.com/privacy"),
        },
        {
          label: "Terms of Service",
          icon: "reader-outline",
          onPress: () => Linking.openURL("https://roamapp.com/terms"),
        },
        {
          label: "Privacy Preferences",
          icon: "shield-outline",
          onPress: placeholder,
          badge: "NEW",
        },
      ],
    },
    {
      title: "Community",
      rows: [
        {
          label: "Safe Travel Tips",
          icon: "heart-outline",
          onPress: placeholder,
        },
        {
          label: "Community Guidelines",
          icon: "people-outline",
          onPress: placeholder,
        },
      ],
    },
    {
      title: "Support",
      rows: [
        {
          label: "Help & FAQ",
          icon: "help-circle-outline",
          onPress: placeholder,
        },
        {
          label: "Report a Problem",
          icon: "flag-outline",
          onPress: placeholder,
        },
      ],
    },
  ];

  const separatorColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.onBackground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              {section.title}
            </Text>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? colors.surface : "#fff",
                  borderColor: separatorColor,
                },
              ]}
            >
              {section.rows.map((row, index) => (
                <React.Fragment key={row.label}>
                  {index > 0 && (
                    <View style={[styles.rowSeparator, { backgroundColor: separatorColor }]} />
                  )}
                  <Pressable
                    onPress={row.onPress}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <Ionicons
                        name={row.icon}
                        size={20}
                        color={colors.onSurfaceVariant}
                        style={styles.rowIcon}
                      />
                      <Text style={[styles.rowLabel, { color: colors.onBackground }]}>
                        {row.label}
                      </Text>
                      {row.badge && (
                        <View style={[styles.badge, { backgroundColor: AppColors.primary }]}>
                          <Text style={styles.badgeText}>{row.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Log Out */}
        <View style={styles.actionSection}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.actionRow,
              {
                backgroundColor: isDark ? colors.surface : "#fff",
                borderColor: separatorColor,
              },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.actionText, { color: colors.onBackground }]}>Log Out</Text>
          </Pressable>
        </View>

        {/* Delete / Pause */}
        <View style={styles.actionSection}>
          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.actionRow,
              {
                backgroundColor: isDark ? colors.surface : "#fff",
                borderColor: separatorColor,
              },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.actionTextDestructive, { color: colors.error }]}>
              Delete or Pause Account
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <PathVisibilitySheet
        visible={visibilitySheetVisible}
        currentVisibility={pathVisibility}
        onClose={() => setVisibilitySheetVisible(false)}
        onSelect={handleChangeVisibility}
      />
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  badge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  rowSeparator: {
    height: 1,
    marginLeft: 50,
  },
  actionSection: {
    marginBottom: 12,
  },
  actionRow: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionTextDestructive: {
    fontSize: 16,
    fontWeight: "600",
  },
});
