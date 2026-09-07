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
  available_balance: string | number;
  locked_balance: string | number;
  escrow_balance: string | number;
  currency?: string;
};

type PayoutBankAccount = {
  id: number;
  bank_name: string;
  bank_code: string;
  account_name: string;
  account_number: string;
  is_verified: boolean;
  is_active: boolean;
};

const normalizeBody = (
  response: any
) => {
  const first =
    response?.data ??
    response;

  return (
    first?.data ??
    first
  );
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
  ] = useState<WalletSummary | null>(
    null
  );

  const [
    bankAccounts,
    setBankAccounts,
  ] = useState<
    PayoutBankAccount[]
  >([]);

  const [
    selectedBankAccount,
    setSelectedBankAccount,
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

  const hasVerifiedAccount =
    !!selectedBankAccount &&
    selectedBankAccount.is_active ===
      true &&
    selectedBankAccount.is_verified ===
      true;

  /*
   * Load wallet and all active,
   * verified payout bank accounts.
   */
  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(true);

          /*
           * Load wallet.
           */
          const walletResponse = await API.getWalletStatement();

          const walletBody = normalizeBody(walletResponse);

          setWallet(
            walletBody?.wallet ??
              null
          );

          /*
           * Load payout accounts.
           */
          // 
          

          try {
  const bankResponse =
    await API.getPayoutBankAccount();

  console.log(
    "SAVED PAYOUT BANK ACCOUNTS:",
    bankResponse
  );

  const accounts =
    Array.isArray(
      bankResponse.bank_accounts
    )
      ? bankResponse.bank_accounts
      : [];

  setBankAccounts(accounts);

  setSelectedBankAccount(
    accounts[0] ?? null
  );
} catch (bankError: any) {
  console.error(
    "Payout account load error:",
    bankError?.response?.data ??
      bankError
  );

  setBankAccounts([]);
  setSelectedBankAccount(null);
}
        } catch (
          error: any
        ) {
          console.error(
            "Withdrawal load error:",
            error
              ?.response
              ?.data ??
              error
          );

          Alert.alert(
            "Unable to Load Wallet",
            error
              ?.response
              ?.data
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

  /*
   * Amount input.
   */
  const handleAmountChange =
    (
      text: string
    ) => {
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

  const useMaximum =
    () => {
      if (
        available <= 0
      ) {
        return;
      }

      setAmount(
        String(available)
      );
    };

  /*
   * Validate and ask user
   * for confirmation.
   */
  const requestWithdrawal =
    () => {
      if (
        !selectedBankAccount
      ) {
        Alert.alert(
          "Payout Account Required",
          "Add and verify a payout bank account before requesting a withdrawal.",
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
                  "/(tabs)/wallet/bank-account" as any
                ),
            },
          ]
        );

        return;
      }

      if (
        !selectedBankAccount
          .is_verified ||
        !selectedBankAccount
          .is_active
      ) {
        Alert.alert(
          "Payout Account Unavailable",
          "Please select an active verified payout bank account."
        );

        return;
      }

      if (
        requestedAmount <= 0
      ) {
        Alert.alert(
          "Invalid Amount",
          "Enter an amount greater than zero."
        );

        return;
      }

      if (
        requestedAmount >
        available
      ) {
        Alert.alert(
          "Insufficient Balance",
          `You currently have ${money(
            available
          )} available to withdraw.`
        );

        return;
      }

      Alert.alert(
        "Confirm Withdrawal",

        `Request ${money(
          requestedAmount
        )} to:\n\n${
          selectedBankAccount
            .account_name
        }\n${
          selectedBankAccount
            .bank_name
        }\nAccount ending ${String(
          selectedBankAccount
            .account_number
        ).slice(-4)}`,

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

  /*
   * Submit selected bank account
   * ID to the backend.
   */
  const submitWithdrawal =
    async () => {
      if (
        !selectedBankAccount ||
        !selectedBankAccount
          .is_verified ||
        !selectedBankAccount
          .is_active
      ) {
        return;
      }

      try {
        setSubmitting(true);

        const response =
          await API
            .requestWalletWithdrawal(
              {
                amount:
                  requestedAmount,

                bank_account_id:
                  selectedBankAccount
                    .id,
              }
            );

        const body =
          normalizeBody(
            response
          );

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
      } catch (
        error: any
      ) {
        console.error(
          "Withdrawal error:",
          error
            ?.response
            ?.data ??
            error
        );

        const code =
          error
            ?.response
            ?.data
            ?.code;

        if (
          code ===
          "PAYOUT_BANK_ACCOUNT_NOT_VERIFIED"
        ) {
          Alert.alert(
            "Verification Required",
            "The selected payout bank account is not verified.",
            [
              {
                text: "OK",

                onPress: () =>
                  router.push(
                    "/(tabs)/wallet/bank-account" as any
                  ),
              },
            ]
          );

          return;
        }

        if (
          code ===
          "PAYOUT_BANK_ACCOUNT_NOT_FOUND"
        ) {
          Alert.alert(
            "Bank Account Unavailable",
            "The selected payout bank account could not be found. Please select or add another account."
          );

          loadData();

          return;
        }

        Alert.alert(
          "Withdrawal Failed",

          error
            ?.response
            ?.data
            ?.message ??
            "Your withdrawal request could not be submitted."
        );
      } finally {
        setSubmitting(false);
      }
    };

  /*
   * Loading state.
   */
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
        {/* HEADER */}

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

        {/* BALANCE */}

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
            Only available wallet
            funds can be withdrawn.
            Locked and escrow
            balances remain
            protected.
          </Text>
        </View>

        {/* PAYOUT ACCOUNTS */}

        <View
          style={
            styles.sectionHeader
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Payout Account
          </Text>

          {bankAccounts.length >
            0 && (
            <Text
              style={
                styles.accountCount
              }
            >
              {bankAccounts.length}
              {" "}
              {bankAccounts.length ===
              1
                ? "account"
                : "accounts"}
            </Text>
          )}
        </View>

        {bankAccounts.length >
        0 ? (
          <>
            <Text
              style={
                styles.selectionHelp
              }
            >
              Select the verified
              bank account where you
              want to receive this
              withdrawal.
            </Text>

            {bankAccounts.map(
              (account) => {
                const selected =
                  selectedBankAccount
                    ?.id ===
                  account.id;

                return (
                  <TouchableOpacity
                    key={
                      account.id
                    }
                    activeOpacity={
                      0.8
                    }
                    onPress={() =>
                      setSelectedBankAccount(
                        account
                      )
                    }
                    style={[
                      styles.bankCard,

                      selected &&
                        styles.selectedBankCard,
                    ]}
                  >
                    <View
                      style={
                        styles.radioContainer
                      }
                    >
                      <MaterialCommunityIcons
                        name={
                          selected
                            ? "radiobox-marked"
                            : "radiobox-blank"
                        }
                        size={
                          25
                        }
                        color={
                          selected
                            ? "#2563eb"
                            : "#94a3b8"
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.bankIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="bank-outline"
                        size={
                          25
                        }
                        color="#2563eb"
                      />
                    </View>

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
                        {
                          account
                            .bank_name
                        }
                      </Text>

                      <Text
                        style={
                          styles.accountName
                        }
                      >
                        {
                          account
                            .account_name
                        }
                      </Text>

                      <Text
                        style={
                          styles.accountNumber
                        }
                      >
                        ••••••
                        {String(
                          account
                            .account_number
                        ).slice(
                          -4
                        )}
                      </Text>

                      <View
                        style={
                          styles.verifiedRow
                        }
                      >
                        <MaterialCommunityIcons
                          name="check-decagram"
                          size={
                            16
                          }
                          color="#166534"
                        />

                        <Text
                          style={
                            styles.verifiedText
                          }
                        >
                          Verified payout
                          account
                        </Text>
                      </View>
                    </View>

                    {selected && (
                      <View
                        style={
                          styles.selectedBadge
                        }
                      >
                        <Text
                          style={
                            styles.selectedBadgeText
                          }
                        >
                          Selected
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }
            )}

            <TouchableOpacity
              style={
                styles.addBankCard
              }
              onPress={() =>
                router.push(
                  "/(tabs)/wallet/bank-account" as any
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
                Add another payout
                account
              </Text>

              <MaterialCommunityIcons
                name="chevron-right"
                size={23}
                color="#64748b"
              />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={
              styles.addBankCard
            }
            onPress={() =>
              router.push(
                "/(tabs)/wallet/bank-account" as any
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
              Add & Verify Payout
              Bank Account
            </Text>

            <MaterialCommunityIcons
              name="chevron-right"
              size={23}
              color="#64748b"
            />
          </TouchableOpacity>
        )}

        {!hasVerifiedAccount && (
          <View
            style={
              styles.warningCard
            }
          >
            <MaterialCommunityIcons
              name="shield-alert-outline"
              size={23}
              color="#92400e"
            />

            <Text
              style={
                styles.warningText
              }
            >
              You need an active
              verified payout bank
              account before you can
              withdraw wallet funds.
            </Text>
          </View>
        )}

        {/* AMOUNT */}

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
            editable={
              !submitting
            }
          />

          <TouchableOpacity
            disabled={
              available <= 0 ||
              submitting
            }
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

        {/* NOTICE */}

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
            After submission, the
            requested amount is
            reserved from your
            available balance while
            OHLAM processes the
            payout.
          </Text>
        </View>

        {/* WITHDRAW */}

        <TouchableOpacity
          style={[
            styles.withdrawButton,

            (
              submitting ||
              requestedAmount <=
                0 ||
              requestedAmount >
                available ||
              !hasVerifiedAccount
            ) &&
              styles.disabledButton,
          ]}
          disabled={
            submitting ||
            requestedAmount <= 0 ||
            requestedAmount >
              available ||
            !hasVerifiedAccount
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
          the verified payout
          account you select above.
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
      color: "#64748b",
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

    sectionHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginTop: 5,
      marginBottom: 9,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: "#0f172a",
      marginBottom: 9,
      marginTop: 5,
    },

    accountCount: {
      color: "#64748b",
      fontSize: 12,
      fontWeight: "700",
    },

    selectionHelp: {
      color: "#64748b",
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },

    bankCard: {
      backgroundColor:
        "#ffffff",
      padding: 14,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    selectedBankCard: {
      borderColor:
        "#2563eb",
      borderWidth: 2,
      backgroundColor:
        "#eff6ff",
    },

    radioContainer: {
      justifyContent:
        "center",
      alignItems: "center",
    },

    bankIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        "#eff6ff",
      justifyContent:
        "center",
      alignItems: "center",
    },

    flex: {
      flex: 1,
    },

    bankName: {
      fontWeight: "900",
      color: "#0f172a",
      fontSize: 15,
    },

    accountName: {
      color: "#475569",
      marginTop: 3,
      fontSize: 13,
    },

    accountNumber: {
      color: "#64748b",
      marginTop: 3,
      fontSize: 13,
    },

    verifiedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 7,
    },

    verifiedText: {
      color: "#166534",
      fontSize: 12,
      fontWeight: "800",
    },

    selectedBadge: {
      backgroundColor:
        "#dbeafe",
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    selectedBadgeText: {
      color: "#1d4ed8",
      fontSize: 10,
      fontWeight: "900",
    },

    addBankCard: {
      padding: 16,
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    addBankText: {
      color: "#2563eb",
      fontWeight: "800",
      flex: 1,
    },

    warningCard: {
      backgroundColor:
        "#fffbeb",
      borderWidth: 1,
      borderColor:
        "#fde68a",
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      gap: 10,
      marginBottom: 20,
    },

    warningText: {
      flex: 1,
      color: "#92400e",
      lineHeight: 19,
      fontSize: 13,
    },

    amountContainer: {
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
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
      color: "#0f172a",
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
      opacity: 0.45,
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