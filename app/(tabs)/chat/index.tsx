import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ScreenWrapper from "components/ScreenWrapper";
import Navbar from "components/Navbar";
import API from "@/src/services/api";
import Protected from "components/Protected";

type Message = { id: number; message: string; created_at: string };
type Participant = { id: number; user?: { id: number; name: string } };
type Conversation = {
  id: number;
  type: "private" | "group";
  title: string | null;
  participants: Participant[];
  messages: Message[];
  updated_at: string;
};

type Tab = "private" | "group";

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#db2777", "#0891b2"];
const colorFor = (id: number) => COLORS[id % COLORS.length];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function convTitle(conv: Conversation, currentUserId: number | null): string {
  if (conv.title) return conv.title;
  if (conv.type === "private") {
    const other = conv.participants.find((p) => p.user?.id !== currentUserId);
    return other?.user?.name ?? "Private Chat";
  }
  return "Group Chat";
}

function convInitials(title: string): string {
  return title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ChatIndex() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("private");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [convRes, meRes] = await Promise.all([
        API.get("/conversations"),
        API.get("/me").catch(() => ({ data: null })),
      ]);
      setConversations(convRes.data?.data ?? []);
      if (meRes.data?.id) setCurrentUserId(meRes.data.id);
    } catch {
      // silently ignore — FlatList will show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), 15000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = conversations
    .filter((c) => c.type === tab)
    .filter((c) => {
      if (!search.trim()) return true;
      const title = convTitle(c, currentUserId).toLowerCase();
      const last = (c.messages[0]?.message ?? "").toLowerCase();
      return title.includes(search.toLowerCase()) || last.includes(search.toLowerCase());
    });

  const renderItem = ({ item }: { item: Conversation }) => {
    const title = convTitle(item, currentUserId);
    const initials = convInitials(title);
    const lastMsg = item.messages[0];
    const time = lastMsg ? timeAgo(lastMsg.created_at) : timeAgo(item.updated_at);

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/(tabs)/chat/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={[styles.avatar, { backgroundColor: colorFor(item.id) }]}>
          {item.type === "group" ? (
            <Ionicons name="people" size={20} color="#fff" />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>

        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.rowTime}>{time}</Text>
          </View>
          <Text style={styles.rowPreview} numberOfLines={1}>
            {lastMsg?.message ?? "No messages yet"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <Navbar />
      <Protected>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
     

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={17} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["private", "group"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Ionicons
              name={t === "private" ? "person-outline" : "people-outline"}
              size={15}
              color={tab === t ? "#2563eb" : "#94a3b8"}
            />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "private" ? "Direct" : "Groups"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#2563eb"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={tab === "private" ? "chatbubble-outline" : "people-outline"}
                size={56}
                color="#cbd5e1"
              />
              <Text style={styles.emptyTitle}>
                {search ? "No results found" : tab === "private" ? "No Chats Yet" : "No Groups Yet"}
              </Text>
              <Text style={styles.emptyText}>
                {search
                  ? "Try a different search term."
                  : tab === "private"
                  ? "Your direct conversations will appear here."
                  : "Groups you join will appear here."}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
      </Protected>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#0f172a" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabActive: { backgroundColor: "#fff", elevation: 1 },
  tabText: { fontSize: 13, fontWeight: "700", color: "#94a3b8" },
  tabTextActive: { color: "#2563eb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingBottom: 30 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#94a3b8", textAlign: "center", lineHeight: 22 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: "#fff",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  rowTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", flex: 1, marginRight: 8 },
  rowTime: { fontSize: 12, fontWeight: "600", color: "#94a3b8" },
  rowPreview: { fontSize: 13, fontWeight: "500", color: "#64748b" },
  separator: { height: 1, backgroundColor: "#f1f5f9", marginLeft: 78 },
});
