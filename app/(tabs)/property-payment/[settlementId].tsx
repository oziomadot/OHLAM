import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import * as WebBrowser
  from "expo-web-browser";

import API, {
  PropertySettlement,
} from "@/src/services/api";

const money = (
  value: string | number
) =>
  `₦${Number(value ?? 0).toLocaleString(
    "en-NG",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;

export default function PropertyPaymentScreen() {
  const router = useRouter();

  const {
    settlementId,
  } = useLocalSearchParams<{
    settlementId: string;
  }>();

  const [
    settlement,
    setSettlement,
  ] = useState<PropertySettlement | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    paying,
    setPaying,
  ] = useState(false);

  const loadSettlement =
    useCallback(async () => {
      if (!settlementId) {
        return;
      }

      try {
        const data =
          await API.getPropertySettlement(
            Number(settlementId)
          );

        setSettlement(data);
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.response?.data?.message ??
            "Unable to load payment."
        );
      } finally {
        setLoading(false);
      }
    }, [settlementId]);

  useFocusEffect(
    useCallback(() => {
      loadSettlement();
    }, [loadSettlement])
  );

  const handlePay = async () => {
    if (!settlement) {
      return;
    }

    try {
      setPaying(true);

      const payment =
        await API.initializePropertyPayment(
          settlement.id
        );

      if (!payment.authorization_url) {
        throw new Error(
          "Payment URL was not returned."
        );
      }

      /*
       * Opens Paystack hosted checkout.
       *
       * OHLAM never handles card details.
       */
      await WebBrowser.openBrowserAsync(
        payment.authorization_url
      );

      /*
       * Customer comes back from Paystack.
       *
       * Refresh settlement.
       *
       * The webhook is the source of truth,
       * NOT the browser returning.
       */
      await loadSettlement();
    } catch (error: any) {
      Alert.alert(
        "Payment Error",
        error?.response?.data?.message ??
          error?.message ??
          "Unable to start payment."
      );
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Preparing payment...
        </Text>
      </View>
    );
  }

  if (!settlement) {
    return (
      <View style={styles.center}>
        <Text>
          Payment settlement was not found.
        </Text>
      </View>
    );
  }

  const statusCode =
    settlement.status?.code;

  const paymentReady =
    statusCode ===
    "settlement_payment_ready";

  const paymentPending =
    statusCode ===
    "settlement_payment_pending";

  const paid =
    statusCode ===
    "settlement_paid";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <Text style={styles.title}>
        Property Payment
      </Text>

      {settlement.property && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {settlement.property.title ??
              "Property"}
          </Text>

          {!!settlement.property.address && (
            <Text style={styles.muted}>
              {settlement.property.address}
            </Text>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Payment Breakdown
        </Text>

        {settlement.items?.map(
          (item) => (
            <View
              key={item.id}
              style={styles.row}
            >
              <Text style={styles.label}>
                {item.label}
              </Text>

              <Text style={styles.amount}>
                {money(item.amount)}
              </Text>
            </View>
          )
        )}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.totalLabel}>
            Total
          </Text>

          <Text style={styles.totalAmount}>
            {money(
              settlement.total_amount
            )}
          </Text>
        </View>
      </View>

      {statusCode ===
        "settlement_pending_beneficiary" && (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            Payment Not Yet Available
          </Text>

          <Text style={styles.noticeText}>
            The property's payment
            beneficiary is currently being
            prepared and reviewed.
          </Text>

          <Text style={styles.warningText}>
            Do not transfer money directly
            to an agent or to a bank account
            sent outside OHLAM.
          </Text>

          <Pressable
            style={styles.secondaryButton}
            onPress={loadSettlement}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Check Again
            </Text>
          </Pressable>
        </View>
      )}

      {paymentReady && (
        <>
          <View style={styles.readyBox}>
            <Text style={styles.readyTitle}>
              Payment Ready
            </Text>

            <Text style={styles.readyText}>
              The payment route for this
              property has been prepared.
              Review the amounts carefully
              before proceeding.
            </Text>
          </View>

          <Pressable
            style={styles.payButton}
            disabled={paying}
            onPress={handlePay}
          >
            {paying ? (
              <ActivityIndicator />
            ) : (
              <Text
                style={styles.payButtonText}
              >
                Proceed to Paystack
              </Text>
            )}
          </Pressable>
        </>
      )}

      {paymentPending && (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            Payment Processing
          </Text>

          <Text style={styles.noticeText}>
            If you completed payment,
            OHLAM is waiting for payment
            confirmation.
          </Text>

          <Pressable
            style={styles.secondaryButton}
            onPress={loadSettlement}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Refresh Payment Status
            </Text>
          </Pressable>
        </View>
      )}

      {paid && (
        <View style={styles.paidBox}>
          <Text style={styles.paidTitle}>
            Payment Confirmed
          </Text>

          <Text style={styles.paidText}>
            OHLAM has received confirmation
            of this property payment.
          </Text>
        </View>
      )}

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>
          Back
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },

  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  muted: {
    marginTop: 6,
    opacity: 0.65,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },

  label: {
    flex: 1,
    fontSize: 15,
  },

  amount: {
    fontWeight: "600",
  },

  divider: {
    borderTopWidth: 1,
    borderColor: "#ddd",
    marginVertical: 8,
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
  },

  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
  },

  notice: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 18,
    marginTop: 6,
  },

  noticeTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  noticeText: {
    lineHeight: 21,
  },

  warningText: {
    marginTop: 12,
    lineHeight: 21,
    fontWeight: "600",
  },

  readyBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },

  readyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  readyText: {
    lineHeight: 21,
  },

  payButton: {
    minHeight: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    paddingHorizontal: 20,
  },

  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButton: {
    marginTop: 18,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontWeight: "600",
  },

  paidBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 18,
  },

  paidTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  paidText: {
    lineHeight: 21,
  },

  backButton: {
    marginTop: 25,
    alignItems: "center",
    padding: 14,
  },

  backButtonText: {
    fontWeight: "600",
  },
});