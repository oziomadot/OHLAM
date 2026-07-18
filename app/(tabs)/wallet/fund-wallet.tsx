import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import API from "@/src/services/api";

export default function FundWalletScreen() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await API.get("/wallet");

      setAccount(res.data.wallet.accounts[0]);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fund Wallet</Text>

      <Text style={styles.info}>
        Transfer money to the account below.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Bank</Text>
        <Text style={styles.value}>
          {account?.bank_name}
        </Text>

        <Text style={styles.label}>Account Number</Text>
        <Text style={styles.account}>
          {account?.account_number}
        </Text>

        <Text style={styles.label}>Account Name</Text>
        <Text style={styles.value}>
          {account?.account_name}
        </Text>
      </View>

      <Text style={styles.note}>
        Funds transferred to this account will automatically
        appear in your OHLAM wallet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#000',
    marginBottom: 16,
  },
  account: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});