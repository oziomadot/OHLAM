import { Stack } from "expo-router";

// The root layout owns authentication, safe areas, notifications and the banner.
export default function TabsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
