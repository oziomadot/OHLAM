import { Tabs, usePathname } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

const LAST_VISITED_ROUTE_KEY = "@opaam_last_visited_route";

export default function TabLayout() {
  const pathname = usePathname();

  useEffect(() => {
    AsyncStorage.setItem(LAST_VISITED_ROUTE_KEY, pathname).catch(console.error);
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: { backgroundColor: "#fff", height: 60 },
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      {/* Only include tabs that actually exist under app/(tabs)/ */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="games" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="appointment"
        options={{
          title: "Customer Appointment",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
