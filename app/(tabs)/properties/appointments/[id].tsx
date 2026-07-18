import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenWrapper from "components/ScreenWrapper";
import Protected from "components/Protected";
import API from "@/src/services/api";

type Customer = {
  id: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
};

type Appointment = {
  id: number;
  property_id: number;
  customer_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  note?: string;
  customer?: Customer;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  accepted: "#10b981",
  rejected: "#ef4444",
  cancelled: "#94a3b8",
};

export default function PropertyAppointments() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await API.get("/lister/appointments");
      const all: Appointment[] = res.data?.data || res.data || [];
      setAppointments(all.filter((a) => String(a.property_id) === String(id)));
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [id]);

  const handleAction = async (appointmentId: number, action: "accept" | "reject") => {
    setActionLoading(appointmentId);
    try {
      await API.post(`/appointments/${appointmentId}/${action}`, {});
      await loadAppointments();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || `Failed to ${action} appointment`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-NG", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    if (!time) return "-";
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
  };

  return (
    <Protected>
      <ScreenWrapper>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.subtitle}>Property #{id}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : appointments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No appointments for this property yet.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {appointments.map((item) => {
              const customerName = item.customer
                ? `${item.customer.firstname ?? ""} ${item.customer.lastname ?? ""}`.trim() || item.customer.email
                : `Customer #${item.customer_id}`;

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.customerName}>{customerName}</Text>
                    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? "#94a3b8" }]}>
                      <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.detail}>📅 {formatDate(item.appointment_date)}</Text>
                  <Text style={styles.detail}>
                    🕐 {formatTime(item.start_time)} – {formatTime(item.end_time)}
                  </Text>

                  {item.note ? <Text style={styles.note}>💬 {item.note}</Text> : null}

                  {item.status === "pending" && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.acceptBtn]}
                        disabled={actionLoading === item.id}
                        onPress={() => handleAction(item.id, "accept")}
                      >
                        {actionLoading === item.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.actionText}>Accept</Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        disabled={actionLoading === item.id}
                        onPress={() => handleAction(item.id, "reject")}
                      >
                        <Text style={styles.actionText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </ScreenWrapper>
    </Protected>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  backBtn: { marginBottom: 8 },
  backText: { color: "#2563eb", fontSize: 14, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "900", color: "#0f172a" },
  subtitle: { color: "#64748b", marginTop: 2, fontSize: 13 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  customerName: { fontSize: 15, fontWeight: "800", color: "#1e293b", flex: 1 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  detail: { fontSize: 13, color: "#475569", marginBottom: 4 },
  note: { fontSize: 13, color: "#64748b", marginTop: 6, fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptBtn: { backgroundColor: "#10b981" },
  rejectBtn: { backgroundColor: "#ef4444" },
  actionText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { color: "#94a3b8", fontSize: 15, textAlign: "center" },
});