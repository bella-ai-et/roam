import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS } from "react-native";
import { supportsGlassEffect } from "@/lib/glass";
import { AppColors, useAppTheme } from "@/lib/theme";

export default function TabLayout() {
  const { colors } = useAppTheme();

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
          <NativeTabs.Trigger.Label>Routes</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: "map", selected: "map.fill" }} md="map" />
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

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: AppColors.primary,
      tabBarInactiveTintColor: colors.onSurfaceVariant,
      tabBarStyle: {
        backgroundColor: colors.background,
        paddingTop: 10, paddingBottom: 10, paddingHorizontal: 10,
        borderRadius: 10, borderWidth: 1, borderColor: colors.outline,
      },
      tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
    }}>
      <Tabs.Screen name="index" options={{ title: "Discover", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "heart" : "heart-outline"} size={24} color={color} /> }} />
      <Tabs.Screen name="routes" options={{ title: "Routes", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "map" : "map-outline"} size={24} color={color} /> }} />
      <Tabs.Screen name="community" options={{ title: "Community", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} /> }} />
    </Tabs>
  );
}
