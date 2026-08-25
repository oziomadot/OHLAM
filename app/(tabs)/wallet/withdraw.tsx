import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

  currency?: string;
};

type PayoutBankAccount = {
  id?: number;

  bank_name?: string;

  account_name?: string;

  account_number?: string;
};

const money = (
  amount:
    | string
    | number
    | null
    | undefined
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

const toNumber = (
  value:
    | string
    | number
    | null
    | undefined
) => {
  const cleaned =
    String(value ?? "")
      .replace(/,/g, "")
      .trim();

  const number =
    Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
};

export default function WithdrawScreen() {
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
    bankAccount,
    setBankAccount,
  ] = useState<
    PayoutBankAccount | null
  >(null);

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const available =
    toNumber(
      wallet?.available_balance
    );

  const requestedAmount =
    toNumber(amount);

  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(true);

          /*
           * Wallet.
           */
          const walletResponse =
            await API.getWalletStatement();

          const walletBody =
            walletResponse?.data ??
            walletResponse;

          const walletData =
            walletBody?.data ??
            walletBody;

          setWallet(
            walletData?.wallet ??
              null
          );

          /*
           * Existing payout bank account.
           *
           * Add getPayoutBankAccount()
           * to API service below.
           */
          try {
            const bankResponse =
              await API.getPayoutBankAccount();

            const bankBody =
              bankResponse?.data ??
              bankResponse;

            const bankData =
              bankBody?.data ??
              bankBody;

            setBankAccount(
              bankData
                ?.bank_account ??
                bankData ??
                null
            );
          } catch (
            bankError: any
          ) {
            /*
             * No payout account is not
             * fatal. User can add one.
             */
            if (
              bankError?.response
                ?.status !== 404
            ) {
              console.error(
                "Bank account error:",
                bankError
                  ?.response?.data ??
                  bankError
              );
            }

            setBankAccount(null);
          }
        } catch (error: any) {
          console.error(
            "Withdrawal load error:",
            error?.response?.data ??
              error
          );

          Alert.alert(
            "Unable to load wallet",
            error?.response?.data
              ?.message ??
              "Unable to load your withdrawal information."
          );
        } finally {
          setLoading(false);
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

  const handleAmountChange =
    (text: string) => {
      const clean =
        text.replace(
          /,/g,
          ""
        );

      if (
        clean !== "" &&
        !/^\d*(\.\d{0,2})?$/.test(
          clean
        )
      ) {
        return;
      }

      setAmount(clean);
    };

  const useMaximum = () => {
    if (available <= 0) {
      return;
    }

    setAmount(
      String(available)
    );
  };

  const requestWithdrawal =
    async () => {
      if (!bankAccount) {
        Alert.alert(
          "Payout account required",
          "Add your payout bank account before requesting a withdrawal.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text:
                "Add Bank Account",

              onPress: () =>
                router.push(
                  "/(tabs)/wallet/bank-account"
                    as any
                ),
            },
          ]
        );

        return;
      }

      if (
        requestedAmount <= 0
      ) {
        Alert.alert(
          "Invalid amount",
          "Enter an amount greater than zero."
        );

        return;
      }

      if (
        requestedAmount >
        available
      ) {
        Alert.alert(
          "Insufficient balance",
          `You have ${money(
            available
          )} available to withdraw.`
        );

        return;
      }

      Alert.alert(
        "Confirm Withdrawal",
        `Request withdrawal of ${money(
          requestedAmount
        )} to ${bankAccount.bank_name ?? "your bank"} account ending ${String(
          bankAccount.account_number ??
            ""
        ).slice(-4)}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text:
              "Request Withdrawal",

            onPress:
              submitWithdrawal,
          },
        ]
      );
    };

  const submitWithdrawal =
    async () => {
      try {
        setSubmitting(true);

        const response =
          await API.requestWalletWithdrawal(
            {
              amount:
                requestedAmount,

              bank_account_id:
                bankAccount?.id,
            }
          );

        const body =
          response?.data ??
          response;

        Alert.alert(
          "Withdrawal Requested",
          body?.message ??
            "Your withdrawal request has been submitted.",
          [
            {
              text: "OK",

              onPress: () => {
                setAmount("");

                loadData();
              },
            },
          ]
        );
      } catch (error: any) {
        console.error(
          "Withdrawal error:",
          error?.response?.data ??
            error
        );

        Alert.alert(
          "Withdrawal Failed",
          error?.response?.data
            ?.message ??
            "Your withdrawal request could not be submitted."
        );
      } finally {
        setSubmitting(false);
      }
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
            Loading withdrawal...
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
        keyboardShouldPersistTaps="handled"
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
              size={27}
              color="#0f172a"
            />
          </TouchableOpacity>

          <Text
            style={
              styles.title
            }
          >
            Withdraw Funds
          </Text>
        </View>

        <View
          style={
            styles.balanceCard
          }
        >
          <Text
            style={
              styles.balanceLabel
            }
          >
            Available Balance
          </Text>

          <Text
            style={
              styles.balanceAmount
            }
          >
            {money(available)}
          </Text>

          <Text
            style={
              styles.balanceHelp
            }
          >
            Only your available
            balance can be
            withdrawn. Locked and
            escrow funds cannot be
            withdrawn.
          </Text>
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Payout Account
        </Text>

        {bankAccount ? (
          <View
            style={
              styles.bankCard
            }
          >
            <MaterialCommunityIcons
              name="bank-outline"
              size={29}
              color="#2563eb"
            />

            <View
              style={
                styles.flex
              }
            >
              <Text
                style={
                  styles.bankName
                }
              >
                {bankAccount.bank_name ??
                  "Bank"}
              </Text>

              <Text
                style={
                  styles.accountName
                }
              >
                {bankAccount.account_name ??
                  ""}
              </Text>

              <Text
                style={
                  styles.accountNumber
                }
              >
                ••••••
                {String(
                  bankAccount.account_number ??
                    ""
                ).slice(-4)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                router.push(
                  "/(tabs)/wallet/bank-account"
                    as any
                )
              }
            >
              <Text
                style={
                  styles.changeText
                }
              >
                Change
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={
              styles.addBankCard
            }
            onPress={() =>
              router.push(
                "/(tabs)/wallet/bank-account"
                  as any
              )
            }
          >
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={24}
              color="#2563eb"
            />

            <Text
              style={
                styles.addBankText
              }
            >
              Add Payout Bank
              Account
            </Text>
          </TouchableOpacity>
        )}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Withdrawal Amount
        </Text>

        <View
          style={
            styles.amountContainer
          }
        >
          <Text
            style={
              styles.currency
            }
          >
            ₦
          </Text>

          <TextInput
            style={
              styles.amountInput
            }
            value={amount}
            onChangeText={
              handleAmountChange
            }
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <TouchableOpacity
            onPress={
              useMaximum
            }
          >
            <Text
              style={
                styles.maxText
              }
            >
              MAX
            </Text>
          </TouchableOpacity>
        </View>

        {requestedAmount >
          available && (
          <Text
            style={
              styles.error
            }
          >
            Amount exceeds your
            available balance.
          </Text>
        )}

        <View
          style={
            styles.notice
          }
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={22}
            color="#475569"
          />

          <Text
            style={
              styles.noticeText
            }
          >
            After you submit the
            request, the requested
            amount will be reserved
            until the withdrawal is
            completed or rejected.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.withdrawButton,

            (
              submitting ||
              requestedAmount <= 0 ||
              requestedAmount >
                available ||
              !bankAccount
            ) &&
              styles.disabledButton,
          ]}
          disabled={
            submitting ||
            requestedAmount <= 0 ||
            requestedAmount >
              available ||
            !bankAccount
          }
          onPress={
            requestWithdrawal
          }
        >
          {submitting ? (
            <ActivityIndicator
              color="#ffffff"
            />
          ) : (
            <>
              <MaterialCommunityIcons
                name="bank-transfer-out"
                size={22}
                color="#ffffff"
              />

              <Text
                style={
                  styles.withdrawButtonText
                }
              >
                Request Withdrawal
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text
          style={
            styles.securityText
          }
        >
          OHLAM will only send
          approved withdrawals to
          the payout account
          registered to your
          account.
        </Text>
      </ScrollView>
    </Protected>
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
    },

    loadingText: {
      marginTop: 10,
    },

    heading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 22,
    },

    title: {
      fontSize: 24,
      fontWeight: "900",
      color: "#0f172a",
    },

    balanceCard: {
      backgroundColor:
        "#2563eb",
      padding: 22,
      borderRadius: 22,
      marginBottom: 25,
    },

    balanceLabel: {
      color: "#dbeafe",
      fontWeight: "700",
    },

    balanceAmount: {
      color: "#ffffff",
      fontSize: 31,
      fontWeight: "900",
      marginTop: 4,
    },

    balanceHelp: {
      color: "#dbeafe",
      lineHeight: 19,
      marginTop: 10,
      fontSize: 13,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: "#0f172a",
      marginBottom: 9,
      marginTop: 5,
    },

    bankCard: {
      backgroundColor:
        "#ffffff",
      padding: 16,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      marginBottom: 23,
    },

    flex: {
      flex: 1,
    },

    bankName: {
      fontWeight: "900",
      color: "#0f172a",
    },

    accountName: {
      color: "#475569",
      marginTop: 3,
    },

    accountNumber: {
      color: "#64748b",
      marginTop: 3,
    },

    changeText: {
      color: "#2563eb",
      fontWeight: "800",
    },

    addBankCard: {
      padding: 18,
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 23,
    },

    addBankText: {
      color: "#2563eb",
      fontWeight: "800",
    },

    amountContainer: {
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 17,
      marginBottom: 5,
    },

    currency: {
      fontSize: 23,
      fontWeight: "900",
      color: "#0f172a",
    },

    amountInput: {
      flex: 1,
      paddingVertical: 17,
      paddingHorizontal: 10,
      fontSize: 24,
      fontWeight: "800",
    },

    maxText: {
      color: "#2563eb",
      fontWeight: "900",
    },

    error: {
      color: "#dc2626",
      marginTop: 5,
      marginBottom: 10,
    },

    notice: {
      backgroundColor:
        "#f1f5f9",
      padding: 15,
      borderRadius: 15,
      flexDirection: "row",
      gap: 10,
      marginVertical: 20,
    },

    noticeText: {
      flex: 1,
      color: "#475569",
      lineHeight: 19,
      fontSize: 13,
    },

    withdrawButton: {
      backgroundColor:
        "#2563eb",
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: "row",
      justifyContent:
        "center",
      alignItems: "center",
      gap: 9,
    },

    disabledButton: {
      opacity: 0.5,
    },

    withdrawButtonText: {
      color: "#ffffff",
      fontWeight: "900",
      fontSize: 16,
    },

    securityText: {
      marginTop: 18,
      textAlign: "center",
      color: "#64748b",
      fontSize: 12,
      lineHeight: 18,
    },
  });