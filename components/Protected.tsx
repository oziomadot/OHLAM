import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth } from "@/context/AuthContext";


export default function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, login } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const verifyStoredSession = async () => {
      try {
        // Wait for AuthContext to finish initial loading
        if (loading) return;

        const token = await SecureStore.getItemAsync("authToken");
        const userJson = await SecureStore.getItemAsync("user");
        const storedPin = await SecureStore.getItemAsync("user_pin");

        // If already authenticated in context → done
        if (isAuthenticated) {
          setCheckingAuth(false);
          return;
        }

        // 🔐 Try biometric or PIN auto‑unlock
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const canBiometric = hasHardware && enrolled;

        if (token && userJson) {
          const user = JSON.parse(userJson);

          // Prompt biometric first if device supports it
          if (canBiometric) {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: "Verify your identity",
              fallbackLabel: "Use your PIN",
            });

            if (result.success) {
              await login(token, user);
              setCheckingAuth(false);
              return;
            }
          }

          // If biometric not used or failed, require PIN verification
          if (storedPin) {
            // You could show a custom PIN modal here instead of redirect,
            // but for simplicity we redirect to Login screen where PIN UI exists
            setShouldRedirect(true);
            setCheckingAuth(false);
            return;
          }

          // If neither biometrics nor PIN are set but we have token/user → log in directly
          await login(token, user);
          setCheckingAuth(false);
          return;
        }

        // No saved session → redirect to login
        setShouldRedirect(true);
        setCheckingAuth(false);
      } catch (error) {
        console.warn("Protected check error", error);
        Alert.alert("Error", "Authentication check failed.");
        setShouldRedirect(true);
        setCheckingAuth(false);
      }
    };

    verifyStoredSession();
  }, [isAuthenticated, loading]);

  if (checkingAuth || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  if (shouldRedirect) {
    return <Redirect href="/auth/LoginScreen" />;
  }

  return <>{children}</>;
}
