import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Protected from "components/Protected";
import { walletSummary } from "@/src/data/dashboard";

export default function Wallet() {
  return (
    <Protected>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Wallet & Escrow</Text>

        <View style={styles.walletCard}>
          <MaterialCommunityIcons name="wallet" size={34} color="#fff" />
          <Text style={styles.walletLabel}>Wallet Coin Balance</Text>
          <Text style={styles.walletValue}>{walletSummary.walletBalance}</Text>
        </View>

        <View style={styles.escrowCard}>
          <MaterialCommunityIcons name="shield-check" size={34} color="#2563eb" />
          <Text style={styles.escrowLabel}>Escrow Balance</Text>
          <Text style={styles.escrowValue}>{walletSummary.escrowBalance}</Text>
          <Text style={styles.escrowText}>
            Escrow protects both property listers and interested customers until the
            transaction process is confirmed.
          </Text>
        </View>

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
  escrowCard: { backgroundColor: "#fff", padding: 22, borderRadius: 26, marginBottom: 16, elevation: 3 },
  escrowLabel: { color: "#64748b", fontWeight: "800", marginTop: 16 },
  escrowValue: { color: "#0f172a", fontWeight: "900", fontSize: 28, marginTop: 8 },
  escrowText: { color: "#64748b", lineHeight: 22, marginTop: 12 },
  actions: { gap: 12 },
  primaryButton: { backgroundColor: "#0f172a", padding: 15, borderRadius: 16, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "900" },
  secondaryButton: { backgroundColor: "#e2e8f0", padding: 15, borderRadius: 16, alignItems: "center" },
  secondaryText: { color: "#0f172a", fontWeight: "900" },
});