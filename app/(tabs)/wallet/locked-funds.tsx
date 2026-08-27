import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import Protected from "components/Protected";
import API from "@/src/services/api";

import usePreventScreenCapture
  from "@/hooks/usePreventScreenCapture";

type WalletSummary = {
  available_balance:
    | string
    | number;

  locked_balance:
    | string
    | number;

  escrow_balance:
    | string
    | number;

  coin_balance?:
    | string
    | number;

  currency?: string;
};

type LockedTransaction = {
  id: number;

  type?: string;

  direction?: string;

  balance_bucket?: string;

  amount?:
    | string
    | number;

  description?: string;

  reference?: string;

  status?: string;

  processed_at?: string | null;

  created_at?: string;

  updated_at?: string;

  transactionable_type?: string;

  transactionable_id?: number | null;
};

const money = (
  value:
    | string
    | number
    | null
    | undefined
) => {
  const amount =
    Number(value ?? 0);

  return `₦${amount.toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
};

const formatDate = (
  value?: string | null
) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-NG",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};

const humanize = (
  value?: string
) => {
  if (!value) {
    return "";
  }

  return value
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
};

export default function LockedFundsScreen() {
  const router =
    useRouter();

  usePreventScreenCapture(true);

  const [
    wallet,
    setWallet,
  ] = useState<
    WalletSummary | null
  >(null);

  const [
    transactions,
    setTransactions,
  ] = useState<
    LockedTransaction[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadData =
    useCallback(
      async (
        silent = false
      ) => {
        try {
          if (!silent) {
            setLoading(true);
          }

          setErrorMessage("");

          /*
           * Load wallet summary and
           * locked transactions together.
           */
          const [
            walletResponse,
            transactionResponse,
          ] = await Promise.all([
            API.getWalletStatement(),

            API.getWalletTransactions({
              balance_bucket:
                "locked",
            }),
          ]);

          /*
           * Wallet response is already
           * normalized by API service.
           */
          const walletBody =
            walletResponse;

          setWallet(
            walletBody?.wallet ??
              null
          );

          /*
           * Wallet transactions are
           * returned inside a Laravel
           * paginator wrapped in data.
           */
          const items:
            LockedTransaction[] =
            Array.isArray(
              transactionResponse
                ?.data?.data
            )
              ? transactionResponse
                  .data.data
              : [];

          /*
           * Safety filter.
           *
           * Even if backend filtering
           * changes, this page should
           * only show locked entries.
           */
          const lockedItems =
            items.filter(
              (
                item:
                  LockedTransaction
              ) =>
                !item.balance_bucket ||
                item.balance_bucket ===
                  "locked"
            );

          setTransactions(
            lockedItems
          );
        } catch (
          error: any
        ) {
          console.error(
            "Locked funds error:",
            error?.response
              ?.data ??
              error
          );

          setErrorMessage(
            error?.response
              ?.data
              ?.message ??
              "Unable to load locked funds."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      loadData();

      return undefined;
    }, [loadData])
  );

  const refresh = () => {
    setRefreshing(true);

    loadData(true);
  };

  if (loading) {
    return (
      <Protected>
        <View
          style={
            styles.center
          }
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading locked funds...
          </Text>
        </View>
      </Protected>
    );
  }

  return (
    <Protected>
      <ScrollView
        style={
          styles.container
        }
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              refresh
            }
          />
        }
      >
        <View
          style={
            styles.heading
          }
        >
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color="#0f172a"
            />
          </TouchableOpacity>

          <View
            style={
              styles.headingText
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Locked Funds
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Money temporarily
              reserved for pending
              commitments
            </Text>
          </View>

          <MaterialCommunityIcons
            name="lock-outline"
            size={30}
            color="#d97706"
          />
        </View>

        <View
          style={
            styles.balanceCard
          }
        >
          <MaterialCommunityIcons
            name="lock"
            size={30}
            color="#ffffff"
          />

          <Text
            style={
              styles.balanceLabel
            }
          >
            Total Locked Balance
          </Text>

          <Text
            style={
              styles.balanceAmount
            }
          >
            {money(
              wallet
                ?.locked_balance
            )}
          </Text>

          <Text
            style={
              styles.balanceHelp
            }
          >
            Locked money cannot be
            spent or withdrawn until
            the related transaction
            completes, fails, is
            rejected, or is released.
          </Text>
        </View>

        <View
          style={
            styles.notice
          }
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={23}
            color="#92400e"
          />

          <Text
            style={
              styles.noticeText
            }
          >
            A withdrawal request moves
            money from your available
            balance into locked funds
            while OHLAM waits for the
            bank transfer result.
          </Text>
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Locked Transactions
        </Text>

        {errorMessage ? (
          <View
            style={
              styles.errorCard
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {errorMessage}
            </Text>

            <TouchableOpacity
              style={
                styles.retryButton
              }
              onPress={() =>
                loadData()
              }
            >
              <Text
                style={
                  styles.retryText
                }
              >
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : transactions.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <MaterialCommunityIcons
              name="lock-open-outline"
              size={40}
              color="#94a3b8"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No locked transactions
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              You currently have no
              transaction entries
              associated with your
              locked balance.
            </Text>
          </View>
        ) : (
          transactions.map(
            (
              transaction
            ) => (
              <LockedItem
                key={
                  transaction.id
                }
                transaction={
                  transaction
                }
              />
            )
          )
        )}

        <View
          style={{
            height: 30,
          }}
        />
      </ScrollView>
    </Protected>
  );
}

function LockedItem({transaction,}: {
  transaction:
    LockedTransaction;
}) {
  const title = humanize(
      transaction.type
    ) ||
    "Locked Funds";

  const direction =
    String(
      transaction.direction ??
        ""
    ).toLowerCase();

  const amountPrefix =
    direction === "credit"
      ? "+"
      : direction ===
          "debit"
        ? "-"
        : "";

  return (
    <View
      style={
        styles.transactionCard
      }
    >
      <View
        style={
          styles.transactionIcon
        }
      >
        <MaterialCommunityIcons
          name="lock-clock"
          size={25}
          color="#d97706"
        />
      </View>

      <View
        style={
          styles.transactionBody
        }
      >
        <Text
          style={
            styles.transactionTitle
          }
        >
          {title}
        </Text>

        {transaction.description ? (
          <Text
            style={
              styles.description
            }
          >
            {
              transaction.description
            }
          </Text>
        ) : null}

        {transaction.reference ? (
          <Text
            style={
              styles.reference
            }
          >
            Ref:{" "}
            {
              transaction.reference
            }
          </Text>
        ) : null}

        <Text
          style={
            styles.date
          }
        >
          {formatDate(
            transaction.created_at
          )}
        </Text>
      </View>

      <View
        style={
          styles.amountBox
        }
      >
        <Text
          style={
            styles.transactionAmount
          }
        >
          {amountPrefix}
          {money(
            transaction.amount
          )}
        </Text>

        <View
          style={
            styles.lockedBadge
          }
        >
          <Text
            style={
              styles.lockedBadgeText
            }
          >
            Locked
          </Text>
        </View>
      </View>
    </View>
  );
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

    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor:
        "#f8fafc",
    },

    loadingText: {
      marginTop: 12,
      color: "#64748b",
      fontWeight: "600",
    },

    heading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
    },

    headingText: {
      flex: 1,
    },

    title: {
      fontSize: 24,
      fontWeight: "900",
      color: "#0f172a",
    },

    subtitle: {
      color: "#64748b",
      marginTop: 3,
      fontSize: 13,
    },

    balanceCard: {
      backgroundColor:
        "#d97706",
      borderRadius: 22,
      padding: 22,
      marginBottom: 14,
    },

    balanceLabel: {
      color: "#fef3c7",
      fontWeight: "700",
      marginTop: 14,
    },

    balanceAmount: {
      color: "#ffffff",
      fontSize: 32,
      fontWeight: "900",
      marginTop: 4,
    },

    balanceHelp: {
      color: "#fef3c7",
      lineHeight: 19,
      marginTop: 9,
      fontSize: 13,
    },

    notice: {
      flexDirection: "row",
      gap: 11,
      backgroundColor:
        "#fffbeb",
      borderWidth: 1,
      borderColor:
        "#fde68a",
      padding: 15,
      borderRadius: 16,
      marginBottom: 24,
    },

    noticeText: {
      flex: 1,
      color: "#78350f",
      fontSize: 13,
      lineHeight: 19,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: "#0f172a",
      marginBottom: 11,
    },

    transactionCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      padding: 15,
      marginBottom: 10,
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 12,
    },

    transactionIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        "#fffbeb",
      justifyContent:
        "center",
      alignItems: "center",
    },

    transactionBody: {
      flex: 1,
    },

    transactionTitle: {
      fontWeight: "900",
      color: "#0f172a",
      fontSize: 15,
    },

    description: {
      color: "#64748b",
      fontSize: 13,
      marginTop: 3,
      lineHeight: 18,
    },

    reference: {
      color: "#94a3b8",
      fontSize: 11,
      marginTop: 5,
    },

    date: {
      color: "#94a3b8",
      fontSize: 11,
      marginTop: 5,
    },

    amountBox: {
      alignItems: "flex-end",
    },

    transactionAmount: {
      color: "#0f172a",
      fontWeight: "900",
      fontSize: 14,
    },

    lockedBadge: {
      backgroundColor:
        "#fef3c7",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 7,
    },

    lockedBadgeText: {
      color: "#92400e",
      fontSize: 10,
      fontWeight: "800",
    },

    emptyCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      padding: 30,
      alignItems: "center",
    },

    emptyTitle: {
      fontWeight: "900",
      fontSize: 17,
      color: "#334155",
      marginTop: 12,
    },

    emptyText: {
      color: "#64748b",
      textAlign: "center",
      marginTop: 6,
      lineHeight: 19,
    },

    errorCard: {
      backgroundColor:
        "#fef2f2",
      padding: 18,
      borderRadius: 16,
    },

    errorText: {
      color: "#991b1b",
      lineHeight: 19,
    },

    retryButton: {
      marginTop: 12,
      alignSelf:
        "flex-start",
    },

    retryText: {
      color: "#2563eb",
      fontWeight: "800",
    },
  });