// app/(tabs)/games/_layout.tsx
import { Stack } from "expo-router";
import { useAuth } from '@/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function GamesLayout() {
    const { isAuthenticated, loading, logout } = useAuth();
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
      }
    return <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
            <Stack.Screen name="index" options={{ headerShown: false }} />
        ) : (
            <Stack.Screen name="login" options={{ headerShown: false }} />
        )}
    </Stack>;
}