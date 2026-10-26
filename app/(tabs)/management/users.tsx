import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { API } from "@/src/services/api";

type UserRow = { id: number; oramex_id: string; name: string; email: string; phone: string | null };
type PropertyRow = { id: number; address: string; amount: number; status: string | null };
type BankRow = { id: number; bank_name: string; account_name: string; account_last4: string; is_verified: boolean; payout_ready: boolean };
type UserDetail = UserRow & { properties: PropertyRow[] | null; bank_accounts: BankRow[] | null };

export default function ManagementUsers() {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const search = async (nextPage = 1) => {
    const term = query.trim();
    if (term.length < 3 || busy) return;
    setBusy(true); setError(""); setSelected(null);
    try {
      const { data } = await API.get(`/management/users?q=${encodeURIComponent(term)}&page=${nextPage}`);
      const payload = data?.data;
      const rows: UserRow[] = payload?.data ?? [];
      setRecords(previous => nextPage > 1 ? [...previous, ...rows] : rows);
      setPage(nextPage);
      setHasMore(Boolean(payload?.next_page_url));
      setSearched(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to search registered users.");
      if (nextPage === 1) setRecords([]);
    } finally { setBusy(false); }
  };

  const details = async (id: number) => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { data } = await API.get(`/management/users/${id}`);
      setSelected(data?.data ?? null);
    } catch (err: any) {
      setError(err?.response?.status === 403
        ? "You are not authorized to view this user's details."
        : err?.response?.data?.message ?? "Unable to load user details.");
    } finally { setBusy(false); }
  };

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Stack.Screen options={{ headerShown: true, title: "Registered Users" }} />
    <Text style={styles.heading}>Search registered users</Text>
    <Text>Find a customer, agent, owner or other registered user by Oramex ID, phone, surname or email.</Text>
    <TextInput accessibilityLabel="Search users by Oramex ID, phone, surname or email"
      style={styles.input} value={query} onChangeText={setQuery}
      autoCapitalize="none" placeholder="Enter at least 3 characters"
      onSubmitEditing={() => void search()} returnKeyType="search" />
    <TouchableOpacity style={[styles.primary, (busy || query.trim().length < 3) && styles.disabled]}
      disabled={busy || query.trim().length < 3} onPress={() => void search()}>
      <Text style={styles.white}>Search users</Text>
    </TouchableOpacity>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {busy ? <ActivityIndicator /> : null}
    {selected ? <View style={styles.card}>
      <TouchableOpacity style={styles.secondary} onPress={() => setSelected(null)}><Text>Back to search results</Text></TouchableOpacity>
      <Text style={styles.heading}>{selected.name}</Text>
      <Text selectable>Oramex ID: {selected.oramex_id}</Text>
      <Text selectable>Email: {selected.email}</Text>
      <Text selectable>Phone: {selected.phone || "Not provided"}</Text>
      <Text style={styles.section}>Properties</Text>
      {selected.properties === null ? <Text>Property details are restricted.</Text>
        : !selected.properties.length ? <Text>No properties uploaded.</Text>
        : selected.properties.map(p => <View key={p.id} style={styles.record}>
          <Text selectable>Property #{p.id} — {p.address}</Text><Text>Status: {p.status || "Unknown"}</Text>
          <Text>Amount: ₦{Number(p.amount || 0).toLocaleString()}</Text>
        </View>)}
      <Text style={styles.section}>Bank accounts</Text>
      {selected.bank_accounts === null ? <Text>Bank account access requires additional authorization.</Text>
        : !selected.bank_accounts.length ? <Text>No bank accounts saved.</Text>
        : selected.bank_accounts.map(b => <View key={b.id} style={styles.record}>
          <Text selectable>{b.bank_name} · ****{b.account_last4}</Text>
          <Text>Holder: {b.account_name}</Text>
          <Text>Verification: {b.is_verified ? "Verified" : "Not verified"}</Text>
          <Text>Payout: {b.payout_ready ? "Ready" : "Not ready"}</Text>
        </View>)}
      <Text style={styles.note}>Sensitive identity documents and full bank numbers are not shown.</Text>
    </View> : <>
      {searched && !busy && !records.length ? <Text>No registered users matched your search.</Text> : null}
      {records.map(u => <View key={u.id} style={styles.card}>
        <Text style={styles.section}>{u.name}</Text>
        <Text selectable>{u.oramex_id}</Text>
        <Text selectable>{u.email}</Text>
        <Text selectable>{u.phone || "No phone listed"}</Text>
        <TouchableOpacity style={styles.secondary} disabled={busy} onPress={() => void details(u.id)}>
          <Text>View details</Text>
        </TouchableOpacity>
      </View>)}
      {hasMore ? <TouchableOpacity style={styles.secondary} disabled={busy} onPress={() => void search(page + 1)}>
        <Text>Load more users</Text>
      </TouchableOpacity> : null}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, gap: 12, paddingBottom: 50, maxWidth: 800, width: "100%", alignSelf: "center" },
  heading: { fontSize: 22, fontWeight: "700" },
  section: { fontSize: 16, fontWeight: "700" },
  input: { padding: 12, borderWidth: 1, borderColor: "#94a3b8", borderRadius: 8, backgroundColor: "white" },
  primary: { backgroundColor: "#2563eb", padding: 14, borderRadius: 8, alignItems: "center" },
  secondary: { borderWidth: 1, borderColor: "#93c5fd", padding: 12, borderRadius: 8, alignItems: "center" },
  white: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: 0.5 }, error: { color: "#b91c1c" },
  card: { backgroundColor: "#fff", padding: 14, borderRadius: 10, gap: 8 },
  record: { padding: 10, borderRadius: 8, backgroundColor: "#f1f5f9", gap: 4 },
  note: { fontSize: 12, color: "#475569" },
});
