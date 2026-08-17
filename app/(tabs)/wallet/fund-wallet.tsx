import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import API, { WalletFundingAccount } from "@/src/services/api";

import usePreventScreenCapture from "@/hooks/usePreventScreenCapture";

export default function FundWalletScreen() {
  const [loading, setLoading,  ] = useState(true);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    account,
    setAccount,
  ] =
    useState<WalletFundingAccount | null>(
      null
    );

  usePreventScreenCapture(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet =
    async () => {
      try {
        setLoading(true);

        const data =
          await API.getWalletStatement();

        setAccount(
          data?.funding_account ??
            null
        );
      } catch (error: any) {
        console.error(
          error?.response?.data ??
            error
        );

        Alert.alert(
          "Unable to load wallet",
          error?.response?.data
            ?.message ??
            "Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  const createFundingAccount =
    async () => {
      try {
        setCreating(true);

        const data =
          await API.createWalletFundingAccount();

        setAccount(
          data?.funding_account ??
            data?.account ??
            null
        );

        Alert.alert(
          "Funding account ready",
          "Your wallet funding account has been created."
        );

        await loadWallet();
      } catch (error: any) {
        console.error(
          error?.response?.data ??
            error
        );

        Alert.alert(
          "Unable to create account",
          error?.response?.data
            ?.message ??
            "Please try again."
        );
      } finally {
        setCreating(false);
      }
    };

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Fund Wallet
      </Text>

      <Text
        style={styles.subtitle}
      >
        Transfer money only to
        your official OHLAM wallet
        funding account.
      </Text>

      {!account ? (
        <View
          style={styles.emptyCard}
        >
          <MaterialCommunityIcons
            name="bank-plus"
            size={42}
            color="#2563eb"
          />

          <Text style={ styles.emptyTitle}>
            Funding account not
            created
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            Create your dedicated
            funding account before
            making a bank transfer.
          </Text>

          <TouchableOpacity
            style={styles.button}
            disabled={creating}
            onPress={
              createFundingAccount
            }
          >
            {creating ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <Text
                style={
                  styles.buttonText
                }
              >
                Create Funding
                Account
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <View
              style={
                styles.bankIcon
              }
            >
              <MaterialCommunityIcons
                name="bank"
                size={31}
                color="#2563eb"
              />
            </View>

            <Text
              style={styles.label}
            >
              Bank
            </Text>

            <Text
              style={styles.value}
            >
              {account.bank_name}
            </Text>

            <Text
              style={styles.label}
            >
              Account Number
            </Text>

            <Text
              style={
                styles.accountNumber
              }
            >
              {
                account.account_number
              }
            </Text>

            <Text
              style={styles.label}
            >
              Account Name
            </Text>

            <Text
              style={styles.value}
            >
              {
                account.account_name
              }
            </Text>
          </View>

          <View
            style={
              styles.noticeCard
            }
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={23}
              color="#2563eb"
            />

            <Text
              style={
                styles.noticeText
              }
            >
              Funds received and
              confirmed by the
              payment provider will
              be credited to your
              available wallet
              balance.
            </Text>
          </View>

          <View
            style={
              styles.warningCard
            }
          >
            <MaterialCommunityIcons
              name="shield-alert-outline"
              size={23}
              color="#b45309"
            />

            <Text
              style={
                styles.warningText
              }
            >
              This account is for
              funding your OHLAM
              wallet. It is not your
              personal payout bank
              account.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor:
        "#f8fafc",
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor:
        "#f8fafc",
    },

    title: {
      fontSize: 27,
      fontWeight: "900",
      color: "#0f172a",
      textAlign: "center",
    },

    subtitle: {
      color: "#64748b",
      textAlign: "center",
      marginTop: 8,
      marginBottom: 22,
      lineHeight: 21,
    },

    card: {
      backgroundColor:
        "#ffffff",
      padding: 22,
      borderRadius: 22,
      elevation: 2,
    },

    bankIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor:
        "#eff6ff",
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 18,
    },

    label: {
      fontSize: 13,
      fontWeight: "700",
      color: "#64748b",
      marginBottom: 4,
    },

    value: {
      fontSize: 17,
      color: "#0f172a",
      fontWeight: "700",
      marginBottom: 19,
    },

    accountNumber: {
      fontSize: 26,
      fontWeight: "900",
      color: "#0f172a",
      letterSpacing: 1,
      marginBottom: 19,
    },

    emptyCard: {
      backgroundColor:
        "#ffffff",
      padding: 28,
      borderRadius: 22,
      alignItems: "center",
    },

    emptyTitle: {
      marginTop: 15,
      fontSize: 18,
      fontWeight: "900",
      color: "#0f172a",
    },

    emptyText: {
      marginTop: 8,
      color: "#64748b",
      textAlign: "center",
      lineHeight: 21,
    },

    button: {
      width: "100%",
      marginTop: 20,
      backgroundColor:
        "#2563eb",
      padding: 15,
      borderRadius: 14,
      alignItems: "center",
    },

    buttonText: {
      color: "#ffffff",
      fontWeight: "900",
    },

    noticeCard: {
      marginTop: 15,
      backgroundColor:
        "#eff6ff",
      padding: 16,
      borderRadius: 16,
      flexDirection: "row",
      gap: 10,
    },

    noticeText: {
      flex: 1,
      color: "#1e3a8a",
      lineHeight: 20,
    },

    warningCard: {
      marginTop: 12,
      backgroundColor:
        "#fffbeb",
      padding: 16,
      borderRadius: 16,
      flexDirection: "row",
      gap: 10,
    },

    warningText: {
      flex: 1,
      color: "#92400e",
      lineHeight: 20,
    },
  });