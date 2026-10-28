import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack, useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import { API } from "@/src/services/api";

type Access = { role: string; permissions: string[] };
type Kind = "agent" | "property" | "appointments";

export default function ManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  useEffect(() => { if (params.kind === "agent" || params.kind === "property") setKind(params.kind); }, [params.kind]);
  const [access, setAccess] = useState<Access | null>(null);
  const [kind, setKind] = useState<Kind>("agent");
  const [reference, setReference] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [resultTitle, setResultTitle] = useState("");
  const [resultKind, setResultKind] = useState<"agent" | "property" | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setAccess(null);
    setRows([]);
    API.get<Access>("/management/access").then(({ data }) => {
      if (active) { setAccess(data); setError(""); }
    }).catch(() => { if (active) setError("Unable to check management access. Please sign in again."); });
    return () => { active = false; };
  }, []));

  const load = async (url: string, title: string, append = false) => {
    if (busy) return;
    setBusy(true); setError("");
    if (!append) { setRows([]); setNextPage(null); }
    try {
      const { data } = await API.get(url);
      const payload = data.data;
      const items = Array.isArray(payload) ? payload : payload?.data ?? [];
      setRows(previous => append ? [...previous, ...items] : items);
      // Laravel provides absolute links. Reuse only the page number with the original API path.
      const next = payload?.next_page_url;
      const match = typeof next === "string" ? next.match(/[?&]page=(\d+)/) : null;
      const base = url.replace(/([?&])page=\d+(&?)/, (_all, separator, tail) => tail ? separator : "").replace(/[?&]$/, "");
      setNextPage(match ? base + (base.includes("?") ? "&" : "?") + `page=${match[1]}` : null);
      setResultTitle(title); setSearched(true);
      const entity = url.match(/[?&]kind=(agent|property)(?:&|$)/)?.[1];
      setResultKind(entity === "agent" || entity === "property" ? entity : null);
    } catch (e: any) {
      setRows([]); setNextPage(null);
      setError(e?.response?.status === 403 ? "You do not have permission for this action." : e?.response?.data?.message ?? "Unable to load results. Please try again.");
    } finally { setBusy(false); }
  };

  const can = (permission: string) => access?.permissions.includes(permission);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ headerShown: true, title: "Management" }} />
      <Text style={styles.title}>Management workspace</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {!access && !error ? <ActivityIndicator /> : null}
      {access && !can("support.view") ? <Text>This area is restricted to authorized staff and administrators.</Text> : null}
      {can("support.view") ? <>
        <Text>Access: {access?.role}. Searches and support actions are recorded.</Text>
        <TouchableOpacity style={styles.primary} onPress={() => router.push("/(tabs)/chat" as never)}>
          <Text style={styles.white}>Open user support chats</Text>
        </TouchableOpacity>
        <Text>Use the Support Queue tab in Chats to join and reply to a management conversation.</Text>
        <Text style={styles.heading}>Find an agent, property or inspection</Text>
        <View style={styles.tabs}>
          {(["agent", "property", "appointments"] as Kind[]).map(value => (
            <TouchableOpacity key={value} disabled={busy} style={[styles.tab, value === kind && styles.selected]} onPress={() => { setKind(value); setRows([]); setSearched(false); setNextPage(null); }}>
              <Text>{value === "appointments" ? "Inspections" : value === "agent" ? "Agent" : "Property"}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text>{kind === "agent" ? "Agent number, Oramex ID or numeric user ID" : kind === "property" ? "Property number or agent’s Oramex ID / agent number" : "Property number"}</Text>
        <TextInput accessibilityLabel="Search reference" style={styles.input} value={reference} onChangeText={setReference} autoCapitalize="characters" placeholder="Enter the exact number" returnKeyType="search" onSubmitEditing={() => { if (reference.trim()) void load(`/management/search?kind=${kind}&reference=${encodeURIComponent(reference.trim())}`, "Search results"); }} />
        <TouchableOpacity disabled={busy || !reference.trim()} style={[styles.primary, (busy || !reference.trim()) && styles.disabled]} onPress={() => void load(`/management/search?kind=${kind}&reference=${encodeURIComponent(reference.trim())}`, "Search results")}>
          <Text style={styles.white}>Search</Text>
        </TouchableOpacity>
        {can("recruitment.contracts.prepare") ? <TouchableOpacity style={styles.primary}
          onPress={() => router.push("/(tabs)/management/recruitment-contracts" as never)}>
          <Text style={styles.white}>Personnel contracts and approvals</Text>
        </TouchableOpacity> : null}
        {can("staff.read") ? <TouchableOpacity style={styles.tab} disabled={busy} onPress={() => void load("/management/staff", "Staff directory")}><Text>View staff directory</Text></TouchableOpacity> : null}
        {can("audit.read") ? <TouchableOpacity style={styles.tab} disabled={busy} onPress={() => void load("/management/audit", "Management audit log")}><Text>View audit log</Text></TouchableOpacity> : null}
        {can("moderation.history") ? <>
          <Text style={styles.heading}>Admin moderation review</Text>
          {(["property", "agent"] as const).flatMap(entity => (["suspended", "deleted"] as const).map(state => <TouchableOpacity key={`${entity}-${state}`} style={styles.tab} disabled={busy} onPress={() => void load(`/management/moderation-records?kind=${entity}&state=${state}`, `${state} ${entity} records`)}><Text>{state === "suspended" ? "Suspended" : "Deleted"} {entity === "property" ? "properties" : "agents"}</Text></TouchableOpacity>))}
          <TouchableOpacity style={styles.tab} disabled={busy} onPress={() => void load("/management/moderation-history", "Suspension and deletion history")}><Text>History — including permanently deleted records</Text></TouchableOpacity>
        </> : null}
        {can("policies.manage") ? <TouchableOpacity style={styles.tab} onPress={() => router.push("/(tabs)/management/policies" as never)}><Text>Add / view policies</Text></TouchableOpacity> : null}
        {busy ? <ActivityIndicator /> : null}
        {searched ? <Text style={styles.heading}>{resultTitle}</Text> : null}
        {searched && !busy && !rows.length && !error ? <Text>No matching records found.</Text> : null}
        {rows.map((row, index) => <View key={`${row.id ?? index}-${index}`} style={styles.card}>
          {Object.entries(row).filter(([, value]) => value != null).map(([key, value]) => <Text selectable key={key}><Text style={styles.label}>{key.replace(/_/g, " ")}: </Text>{String(value)}</Text>)}
          {resultKind && can(resultKind === "agent" ? "agents.suspend" : "properties.suspend") ? <TouchableOpacity style={styles.tab} onPress={() => router.push({ pathname: "/(tabs)/management/moderate", params: { kind: resultKind, id: String(row.id) } } as never)}><Text>Suspend / review {resultKind}</Text></TouchableOpacity> : null}
        </View>)}
        {nextPage ? <TouchableOpacity disabled={busy} style={styles.tab} onPress={() => void load(nextPage, resultTitle, true)}><Text>Load more</Text></TouchableOpacity> : null}
      </> : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" }, content: { padding: 14, gap: 12, maxWidth: 800, width: "100%", alignSelf: "center", paddingBottom: 32 },
  title: { fontSize: 23, fontWeight: "700" }, heading: { fontSize: 17, fontWeight: "700", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#94a3b8", borderRadius: 8, padding: 12, backgroundColor: "white" },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, tab: { padding: 12, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8 }, selected: { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
  primary: { backgroundColor: "#2563eb", borderRadius: 8, padding: 13, alignItems: "center" }, white: { color: "white", fontWeight: "700" }, disabled: { opacity: 0.45 },
  error: { color: "#b91c1c" }, card: { backgroundColor: "white", padding: 12, borderRadius: 8, gap: 5 }, label: { fontWeight: "700" },
});
