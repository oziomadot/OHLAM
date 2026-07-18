import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

const EscrowScreen = () => {
  const { propertyId, requiredEscrow, currentEscrow, amountNeeded, message } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
  <Text style={styles.title}>Escrow Dashboard</Text>

  {message ? (
    <Text style={styles.message}>{message}</Text>
  ) : null}

  <View style={styles.row}>
    <Text style={styles.label}>Required Escrow</Text>
    <Text style={styles.value}>
      ₦{Number(requiredEscrow).toLocaleString()}
    </Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Wallet Balance</Text>
    <Text style={styles.value}>
      ₦{Number(currentEscrow).toLocaleString()}
    </Text>
  </View>

  <View style={styles.row}>
    <Text style={styles.label}>Amount Needed</Text>
    <Text style={styles.danger}>
      ₦{Number(amountNeeded).toLocaleString()}
    </Text>
  </View>

  <TouchableOpacity
    style={styles.depositBtn}
    onPress={() => router.push("/wallet/fund-wallet")}
  >
    <Text style={styles.depositText}>
      Fund Wallet
    </Text>
  </TouchableOpacity>
</View>

<View>
  
</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: "#64748b",
    lineHeight: 22,
  },
  card: {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 20,
  marginVertical: 20,
  elevation: 3,
},




row: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 15,
},

label: {
  fontSize: 16,
  color: "#64748b",
},

value: {
  fontSize: 16,
  fontWeight: "600",
},

danger: {
  fontSize: 16,
  fontWeight: "700",
  color: "#dc2626",
},

depositBtn: {
  backgroundColor: "#16a34a",
  padding: 15,
  borderRadius: 12,
  alignItems: "center",
  marginTop: 20,
},

depositText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 16,
},
});

export default EscrowScreen;