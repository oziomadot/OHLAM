import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, Alert } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth } from "@/context/AuthContext";
import { getItemSafe } from "@/utils/storage";

const TOKEN_KEY = 'auth_token';   // Must match your ApiService

export default function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: contextLoading, login } = useAuth();

  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (contextLoading) return;

        // Already authenticated in context
        if (isAuthenticated) {
          setIsChecking(false);
          return;
        }

        const token = await getItemSafe(TOKEN_KEY);
        const userJson = await getItemSafe('user');
        const storedPin = await getItemSafe("user_pin");

        // No credentials → redirect to login
        if (!token || !userJson) {
          setShouldRedirect(true);
          setIsChecking(false);
          return;
        }

        const user = JSON.parse(userJson);

        // === Biometric Authentication ===
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Verify your identity to continue",
            fallbackLabel: "Use PIN",
            disableDeviceFallback: false,
          });

          if (result.success) {
            await login(token, user);
            setIsChecking(false);
            return;
          }
        }

        // Biometrics failed or unavailable
        if (storedPin) {
          setShouldRedirect(true);        // Let LoginScreen handle PIN
          setIsChecking(false);
          return;
        }

        // Direct login (no extra security set)
        await login(token, user);
        setIsChecking(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        Alert.alert("Authentication Error", "Please log in again.");
        setShouldRedirect(true);
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, contextLoading, login]);

  if (isChecking || contextLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  if (shouldRedirect || !isAuthenticated) {
    return <Redirect href="/auth/LoginScreen" />;
  }

  return <>{children}</>;
}