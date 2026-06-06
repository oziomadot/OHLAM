import { Stack } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { OramexBanner } from "../components/OramexBanner";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Add a small delay to ensure the layout is mounted before any navigation occurs
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <AuthProvider>
      <SafeAreaView style={{ flex: 1 }}>
      <OramexBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { padding: 20 },
        }}
      >
        
        <Stack.Screen name="(tabs)" 
        options={{ headerShown: false }}/>
        <Stack.Screen name="auth" 
        options={{ headerShown: false }}/>
      </Stack>
      </SafeAreaView>
    </AuthProvider>
    </SafeAreaProvider>
  );
}
