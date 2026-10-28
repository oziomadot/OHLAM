import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { API } from "@/src/services/api";

type Authorization = { code: string; label: string };
type StaffMember = {
  id: number; name: string; number: string; role: string;
  permissions: string[]; assigned_authorizations: Authorization[];
  available_authorizations: Authorization[]; can_delegate: boolean;
};
const labels: Record<string, string> = {
  "users.search": "Search users", "users.view": "View user details",
  "users.properties.read": "View user properties", "users.bank.read": "View masked user bank accounts",
  "agents.search": "Search agents", "properties.search": "Search properties",
  "appointments.read": "View appointment summaries", "support.reply": "Reply to support",
  "payouts.create": "Initiate payout requests",
  "marketing.campaign.manage": "Upload and manage campaign media",
  "recruitment.decide": "Accept shortlisted applicants and start onboarding",
};

export default function AdminStaffDirectory() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [mode, setMode] = useState<"assign" | "remove" | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const load = useCallback(async (nextPage = 1) => {
    setLoading(true); setError("");
    try {
      const { data } = await API.get(`/management/staff?page=${nextPage}`);
      const payload = data?.data;
      const rows = (payload?.data ?? []) as StaffMember[];
      setStaff(previous => nextPage > 1 ? [...previous, ...rows] : rows);
      setPage(nextPage);
      setHasNext(Boolean(payload?.next_page_url));
    } catch (err: any) {
      setError(err?.response?.status === 403
        ? "Only administrators may view staff authorizations."
        : err?.response?.data?.message ?? "Unable to load staff directory.");
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const change = (member: StaffMember, auth: Authorization, action: "assign" | "remove") => {
    if (processing || !member.can_delegate) return;
    Alert.alert(action === "assign" ? "Assign authorization?" : "Remove authorization?",
      `${action === "assign" ? "Assign" : "Remove"} "${auth.label}" ${action === "assign" ? "to" : "from"} ${member.name}?`, [
        { text: "Cancel", style: "cancel" },
        { text: action === "assign" ? "Assign" : "Remove", style: action === "remove" ? "destructive" : "default",
          onPress: () => {
            void (async () => {
              setProcessing(true); setError("");
              try {
                await API.post(`/management/staff/${member.id}/permissions`, { permission: auth.code, action });
                setMode(null);
                await load();
                Alert.alert("Saved", "The staff authorization has been updated.");
              } catch (err: any) {
                Alert.alert("Unable to update authority", err?.response?.data?.message ?? "Try again.");
              } finally { setProcessing(false); }
            })();
          },
        },
      ]);
  };

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Stack.Screen options={{ headerShown: true, title: "Staff Authorizations" }} />
    <Text style={styles.heading}>Staff directory</Text>
    <Text>Review staff responsibilities, assign missing authorizations, or remove existing authorizations.</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {loading ? <ActivityIndicator /> : null}
    {!loading && !staff.length && !error ? <Text>No staff records found.</Text> : null}
    {staff.map(member => {
      const open = expanded === member.id;
      const choices = mode === "assign" ? member.available_authorizations : member.assigned_authorizations;
      return <View key={member.id} style={styles.card}>
        <Text style={styles.title}>{member.name || `Staff #${member.id}`}</Text>
        <Text selectable>Oramex ID: {member.number}</Text>
        <Text>Role: {member.role}</Text>
        <Text style={styles.section}>Effective permissions</Text>
        {member.permissions?.length ? member.permissions.map(code => <Text key={code} style={styles.permission}>
          • {labels[code] ?? code}
        </Text>) : <Text>No active authorizations</Text>}
        {member.can_delegate ? <>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} disabled={processing} onPress={() => {
              setExpanded(open && mode === "assign" ? null : member.id); setMode("assign");
            }}><Text style={styles.buttonText}>Assign ({member.available_authorizations?.length ?? 0})</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} disabled={processing} onPress={() => {
              setExpanded(open && mode === "remove" ? null : member.id); setMode("remove");
            }}><Text style={styles.buttonText}>Remove</Text></TouchableOpacity>
          </View>
          {open && mode ? <View style={styles.options}>
            <Text style={styles.section}>{mode === "assign" ? "Not yet assigned" : "Currently assigned"}</Text>
            {!choices?.length ? <Text>No authorizations available for this action.</Text> : choices.map(auth =>
              <TouchableOpacity key={auth.code} disabled={processing} style={styles.option}
                onPress={() => change(member, auth, mode)}>
                <Text style={styles.section}>{auth.label}</Text>
                <Text style={styles.muted}>{auth.code}</Text>
              </TouchableOpacity>)}
          </View> : null}
        </> : <Text style={styles.muted}>This account cannot receive staff-level authorization changes.</Text>}
      </View>;
    })}
    {hasNext ? <TouchableOpacity style={styles.button} disabled={loading || processing}
      onPress={() => void load(page + 1)}><Text style={styles.buttonText}>Load more staff</Text></TouchableOpacity> : null}
  </ScrollView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, gap: 12, maxWidth: 800, width: "100%", alignSelf: "center", paddingBottom: 45 },
  heading: { fontSize: 22, fontWeight: "700" }, title: { fontSize: 17, fontWeight: "700" },
  section: { fontWeight: "700" }, muted: { color: "#64748b", fontSize: 12 },
  card: { padding: 14, backgroundColor: "#fff", borderRadius: 10, gap: 7 },
  permission: { color: "#334155", fontSize: 13 },
  actions: { flexDirection: "row", gap: 8, marginTop: 6 },
  button: { flex: 1, padding: 12, backgroundColor: "#dbeafe", borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#1d4ed8", fontWeight: "700" },
  options: { padding: 10, backgroundColor: "#eff6ff", gap: 8, borderRadius: 8 },
  option: { padding: 10, borderRadius: 8, backgroundColor: "white" },
  error: { color: "#b91c1c" },
});
