import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import API from "@/src/services/api";

type Application = { id: number; name: string; vacancy: string; status: string };
type Contract = { id: number; title: string; version: number; status: string; prepared_by: number };
type Template = { id: number; name: string; engagement_type: string; version: number; body: string; active: boolean };
type Access = { permissions: string[] };

const message = (e: any) => e?.response?.data?.message ?? Object.values(e?.response?.data?.errors ?? {}).flat().join("\n") ?? "Request failed";

export default function RecruitmentContracts() {
  const [access, setAccess] = useState<Access | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [terms, setTerms] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const can = (permission: string) => !!access?.permissions?.includes(permission);
  const refresh = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const [a, b, c] = await Promise.all([
        API.get("/management/access"),
        API.get("/management/recruitment/applications?status=accepted"),
        API.get("/management/recruitment/contract-templates"),
      ]);
      setAccess(a.data);
      setApplications(Array.isArray(b.data?.data) ? b.data.data : b.data?.data?.data ?? []);
      setTemplates(c.data?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.status === 403 ? "You are not authorized to manage contracts." : message(e));
    } finally { setBusy(false); }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const open = async (application: Application) => {
    setSelected(application); setContracts([]); setTitle(""); setTerms(""); setTemplateId(null);
    setBusy(true);
    try {
      const { data } = await API.get(`/management/recruitment/applications/${application.id}/contracts`);
      setContracts(data?.data ?? []);
    } catch (e: any) { Alert.alert("Unable to load contracts", message(e)); }
    finally { setBusy(false); }
  };

  const action = async (url: string, label: string) => {
    setBusy(true);
    try {
      await API.post(url, {});
      Alert.alert("Saved", label);
      if (selected) await open(selected);
    } catch (e: any) { Alert.alert("Action rejected", message(e)); }
    finally { setBusy(false); }
  };

  const create = async () => {
    if (!selected || title.trim().length < 5 || terms.trim().length < 100) {
      Alert.alert("Incomplete contract", "Provide a title and contract terms of at least 100 characters."); return;
    }
    setBusy(true);
    try {
      await API.post(`/management/recruitment/applications/${selected.id}/contracts`, {
        title: title.trim(), terms, ...(templateId ? { template_id: templateId } : {}),
      });
      Alert.alert("Draft created", "Contract needs a different authorized approver before issuance.");
      await open(selected);
    } catch (e: any) { Alert.alert("Draft not created", message(e)); }
    finally { setBusy(false); }
  };

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Stack.Screen options={{ title: "Recruitment contracts", headerShown: true }} />
    <Text style={styles.heading}>Personnel contracts</Text>
    <Text style={styles.note}>Draft preparation, independent approval and issuance. An acknowledgement is not an electronic signature.</Text>
    {busy ? <ActivityIndicator /> : null}
    {!!error && <Text style={styles.error}>{error}</Text>}
    {can("recruitment.contracts.prepare") && <>
      <Text style={styles.subheading}>Accepted applicants</Text>
      {applications.length === 0 && <Text>No accepted applications available.</Text>}
      {applications.map(a => <TouchableOpacity key={a.id} style={styles.card} onPress={() => void open(a)}>
        <Text style={styles.bold}>{a.name}</Text><Text>{a.vacancy}</Text><Text>Application #{a.id}</Text>
      </TouchableOpacity>)}
    </>}
    {selected && can("recruitment.contracts.prepare") && <>
      <Text style={styles.subheading}>Contracts for {selected.name}</Text>
      {contracts.map(c => <View key={c.id} style={styles.card}>
        <Text style={styles.bold}>{c.title} · v{c.version}</Text>
        <Text>Status: {c.status.replace(/_/g, " ")}</Text>
        {c.status === "draft" && can("recruitment.contracts.approve") &&
          <TouchableOpacity style={styles.button} disabled={busy} onPress={() => void action(`/management/recruitment/contracts/${c.id}/approve`, "Contract approved.")}><Text style={styles.buttonText}>Approve (different preparer required)</Text></TouchableOpacity>}
        {c.status === "approved" && can("recruitment.contracts.issue") &&
          <TouchableOpacity style={styles.button} disabled={busy} onPress={() => Alert.alert("Issue contract?", "An immutable PDF will be generated and made available to the applicant.", [{ text: "Cancel" }, { text: "Issue", onPress: () => void action(`/management/recruitment/contracts/${c.id}/issue`, "Contract issued.") }])}><Text style={styles.buttonText}>Issue to applicant</Text></TouchableOpacity>}
      </View>)}
      <Text style={styles.subheading}>Create contract draft</Text>
      <Text style={styles.note}>Select an approved, engagement-matched template. Its text cannot be changed without a new approved template version.</Text>
      {templates.filter(t => t.active).map(t => <TouchableOpacity key={t.id} style={styles.card} onPress={() => { setTemplateId(t.id); setTitle(t.name); setTerms(t.body); }}>
        <Text style={styles.bold}>{templateId === t.id ? "✓ " : ""}{t.name} v{t.version}</Text><Text>{t.engagement_type}</Text>
      </TouchableOpacity>)}
      <TextInput style={styles.input} accessibilityLabel="Contract title" placeholder="Contract title" value={title} onChangeText={setTitle}/>
      <TextInput style={[styles.input, styles.terms]} accessibilityLabel="Contract terms" placeholder="Contract terms" multiline textAlignVertical="top" value={terms} onChangeText={value => { setTerms(value); if (templateId) setTemplateId(null); }}/>
      <TouchableOpacity style={styles.button} disabled={busy} onPress={() => void create()}><Text style={styles.buttonText}>Save draft for approval</Text></TouchableOpacity>
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
 page: { flex: 1, backgroundColor: "#f8fafc" },
 content: { padding: 16, paddingBottom: 48, gap: 12 },
 heading: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
 subheading: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginTop: 12 },
 note: { color: "#475569", fontSize: 13 },
 error: { color: "#b91c1c" },
 card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, gap: 6, borderWidth: 1, borderColor: "#e2e8f0" },
 bold: { fontWeight: "700", color: "#0f172a" },
 input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, backgroundColor: "#fff", padding: 12 },
 terms: { minHeight: 180 },
 button: { borderRadius: 8, backgroundColor: "#1d4ed8", padding: 13, alignItems: "center" },
 buttonText: { color: "#fff", fontWeight: "700" },
});