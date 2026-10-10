import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet
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
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>
          Property payment beneficiary
        </Text>
        <Text style={styles.text}>
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
          <ActivityIndicator color="#147D64" />
        ) : (
          <>
            <Text style={{ fontWeight: "700" }}>
              Property #{data.property_id}
            </Text>
            {data.beneficiaries.length === 0 ? (
              <Text style={styles.text}>No beneficiary has been provided yet.</Text>
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
                  <Text style={styles.text}>Beneficiary: {b.beneficiary_type}</Text>
                  <Text style={styles.text}>
                    {b.bank_verified
                      ? "Bank account resolved"
                      : "Bank account needs verification"}
                  </Text>
                  {data.confirmed_id === b.id ? (
                    <Text style={styles.text}>✓ Confirmed for this appointment</Text>
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
            <View style={styles.card}>
              <Text style={{ fontWeight: "700" }}>
                Provide or replace beneficiary details
              </Text>
              <Text>Relationship to the property</Text>
              <Picker
                style={styles.picker}
                dropdownIconColor="#334155"
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
                style={styles.picker}
                dropdownIconColor="#334155"
                selectedValue={bankCode}
                onValueChange={setBankCode}
                enabled={!busy}
              >
                <Picker.Item label="Choose bank" value="" color="#0F172A" />
                {banks.map((b) => (
                  <Picker.Item key={b.code} label={b.name} value={b.code} color="#0F172A" />
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
                  borderColor: "#f1f4f8",
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

 const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    gap: 14,
    paddingBottom: 60,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#0F172A",
  },
  heading: {
    fontWeight: "700",
    color: "#0F172A",
  },
  text: {
    color: "#334155",
    lineHeight: 22,
  },
  success: {
    color: "#166534",
    fontWeight: "600",
  },
  error: {
    color: "#B91C1C",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  picker: {
    color: "#0F172A",
    backgroundColor: "#F1F5F9",
  },
  input: {
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#94A3B8",
    padding: 14,
    borderRadius: 8,
  },
});
