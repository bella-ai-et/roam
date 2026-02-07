import React, { useState } from "react";
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
  AddStopSheet,
  PathVisibilitySheet,
} from "@/components/profile";
import type { ProfileTab } from "@/components/profile";

export default function ProfileScreen() { 
  const { colors } = useAppTheme();
  const { currentUser, clerkUser } = useCurrentUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const updateRoute = useMutation(api.users.updateRoute);
  const updateProfile = useMutation(api.users.updateProfile);

  const [activeTab, setActiveTab] = useState<ProfileTab>("routes");
  const [addStopVisible, setAddStopVisible] = useState(false);
  const [visibilitySheetVisible, setVisibilitySheetVisible] = useState(false);

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

  const handleAddStop = async (stop: {
    locationName: string;
    latitude: number;
    longitude: number;
    arrivalDate: string;
    departureDate: string;
    notes: string;
    status: string;
  }) => {
    if (!currentUser?._id) return;
    try {
      const existingStops = (currentUser.currentRoute ?? []).map((s) => ({
        location: s.location,
        arrivalDate: s.arrivalDate,
        departureDate: s.departureDate,
        notes: s.notes,
        role: s.role,
        intent: s.intent,
        destinationType: s.destinationType,
        status: s.status,
      }));

      const newStop = {
        location: {
          latitude: stop.latitude,
          longitude: stop.longitude,
          name: stop.locationName,
        },
        arrivalDate: stop.arrivalDate,
        departureDate: stop.departureDate,
        notes: stop.notes || undefined,
        status: stop.status,
      };

      await updateRoute({
        userId: currentUser._id,
        route: [...existingStops, newStop],
      });
      setAddStopVisible(false);
    } catch {
      Alert.alert("Error", "Failed to add stop");
    }
  };

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
              onAddStop={() => setAddStopVisible(true)}
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

        {/* Tab Bar */}
        <View style={[styles.tabBarWrapper, { backgroundColor: colors.background }]}>
          <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Bottom Sheets */}
      <AddStopSheet
        visible={addStopVisible}
        onClose={() => setAddStopVisible(false)}
        onSave={handleAddStop}
      />
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
