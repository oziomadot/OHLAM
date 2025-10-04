import { Stack } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          tabBarShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { display: 'none' },
          style: { padding: 20 },
        }}
      />
    </AuthProvider>
  );
}
