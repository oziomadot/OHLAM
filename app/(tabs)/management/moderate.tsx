import React, { useCallback, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { API } from "@/src/services/api";

export default function ModerateRecord() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [record, setRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const valid = (kind === "agent" || kind === "property") && /^\d+$/.test(String(id));
  const load = useCallback(async () => {
    if (!valid) { setError("Invalid record reference."); return; }
    const access = await API.get("/management/access");
    const allowed: string[] = access.data.permissions ?? [];
    setPermissions(allowed);
    const result = await API.get(`/management/search?kind=${kind}&reference=${encodeURIComponent(id)}`);
    const payload = result.data.data;
    const rows = Array.isArray(payload) ? payload : payload?.data ?? [];
    setRecord(rows.find((row: any) => String(row.id) === String(id)) ?? null);
    if (allowed.includes("moderation.history")) {
      const events = await API.get(`/management/moderation-history?kind=${kind}&target_id=${id}`);
      setHistory(events.data.data?.data ?? []);
    }
  }, [kind, id, valid]);
  useFocusEffect(useCallback(() => {
    setRecord(null); setPermissions([]); setHistory([]);
    void load().catch(e => setError(e?.response?.data?.message ?? "Unable to load record."));
  }, [load]));
  const change = async (action: "suspend" | "restore") => {
    if (busy || reason.trim().length < 10) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await API.post(`/management/moderation/${kind}/${id}`, { action, reason: reason.trim() });
      setNotice(action === "suspend" ? "Suspension recorded." : "Suspension lifted.");
      setReason(""); await load();
    } catch (e: any) { setError(e?.response?.data?.message ?? "Unable to save this action."); }
    finally { setBusy(false); }
  };
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ headerShown: true, title: "Moderation review" }} />
      <Text style={styles.heading}>{kind === "agent" ? "Agent" : "Property"} #{id}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.success}>{notice}</Text> : null}
      {record ? <>
        {Object.entries(record).filter(([, value]) => value !== null).map(([key, value]) => <Text selectable key={key}>{key.replace(/_/g, " ")}: {String(value)}</Text>)}
        {!record.deleted_at ? <>
          <Text>Reason for the action (at least 10 characters)</Text>
          <TextInput accessibilityLabel="Moderation reason" style={styles.input} value={reason} onChangeText={setReason} multiline maxLength={2000} placeholder="Describe the issue and supporting evidence." />
          {!record.is_suspended && permissions.includes(kind === "agent" ? "agents.suspend" : "properties.suspend") ? <TouchableOpacity disabled={busy || reason.trim().length < 10} style={[styles.danger, (busy || reason.trim().length < 10) && styles.disabled]} onPress={() => void change("suspend")}><Text style={styles.white}>Suspend {kind} #{id}</Text></TouchableOpacity> : null}
          {record.is_suspended && permissions.includes("moderation.restore") ? <TouchableOpacity disabled={busy || reason.trim().length < 10} style={[styles.restore, (busy || reason.trim().length < 10) && styles.disabled]} onPress={() => void change("restore")}><Text style={styles.white}>Lift suspension</Text></TouchableOpacity> : null}
          {record.is_suspended && !permissions.includes("moderation.restore") ? <Text>An administrator must review and lift this suspension.</Text> : null}
        </> : <Text>This record is deleted. Suspension controls are disabled.</Text>}
      </> : !error ? <Text>No accessible record found.</Text> : null}
      {busy ? <ActivityIndicator /> : null}
      {permissions.includes("moderation.history") ? <>
        <Text style={styles.heading}>Action history</Text>
        {!history.length ? <Text>No recorded history. Actions before this feature was deployed may not identify who acted.</Text> : null}
        {history.map(event => <Text selectable key={event.id}>{event.created_at} — {event.action}{"\n"}By: {event.actor_name || "System / actor unavailable"} (user ID: {event.actor_user_id ?? "—"}){"\n"}{event.reason || "No reason recorded"}</Text>)}
      </> : null}
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  content: { padding: 14, gap: 12, maxWidth: 800, width: "100%", alignSelf: "center", paddingBottom: 40 }, heading: { fontSize: 20, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#94a3b8", borderRadius: 8, padding: 12, minHeight: 100, textAlignVertical: "top" },
  danger: { padding: 14, borderRadius: 8, backgroundColor: "#b91c1c", alignItems: "center" }, restore: { padding: 14, borderRadius: 8, backgroundColor: "#166534", alignItems: "center" },
  white: { color: "white", fontWeight: "700" }, error: { color: "#b91c1c" }, success: { color: "#166534" }, disabled: { opacity: 0.45 },
});
