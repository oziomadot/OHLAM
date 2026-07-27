import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Protected from "components/Protected";
import API from "@/src/services/api";

export default function SetLoginPinScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] =
    useState("");
  const [pin, setPin] = useState("");
  const [pinConfirmation, setPinConfirmation] =
    useState("");
  const [loading, setLoading] = useState(false);

  const normalizePin = (value: string) =>
    value.replace(/\D/g, "").slice(0, 6);

  const savePin = async () => {
    if (!currentPassword) {
      Alert.alert(
        "Password Required",
        "Enter your current account password."
      );
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      Alert.alert(
        "Invalid PIN",
        "Your login PIN must contain exactly six digits."
      );
      return;
    }

    if (pin !== pinConfirmation) {
      Alert.alert(
        "PIN Does Not Match",
        "The PIN confirmation does not match."
      );
      return;
    }

    if (/^(\d)\1{5}$/.test(pin)) {
      Alert.alert(
        "Weak PIN",
        "Your PIN cannot contain the same digit six times."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await API.setLoginPin({
          current_password:
            currentPassword,
          pin,
          pin_confirmation:
            pinConfirmation,
        });

      Alert.alert(
        "PIN Saved",
        response?.message ||
          "Your login PIN has been saved.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );

      setCurrentPassword("");
      setPin("");
      setPinConfirmation("");
    } catch (error: any) {
      const validationErrors =
        error?.response?.data?.errors;

      const firstError =
        validationErrors &&
        Object.values(validationErrors)
          .flat()
          .find(Boolean);

      Alert.alert(
        "Unable to Save PIN",
        String(
          firstError ||
            error?.response?.data
              ?.message ||
            error?.message ||
            "Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Protected>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.content
          }
        >
          <View style={styles.iconBox}>
            <Ionicons
              name="keypad-outline"
              size={32}
              color="#2563eb"
            />
          </View>

          <Text style={styles.title}>
            Set Login PIN
          </Text>

          <Text style={styles.description}>
            Create a six-digit PIN for faster
            login on trusted devices.
          </Text>

          <Text style={styles.label}>
            Current password
          </Text>

          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            style={styles.input}
            placeholder="Enter current password"
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.label}>
            New six-digit PIN
          </Text>

          <TextInput
            value={pin}
            onChangeText={(value) =>
              setPin(normalizePin(value))
            }
            style={styles.pinInput}
            placeholder="••••••"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            editable={!loading}
          />

          <Text style={styles.label}>
            Confirm PIN
          </Text>

          <TextInput
            value={pinConfirmation}
            onChangeText={(value) =>
              setPinConfirmation(
                normalizePin(value)
              )
            }
            style={styles.pinInput}
            placeholder="••••••"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              loading &&
                styles.disabledButton,
            ]}
            onPress={savePin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                color="#fff"
              />
            ) : (
              <>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={21}
                  color="#fff"
                />

                <Text
                  style={styles.saveButtonText}
                >
                  Save Login PIN
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={21}
              color="#92400e"
            />

            <Text style={styles.noticeText}>
              After five incorrect attempts,
              PIN login will be locked for 15
              minutes. Your password will still
              be available.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
  },
  iconBox: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    marginBottom: 14,
  },
  title: {
    fontSize: 25,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
  },
  description: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 7,
    marginBottom: 25,
    lineHeight: 20,
  },
  label: {
    color: "#334155",
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    minHeight: 55,
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#0f172a",
  },
  pinInput: {
    minHeight: 60,
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 10,
    fontWeight: "900",
    color: "#0f172a",
  },
  saveButton: {
    minHeight: 55,
    marginTop: 24,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.65,
  },
  notice: {
    marginTop: 18,
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 9,
  },
  noticeText: {
    flex: 1,
    color: "#92400e",
    lineHeight: 20,
    fontWeight: "600",
  },
});