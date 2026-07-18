import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Protected from "components/Protected";
import ScreenWrapper from "components/ScreenWrapper";
import API from "@/src/services/api";

type NotificationItem = {
  id: number | string;
  title: string;
  message: string;
  type?: string;
  read_at?: string | null;
  created_at: string;
  data?: any;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await API.getNotifications();
      setNotifications(res?.notifications || res?.data || []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGroupTitle = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const notificationDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const diffTime = today.getTime() - notificationDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return "This Week";
    if (diffDays <= 30) return "This Month";

    return "Older";
  };

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {};

    notifications.forEach((item) => {
      const group = getGroupTitle(item.created_at);

      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push(item);
    });

    return groups;
  }, [notifications]);

  const getIcon = (type?: string) => {
    switch (type) {
      case "property_delete_request":
        return "home-alert";
      case "property_deleted":
        return "home-remove";
      case "appointment":
        return "calendar-clock";
      case "wallet":
        return "wallet";
      case "chat":
        return "message-text";
      case "suspicious_property_delete_report":
        return "shield-alert";
      default:
        return "bell-ring";
    }
  };

  const markAsRead = async (id: number | string) => {
    try {
      await API.markNotificationAsRead(id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, read_at: new Date().toISOString() }
            : item
        )
      );
    } catch (error: any) {
      Alert.alert("Error", "Could not mark notification as read.");
    }
  };

  if (loading) {
    return (
      <Protected>
        <ScreenWrapper>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        </ScreenWrapper>
      </Protected>
    );
  }

  return (
    <Protected>
      <ScreenWrapper>
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.title}>Notifications</Text>

          {notifications.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="bell-off-outline"
                size={46}
                color="#94a3b8"
              />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyText}>
                Updates about appointments, properties, wallet, escrow and chat
                will appear here.
              </Text>
            </View>
          ) : (
            Object.entries(groupedNotifications).map(([group, items]) => (
              <View key={group}>
                <Text style={styles.groupTitle}>{group}</Text>

                {items.map((item) => {
                  const unread = !item.read_at;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.card, unread && styles.unreadCard]}
                      onPress={() => markAsRead(item.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.iconBox}>
                        <MaterialCommunityIcons
                          name={getIcon(item.type) as any}
                          size={24}
                          color="#2563eb"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>{item.title}</Text>
                          {unread && <View style={styles.unreadDot} />}
                        </View>

                        <Text style={styles.message}>{item.message}</Text>
                        <Text style={styles.time}>
                          {formatTime(item.created_at)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </ScreenWrapper>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 18,
  },
  center: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 18,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#475569",
    marginTop: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  unreadCard: {
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    marginLeft: 8,
  },
  message: {
    color: "#64748b",
    marginTop: 5,
    lineHeight: 20,
  },
  time: {
    color: "#94a3b8",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 30,
    alignItems: "center",
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 12,
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },
});