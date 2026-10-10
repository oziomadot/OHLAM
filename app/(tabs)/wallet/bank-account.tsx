import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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

type Bank = {
  id?: number;
  name: string;
  code: string;
  slug?: string;
};

type BankAccount = {
  id: number;

  bank_name: string;

  bank_code: string;

  account_number: string;

  account_name: string;

  is_verified: boolean;

  is_active: boolean;

  verified_at?: string | null;
};

type ResolvedAccount = {
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
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
    banks,
    setBanks,
  ] = useState<Bank[]>(
    []
  );

  const [
    selectedBank,
    setSelectedBank,
  ] = useState<
    Bank | null
  >(null);

  const [
    accountNumber,
    setAccountNumber,
  ] = useState("");

  const [
    resolvedAccount,
    setResolvedAccount,
  ] = useState<
    ResolvedAccount | null
  >(null);

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    bankPickerVisible,
    setBankPickerVisible,
  ] = useState(false);

  const [
    bankSearch,
    setBankSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingBanks,
    setLoadingBanks,
  ] = useState(false);

  const [
    verifying,
    setVerifying,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const filteredBanks =
    useMemo(() => {
      const query =
        bankSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return banks;
      }

      return banks.filter(
        (bank) =>
          bank.name
            .toLowerCase()
            .includes(query)
      );
    }, [
      banks,
      bankSearch,
    ]);

  /*
   * Any change to bank/account number
   * invalidates a previous resolution.
   */
  const clearResolution =
    () => {
      setResolvedAccount(
        null
      );
    };

  const loadBanks =
    useCallback(
      async () => {
        try {
          setLoadingBanks(
            true
          );

          const response =
            await API.getPayoutBanks();

          const body =
            normalizeBody(
              response
            );

          const list =
            Array.isArray(body)
              ? body
              : body?.banks ??
                [];

          const normalized =
            list
              .map(
                (bank: any) => ({
                  id:
                    bank.id,

                  name:
                    String(
                      bank.name ??
                        ""
                    ),

                  code:
                    String(
                      bank.code ??
                        ""
                    ),

                  slug:
                    bank.slug ??
                    undefined,
                })
              )
              .filter(
                (bank: Bank) =>
                  !!bank.name &&
                  !!bank.code
              )
              .sort(
                (
                  a: Bank,
                  b: Bank
                ) =>
                  a.name.localeCompare(
                    b.name
                  )
              );

          setBanks(
            normalized
          );
        } catch (error: any) {
          console.error(
            "Bank list error:",
            error?.response
              ?.data ??
              error
          );

          Alert.alert(
            "Unable to Load Banks",
            error?.response
              ?.data
              ?.message ??
              "Unable to load the Nigerian bank list."
          );
        } finally {
          setLoadingBanks(
            false
          );
        }
      },
      []
    );

  const loadAccount =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const response =
            await API
              .getPayoutBankAccount();

          const body =
            normalizeBody(
              response
            );

          const account =
            body?.bank_account ??
            null;

          setBankAccount(
            account
          );

          if (account) {
            setSelectedBank({
              name:
                account.bank_name,

              code:
                account.bank_code,
            });

            setAccountNumber(
              account.account_number ??
                ""
            );

            if (
              account.is_verified
            ) {
              setResolvedAccount({
                account_number:
                  account.account_number,

                account_name:
                  account.account_name,

                bank_code:
                  account.bank_code,

                bank_name:
                  account.bank_name,
              });
            } else {
              setResolvedAccount(
                null
              );
            }

            setEditing(false);
          } else {
            setSelectedBank(
              null
            );

            setAccountNumber(
              ""
            );

            setResolvedAccount(
              null
            );

            setEditing(true);
          }
        } catch (error: any) {
          console.error(
            "Bank account load error:",
            error?.response
              ?.data ??
              error
          );

          Alert.alert(
            "Unable to Load Account",
            error?.response
              ?.data
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
      loadBanks();

      return undefined;
    }, [
      loadAccount,
      loadBanks,
    ])
  );

  const startEditing =
    () => {
      if (
        bankAccount
      ) {
        setSelectedBank({
          name:
            bankAccount
              .bank_name,

          code:
            bankAccount
              .bank_code,
        });

        setAccountNumber(
          bankAccount
            .account_number
        );
      }

      /*
       * Require a new verification
       * whenever edit mode starts.
       */
      setResolvedAccount(
        null
      );

      setEditing(true);
    };

  const cancelEditing =
    () => {
      if (
        !bankAccount
      ) {
        return;
      }

      setSelectedBank({
        name:
          bankAccount.bank_name,

        code:
          bankAccount.bank_code,
      });

      setAccountNumber(
        bankAccount.account_number
      );

      if (
        bankAccount.is_verified
      ) {
        setResolvedAccount({
          account_number:
            bankAccount
              .account_number,

          account_name:
            bankAccount
              .account_name,

          bank_code:
            bankAccount
              .bank_code,

          bank_name:
            bankAccount
              .bank_name,
        });
      }

      setEditing(false);
    };

  const selectBank =
    (bank: Bank) => {
      setSelectedBank(
        bank
      );

      clearResolution();

      setBankPickerVisible(
        false
      );

      setBankSearch("");
    };

  const changeAccountNumber =
    (value: string) => {
      const numeric =
        value.replace(
          /\D/g,
          ""
        );

      setAccountNumber(
        numeric
      );

      clearResolution();
    };

  const verifyAccount =
    async () => {
      if (
        !selectedBank
      ) {
        Alert.alert(
          "Select Bank",
          "Select your bank before verifying your account."
        );

        return;
      }

      /*
       * Nigerian NUBAN accounts
       * normally use 10 digits.
       */
      if (
        accountNumber
          .length !== 10
      ) {
        Alert.alert(
          "Invalid Account Number",
          "Enter your 10-digit Nigerian bank account number."
        );

        return;
      }

      try {
        setVerifying(true);

        setResolvedAccount(
          null
        );

        const response =
          await API
            .resolvePayoutBankAccount({
              bank_code:
                selectedBank
                  .code,

              account_number:
                accountNumber,
            });

        const body =
          normalizeBody(
            response
          );

        const resolved =
          body?.account ??
          body;

        const resolvedName =
          resolved
            ?.account_name;

        const resolvedNumber =
          resolved
            ?.account_number ??
          accountNumber;

        if (
          !resolvedName
        ) {
          throw new Error(
            "The bank account could not be resolved."
          );
        }

        /*
         * Make sure backend has not
         * resolved a different number.
         */
        if (
          String(
            resolvedNumber
          ) !==
          String(
            accountNumber
          )
        ) {
          throw new Error(
            "Resolved account number does not match the submitted account."
          );
        }

        setResolvedAccount({
          account_number:
            String(
              resolvedNumber
            ),

          account_name:
            String(
              resolvedName
            ),

          bank_code:
            selectedBank
              .code,

          bank_name:
            selectedBank
              .name,
        });
      } catch (error: any) {
        console.error(
          "Account resolve error:",
          error?.response
            ?.data ??
            error
        );

        Alert.alert(
          "Account Verification Failed",
          error?.response
            ?.data
            ?.message ??
            error?.message ??
            "The bank could not verify this account number. Check the bank and account number and try again."
        );
      } finally {
        setVerifying(false);
      }
    };

  const saveAccount =
    () => {
      if (
        !resolvedAccount
      ) {
        Alert.alert(
          "Verify Account First",
          "Verify the bank account before saving it."
        );

        return;
      }

      Alert.alert(
        bankAccount
          ? "Change Payout Account?"
          : "Save Payout Account?",

        `OHLAM will save ${resolvedAccount.account_name} at ${resolvedAccount.bank_name} as your payout account.`,

        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              bankAccount
                ? "Change Account"
                : "Save Account",

            onPress:
              submitSave,
          },
        ]
      );
    };

  const submitSave =
    async () => {
      if (
        !resolvedAccount
      ) {
        return;
      }

      try {
        setSaving(true);

        const response =
          await API
            .savePayoutBankAccount({
              bank_name:
                resolvedAccount
                  .bank_name,

              bank_code:
                resolvedAccount
                  .bank_code,

              account_number:
                resolvedAccount
                  .account_number,

              account_name:
                resolvedAccount
                  .account_name,
            });

        const body =
          normalizeBody(
            response
          );

        Alert.alert(
          "Payout Account Saved",
          body?.message ??
            "Your verified payout bank account has been saved.",
          [
            {
              text: "OK",

              onPress:
                loadAccount,
            },
          ]
        );
      } catch (error: any) {
        console.error(
          "Save payout account error:",
          error?.response
            ?.data ??
            error
        );

        const errors =
          error?.response
            ?.data?.errors;

        const firstError =
          errors
            ? Object.values(
                errors
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
              error?.response
                ?.data
                ?.message ??
              "Unable to save your payout bank account."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const deleteAccount =
    () => {
      Alert.alert(
        "Remove Payout Account?",
        "You will not be able to request a withdrawal until another verified payout account is added.",
        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Remove",

            style:
              "destructive",

            onPress:
              async () => {
                try {
                  setSaving(
                    true
                  );

                  await API
                    .deletePayoutBankAccount();

                  setBankAccount(
                    null
                  );

                  setSelectedBank(
                    null
                  );

                  setAccountNumber(
                    ""
                  );

                  setResolvedAccount(
                    null
                  );

                  setEditing(
                    true
                  );

                  Alert.alert(
                    "Account Removed",
                    "Your payout bank account has been removed."
                  );
                } catch (
                  error: any
                ) {
                  Alert.alert(
                    "Unable to Remove",
                    error
                      ?.response
                      ?.data
                      ?.message ??
                      "Unable to remove your payout account."
                  );
                } finally {
                  setSaving(
                    false
                  );
                }
              },
          },
        ]
      );
    };

  if (
    loading
  ) {
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

          <View
            style={
              styles.flex
            }
          >
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
              Verified account for wallet withdrawals
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
                    size={29}
                    color="#2563eb"
                  />
                </View>

                <Text
                  style={
                    styles.bankName
                  }
                >
                  {
                    bankAccount
                      .bank_name
                  }
                </Text>

                <Text
                  style={
                    styles.accountName
                  }
                >
                  {
                    bankAccount
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
                        : "alert-circle-outline"
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
                onPress={
                  startEditing
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
                style={[
                  styles.withdrawButton,

                  !bankAccount
                    .is_verified &&
                    styles.disabledButton,
                ]}
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
                disabled={
                  saving
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
                styles.helperText
              }
            >
              Select your Nigerian bank and enter your account number. OHLAM will verify the account name before saving it.
            </Text>

            <Text
              style={
                styles.label
              }
            >
              Bank
            </Text>

            <TouchableOpacity
              style={
                styles.bankSelector
              }
              disabled={
                loadingBanks
              }
              onPress={() =>
                setBankPickerVisible(
                  true
                )
              }
            >
              <MaterialCommunityIcons
                name="bank-outline"
                size={22}
                color="#475569"
              />

              <Text
                style={
                  selectedBank
                    ? styles.bankSelectorText
                    : styles.bankSelectorPlaceholder
                }
              >
                {loadingBanks
                  ? "Loading banks..."
                  : selectedBank
                    ?.name ??
                    "Select your bank"}
              </Text>

              <MaterialCommunityIcons
                name="chevron-down"
                size={23}
                color="#64748b"
              />
            </TouchableOpacity>

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
              placeholder="10-digit account number"
              value={
                accountNumber
              }
              onChangeText={
                changeAccountNumber
              }
              keyboardType="number-pad"
              maxLength={10}
            />

            <TouchableOpacity
              style={[
                styles.verifyButton,

                (
                  verifying ||
                  !selectedBank ||
                  accountNumber
                    .length !==
                    10
                ) &&
                  styles.disabledButton,
              ]}
              disabled={
                verifying ||
                !selectedBank ||
                accountNumber
                  .length !== 10
              }
              onPress={
                verifyAccount
              }
            >
              {verifying ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="shield-search"
                    size={21}
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.verifyButtonText
                    }
                  >
                    Verify Account
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {resolvedAccount && (
              <View
                style={
                  styles.resolvedCard
                }
              >
                <View
                  style={
                    styles.resolvedHeader
                  }
                >
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={24}
                    color="#166534"
                  />

                  <Text
                    style={
                      styles.resolvedTitle
                    }
                  >
                    Account Verified
                  </Text>
                </View>

                <Text
                  style={
                    styles.resolvedLabel
                  }
                >
                  Account Name
                </Text>

                <Text
                  style={
                    styles.resolvedName
                  }
                >
                  {
                    resolvedAccount
                      .account_name
                  }
                </Text>

                <Text
                  style={
                    styles.resolvedDetails
                  }
                >
                  {
                    resolvedAccount
                      .bank_name
                  }
                  {"\n"}
                  {
                    resolvedAccount
                      .account_number
                  }
                </Text>

                <Text
                  style={
                    styles.confirmText
                  }
                >
                  Confirm that this is your bank account before saving.
                </Text>
              </View>
            )}

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
                The account name is returned by the bank verification provider and cannot be manually edited. Changing the bank or account number requires verification again.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,

                (
                  saving ||
                  !resolvedAccount
                ) &&
                  styles.disabledButton,
              ]}
              disabled={
                saving ||
                !resolvedAccount
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
                    Save Verified Account
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
                  cancelEditing
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
          OHLAM will only process withdrawals to a verified payout bank account registered to your account.
        </Text>
      </ScrollView>

      <Modal
        visible={
          bankPickerVisible
        }
        animationType="slide"
        transparent
        onRequestClose={() =>
          setBankPickerVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modalCard
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Select Bank
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setBankPickerVisible(
                    false
                  )
                }
              >
                <MaterialCommunityIcons
                  name="close"
                  size={27}
                  color="#0f172a"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={
                styles.searchInput
              }
              placeholder="Search banks"
              value={
                bankSearch
              }
              onChangeText={
                setBankSearch
              }
            />

            {loadingBanks ? (
              <View
                style={
                  styles.bankLoading
                }
              >
                <ActivityIndicator
                  size="large"
                />

                <Text>
                  Loading banks...
                </Text>
              </View>
            ) : (
              <FlatList
                data={
                  filteredBanks
                }
                keyExtractor={(
                  item
                ) =>
                  `${item.code}-${item.name}`
                }
                keyboardShouldPersistTaps="handled"
                renderItem={({
                  item,
                }) => (
                  <TouchableOpacity
                    style={
                      styles.bankRow
                    }
                    onPress={() =>
                      selectBank(
                        item
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="bank"
                      size={22}
                      color="#2563eb"
                    />

                    <Text
                      style={
                        styles.bankRowText
                      }
                    >
                      {
                        item.name
                      }
                    </Text>

                    {selectedBank
                      ?.code ===
                      item.code && (
                      <MaterialCommunityIcons
                        name="check"
                        size={22}
                        color="#16a34a"
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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

    flex: {
      flex: 1,
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
      textAlign: "center",
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
      marginBottom: 7,
      color: "#0f172a",
    },

    helperText: {
      color: "#64748b",
      lineHeight: 19,
      marginBottom: 20,
      fontSize: 13,
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
      backgroundColor:
        "#ffffff",
    },

    bankSelector: {
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 13,
      minHeight: 52,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 15,
    },

    bankSelectorText: {
      flex: 1,
      color: "#0f172a",
      fontSize: 16,
      fontWeight: "600",
    },

    bankSelectorPlaceholder: {
      flex: 1,
      color: "#94a3b8",
      fontSize: 16,
    },

    verifyButton: {
      backgroundColor:
        "#0f766e",
      paddingVertical: 15,
      borderRadius: 15,
      alignItems: "center",
      justifyContent:
        "center",
      flexDirection: "row",
      gap: 8,
      marginBottom: 17,
    },

    verifyButtonText: {
      color: "#ffffff",
      fontWeight: "900",
      fontSize: 15,
    },

    resolvedCard: {
      borderWidth: 1,
      borderColor:
        "#bbf7d0",
      backgroundColor:
        "#f0fdf4",
      borderRadius: 16,
      padding: 16,
      marginBottom: 17,
    },

    resolvedHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 13,
    },

    resolvedTitle: {
      color: "#166534",
      fontWeight: "900",
      fontSize: 16,
    },

    resolvedLabel: {
      color: "#64748b",
      fontSize: 12,
      marginBottom: 3,
    },

    resolvedName: {
      color: "#0f172a",
      fontSize: 18,
      fontWeight: "900",
      marginBottom: 9,
    },

    resolvedDetails: {
      color: "#475569",
      lineHeight: 20,
    },

    confirmText: {
      marginTop: 12,
      color: "#166534",
      fontSize: 13,
      fontWeight: "700",
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

    disabledButton: {
      opacity: 0.45,
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

    modalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(15,23,42,0.50)",
      justifyContent:
        "flex-end",
    },

    modalCard: {
      backgroundColor:
        "#ffffff",
      borderTopLeftRadius:
        24,
      borderTopRightRadius:
        24,
      maxHeight: "80%",
      padding: 18,
    },

    modalHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 15,
    },

    modalTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: "#0f172a",
    },

    searchInput: {
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 13,
      paddingHorizontal: 13,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 12,
    },

    bankLoading: {
      paddingVertical: 35,
      alignItems: "center",
      gap: 10,
    },

    bankRow: {
      minHeight: 55,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "#f1f5f9",
    },

    bankRowText: {
      flex: 1,
      color: "#0f172a",
      fontWeight: "600",
    },
  });