import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenWrapper from "components/ScreenWrapper";
import Protected from "components/Protected";
import API from "@/src/services/api";

export default function DeleteReason() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submitDelete = async () => {
    if (!reason.trim()) {
      Alert.alert("Reason required", "Please explain why you want to delete this listing.");
      return;
    }

    try {
      setLoading(true);

      await API.post(`/properties/${id}/delete-request`, {
        reason,
      });

      Alert.alert(
        "Submitted",
        "Your delete request has been submitted. This may affect listing trust score depending on the reason.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/properties/view"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Delete request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Protected>
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.title}>Delete Property Listing</Text>
          <Text style={styles.warning}>
            Deleting a property without valid reason may reduce your lister trust score.
          </Text>

          <TextInput
            style={styles.input}
            multiline
            numberOfLines={6}
            placeholder="Enter reason for deleting this listing..."
            value={reason}
            onChangeText={setReason}
          />

          <TouchableOpacity style={styles.button} onPress={submitDelete} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Submitting..." : "Submit Delete Request"}</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18 },
  title: { fontSize: 24, fontWeight: "900", color: "#0f172a" },
  warning: {
    backgroundColor: "#fff7ed",
    color: "#9a3412",
    padding: 14,
    borderRadius: 12,
    marginVertical: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    padding: 14,
    minHeight: 130,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#dc2626",
    padding: 15,
    borderRadius: 14,
    marginTop: 18,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "900" },
});