import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import Protected from "components/Protected";
import API from "@/src/services/api";
import {
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricAvailability,
  isBiometricLoginEnabled,
} from "@/src/services/quickLoginService";
import { getItem } from "@/utils/storage";

export default function LoginSecurityScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] =
    useState(false);
  const [biometricAvailable, setBiometricAvailable] =
    useState(false);
  const [changingBiometric, setChangingBiometric] =
    useState(false);

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    try {
      const [securityResponse, biometricStatus, availability] =
        await Promise.all([
          API.getLoginSecurity(),
          isBiometricLoginEnabled(),
          getBiometricAvailability(),
        ]);

      setPinEnabled(securityResponse.data.pin_enabled);
      setBiometricEnabled(biometricStatus);
      setBiometricAvailable(
        availability.available && availability.enrolled
      );
    } catch (error: any) {
      Alert.alert(
        "Unable to Load Security Settings",
        error?.response?.data?.message ||
          error?.message ||
          "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricChange = async (enabled: boolean) => {
    if (changingBiometric) {
      return;
    }

    setChangingBiometric(true);

    try {
      if (!enabled) {
        await disableBiometricLogin();
        setBiometricEnabled(false);
        return;
      }

      if (!biometricAvailable) {
        Alert.alert(
          "Biometrics Unavailable",
          "Set up fingerprint or face recognition in your phone settings first."
        );
        return;
      }

      const [token, storedUser] = await Promise.all([
        getItem("auth_token"),
        getItem("user"),
      ]);

      if (!token) {
        Alert.alert(
          "Password Login Required",
          "Login with your password again before enabling biometric login."
        );
        return;
      }

      const parsedUser =
        typeof storedUser === "string"
          ? JSON.parse(storedUser)
          : storedUser;

      if (!parsedUser?.id) {
        throw new Error("The logged-in user could not be identified.");
      }

      await enableBiometricLogin({
        token,
        user: parsedUser,
      });

      setBiometricEnabled(true);

      Alert.alert(
        "Biometrics Enabled",
        "You can now use fingerprint or face recognition to unlock OHLAM."
      );
    } catch (error: any) {
      Alert.alert(
        "Biometric Setup Failed",
        error?.message ||
          "Biometric login could not be enabled."
      );
    } finally {
      setChangingBiometric(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Protected>
      <View style={styles.container}>
        <Text style={styles.title}>Login & Security</Text>

        <View style={styles.card}>
          <View style={styles.settingHeader}>
            <View style={styles.iconBox}>
              <Ionicons
                name="keypad-outline"
                size={24}
                color="#2563eb"
              />
            </View>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Login PIN</Text>
              <Text style={styles.settingDescription}>
                {pinEnabled
                  ? "Your 6-digit login PIN is enabled."
                  : "Create a 6-digit PIN for faster login."}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push(
                "/(tabs)/profile/set-login-pin" as never
              )
            }
          >
            <Text style={styles.primaryButtonText}>
              {pinEnabled ? "Change PIN" : "Set Login PIN"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingHeader}>
              <View style={styles.iconBox}>
                <Ionicons
                  name="finger-print-outline"
                  size={26}
                  color="#2563eb"
                />
              </View>

              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  Biometric Login
                </Text>

                <Text style={styles.settingDescription}>
                  Use fingerprint or Face ID on this device.
                </Text>

                {!biometricAvailable && (
                  <Text style={styles.warningText}>
                    Biometrics are unavailable or not enrolled.
                  </Text>
                )}
              </View>
            </View>

            <Switch
              value={biometricEnabled}
              disabled={changingBiometric}
              onValueChange={handleBiometricChange}
            />
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color="#166534"
          />

          <Text style={styles.noticeText}>
            OHLAM does not receive or store your fingerprint or
            Face ID. Your phone performs the biometric check.
          </Text>
        </View>
      </View>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#0f172a",
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconBox: {
    backgroundColor: "#eff6ff",
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    color: "#0f172a",
    fontWeight: "900",
  },
  settingDescription: {
    color: "#64748b",
    lineHeight: 20,
    marginTop: 4,
  },
  warningText: {
    color: "#b45309",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    padding: 13,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  notice: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noticeText: {
    flex: 1,
    color: "#166534",
    lineHeight: 20,
    fontWeight: "600",
  },
});