// app/(tabs)/games/_layout.tsx
import { Stack } from "expo-router";
import { useAuth } from '@/context/AuthContext';

export default function GamesLayout() {
    const { isAuthenticated, loading, logout } = useAuth();
    if (loading) {
        return <LoadingScreen />; // or null
      }
    return <Stack screenOptions={{ headerShown: true }}>
        {isAuthenticated ? (
            <Stack.Screen name="index" options={{ headerShown: false }} />
        ) : (
            <Stack.Screen name="login" options={{ headerShown: false }} />
        )}
    </Stack>;
}