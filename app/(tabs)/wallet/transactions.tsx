import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
} from "expo-router";

import API, {
  WalletTransaction,
} from "@/src/services/api";
import usePreventScreenCapture
  from "@/hooks/usePreventScreenCapture";

const money = (
  value: string | number
) =>
  `₦${Number(
    value ?? 0
  ).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function TransactionsScreen() {
  const [
    transactions,
    setTransactions,
  ] = useState<WalletTransaction[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  usePreventScreenCapture(true);

  const loadTransactions =
    useCallback(async () => {
      try {
        const response =
          await API.getWalletTransactions();

        const list =
          response?.data?.data ??
          [];

        setTransactions(list);
      } catch (error) {
        console.error(
          "Transactions:",
          error
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();

      return undefined;
    }, [loadTransactions])
  );

  if (loading) {
    return (
      <View
        style={
          styles.loading
        }
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      data={transactions}
      keyExtractor={(item) =>
        String(item.id)
      }
      refreshControl={
        <RefreshControl
          refreshing={
            refreshing
          }
          onRefresh={() => {
            setRefreshing(true);
            loadTransactions();
          }}
        />
      }
      ListHeaderComponent={
        <View
          style={
            styles.header
          }
        >
          <Text
            style={styles.title}
          >
            Transaction History
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Your wallet ledger
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View
          style={
            styles.empty
          }
        >
          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={42}
            color="#94a3b8"
          />

          <Text
            style={
              styles.emptyTitle
            }
          >
            No transactions yet
          </Text>
        </View>
      }
      renderItem={({
        item,
      }) => {
        const credit =
          item.direction ===
          "credit";

        return (
          <View
            style={
              styles.transactionCard
            }
          >
            <View
              style={[
                styles.transactionIcon,
                credit
                  ? styles.creditIcon
                  : styles.debitIcon,
              ]}
            >
              <MaterialCommunityIcons
                name={
                  credit
                    ? "arrow-down-left"
                    : "arrow-up-right"
                }
                size={23}
                color={
                  credit
                    ? "#15803d"
                    : "#b91c1c"
                }
              />
            </View>

            <View
              style={styles.flex}
            >
              <Text
                style={
                  styles.transactionTitle
                }
              >
                {formatType(
                  item.type
                )}
              </Text>

              <View
                style={
                  styles.metaRow
                }
              >
                <Text
                  style={
                    styles.bucket
                  }
                >
                  {formatType(
                    item.balance_bucket
                  )}
                </Text>

                <Text
                  style={
                    styles.date
                  }
                >
                  {formatDate(
                    item.processed_at ??
                      item.created_at
                  )}
                </Text>
              </View>

              {item.description ? (
                <Text
                  style={
                    styles.description
                  }
                >
                  {
                    item.description
                  }
                </Text>
              ) : null}
            </View>

            <Text
              style={[
                styles.amount,
                credit
                  ? styles.creditAmount
                  : styles.debitAmount,
              ]}
            >
              {credit ? "+" : "-"}
              {money(
                item.amount
              )}
            </Text>
          </View>
        );
      }}
    />
  );
}

function formatType(
  value?: string
) {
  if (!value) {
    return "Transaction";
  }

  return value
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatDate(
  value?: string
) {
  if (!value) {
    return "";
  }

  return new Date(
    value
  ).toLocaleString();
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    content: {
      padding: 18,
      paddingBottom: 50,
    },

    loading: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
    },

    header: {
      marginBottom: 18,
    },

    title: {
      fontSize: 26,
      fontWeight: "900",
      color: "#0f172a",
    },

    subtitle: {
      color: "#64748b",
      marginTop: 4,
    },

    transactionCard: {
      backgroundColor:
        "#ffffff",
      padding: 15,
      borderRadius: 17,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    transactionIcon: {
      height: 45,
      width: 45,
      borderRadius: 14,
      justifyContent:
        "center",
      alignItems: "center",
    },

    creditIcon: {
      backgroundColor:
        "#f0fdf4",
    },

    debitIcon: {
      backgroundColor:
        "#fef2f2",
    },

    flex: {
      flex: 1,
    },

    transactionTitle: {
      color: "#0f172a",
      fontWeight: "800",
    },

    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 5,
    },

    bucket: {
      fontSize: 12,
      color: "#475569",
      backgroundColor:
        "#f1f5f9",
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: 6,
    },

    date: {
      fontSize: 11,
      color: "#94a3b8",
    },

    description: {
      color: "#64748b",
      fontSize: 12,
      marginTop: 6,
    },

    amount: {
      fontWeight: "900",
      fontSize: 15,
    },

    creditAmount: {
      color: "#15803d",
    },

    debitAmount: {
      color: "#b91c1c",
    },

    empty: {
      alignItems: "center",
      marginTop: 80,
    },

    emptyTitle: {
      marginTop: 12,
      color: "#64748b",
      fontWeight: "700",
    },
  });