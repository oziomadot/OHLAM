import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import Protected from "components/Protected";
import { ActionButton } from "components/inspection/InspectionFlowCard";
import API from "@/src/services/api";
import { errorText } from "@/src/services/inspectionFlow";

type Beneficiary = {
  id: number;
  beneficiary_type: string;
  account_name: string;
  bank_name: string;
  masked_account_number: string;
  bank_verified: boolean;
  version: string;
};
type Data = {
  revision: number;
  property_id: number;
  confirmed_id: number | null;
  beneficiaries: Beneficiary[];
};
type Bank = { code: string; name: string };
export default function BeneficiaryScreen() {
  const params = useLocalSearchParams<{ appointmentId?: string | string[] }>();
  const id = Array.isArray(params.appointmentId)
    ? params.appointmentId[0]
    : params.appointmentId;
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState("owner");
  const [bankCode, setBankCode] = useState("");
  const [account, setAccount] = useState("");
  const lock = useRef(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const g = ++generation.current;
    if (!id) {
      setError("Open the beneficiary page from an appointment.");
      return;
    }
    try {
      const r = await API.get<{ data: Data }>(
        `/appointments/${encodeURIComponent(id)}/beneficiary`,
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
      void API.get<{ data: Bank[] }>("/wallet/banks")
        .then((r) => setBanks(r.data.data))
        .catch(() => setBanks([]));
      return () => {
        generation.current++;
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
      Alert.alert("Unable to save beneficiary", errorText(e));
    } finally {
      await reload();
      lock.current = false;
      setBusy(false);
    }
  }
  function confirm(b: Beneficiary) {
    Alert.alert(
      "Are these beneficiary details correct?",
      `${b.account_name}\n${b.bank_name}\n${b.masked_account_number}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm correct",
          onPress: () => {
            void run(async () => {
              await API.post(
                `/appointments/${encodeURIComponent(id!)}/beneficiary/confirm`,
                {
                  revision: data!.revision,
                  beneficiary_id: b.id,
                  version: b.version,
                  details_correct: true,
                },
              );
              Alert.alert(
                "Beneficiary confirmed",
                "The customer can proceed once the inspection requirements are satisfied.",
              );
              router.replace(`/appointment/${id}` as never);
            });
          },
        },
      ],
    );
  }
  const selectedBank = banks.find((b) => b.code === bankCode);
  return (
    <Protected>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 60 }}
      >
        <Text style={{ fontSize: 23, fontWeight: "700" }}>
          Property payment beneficiary
        </Text>
        <Text>
          Provide the account that should receive the property payment, or
          confirm that an existing account is correct.
        </Text>
        {error ? (
          <>
            <Text style={{ color: "#b91c1c" }}>{error}</Text>
            <ActionButton
              title="Reload"
              disabled={busy}
              onPress={() => {
                void reload();
              }}
            />
          </>
        ) : !data ? (
          <ActivityIndicator />
        ) : (
          <>
            <Text style={{ fontWeight: "700" }}>
              Property #{data.property_id}
            </Text>
            {data.beneficiaries.length === 0 ? (
              <Text>No beneficiary has been provided yet.</Text>
            ) : (
              data.beneficiaries.map((b) => (
                <View
                  key={b.id}
                  style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    gap: 8,
                  }}
                >
                  <Text style={{ fontWeight: "700" }}>{b.account_name}</Text>
                  <Text>
                    {b.bank_name} · {b.masked_account_number}
                  </Text>
                  <Text>Beneficiary: {b.beneficiary_type}</Text>
                  <Text>
                    {b.bank_verified
                      ? "Bank account resolved"
                      : "Bank account needs verification"}
                  </Text>
                  {data.confirmed_id === b.id ? (
                    <Text>✓ Confirmed for this appointment</Text>
                  ) : (
                    <ActionButton
                      title="Confirm these details are correct"
                      disabled={busy || !b.bank_verified}
                      onPress={() => confirm(b)}
                    />
                  )}
                </View>
              ))
            )}
            <View
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 12,
                gap: 10,
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                Provide or replace beneficiary details
              </Text>
              <Text>Relationship to the property</Text>
              <Picker
                selectedValue={type}
                onValueChange={setType}
                enabled={!busy}
              >
                {[
                  "owner",
                  "landlord",
                  "agent",
                  "developer",
                  "lawyer",
                  "other",
                ].map((t) => (
                  <Picker.Item key={t} label={t} value={t} />
                ))}
              </Picker>
              <Text>Bank</Text>
              <Picker
                selectedValue={bankCode}
                onValueChange={setBankCode}
                enabled={!busy}
              >
                <Picker.Item label="Choose bank" value="" />
                {banks.map((b) => (
                  <Picker.Item key={b.code} label={b.name} value={b.code} />
                ))}
              </Picker>
              {banks.length === 0 && (
                <>
                  <Text>The bank list could not be loaded.</Text>
                  <ActionButton
                    title="Retry bank list"
                    disabled={busy}
                    onPress={() => {
                      void API.get<{ data: Bank[] }>("/wallet/banks")
                        .then((r) => setBanks(r.data.data))
                        .catch((e) =>
                          Alert.alert("Banks unavailable", errorText(e)),
                        );
                    }}
                  />
                </>
              )}
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  padding: 14,
                  borderRadius: 8,
                }}
                placeholder="10-digit account number"
                keyboardType="number-pad"
                maxLength={10}
                editable={!busy}
                value={account}
                onChangeText={setAccount}
              />
              <ActionButton
                title="Resolve and save bank account"
                disabled={busy || !selectedBank || !/^\d{10}$/.test(account)}
                onPress={() => {
                  void run(async () => {
                    await API.post(
                      `/appointments/${encodeURIComponent(id!)}/beneficiary`,
                      {
                        revision: data.revision,
                        beneficiary_type: type,
                        bank_code: bankCode,
                        bank_name: selectedBank!.name,
                        account_number: account,
                      },
                    );
                    setAccount("");
                    Alert.alert(
                      "Bank account resolved",
                      "Review the resolved account name above, then confirm that the details are correct.",
                    );
                  });
                }}
              />
              <Text>
                Bank resolution confirms the account details. It does not verify
                ownership of the property.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </Protected>
  );
}
