import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Protected from "components/Protected";
import API from "@/src/services/api";

export default function Wallet() {
  const [walletData, setWalletData] = useState<any>(null);

  useEffect(() => {
    API.getWalletStatement().then(async (data) => {
      setWalletData(data);
      if (!data?.bank_account) {
        await API.post("/wallet/create-virtual-account");
        const updated = await API.getWalletStatement();
        setWalletData(updated);
      }
    });
  }, []);
  return (
    <Protected>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Wallet & Escrow</Text>

        <View style={styles.walletCard}>
          <MaterialCommunityIcons name="wallet" size={34} color="#fff" />
          <Text style={styles.walletLabel}>Wallet Coin Balance</Text>
          <Text style={styles.walletValue}>{walletData?.coin_balance ?? "0.00"}</Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceValue}>{walletData?.available_balance ?? "0.00"}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Locked Balance</Text>
              <Text style={styles.balanceValue}>{walletData?.locked_balance ?? "0.00"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.escrowCard}>
          <MaterialCommunityIcons name="shield-check" size={34} color="#2563eb" />
          <Text style={styles.escrowLabel}>Escrow Balance</Text>
          <Text style={styles.escrowValue}>{walletData?.escrow_balance ?? "0.00"}</Text>
          <Text style={styles.escrowText}>
            Escrow protects both property listers and interested customers until the
            transaction process is confirmed.
          </Text>
        </View>

        {walletData?.bank_account && (
          <View style={styles.bankCard}>
            <MaterialCommunityIcons name="bank" size={28} color="#2563eb" />
            <Text style={styles.bankTitle}>Bank Account Details</Text>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Account Name:</Text>
              <Text style={styles.bankValue}>{walletData.bank_account.account_name}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Account Number:</Text>
              <Text style={styles.bankValue}>{walletData.bank_account.account_number}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Bank Name:</Text>
              <Text style={styles.bankValue}>{walletData.bank_account.bank_name}</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryText}>Fund Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Transaction History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 18 },
  title: { fontSize: 26, fontWeight: "900", color: "#0f172a", marginBottom: 18 },
  walletCard: { backgroundColor: "#2563eb", padding: 24, borderRadius: 26, marginBottom: 16 },
  walletLabel: { color: "#dbeafe", fontWeight: "800", marginTop: 16 },
  walletValue: { color: "#fff", fontWeight: "900", fontSize: 32, marginTop: 8 },
  balanceCard: { backgroundColor: "#fff", padding: 22, borderRadius: 26, marginBottom: 16, elevation: 3 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between" },
  balanceItem: { flex: 1 },
  balanceLabel: { color: "#64748b", fontWeight: "700", fontSize: 14 },
  balanceValue: { color: "#0f172a", fontWeight: "900", fontSize: 20, marginTop: 4 },
  escrowCard: { backgroundColor: "#fff", padding: 22, borderRadius: 26, marginBottom: 16, elevation: 3 },
  escrowLabel: { color: "#64748b", fontWeight: "800", marginTop: 16 },
  escrowValue: { color: "#0f172a", fontWeight: "900", fontSize: 28, marginTop: 8 },
  escrowText: { color: "#64748b", lineHeight: 22, marginTop: 12 },
  bankCard: { backgroundColor: "#fff", padding: 22, borderRadius: 26, marginBottom: 16, elevation: 3 },
  bankTitle: { color: "#0f172a", fontWeight: "800", fontSize: 18, marginTop: 12, marginBottom: 12 },
  bankRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  bankLabel: { color: "#64748b", fontWeight: "600" },
  bankValue: { color: "#0f172a", fontWeight: "700" },
  actions: { gap: 12 },
  primaryButton: { backgroundColor: "#0f172a", padding: 15, borderRadius: 16, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "900" },
  secondaryButton: { backgroundColor: "#e2e8f0", padding: 15, borderRadius: 16, alignItems: "center" },
  secondaryText: { color: "#0f172a", fontWeight: "900" },
});