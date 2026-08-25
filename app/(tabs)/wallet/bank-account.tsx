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

type BankAccount = {
  id: number;

  bank_name: string;

  bank_code?: string | null;

  account_number: string;

  account_name: string;

  is_verified: boolean;

  is_active: boolean;
};

export default function BankAccountScreen() {
  const router =
    useRouter();

  usePreventScreenCapture(true);

  const [
    bankAccount,
    setBankAccount,
  ] = useState<
    BankAccount | null
  >(null);

  const [
    bankName,
    setBankName,
  ] = useState("");

  const [
    bankCode,
    setBankCode,
  ] = useState("");

  const [
    accountNumber,
    setAccountNumber,
  ] = useState("");

  const [
    accountName,
    setAccountName,
  ] = useState("");

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const loadAccount =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const response =
            await API.getPayoutBankAccount();

          const account =
            response?.bank_account ??
            null;

          setBankAccount(
            account
          );

          /*
           * Existing account should not
           * automatically open edit mode.
           */
          if (account) {
            setBankName(
              account.bank_name ??
                ""
            );

            setBankCode(
              account.bank_code ??
                ""
            );

            setAccountNumber(
              account.account_number ??
                ""
            );

            setAccountName(
              account.account_name ??
                ""
            );

            setEditing(false);
          } else {
            setBankName("");
            setBankCode("");
            setAccountNumber("");
            setAccountName("");

            setEditing(true);
          }
        } catch (error: any) {
          console.error(
            "Bank account load error:",
            error?.response?.data ??
              error
          );

          Alert.alert(
            "Unable to Load Account",
            error?.response?.data
              ?.message ??
              "Unable to load your payout bank account."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      loadAccount();

      return undefined;
    }, [loadAccount])
  );

  const resetForm =
    () => {
      if (bankAccount) {
        setBankName(
          bankAccount.bank_name ??
            ""
        );

        setBankCode(
          bankAccount.bank_code ??
            ""
        );

        setAccountNumber(
          bankAccount.account_number ??
            ""
        );

        setAccountName(
          bankAccount.account_name ??
            ""
        );

        setEditing(false);
      }
    };

  const saveAccount =
    async () => {
      const cleanBankName =
        bankName.trim();

      const cleanAccountName =
        accountName.trim();

      const cleanAccountNumber =
        accountNumber.replace(
          /\D/g,
          ""
        );

      if (!cleanBankName) {
        Alert.alert(
          "Bank Required",
          "Enter the name of your bank."
        );

        return;
      }

      if (
        cleanAccountNumber
          .length < 10
      ) {
        Alert.alert(
          "Invalid Account Number",
          "Enter a valid bank account number."
        );

        return;
      }

      if (!cleanAccountName) {
        Alert.alert(
          "Account Name Required",
          "Enter the name on the bank account."
        );

        return;
      }

      Alert.alert(
        bankAccount
          ? "Change Payout Account?"
          : "Add Payout Account?",

        bankAccount
          ? "Changing your payout account will require the new account to be verified before withdrawal."
          : "This bank account will be used for eligible OHLAM wallet withdrawals.",

        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text:
              bankAccount
                ? "Change Account"
                : "Add Account",

            onPress:
              async () => {
                try {
                  setSaving(true);

                  const response =
                    await API
                      .savePayoutBankAccount({
                        bank_name:
                          cleanBankName,

                        bank_code:
                          bankCode.trim() ||
                          undefined,

                        account_number:
                          cleanAccountNumber,

                        account_name:
                          cleanAccountName,
                      });

                  const body = response;

                  Alert.alert(
                    "Bank Account Saved",
                    body?.message ??
                      "Your payout bank account has been saved.",
                    [
                      {
                        text: "OK",

                        onPress:
                          loadAccount,
                      },
                    ]
                  );
                } catch (
                  error: any
                ) {
                  console.error(
                    "Bank account save error:",
                    error?.response
                      ?.data ??
                      error
                  );

                  const validationErrors =
                    error?.response
                      ?.data
                      ?.errors;

                  const firstError =
                    validationErrors
                      ? Object.values(
                          validationErrors
                        )
                          .flat()
                          .find(
                            Boolean
                          )
                      : null;

                  Alert.alert(
                    "Unable to Save",
                    String(
                      firstError ??
                        error
                          ?.response
                          ?.data
                          ?.message ??
                        "Unable to save your payout bank account."
                    )
                  );
                } finally {
                  setSaving(false);
                }
              },
          },
        ]
      );
    };

  const deleteAccount =
    () => {
      Alert.alert(
        "Remove Payout Account?",
        "You will not be able to request a withdrawal until another payout account is added.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Remove",
            style: "destructive",

            onPress:
              async () => {
                try {
                  setSaving(true);

                  await API
                    .deletePayoutBankAccount();

                  setBankAccount(
                    null
                  );

                  setBankName("");
                  setBankCode("");
                  setAccountNumber("");
                  setAccountName("");

                  setEditing(true);

                  Alert.alert(
                    "Account Removed",
                    "Your payout bank account has been removed."
                  );
                } catch (
                  error: any
                ) {
                  Alert.alert(
                    "Unable to Remove",
                    error?.response
                      ?.data
                      ?.message ??
                      "Unable to remove your payout account."
                  );
                } finally {
                  setSaving(false);
                }
              },
          },
        ]
      );
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
            Loading payout account...
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
              size={28}
              color="#0f172a"
            />
          </TouchableOpacity>

          <View>
            <Text
              style={
                styles.title
              }
            >
              Payout Bank Account
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Used for wallet withdrawals
            </Text>
          </View>
        </View>

        {bankAccount &&
          !editing && (
            <>
              <View
                style={
                  styles.accountCard
                }
              >
                <View
                  style={
                    styles.bankIcon
                  }
                >
                  <MaterialCommunityIcons
                    name="bank"
                    size={28}
                    color="#2563eb"
                  />
                </View>

                <Text
                  style={
                    styles.bankName
                  }
                >
                  {
                    bankAccount.bank_name
                  }
                </Text>

                <Text
                  style={
                    styles.accountName
                  }
                >
                  {
                    bankAccount.account_name
                  }
                </Text>

                <Text
                  style={
                    styles.accountNumber
                  }
                >
                  ••••••
                  {String(
                    bankAccount
                      .account_number
                  ).slice(-4)}
                </Text>

                <View
                  style={
                    bankAccount
                      .is_verified
                      ? styles.verifiedBadge
                      : styles.pendingBadge
                  }
                >
                  <MaterialCommunityIcons
                    name={
                      bankAccount
                        .is_verified
                        ? "check-decagram"
                        : "clock-outline"
                    }
                    size={18}
                    color={
                      bankAccount
                        .is_verified
                        ? "#166534"
                        : "#92400e"
                    }
                  />

                  <Text
                    style={
                      bankAccount
                        .is_verified
                        ? styles.verifiedText
                        : styles.pendingText
                    }
                  >
                    {bankAccount
                      .is_verified
                      ? "Verified"
                      : "Verification Required"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={
                  styles.primaryButton
                }
                onPress={() =>
                  setEditing(
                    true
                  )
                }
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={21}
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Change Bank Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.withdrawButton
                }
                disabled={
                  !bankAccount
                    .is_verified
                }
                onPress={() =>
                  router.push(
                    "/(tabs)/wallet/withdraw" as any
                  )
                }
              >
                <MaterialCommunityIcons
                  name="bank-transfer-out"
                  size={22}
                  color={
                    bankAccount
                      .is_verified
                      ? "#2563eb"
                      : "#94a3b8"
                  }
                />

                <Text
                  style={[
                    styles.withdrawText,

                    !bankAccount
                      .is_verified &&
                      styles.disabledText,
                  ]}
                >
                  Withdraw to This Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.removeButton
                }
                onPress={
                  deleteAccount
                }
              >
                <Text
                  style={
                    styles.removeText
                  }
                >
                  Remove Bank Account
                </Text>
              </TouchableOpacity>
            </>
          )}

        {editing && (
          <View
            style={
              styles.formCard
            }
          >
            <Text
              style={
                styles.formTitle
              }
            >
              {bankAccount
                ? "Change Payout Account"
                : "Add Payout Account"}
            </Text>

            <Text
              style={
                styles.label
              }
            >
              Bank Name
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="e.g. Access Bank"
              value={
                bankName
              }
              onChangeText={
                setBankName
              }
              autoCapitalize="words"
            />

            <Text
              style={
                styles.label
              }
            >
              Bank Code
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Optional for now"
              value={
                bankCode
              }
              onChangeText={
                setBankCode
              }
              keyboardType="numeric"
            />

            <Text
              style={
                styles.label
              }
            >
              Account Number
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Enter account number"
              value={
                accountNumber
              }
              onChangeText={(
                value
              ) =>
                setAccountNumber(
                  value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              keyboardType="numeric"
              maxLength={20}
            />

            <Text
              style={
                styles.label
              }
            >
              Account Name
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Name on bank account"
              value={
                accountName
              }
              onChangeText={
                setAccountName
              }
              autoCapitalize="words"
            />

            <View
              style={
                styles.notice
              }
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={23}
                color="#475569"
              />

              <Text
                style={
                  styles.noticeText
                }
              >
                For security, changing
                your payout account
                resets its verification
                status. Withdrawals
                should only be allowed
                after the new account
                has been verified.
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.primaryButton
              }
              disabled={
                saving
              }
              onPress={
                saveAccount
              }
            >
              {saving ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="content-save-outline"
                    size={21}
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Save Bank Account
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {bankAccount && (
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={
                  resetForm
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text
          style={
            styles.securityText
          }
        >
          OHLAM will never ask you to
          send wallet withdrawals to a
          third-party or personal
          account outside your
          registered payout account.
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
      marginBottom: 24,
    },

    title: {
      fontSize: 23,
      fontWeight: "900",
      color: "#0f172a",
    },

    subtitle: {
      color: "#64748b",
      marginTop: 2,
    },

    accountCard: {
      backgroundColor:
        "#ffffff",
      padding: 22,
      borderRadius: 22,
      marginBottom: 16,
      alignItems: "center",
    },

    bankIcon: {
      width: 55,
      height: 55,
      borderRadius: 17,
      backgroundColor:
        "#eff6ff",
      justifyContent:
        "center",
      alignItems: "center",
      marginBottom: 14,
    },

    bankName: {
      fontSize: 20,
      fontWeight: "900",
      color: "#0f172a",
    },

    accountName: {
      color: "#475569",
      marginTop: 5,
    },

    accountNumber: {
      color: "#64748b",
      fontSize: 17,
      fontWeight: "700",
      marginTop: 8,
    },

    verifiedBadge: {
      marginTop: 15,
      backgroundColor:
        "#dcfce7",
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    pendingBadge: {
      marginTop: 15,
      backgroundColor:
        "#fef3c7",
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    verifiedText: {
      color: "#166534",
      fontWeight: "800",
    },

    pendingText: {
      color: "#92400e",
      fontWeight: "800",
    },

    formCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 20,
      padding: 18,
    },

    formTitle: {
      fontSize: 19,
      fontWeight: "900",
      marginBottom: 18,
      color: "#0f172a",
    },

    label: {
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 7,
      color: "#334155",
    },

    input: {
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 13,
      paddingHorizontal: 13,
      paddingVertical: 13,
      fontSize: 16,
      marginBottom: 15,
      color: "#0f172a",
    },

    notice: {
      backgroundColor:
        "#f1f5f9",
      padding: 14,
      borderRadius: 14,
      flexDirection: "row",
      gap: 10,
      marginBottom: 18,
    },

    noticeText: {
      flex: 1,
      color: "#475569",
      lineHeight: 19,
      fontSize: 13,
    },

    primaryButton: {
      backgroundColor:
        "#2563eb",
      paddingVertical: 15,
      borderRadius: 15,
      alignItems: "center",
      justifyContent:
        "center",
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },

    primaryButtonText: {
      color: "#ffffff",
      fontWeight: "900",
      fontSize: 15,
    },

    withdrawButton: {
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor: "#bfdbfe",
      paddingVertical: 14,
      borderRadius: 15,
      alignItems: "center",
      justifyContent:
        "center",
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },

    withdrawText: {
      color: "#2563eb",
      fontWeight: "900",
    },

    disabledText: {
      color: "#94a3b8",
    },

    removeButton: {
      paddingVertical: 13,
      alignItems: "center",
    },

    removeText: {
      color: "#dc2626",
      fontWeight: "800",
    },

    cancelButton: {
      alignItems: "center",
      paddingVertical: 13,
    },

    cancelText: {
      color: "#475569",
      fontWeight: "800",
    },

    securityText: {
      color: "#64748b",
      textAlign: "center",
      fontSize: 12,
      lineHeight: 18,
      marginTop: 24,
      paddingHorizontal: 10,
    },
  });