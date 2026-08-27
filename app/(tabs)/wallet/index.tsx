import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
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
  useRouter,
  useFocusEffect,
} from "expo-router";

import Protected from "components/Protected";
import API from "@/src/services/api";
import usePreventScreenCapture
  from "@/hooks/usePreventScreenCapture";
import Navbar from "components/Navbar";

type WalletSummary = {
  id?: number;
  available_balance: string | number;
  locked_balance: string | number;
  escrow_balance: string | number;
  coin_balance: string | number;
  currency?: string;
};

type FundingAccount = {
  bank_name: string;
  account_number: string;
  account_name: string;
};

type BankAccount = {
  bank_name: string;
  account_number: string;
  account_name: string;
};

type WalletResponse = {
  wallet?: WalletSummary;

  funding_account?:
    | FundingAccount
    | null;

  bank_account?:
    | BankAccount
    | null;
};

const money = (
  amount?: string | number | null
) => {
  const numeric =
    Number(amount ?? 0);

  return `₦${numeric.toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
};

export default function WalletScreen() {

   const router = useRouter();
  const [
    data,
    setData,
  ] = useState<WalletResponse | null>(
    null
  );

   const goTo = (route: string) => {
    router.push(route as any);
  };

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  usePreventScreenCapture(true);

const loadWallet = useCallback(
  async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const response =
        await API.getWalletStatement();

      console.log(
        "RAW WALLET RESPONSE:",
        JSON.stringify(
          response,
          null,
          2
        )
      );

      const walletData = response;

      console.log(
        "NORMALIZED WALLET DATA:",
        JSON.stringify(
          walletData,
          null,
          2
        )
      );

      console.log(
        "AVAILABLE BALANCE:",
        walletData
          ?.wallet
          ?.available_balance
      );

      console.log(
        "LOCKED BALANCE:",
        walletData
          ?.wallet
          ?.locked_balance
      );

      console.log(
        "ESCROW BALANCE:",
        walletData
          ?.wallet
          ?.escrow_balance
      );

      console.log(
        "COIN BALANCE:",
        walletData
          ?.wallet
          ?.coin_balance
      );

      setData(
        walletData ?? null
      );
    } catch (error: any) {
      console.error(
        "Wallet error:",
        error?.response?.data ??
          error
      );

      Alert.alert(
        "Wallet unavailable",
        error?.response?.data
          ?.message ??
          "Unable to load your wallet."
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
      loadWallet();

      return undefined;
    }, [loadWallet])
  );

  const refresh = () => {
    setRefreshing(true);

    loadWallet(true);
  };

  const wallet = data?.wallet;

  if (
    loading &&
    !data
  ) {
    return (
      <Protected>
        <Navbar/>
        <View
          style={
            styles.loadingContainer
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
            Loading wallet...
          </Text>
        </View>
      </Protected>
    );
  }

  return (
    <Protected>
      <ScrollView
        style={styles.container}
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
            styles.headingRow
          }
        >
          <View>
            <Text
              style={styles.title}
            >
              Wallet
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Wallet, locked funds
              and escrow
            </Text>
          </View>

          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={30}
            color="#2563eb"
          />
        </View>

        {/* AVAILABLE BALANCE */}

        <View
          style={
            styles.mainCard
          }
        >
          <View
            style={styles.iconBox}
          >
            <MaterialCommunityIcons
              name="wallet"
              size={27}
              color="#ffffff"
            />
          </View>

          <Text
            style={
              styles.mainLabel
            }
          >
            Available Balance
          </Text>

          <Text
            style={
              styles.mainAmount
            }
          >
            {money(
              wallet
                ?.available_balance
            )}
          </Text>

          <Text
            style={
              styles.mainDescription
            }
          >
            Money currently
            available for eligible
            OHLAM transactions.
          </Text>

          <TouchableOpacity
            style={
              styles.fundButton
            }
            onPress={() =>
              goTo("/(tabs)/wallet/fund-wallet")
            }
          >
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={20}
              color="#0f172a"
            />

            <Text
              style={
                styles.fundButtonText
              }
            >
              Fund Wallet
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOCKED + ESCROW */}

        <View
          style={
            styles.balanceGrid
          }
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={
              styles.balanceCard
            }
            onPress={() =>
              goTo(
                "/(tabs)/wallet/locked-funds"
              )
            }
          >
            <MaterialCommunityIcons
              name="lock-outline"
              size={27}
              color="#d97706"
            />

            <Text
              style={
                styles.balanceLabel
              }
            >
              Locked
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
                styles.balanceHint
              }
            >
              Reserved commitments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={
              styles.balanceCard
            }
            onPress={() =>
              goTo(
                "/(tabs)/wallet/escrow"
              )
            }
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={27}
              color="#2563eb"
            />

            <Text
              style={
                styles.balanceLabel
              }
            >
              Escrow
            </Text>

            <Text
              style={
                styles.balanceAmount
              }
            >
              {money(
                wallet
                  ?.escrow_balance
              )}
            </Text>

            <Text
              style={
                styles.balanceHint
              }
            >
              Transaction protection
            </Text>
          </TouchableOpacity>
        </View>

        {/* COINS */}

        <View
          style={styles.coinCard}
        >
          <MaterialCommunityIcons
            name="star-circle"
            size={32}
            color="#ca8a04"
          />

          <View
            style={styles.flex}
          >
            <Text
              style={
                styles.sectionCardTitle
              }
            >
              OHLAM Coins
            </Text>

            <Text
              style={
                styles.sectionDescription
              }
            >
              Reward balance
            </Text>
          </View>

          <Text
            style={
              styles.coinAmount
            }
          >
            {Number(
              wallet
                ?.coin_balance ??
                0
            ).toLocaleString()}
          </Text>
        </View>

        {/* INFORMATION */}

        <View
          style={styles.infoCard}
        >
          <Text
            style={
              styles.infoTitle
            }
          >
            How your balances work
          </Text>

          <InfoRow
            icon="wallet-outline"
            title="Available"
            text="Money you can currently use."
          />

          <InfoRow
            icon="lock-outline"
            title="Locked"
            text="Money temporarily reserved for a commitment, such as an inspection or appointment."
          />

          <InfoRow
            icon="shield-check-outline"
            title="Escrow"
            text="Money held for an active property transaction until the applicable settlement conditions are completed."
          />
        </View>

        {/* ACTIONS */}

      

<Text
  style={styles.sectionTitle}
>
  Wallet services
</Text>



        <Action
          icon="bank-transfer-in"
          title="Fund Wallet"
          subtitle="Transfer money to your OHLAM funding account."
          onPress={() =>
            goTo(
              "/(tabs)/wallet/fund-wallet"
            )
          }
        />

        <Action
  icon="bank-transfer-out"
  title="Withdraw Funds"
  subtitle="Request withdrawal of your available wallet balance to your payout bank account."
  onPress={() =>
    goTo(
      "/(tabs)/wallet/withdraw"
    )
  }
/>

        <Action
          icon="history"
          title="Transaction History"
          subtitle="View credits, debits, locks, escrow movements and releases."
          onPress={() =>
            goTo(
              "/(tabs)/wallet/transactions"
            )
          }
        />

        <Action
          icon="bank-outline"
          title="Payout Bank Account"
          subtitle="Manage the bank account used for eligible payouts."
          onPress={() =>
            goTo(
              "/(tabs)/wallet/bank-account"
            )
          }
        />

        <Text
          style={
            styles.securityNotice
          }
        >
          Financial transactions are
          recorded in your wallet
          ledger. OHLAM will never ask
          you to send property
          transaction funds to a
          personal bank account outside
          an approved payment flow.
        </Text>
      </ScrollView>
    </Protected>
  );
}

function InfoRow({
  icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color="#475569"
      />

      <View style={styles.flex}>
        <Text
          style={
            styles.infoRowTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.infoRowText
          }
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

function Action({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={onPress}
    >
      <View
        style={
          styles.actionIcon
        }
      >
        <MaterialCommunityIcons
          name={icon}
          size={25}
          color="#2563eb"
        />
      </View>

      <View style={styles.flex}>
        <Text
          style={
            styles.actionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.actionSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={26}
        color="#94a3b8"
      />
    </TouchableOpacity>
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

    loadingContainer: {
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

    headingRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 20,
    },

    title: {
      fontSize: 28,
      fontWeight: "900",
      color: "#0f172a",
    },

    subtitle: {
      color: "#64748b",
      marginTop: 4,
    },

    mainCard: {
      backgroundColor:
        "#2563eb",
      padding: 22,
      borderRadius: 24,
      marginBottom: 14,
    },

    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor:
        "rgba(255,255,255,0.16)",
      alignItems: "center",
      justifyContent:
        "center",
    },

    mainLabel: {
      color: "#dbeafe",
      marginTop: 18,
      fontWeight: "700",
    },

    mainAmount: {
      color: "#ffffff",
      fontSize: 32,
      fontWeight: "900",
      marginTop: 4,
    },

    mainDescription: {
      color: "#dbeafe",
      lineHeight: 20,
      marginTop: 8,
    },

    fundButton: {
      marginTop: 20,
      backgroundColor:
        "#ffffff",
      alignSelf:
        "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: 14,
    },

    fundButtonText: {
      color: "#0f172a",
      fontWeight: "800",
    },

    balanceGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 14,
    },

    balanceCard: {
      flex: 1,
      backgroundColor:
        "#ffffff",
      padding: 18,
      borderRadius: 20,
      minHeight: 145,
      elevation: 2,
    },

    balanceLabel: {
      marginTop: 14,
      color: "#64748b",
      fontWeight: "700",
    },

    balanceAmount: {
      color: "#0f172a",
      fontWeight: "900",
      fontSize: 19,
      marginTop: 4,
    },

    balanceHint: {
      fontSize: 12,
      color: "#94a3b8",
      marginTop: 7,
    },

    coinCard: {
      backgroundColor:
        "#ffffff",
      padding: 18,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 18,
      elevation: 2,
    },

    flex: {
      flex: 1,
    },

    sectionCardTitle: {
      color: "#0f172a",
      fontWeight: "800",
      fontSize: 16,
    },

    sectionDescription: {
      color: "#64748b",
      fontSize: 13,
      marginTop: 2,
    },

    coinAmount: {
      fontSize: 20,
      fontWeight: "900",
      color: "#854d0e",
    },

    infoCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 20,
      padding: 18,
      marginBottom: 22,
    },

    infoTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: "#0f172a",
      marginBottom: 8,
    },

    infoRow: {
      flexDirection: "row",
      gap: 12,
      paddingVertical: 11,
    },

    infoRowTitle: {
      fontWeight: "800",
      color: "#334155",
    },

    infoRowText: {
      color: "#64748b",
      marginTop: 2,
      lineHeight: 19,
    },

    sectionTitle: {
      fontSize: 18,
      color: "#0f172a",
      fontWeight: "900",
      marginBottom: 10,
    },

    actionCard: {
      backgroundColor:
        "#ffffff",
      padding: 16,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      marginBottom: 10,
    },

    actionIcon: {
      width: 45,
      height: 45,
      borderRadius: 14,
      backgroundColor:
        "#eff6ff",
      justifyContent:
        "center",
      alignItems: "center",
    },

    actionTitle: {
      fontWeight: "800",
      color: "#0f172a",
    },

    actionSubtitle: {
      marginTop: 3,
      color: "#64748b",
      fontSize: 13,
      lineHeight: 18,
    },

    securityNotice: {
      marginTop: 16,
      color: "#64748b",
      textAlign: "center",
      lineHeight: 20,
      fontSize: 12,
      paddingHorizontal: 10,
    },
  });