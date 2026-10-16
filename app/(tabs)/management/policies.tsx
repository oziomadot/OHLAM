import React, { useCallback, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { API } from "@/src/services/api";

export default function ManagementPolicies() {
  const [allowed, setAllowed] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [version, setVersion] = useState("1");
  const [effective, setEffective] = useState("");
  const [content, setContent] = useState("");
  const [active, setActive] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const list = async (number = 1) => {
    const { data } = await API.get(`/management/policies?page=${number}`);
    setPolicies(previous => number === 1 ? data.data.data : [...previous, ...data.data.data]);
    setPage(number); setMore(Boolean(data.data.next_page_url));
  };
  useFocusEffect(useCallback(() => {
    let mounted = true;
    setAllowed(false);
    API.get("/management/access").then(async ({ data }) => {
      if (!mounted) return;
      if (!(data.permissions ?? []).includes("policies.manage")) { setError("Only administrators can manage policies."); return; }
      setAllowed(true); setError(""); await list();
    }).catch(() => { if (mounted) setError("Unable to check policy permissions."); });
    return () => { mounted = false; };
  }, []));
  const save = async () => {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await API.post("/management/policies", { title: title.trim(), slug: slug.trim(), version: Number(version), content: content.trim(), effective_date: effective.trim() || null, active });
      setNotice(active ? "Policy saved and published." : "Policy saved as inactive.");
      setTitle(""); setSlug(""); setContent(""); setVersion("1"); setEffective(""); setActive(false); await list();
    } catch (e: any) {
      const errors = e?.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join("\n") : e?.response?.data?.message ?? "Unable to save policy.");
    } finally { setBusy(false); }
  };
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ headerShown: true, title: "Manage policies" }} />
      <Text style={styles.heading}>Add a policy</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.success}>{notice}</Text> : null}
      {allowed ? <>
        <Text>Title</Text><TextInput accessibilityLabel="Policy title" style={styles.input} value={title} onChangeText={setTitle} maxLength={255} />
        <Text>Unique slug (example: property-listing-policy)</Text><TextInput accessibilityLabel="Policy slug" style={styles.input} value={slug} onChangeText={setSlug} autoCapitalize="none" autoCorrect={false} maxLength={255} />
        <Text>Version</Text><TextInput accessibilityLabel="Policy version" style={styles.input} value={version} onChangeText={setVersion} keyboardType="number-pad" />
        <Text>Effective date (YYYY-MM-DD, optional)</Text><TextInput accessibilityLabel="Policy effective date" style={styles.input} value={effective} onChangeText={setEffective} placeholder="2026-10-17" />
        <Text>Policy text</Text><TextInput accessibilityLabel="Policy content" style={[styles.input, styles.body]} multiline value={content} onChangeText={setContent} maxLength={200000} />
        <View style={styles.row}><Text>Publish immediately</Text><Switch accessibilityLabel="Publish policy immediately" value={active} onValueChange={setActive} /></View>
        <Text>Published policies are visible immediately. The effective date is recorded; it does not schedule publication.</Text>
        <TouchableOpacity disabled={busy || !title.trim() || !slug.trim() || content.trim().length < 20} style={[styles.button, busy && { opacity: 0.5 }]} onPress={() => void save()}><Text style={styles.white}>{active ? "Save and publish policy" : "Save inactive policy"}</Text></TouchableOpacity>
        {busy ? <ActivityIndicator /> : null}
        <Text style={styles.heading}>Existing policies</Text>
        {policies.map(policy => <View style={styles.card} key={policy.id}><Text>{policy.title}</Text><Text selectable>{policy.slug} — v{policy.version} — {policy.active ? "Published" : "Inactive"}</Text></View>)}
        {more ? <TouchableOpacity disabled={busy} style={styles.button} onPress={() => void list(page + 1).catch(() => setError("Unable to load policies."))}><Text style={styles.white}>Load more policies</Text></TouchableOpacity> : null}
      </> : null}
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  content: { padding: 14, gap: 10, maxWidth: 900, width: "100%", alignSelf: "center", paddingBottom: 40 }, heading: { fontSize: 22, fontWeight: "700", marginVertical: 10 },
  input: { padding: 12, borderWidth: 1, borderColor: "#94a3b8", borderRadius: 8 }, body: { minHeight: 220, textAlignVertical: "top" }, row: { flexDirection: "row", alignItems: "center", gap: 14 },
  button: { padding: 14, backgroundColor: "#2563eb", borderRadius: 8, alignItems: "center" }, white: { color: "white", fontWeight: "700" }, error: { color: "#b91c1c" }, success: { color: "#166534" }, card: { padding: 12, backgroundColor: "#f1f5f9", borderRadius: 8 },
});
