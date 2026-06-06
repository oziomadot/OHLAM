import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Button, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const AuthUnlockScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      const savedPin = await SecureStore.getItemAsync("user_pin");
      setStoredPin(savedPin);

      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(compatible && enrolled);

      // If token exists, we can skip manual login entirely
      const token = await SecureStore.getItemAsync("authToken");
      const userData = await SecureStore.getItemAsync("user");
      if (token && userData) {
        // Prompt biometric flow automatically
        if (compatible && enrolled) handleBiometricAuth(token, userData);
      }
    })();
  }, []);

  const handleBiometricAuth = async (token?: string, userData?: string) => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify your identity",
        fallbackLabel: "Use PIN",
      });
      if (result.success) {
        if (token && userData) {
          await login(token, JSON.parse(userData));
          router.push("/home");
        }
      } else {
        Alert.alert("Authentication canceled", "Please use PIN instead.");
      }
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Biometric authentication not available.");
    }
  };

  const handlePinSubmit = async () => {
    const token = await SecureStore.getItemAsync("authToken");
    const userData = await SecureStore.getItemAsync("user");
    if (!token || !userData) {
      Alert.alert("No saved session", "Please sign in with email/password first.");
      router.push("/auth/LoginScreen");
      return;
    }

    if (storedPin && pin === storedPin) {
      await login(token, JSON.parse(userData));
      router.push("/home");
    } else {
      Alert.alert("Invalid PIN", "Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Unlock Your Account</Text>

      {isBiometricAvailable && (
        <Button
          mode="contained"
          icon="fingerprint"
          onPress={() => handleBiometricAuth()}
          style={styles.button}
        >
          Use Fingerprint / Face ID
        </Button>
      )}

      <TextInput
        label="Enter PIN"
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        keyboardType="numeric"
        maxLength={4}
        style={styles.input}
      />

      <Button mode="contained" onPress={handlePinSubmit} style={styles.button}>
        Unlock with PIN
      </Button>

      <Button
        onPress={() => router.push("/auth/LoginScreen")}
        style={{ marginTop: 20 }}
      >
        Sign in with Email & Password
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f3f7fa",
  },
  heading: {
    fontSize: 24,
    textAlign: "center",
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 32,
  },
  input: {
    marginVertical: 10,
    backgroundColor: "#fff",
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
  },
});

export default AuthUnlockScreen;
