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
  declared_name: string;
};
type Data = {
  revision: number;
  property_id: number;
  allocation_revision: number;
  allocation_confirmed: boolean;
  locked: boolean;
  total_amount: string;
  items: { id: number; type: string; label: string; amount: string; beneficiary_id: number | null }[];
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
  const [declaredName, setDeclaredName] = useState("");
  const [assignments, setAssignments] = useState<Record<number, number>>({});
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
        setAssignments(Object.fromEntries(r.data.data.items.map(i => [i.id, i.beneficiary_id || 0])));
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
  function confirmAll() {
    if (!data) return;
    Alert.alert("Confirm payment breakdown", "Check every account owner, bank account and amount. These recipients will be paid automatically after you confirm property availability following payment.", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm all details", onPress: () => { void run(async () => {
        await API.post(`/appointments/${encodeURIComponent(id!)}/beneficiary/allocations`, {
          revision: data.revision, allocation_revision: data.allocation_revision, details_correct: true,
          items: data.items.map(i => ({ id: i.id, amount: i.amount, beneficiary_id: ["ohlam_service_fee", "agent_fee_platform_share"].includes(i.type) ? null : assignments[i.id], version: data.beneficiaries.find(b => b.id === assignments[i.id])?.version ?? null })),
        });
        Alert.alert("Recipients confirmed", "The customer can review the complete breakdown before paying.");
        router.replace(`/appointment/${id}` as never);
      }); } },
    ]);
  }
  const selectedBank = banks.find((b) => b.code === bankCode);
  return (
    <Protected>
      <ScrollView
        style={styles.screen}
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
            <Text style={{ color: "#0f172a", fontWeight: "700" }}>
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
                  <Text style={{ color: "#0f172a", fontWeight: "700" }}>{b.account_name}</Text>
                  <Text style={{ color: "#0f172a" }}>
                    {b.bank_name} · {b.masked_account_number}
                  </Text>
                  <Text style={styles.text}>Beneficiary: {b.beneficiary_type}</Text>
                  <Text style={styles.text}>
                    {b.bank_verified
                      ? "Bank account resolved"
                      : "Bank account needs verification"}
                  </Text>
                  <Text style={{ color: "#334155" }}>Account owner: {b.declared_name}</Text>
                </View>
              ))
            )}
            <View style={styles.card}>
              <Text style={styles.heading}>Assign every property charge</Text>
              <Text style={styles.text}>You receive 82% of the gross agent fee. OHLAM retains 18%, including a referral wallet reward of 3.6% of OHLAM’s share (0.648% of the gross agent fee) for eligible transactions. Customer expenses remain unchanged.</Text>
              {data.items.map(item => <View key={item.id} style={{ gap: 8 }}>
                <Text style={styles.text}>{item.label}: ₦{Number(item.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</Text>
                {["ohlam_service_fee", "agent_fee_platform_share"].includes(item.type) ? <Text style={styles.text}>Retained by OHLAM; eligible referral rewards are funded from this share.</Text> :
                  <Picker style={styles.picker} dropdownIconColor="#334155" selectedValue={assignments[item.id] || 0} enabled={!busy && !data.locked} onValueChange={value => setAssignments(old => ({ ...old, [item.id]: Number(value) }))}>
                    <Picker.Item label="Select recipient" value={0} color="#0f172a" />
                    {data.beneficiaries.filter(b => b.bank_verified).map(b => <Picker.Item key={b.id} value={b.id} color="#0f172a" label={`${b.declared_name} · ${b.account_name} · ${b.bank_name} ${b.masked_account_number}`} />)}
                  </Picker>}
              </View>)}
              <Text style={styles.heading}>Total property expenses: ₦{Number(data.total_amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.text}>The amounts must match the listing. Correct the listing first if a charge is wrong.</Text>
              {data.allocation_confirmed && <Text style={styles.success}>All recipients confirmed</Text>}
              <ActionButton title="Confirm all recipients and amounts" disabled={busy || data.locked || data.items.some(i => !["ohlam_service_fee", "agent_fee_platform_share"].includes(i.type) && !assignments[i.id])} onPress={confirmAll} />
            </View>
            <View style={styles.card}>
              <Text style={{ color: "#0f172a", fontWeight: "700" }}>
                Provide or replace beneficiary details
              </Text>
              <Text style={{ color: "#0f172a" }}>Relationship to the property</Text>
              <Picker
                style={styles.picker}
                dropdownIconColor="#334155"
                selectedValue={type}
                onValueChange={setType}
                enabled={!busy && !data.locked}
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
              <Text style={{ color: "#0f172a" }}>Bank</Text>
              <Picker
                style={styles.picker}
                dropdownIconColor="#334155"
                selectedValue={bankCode}
                onValueChange={setBankCode}
                enabled={!busy && !data.locked}
              >
                <Picker.Item label="Choose bank" value="" color="#0F172A" />
                {banks.map((b) => (
                  <Picker.Item key={b.code} label={b.name} value={b.code} color="#0F172A" />
                ))}
              </Picker>
              {banks.length === 0 && (
                <>
                  <Text style={{ color: "#0f172a" }}>The bank list could not be loaded.</Text>
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
              <TextInput style={{ color: "#0f172a", borderColor: "#cbd5e1", borderWidth: 1, padding: 14, borderRadius: 8 }} placeholder="Account owner’s name" placeholderTextColor="#64748b" value={declaredName} onChangeText={setDeclaredName} editable={!busy && !data.locked} />
              <TextInput
                style={{
                  color: "#0f172a",
                  borderWidth: 1,
                  borderColor: "#f1f4f8",
                  padding: 14,
                  borderRadius: 8,
                }}
                placeholder="10-digit account number"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                maxLength={10}
                editable={!busy && !data.locked}
                value={account}
                onChangeText={setAccount}
              />
              <ActionButton
                title="Resolve and save bank account"
                disabled={busy || data.locked || !declaredName.trim() || !selectedBank || !/^\d{10}$/.test(account)}
                onPress={() => {
                  void run(async () => {
                    await API.post(
                      `/appointments/${encodeURIComponent(id!)}/beneficiary`,
                      {
                        revision: data.revision,
                        declared_name: declaredName.trim(),
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
              <Text style={{ color: "#0f172a" }}>
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
