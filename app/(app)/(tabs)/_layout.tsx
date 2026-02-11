import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supportsGlassEffect } from "@/lib/glass";
import { AppColors, useAppTheme } from "@/lib/theme";

export default function TabLayout() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  if (supportsGlassEffect) {
    return (
      <NativeTabs
        minimizeBehavior="onScrollDown"
        labelStyle={{ color: DynamicColorIOS({ dark: "white", light: "black" }) }}
        tintColor={AppColors.primary}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "heart", selected: "heart.fill" }} md="favorite" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="routes">
          <NativeTabs.Trigger.Label>Syncs</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "bubble.left", selected: "bubble.left.fill" }}
            md="chat_bubble"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="community">
          <NativeTabs.Trigger.Label>Community</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2.fill" }} md="group" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Android-optimized tab bar styling
  return (
    <Tabs screenOptions={{
      headerShown: false,
      animation: "fade",
      tabBarActiveTintColor: AppColors.primary,
      tabBarInactiveTintColor: colors.onSurfaceVariant,
      tabBarStyle: {
        backgroundColor: colors.background,
        height: (Platform.OS === "android" ? 64 : 56) + insets.bottom,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 10 : 8),
        borderTopWidth: 0,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 2,
      },
      tabBarIconStyle: {
        marginTop: 2,
      },
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: "Syncs",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
