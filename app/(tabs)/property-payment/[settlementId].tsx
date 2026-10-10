import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import Protected from "components/Protected";
import { ActionButton } from "components/inspection/InspectionFlowCard";
import API from "@/src/services/api";
import { SettlementView, errorText } from "@/src/services/inspectionFlow";

const money = (value: string) =>
  `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export default function PaymentScreen() {
  const params = useLocalSearchParams<{ settlementId?: string | string[] }>();
  const id = Array.isArray(params.settlementId)
    ? params.settlementId[0]
    : params.settlementId;
  const [data, setData] = useState<SettlementView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const root = `/property-settlements/${encodeURIComponent(id ?? "")}`;
  const reload = useCallback(async () => {
    const g = ++generation.current;
    if (!id) {
      setError("Payment review ID is missing.");
      return;
    }
    try {
      const r = await API.get<{ data: SettlementView }>(
        `/property-settlements/${encodeURIComponent(id)}`,
      );
      if (g === generation.current) {
        setData(r.data.data);
        setError("");
      }
    } catch (e) {
      if (g === generation.current) setError(errorText(e));
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void reload();
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") void reload();
      });
      return () => {
        generation.current++;
        sub.remove();
      };
    }, [reload]),
  );
  async function run(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await work();
    } catch (e) {
      Alert.alert("Payment update", errorText(e));
    } finally {
      await reload();
      lock.current = false;
      setBusy(false);
    }
  }
  async function verify() {
    await run(async () => {
      const r = await API.post<{ data: SettlementView }>(`${root}/verify`);
      setData(r.data.data);
      Alert.alert(
        r.data.data.state === "paid" ? "Payment received" : "Payment pending",
        r.data.data.state === "paid"
          ? "Your payment has been verified and secured."
          : "The provider has not confirmed a successful payment yet.",
      );
    });
  }
  async function pay() {
    await run(async () => {
      const r = await API.post<{
        data: { state?: string; authorization_url?: string };
      }>(`${root}/pay`);
      if (r.data.data.state === "paid") return;
      const url = r.data.data.authorization_url;
      if (!url || !url.startsWith("https://checkout.paystack.com/"))
        throw new Error(
          "Checkout details are unavailable. Check payment status or contact support.",
        );
      await WebBrowser.openBrowserAsync(url);
      // Closing the browser never establishes payment success.
      const verified = await API.post<{ data: SettlementView }>(
        `${root}/verify`,
      );
      setData(verified.data.data);
    });
  }
  return (
    <Protected>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 60 }}
      >
        <Text style={{ fontSize: 23, fontWeight: "700" }}>
          Property payment
        </Text>
        {error ? (
          <Text style={{ color: "#b91c1c" }}>{error}</Text>
        ) : !data ? (
          <ActivityIndicator />
        ) : (
          <>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              {data.property_label}
            </Text>
            <View
              style={{
                padding: 18,
                backgroundColor: "#fff",
                borderRadius: 12,
                gap: 12,
              }}
            >
              {data.items.map((item, i) => (
                <Text key={`${item.type}-${i}`}>
                  {item.label}: {money(item.amount)}
                </Text>
              ))}
              <Text style={{ fontSize: 21, fontWeight: "700" }}>
                Total: {money(data.total_amount)}
              </Text>
            </View>
            {data.beneficiary && (
              <View
                style={{
                  padding: 18,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontWeight: "700" }}>Confirmed beneficiary</Text>
                <Text>{data.beneficiary.account_name}</Text>
                <Text>
                  {data.beneficiary.bank_name} ·{" "}
                  {data.beneficiary.masked_account_number}
                </Text>
              </View>
            )}
            {data.state === "awaiting_account_details" && (
              <>
                <Text>
                  The lister needs to provide or confirm beneficiary details for
                  this property. An email and in-app request have been sent.
                  Refresh after they confirm.
                </Text>
                <ActionButton
                  title="Request beneficiary details"
                  disabled={busy}
                  onPress={() => {
                    void run(async () => {
                      await API.post(`${root}/request-account-details`);
                      Alert.alert(
                        "Request recorded",
                        "The lister has been notified if details are still missing.",
                      );
                    });
                  }}
                />
              </>
            )}
            {data.state === "ready" && (
              <ActionButton
                title="Pay securely with Paystack"
                disabled={busy}
                onPress={() => {
                  void pay();
                }}
              />
            )}
            {data.state === "processing" && (
              <>
                <Text>
                  Payment is awaiting confirmation. Check the existing payment
                  before trying anything else.
                </Text>
                {data.payment?.authorization_url && (
                  <ActionButton
                    title="Resume existing checkout"
                    disabled={busy}
                    onPress={() => {
                      void pay();
                    }}
                  />
                )}
                <ActionButton
                  title="Check payment status"
                  disabled={busy}
                  onPress={() => {
                    void verify();
                  }}
                />
              </>
            )}
            {data.state === "paid" && (
              <View
                style={{
                  padding: 18,
                  backgroundColor: "#dcfce7",
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 19, fontWeight: "700" }}>
                  Payment received and secured
                </Text>
                <Text>Reference: {data.payment?.reference}</Text>
                <Text>
                  The successful payment has been verified by the backend.
                  Release of property funds follows OHLAM's approval process.
                </Text>
              </View>
            )}
          </>
        )}
        <ActionButton
          title="Refresh payment review"
          disabled={busy}
          onPress={() => {
            void reload();
          }}
        />
      </ScrollView>
    </Protected>
  );
}
