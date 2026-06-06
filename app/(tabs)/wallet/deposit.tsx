import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import API from "@/src/services/api";
import { getItem } from "../../utils/storage";

export default function PropertyDepositScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startDeposit = async () => {
    setLoading(true);

    try {
      const interestId = await getItem("interest_id");

      const response = await API.request("/property-deposits", {
        method: 'POST',
        body: JSON.stringify({
          interest_id: interestId,
        }),
      });

      Alert.alert(
        "Deposit Started",
        "Your ₦5,000 inspection deposit has been initialized."
      );

      // Later we will redirect to Paystack/Flutterwave checkout here
      console.log(response.data);
    } catch (error: any) {
      console.log(error.response?.data || error);
      Alert.alert("Error", "Could not start deposit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inspection Deposit</Text>

      <Text style={styles.amount}>₦5,000</Text>

      <Text style={styles.info}>
        This amount will remain in your wallet.
      </Text>

      <Text style={styles.info}>
        Your first 3 inspections are free if you attend the inspection.
      </Text>

      <Text style={styles.warning}>
        If you miss an inspection, ₦2,000 will be deducted to compensate the agent.
      </Text>

      <Text style={styles.info}>
        If renting does not work out and you attended your inspection, you can receive a 100% refund.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={startDeposit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Processing..." : "Deposit ₦5,000"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  amount: {
    fontSize: 34,
    fontWeight: "900",
    color: "#007AFF",
    textAlign: "center",
    marginVertical: 20,
  },
  info: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    color: "#333",
  },
  warning: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    color: "#B45309",
    fontWeight: "700",
  },
  button: {
    marginTop: 25,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});