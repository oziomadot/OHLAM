import { Tabs, usePathname } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

import {
  registerPushTokenWithBackend,
} from "@/src/services/notifications";

const LAST_VISITED_ROUTE_KEY =
  "@opaam_last_visited_route";

export default function TabLayout() {
  const pathname = usePathname();

  useEffect(() => {
    AsyncStorage.setItem(
      LAST_VISITED_ROUTE_KEY,
      pathname
    ).catch(console.error);
  }, [pathname]);

  useEffect(() => {
    console.log(
      "🚀 TAB LAYOUT: Starting push registration"
    );

    registerPushTokenWithBackend()
      .then((result) => {
        console.log(
          "🚀 TAB LAYOUT: Push registration result:",
          result
        );
      })
      .catch((error) => {
        console.error(
          "🚀 TAB LAYOUT: Push registration failed:",
          error
        );
      });
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          display: "none",
        },
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialIcons
              name="home"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="games/index"
        options={{
          title: "Games",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialIcons
              name="games"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="appointment"
        options={{
          title: "Customer Appointment",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialIcons
              name="person"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <MaterialIcons
              name="info"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}