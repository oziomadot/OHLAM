import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "components/ScreenWrapper";
import Navbar from "components/Navbar";
import API from "@/src/services/api";

type PolicySummary = {
  id: number;
  title: string;
  slug: string;
  version?: string;
  effective_date?: string;
};

type PolicyDetail = PolicySummary & {
  content: string;
};

export default function Policies() {
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [selected, setSelected] = useState<PolicyDetail | null>(null);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoadingList(true);

      const res = await API.getPolicies();

      const list = res?.data?.policies || res?.data || [];

      setPolicies(list);
      setSelected(null);
      setSelectedSlug("");
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || e?.message || "Failed to load policies"
      );
    } finally {
      setLoadingList(false);
    }
  };

  const loadPolicy = async (slug: string) => {
    if (!slug) {
      setSelected(null);
      setSelectedSlug("");
      setDropdownOpen(false);
      return;
    }

    setLoadingDetail(true);
    setDropdownOpen(false);
    setSelectedSlug(slug);

    try {
      const res = await API.getPolicy(slug);

      const policy = res?.data?.policy || res?.data;

      setSelected(policy);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || e?.message || "Failed to load policy"
      );
      setSelected(null);
      setSelectedSlug("");
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";

    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const selectedTitle =
    selected?.title ||
    policies.find((p) => p.slug === selectedSlug)?.title ||
    "Select a policy";

  return (
    <ScreenWrapper>
      <Navbar />

      <View style={styles.hero}>
        <View style={styles.badge}>
          <Ionicons name="document-text-outline" size={16} color="#2563eb" />
          <Text style={styles.badgeText}>Legal & Compliance</Text>
        </View>

        <Text style={styles.heroTitle}>Our Policies</Text>

        <Text style={styles.heroSubtitle}>
          Transparent rules that protect every user on OHLAM.
        </Text>
      </View>

      <View style={styles.selectorSection}>
        {loadingList ? (
          <View style={styles.selectorLoading}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.selectorLoadingText}>Loading policies...</Text>
          </View>
        ) : (
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setDropdownOpen((open) => !open)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dropdownTriggerText,
                  !selectedSlug && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {selectedTitle}
              </Text>

              <Ionicons
                name={dropdownOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color="#2563eb"
              />
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    !selectedSlug && styles.dropdownItemActive,
                  ]}
                  onPress={() => loadPolicy("")}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      !selectedSlug && styles.dropdownItemTextActive,
                    ]}
                  >
                    Select a policy
                  </Text>

                  {!selectedSlug && (
                    <Ionicons name="checkmark" size={16} color="#2563eb" />
                  )}
                </TouchableOpacity>

                {policies.map((policy) => (
                  <TouchableOpacity
                    key={policy.id}
                    style={[
                      styles.dropdownItem,
                      selectedSlug === policy.slug && styles.dropdownItemActive,
                    ]}
                    onPress={() => loadPolicy(policy.slug)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedSlug === policy.slug &&
                          styles.dropdownItemTextActive,
                      ]}
                    >
                      {policy.title}
                    </Text>

                    {selectedSlug === policy.slug && (
                      <Ionicons name="checkmark" size={16} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {loadingDetail ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading policy...</Text>
        </View>
      ) : selected ? (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.policyTitle}>{selected.title}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="layers-outline" size={15} color="#64748b" />
                <Text style={styles.metaLabel}>Version</Text>
                <Text style={styles.metaValue}>{selected.version || "—"}</Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={15} color="#64748b" />
                <Text style={styles.metaLabel}>Effective</Text>
                <Text style={styles.metaValue}>
                  {formatDate(selected.effective_date)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.contentText}>{selected.content}</Text>
          </View>
        </ScrollView>
      ) : !loadingList && policies.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No policies available yet.</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Ionicons name="reader-outline" size={52} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Select a policy</Text>
          <Text style={styles.emptyText}>
            Choose a policy title above to read the full content.
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#0f172a",
    padding: 24,
    paddingTop: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  badgeText: {
    color: "#2563eb",
    fontWeight: "900",
    fontSize: 12,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    lineHeight: 22,
  },
  selectorSection: {
    marginHorizontal: 18,
    marginTop: 20,
    marginBottom: 10,
    zIndex: 10,
  },
  selectorLoading: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectorLoadingText: {
    color: "#64748b",
    fontWeight: "700",
  },
  dropdownWrapper: {
    position: "relative",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginRight: 8,
  },
  placeholderText: {
    color: "#94a3b8",
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    borderRadius: 14,
    marginTop: 4,
    elevation: 8,
    zIndex: 20,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownItemActive: {
    backgroundColor: "#eff6ff",
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  dropdownItemTextActive: {
    color: "#2563eb",
    fontWeight: "800",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 10,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  emptyTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  body: {
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    elevation: 2,
  },
  policyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 18,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  metaItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  metaDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e2e8f0",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 18,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 26,
    color: "#334155",
    fontWeight: "500",
  },
});