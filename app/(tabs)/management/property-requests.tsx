import React, { useCallback, useState } from "react";
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { API } from "@/src/services/api";

type Access = { permissions: string[] };
type Place = { id: number; name: string };
type RequestRow = {
  id: number;
  category: "rent" | "house_sale" | "land_sale";
  status: string;
  state?: Place | null;
  area?: Place | null;
  max_budget?: string | null;
  min_bedrooms?: number | null;
  expires_at: string;
  created_at: string;
  forwards_count: number;
  matches_count: number;
};
type Recipient = { id: number; name: string; oramex_id: string };
type Forward = {
  id: number; recipient_name: string; oramex_id: string;
  created_at: string; forwarded_by_user_id: number;
};
const categoryName: Record<RequestRow["category"], string> = {
  rent: "House for Rent", house_sale: "House for Sale", land_sale: "Land for Sale",
};
const filters = ["active", "all", "paused", "fulfilled", "expired", "cancelled"] as const;

export default function ManagementPropertyRequests() {
  const [authorized, setAuthorized] = useState(false);
  const [canForward, setCanForward] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [status, setStatus] = useState<(typeof filters)[number]>("active");
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [selected, setSelected] = useState<RequestRow | null>(null);
  const [query, setQuery] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [forwarded, setForwarded] = useState<Forward[]>([]);

  const load = useCallback(async (nextPage: number, filter: string) => {
    setLoading(true);
    setError("");
    try {
      const access = await API.get<Access>("/management/access");
      const permissions = access.data?.permissions ?? [];
      if (!permissions.includes("property_requests.view")) {
        setAuthorized(false);
        setCanForward(false);
        setRows([]);
        return;
      }
      setAuthorized(true);
      setCanForward(permissions.includes("property_requests.forward"));
      const response = await API.get("/management/property-requests", {
        params: { page: nextPage, status: filter },
      });
      const result = response.data?.data;
      const items: RequestRow[] = result?.data ?? [];
      setRows(previous => nextPage === 1 ? items : [...previous, ...items]);
      setMore(Boolean(result?.next_page_url));
      setPage(nextPage);
    } catch (err: any) {
      setError(err?.response?.status === 403
        ? "You do not have permission to review property requests."
        : "Unable to load property requests. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load(1, status);
  }, [load, status]));

  const viewForwards = async (item: RequestRow) => {
    setSelected(item);
    setQuery("");
    setRecipients([]);
    setForwarded([]);
    try {
      const response = await API.get(`/management/property-requests/${item.id}/forwards`);
      setForwarded(response.data?.data ?? []);
    } catch {
      Alert.alert("Unable to load history", "Please try opening this request again.");
    }
  };

  const searchRecipients = async () => {
    if (!selected || busy || query.trim().length < 3) {
      Alert.alert("Search required", "Enter at least three characters of a name or Oramex ID.");
      return;
    }
    setBusy(true);
    setRecipients([]);
    try {
      const response = await API.get("/management/property-requests/recipients", {
        params: { q: query.trim() },
      });
      setRecipients(response.data?.data ?? []);
    } catch (err: any) {
      Alert.alert("Search failed", err?.response?.data?.message ?? "Unable to search registered users.");
    } finally { setBusy(false); }
  };

  const forwardTo = (recipient: Recipient) => {
    if (!selected || busy) return;
    const requestId = selected.id;
    Alert.alert(
      "Forward property request",
      `Share anonymous request #${requestId} with ${recipient.name} (${recipient.oramex_id})? The customer's identity and private note will not be sent.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Forward", onPress: async () => {
          setBusy(true);
          try {
            const response = await API.post(`/management/property-requests/${requestId}/forwards`, {
              recipient_user_id: recipient.id,
            });
            const history = await API.get(`/management/property-requests/${requestId}/forwards`);
            setForwarded(history.data?.data ?? []);
            setRecipients([]);
            setQuery("");
            void load(1, status);
            Alert.alert("Forward status", response.data?.message ?? "Request forwarded.");
          } catch (err: any) {
            Alert.alert("Unable to forward", err?.response?.data?.message ?? "Please try again.");
          } finally { setBusy(false); }
        } },
      ]
    );
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: "Staff Property Requests", headerShown: true }} />
      <Text style={styles.title}>Customer Property Requests</Text>
      <Text style={styles.description}>
        Review anonymous customer demand, find matching agents and forward requests to registered OHLAM users.
      </Text>
      <Text style={styles.privacy}>Customer identity, contact details and private notes are never shared in this dashboard.</Text>
      <View style={styles.filters}>
        {filters.map(option => (
          <TouchableOpacity
            key={option}
            accessibilityRole="button"
            style={[styles.filter, option === status && styles.selectedFilter]}
            onPress={() => { setStatus(option); setSelected(null); }}
          >
            <Text style={option === status ? styles.white : styles.filterText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading && <ActivityIndicator />}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!loading && !authorized && !error && <Text>Only authorized staff and admin can view requests.</Text>}
      {authorized && rows.map(item => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{categoryName[item.category] ?? item.category} · #{item.id}</Text>
          <Text style={styles.text}>{item.area?.name ? item.area.name + ", " : ""}{item.state?.name ?? "Nigeria"}</Text>
          <Text style={styles.text}>Status: {item.status} · Expires: {new Date(item.expires_at).toLocaleDateString()}</Text>
          <Text style={styles.text}>Budget: {item.max_budget ? `₦${Number(item.max_budget).toLocaleString("en-NG")}` : "Flexible"}</Text>
          {item.min_bedrooms != null && <Text style={styles.text}>Minimum rooms: {item.min_bedrooms}</Text>}
          <Text style={styles.text}>Potential matches: {item.matches_count} · Forwarded: {item.forwards_count}</Text>
          <TouchableOpacity style={styles.button} onPress={() => void viewForwards(item)}>
            <Text style={styles.white}>{selected?.id === item.id ? "Refresh forwarding history" : "Review / forward request"}</Text>
          </TouchableOpacity>
        </View>
      ))}
      {authorized && !loading && rows.length === 0 && <Text style={styles.description}>No property requests match this filter.</Text>}
      {authorized && more && !loading && (
        <TouchableOpacity style={styles.button} onPress={() => void load(page + 1, status)}>
          <Text style={styles.white}>Load more</Text>
        </TouchableOpacity>
      )}
      {selected && authorized && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Request #{selected.id} · Forwarding</Text>
          <Text style={styles.description}>Forwarding history ({forwarded.length})</Text>
          {forwarded.length === 0 && <Text style={styles.text}>Not yet forwarded by staff.</Text>}
          {forwarded.map(forward => (
            <Text key={forward.id} style={styles.text}>
              {forward.recipient_name} ({forward.oramex_id}) · {new Date(forward.created_at).toLocaleDateString()}
            </Text>
          ))}
          {canForward && selected.status === "active" && new Date(selected.expires_at).getTime() > Date.now() && (
            <>
              <Text style={styles.cardTitle}>Forward to a registered user</Text>
              <TextInput
                accessibilityLabel="Search recipient"
                style={styles.input}
                placeholder="Search name or Oramex ID"
                placeholderTextColor="#64748b"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                onSubmitEditing={() => void searchRecipients()}
              />
              <TouchableOpacity style={styles.button} disabled={busy} onPress={() => void searchRecipients()}>
                <Text style={styles.white}>{busy ? "Working..." : "Find recipient"}</Text>
              </TouchableOpacity>
              {recipients.length === 0 && query.length >= 3 && <Text style={styles.description}>Search to display matching users.</Text>}
              {recipients.map(recipient => (
                <View key={recipient.id} style={styles.recipientRow}>
                  <Text style={styles.text}>{recipient.name} · {recipient.oramex_id}</Text>
                  <TouchableOpacity disabled={busy} style={styles.smallButton} onPress={() => forwardTo(recipient)}>
                    <Text style={styles.white}>Forward</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
          <TouchableOpacity style={styles.close} onPress={() => setSelected(null)}>
            <Text style={styles.closeText}>Close request details</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f6f8fc" },
  content: { padding: 16, gap: 12, paddingBottom: 50 },
  title: { color: "#102b4d", fontSize: 23, fontWeight: "800" },
  description: { color: "#475569", lineHeight: 20 },
  privacy: { color: "#37567a", fontSize: 12, lineHeight: 18 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  filter: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, backgroundColor: "#e2e8f0" },
  selectedFilter: { backgroundColor: "#1655a8" },
  filterText: { color: "#0f2747", textTransform: "capitalize" },
  white: { color: "#ffffff", fontWeight: "700" },
  card: { backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderWidth: 1, padding: 15, borderRadius: 12, gap: 8 },
  cardTitle: { color: "#102b4d", fontSize: 16, fontWeight: "800" },
  text: { color: "#334155", lineHeight: 19 },
  button: { backgroundColor: "#1655a8", padding: 12, alignItems: "center", borderRadius: 9 },
  smallButton: { backgroundColor: "#1655a8", paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8 },
  recipientRow: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
  input: { borderColor: "#cbd5e1", borderWidth: 1, borderRadius: 9, padding: 11, color: "#102b4d", backgroundColor: "#fff" },
  close: { padding: 10, alignItems: "center" },
  closeText: { color: "#1655a8", fontWeight: "700" },
  error: { color: "#b91c1c" },
});
