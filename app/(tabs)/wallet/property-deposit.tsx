import React, {
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

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import API from "@/src/services/api";

import usePreventScreenCapture
  from "@/hooks/usePreventScreenCapture";

export default function PropertyDepositScreen() {
  const params =
    useLocalSearchParams<{
      interestId?: string;
      propertyId?: string;
    }>();

  const [
    loading,
    setLoading,
  ] = useState(false);

  usePreventScreenCapture(true);

  const interestId =
    Number(params.interestId);

  const startDeposit =
    async () => {
      if (
        !interestId ||
        Number.isNaN(interestId)
      ) {
        Alert.alert(
          "Invalid request",
          "The property interest could not be identified."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await API.createPropertyDeposit(
            interestId
          );

        const data = response;

        Alert.alert(
          "Deposit secured",
          data?.message ??
            "Your inspection deposit has been reserved successfully.",
          [
            {
              text: "View Wallet",
              onPress: () =>
                router.replace(
                  "/wallet"
                ),
            },
          ]
        );
      } catch (error: any) {
        console.error(
          "Deposit error:",
          error?.response?.data ??
            error
        );

        const status =
          error?.response?.status;

        const data =
          error?.response?.data;

        if (
          status === 422 &&
          data?.code ===
            "INSUFFICIENT_WALLET_BALANCE"
        ) {
          Alert.alert(
            "Wallet funding required",
            data?.message ??
              "Your available balance is not enough.",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Fund Wallet",
                onPress: () =>
                  router.push(
                    "/wallet/fund-wallet"
                  ),
              },
            ]
          );

          return;
        }

        Alert.alert(
          "Unable to reserve deposit",
          data?.message ??
            "Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <View style={styles.container}>
      <View
        style={styles.headerIcon}
      >
        <MaterialCommunityIcons
          name="shield-lock-outline"
          size={38}
          color="#2563eb"
        />
      </View>

      <Text style={styles.title}>
        Inspection Commitment
      </Text>

      <Text style={styles.amount}>
        ₦5,000
      </Text>

      <Text
        style={styles.subtitle}
      >
        This amount is reserved in
        your OHLAM wallet for the
        inspection.
      </Text>

      <View style={styles.card}>
        <Rule
          icon="lock-outline"
          text="The ₦5,000 is moved from your available balance into your locked balance."
        />

        <Rule
          icon="calendar-check-outline"
          text="When the inspection is properly completed, the applicable amount can be released according to OHLAM's inspection rules."
        />

        <Rule
          icon="alert-circle-outline"
          text="If you miss a confirmed inspection without qualifying cancellation, an applicable charge may be deducted from the locked amount."
        />

        <Rule
          icon="shield-check-outline"
          text="Locked funds are different from property transaction escrow."
        />
      </View>

      <TouchableOpacity
        disabled={loading}
        style={[
          styles.button,
          loading &&
            styles.buttonDisabled,
        ]}
        onPress={startDeposit}
      >
        {loading ? (
          <ActivityIndicator
            color="#ffffff"
          />
        ) : (
          <>
            <MaterialCommunityIcons
              name="lock"
              size={20}
              color="#ffffff"
            />

            <Text
              style={
                styles.buttonText
              }
            >
              Reserve ₦5,000
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text
        style={
          styles.securityText
        }
      >
        OHLAM records every wallet
        movement in your transaction
        history.
      </Text>
    </View>
  );
}

function Rule({
  icon,
  text,
}: {
  icon: any;
  text: string;
}) {
  return (
    <View style={styles.rule}>
      <MaterialCommunityIcons
        name={icon}
        size={23}
        color="#475569"
      />

      <Text
        style={styles.ruleText}
      >
        {text}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
      padding: 22,
    },

    headerIcon: {
      width: 66,
      height: 66,
      borderRadius: 21,
      backgroundColor:
        "#eff6ff",
      justifyContent:
        "center",
      alignItems: "center",
      alignSelf: "center",
      marginTop: 24,
    },

    title: {
      fontSize: 25,
      fontWeight: "900",
      color: "#0f172a",
      textAlign: "center",
      marginTop: 16,
    },

    amount: {
      fontSize: 35,
      fontWeight: "900",
      color: "#2563eb",
      textAlign: "center",
      marginTop: 10,
    },

    subtitle: {
      color: "#64748b",
      textAlign: "center",
      lineHeight: 21,
      marginTop: 6,
      marginBottom: 22,
    },

    card: {
      backgroundColor:
        "#ffffff",
      borderRadius: 20,
      padding: 18,
    },

    rule: {
      flexDirection: "row",
      gap: 12,
      marginVertical: 9,
    },

    ruleText: {
      flex: 1,
      color: "#475569",
      lineHeight: 20,
    },

    button: {
      marginTop: 22,
      backgroundColor:
        "#2563eb",
      paddingVertical: 16,
      borderRadius: 15,
      alignItems: "center",
      justifyContent:
        "center",
      flexDirection: "row",
      gap: 8,
    },

    buttonDisabled: {
      opacity: 0.65,
    },

    buttonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "900",
    },

    securityText: {
      textAlign: "center",
      color: "#94a3b8",
      marginTop: 16,
      fontSize: 12,
    },
  });