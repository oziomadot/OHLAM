import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { API } from "@/src/services/api";

type Post = {
  id: number; property_id: number; platform: string; status: string; attempts: number;
  property_status: string | null; failure_reason: string | null;
  external_post_id: string | null; published_at: string | null;
};
type Access = { permissions: string[] };

export default function SocialPublishingStatus() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async (nextPage: number, status: string) => {
    setLoading(true);
    setError("");
    try {
      const access = await API.get<Access>("/management/access");
      if (!access.data?.permissions?.includes("social.posts.read")) {
        setAuthorized(false);
        setRows([]);
        return;
      }
      setAuthorized(true);
      const params = new URLSearchParams({ page: String(nextPage) });
      if (status !== "all") params.set("status", status);
      const response = await API.get(`/management/social-posts?${params.toString()}`);
      const result = response.data?.data;
      setRows(prev => nextPage === 1 ? (result?.data ?? []) : [...prev, ...(result?.data ?? [])]);
      setHasMore(Boolean(result?.next_page_url));
      setPage(nextPage);
    } catch (err: any) {
      setError(err?.response?.status === 403
        ? "Your account does not have social publication reporting permission."
        : "Unable to retrieve social publishing status.");
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(1, filter); }, [filter, load]));
  const filters = ["all", "pending", "processing", "published", "failed"];
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "Social publishing" }} />
      <Text style={styles.title}>Property social publishing</Text>
      <Text style={styles.note}>Read-only publication tracking for Facebook, Instagram and X. Check external accounts before retrying any post.</Text>
      <View style={styles.filters}>
        {filters.map(item => (
          <TouchableOpacity key={item} accessibilityRole="button" style={[styles.filter, filter === item && styles.active]} onPress={() => setFilter(item)}>
            <Text style={filter === item ? styles.activeText : styles.filterText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {!loading && !authorized ? <Text>Only authorized management personnel can view these records.</Text> : null}
      {rows.map(item => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.heading}>Property #{item.property_id} · {item.platform.toUpperCase()}</Text>
          <Text>Status: {item.status} · Attempts: {item.attempts}</Text>
          <Text>Property: {item.property_status ?? "unknown"}</Text>
          {item.external_post_id ? <Text>External post ID: {item.external_post_id}</Text> : null}
          {item.published_at ? <Text>Published: {item.published_at}</Text> : null}
          {item.failure_reason ? <Text style={styles.error}>Reason: {item.failure_reason}</Text> : null}
        </View>
      ))}
      {loading ? <ActivityIndicator /> : null}
      {authorized && !loading && rows.length === 0 ? <Text>No publication records match this filter.</Text> : null}
      {authorized && !loading && hasMore ? <TouchableOpacity style={styles.more} onPress={() => void load(page + 1, filter)}><Text style={styles.activeText}>Load more</Text></TouchableOpacity> : null}
      {authorized && !loading ? <TouchableOpacity style={styles.more} onPress={() => void load(1, filter)}><Text style={styles.activeText}>Refresh</Text></TouchableOpacity> : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 18, gap: 12, paddingBottom: 40 },
  title: { fontSize: 23, fontWeight: "800", color: "#0f172a" },
  note: { color: "#475569", lineHeight: 21 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  filter: { borderRadius: 18, borderWidth: 1, borderColor: "#cbd5e1", paddingVertical: 7, paddingHorizontal: 10 },
  active: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" },
  filterText: { color: "#334155", textTransform: "capitalize" },
  activeText: { color: "#ffffff", fontWeight: "700", textTransform: "capitalize" },
  card: { padding: 15, backgroundColor: "#fff", borderRadius: 13, borderWidth: 1, borderColor: "#e2e8f0", gap: 5 },
  heading: { fontWeight: "800", color: "#0f172a" },
  error: { color: "#b91c1c" },
  more: { backgroundColor: "#1d4ed8", alignItems: "center", padding: 12, borderRadius: 10 },
});
