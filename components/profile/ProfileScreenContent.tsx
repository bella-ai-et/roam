import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useAppTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hapticButtonPress } from "@/lib/haptics";
import { api } from "@/convex/_generated/api";
import {
  ProfileHeader,
  ProfileTabBar,
  JourneyTimeline,
  PathVisibilityCard,
  BioInfoTab,
  MediaTab,
  PathVisibilitySheet,
} from "@/components/profile";
import { EditStopSheet } from "@/components/profile/EditStopSheet";
import type { ProfileTab } from "@/components/profile";

interface ProfileScreenContentProps {
  headerContent?: React.ReactNode;
}

export default function ProfileScreenContent({ headerContent }: ProfileScreenContentProps) { 
  const { colors } = useAppTheme();
  const { currentUser, clerkUser } = useCurrentUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const updateProfile = useMutation(api.users.updateProfile);

  const [activeTab, setActiveTab] = useState<ProfileTab>("routes");
  const [visibilitySheetVisible, setVisibilitySheetVisible] = useState(false);
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);

  const updateRoute = useMutation(api.users.updateRoute);

  const displayName = currentUser?.name || clerkUser?.fullName || "Your Profile";
  const photos = currentUser?.photos ?? [];
  const routeStops = currentUser?.currentRoute ?? [];
  const pathVisibility = (currentUser as any)?.pathVisibility ?? "everyone";

  const handleOpenSettings = () => {
    hapticButtonPress();
    router.push("/(app)/settings");
  };

  const handleEditPhotos = () => {
    hapticButtonPress();
    router.push("/(app)/edit-photos");
  };

  const handleEditRoute = () => {
    hapticButtonPress();
    router.push("/(app)/edit-route" as any);
  };

  const handleEditStop = useCallback((index: number) => {
    hapticButtonPress();
    setEditingStopIndex(index);
  }, []);

  const handleSaveStop = useCallback(
    async (index: number, updated: any) => {
      if (!currentUser?._id) return;
      const newRoute = [...routeStops];
      newRoute[index] = updated;
      try {
        await updateRoute({ userId: currentUser._id, route: newRoute });
      } catch {
        Alert.alert("Error", "Failed to update stop");
      }
    },
    [currentUser, routeStops, updateRoute]
  );

  const handleDeleteStop = useCallback(
    async (index: number) => {
      if (!currentUser?._id) return;
      const newRoute = routeStops.filter((_: any, i: number) => i !== index);
      try {
        await updateRoute({ userId: currentUser._id, route: newRoute });
      } catch {
        Alert.alert("Error", "Failed to remove stop");
      }
    },
    [currentUser, routeStops, updateRoute]
  );

  const handleChangeVisibility = async (visibility: string) => {
    if (!currentUser?._id) return;
    try {
      await updateProfile({
        userId: currentUser._id,
        pathVisibility: visibility,
      });
    } catch {
      Alert.alert("Error", "Failed to update visibility");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "routes":
        return (
          <>
            <JourneyTimeline
              stops={routeStops}
              onAddStop={handleEditRoute}
              onEditStop={handleEditStop}
            />
            <PathVisibilityCard
              visibility={pathVisibility}
              onChangeVisibility={() => setVisibilitySheetVisible(true)}
            />
          </>
        );
      case "bio":
        return currentUser ? <BioInfoTab user={currentUser} /> : null;
      case "media":
        return <MediaTab photos={photos} onEditPhotos={handleEditPhotos} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Settings gear — top right */}
      <Pressable
        onPress={handleOpenSettings}
        style={[styles.settingsButton, { top: insets.top + 12 }]}
        hitSlop={12}
      >
        <Ionicons name="settings-outline" size={24} color={colors.onSurfaceVariant} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Optional header content (e.g. pending banner) + Avatar + Name */}
        <View>
          {headerContent}
          {/* Header: Avatar + Name + Subtitle */}
          <ProfileHeader
            name={displayName}
            vanVerified={currentUser?.vanVerified}
            vanModel={(currentUser as any)?.vanModel}
            vanType={currentUser?.vanType}
            nomadSinceYear={(currentUser as any)?.nomadSinceYear}
            photoStorageId={photos[0]}
            onEditPhoto={handleEditPhotos}
          />
        </View>

        {/* Tab Bar (sticky) */}
        <View style={[styles.tabBarWrapper, { backgroundColor: colors.background }]}>
          <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Bottom Sheets */}
      <PathVisibilitySheet
        visible={visibilitySheetVisible}
        currentVisibility={pathVisibility}
        onClose={() => setVisibilitySheetVisible(false)}
        onSelect={handleChangeVisibility}
      />

      <EditStopSheet
        visible={editingStopIndex !== null}
        stop={editingStopIndex !== null ? routeStops[editingStopIndex] : null}
        stopIndex={editingStopIndex ?? 0}
        onClose={() => setEditingStopIndex(null)}
        onSave={handleSaveStop}
        onDelete={handleDeleteStop}
      />
    </View>
  );
} 

const styles = StyleSheet.create({ 
  container: { flex: 1 },
  content: {},
  settingsButton: {
    position: "absolute",
    right: 20,
    zIndex: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBarWrapper: {
    zIndex: 10,
    paddingTop: 4,
  },
});
