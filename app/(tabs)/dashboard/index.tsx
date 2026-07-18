import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Protected from "components/Protected";
import ScreenWrapper from "components/ScreenWrapper";
import API from "@/src/services/api";
import { useAuth } from "@/context/AuthContext";

type DashboardSummary = {
  wallet: {
    available_balance: number;
    escrow_balance: number;
    reward_points: number;
  };
  counts: {
    my_properties: number;
    interested_properties: number;
    appointments: number;
    unread_notifications: number;
    unread_messages: number;
    flagged_properties: number;
    flagged_users: number;
    complaints: number;
    users: number;
    staff: number;
    property_delete_requests: number;
    account_delete_requests: number;
  };
  has_listed_property: boolean;
  management_group_id?: number | string | null;
};

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const role =
    user?.staff?.role?.name ||
    user?.role?.name ||
    user?.registration_status?.name ||
    "Customer";

  const isStaff = role === "Staff";
  const isAdmin = role === "Admin";

  const goTo = (route: string) => router.push(route as any);

  const loadDashboard = async () => {
    try {
      const res = await API.getDashboardSummary();
      setSummary(res.dashboard || res.data || res);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const money = (value: any) => {
    return `₦${Number(value || 0).toLocaleString()}`;
  };

  const quickActions = useMemo(() => {
    const actions = [
      ["Fund Account", "Add money to wallet", "wallet-plus", "/(tabs)/dashboard/wallet/fund-wallet"],
      ["Upload Property", "List rent, sale or land", "home-plus", "/(tabs)/properties/create"],
    ];

    if (summary?.has_listed_property) {
      actions.push([
        "Create/Edit Slot",
        "Manage inspection availability",
        "calendar-edit",
        "/(tabs)/appointment/lister/create",
      ]);
    }

    return actions;
  }, [summary]);

  const activitySections = [
    [
      "My Properties",
      `${summary?.counts?.my_properties || 0} listed properties`,
      "office-building-marker",
      "/(tabs)/properties/view",
    ],
    [
      "Interested Properties",
      `${summary?.counts?.interested_properties || 0} interested properties`,
      "heart-home",
      "/(tabs)/properties/interested",
    ],
    [
      "Appointments",
      `${summary?.counts?.appointments || 0} appointment records`,
      "calendar-clock",
      "/(tabs)/appointment/my-appointments",
    ],
    [
      "Messages",
      `${summary?.counts?.unread_messages || 0} unread messages`,
      "message-text-lock",
      "/(tabs)/chat",
    ],
    [
      "Notifications",
      `${summary?.counts?.unread_notifications || 0} unread notifications`,
      "bell-ring",
      "/(tabs)/dashboard/notifications",
    ],
    [
      "Wallet & Escrow",
      "Manage wallet, escrow and rewards",
      "wallet",
      "/(tabs)/dashboard/wallet",
    ],
    [
      "Games",
      "Play and earn reward points",
      "gamepad-variant",
      "/(tabs)/games",
    ],
    [
      "Profile",
      "Manage account and verification",
      "account-circle",
      "/(tabs)/profile",
    ],
  ];

  const staffSections = [
    [
      "All Users",
      `${summary?.counts?.users || 0} registered users`,
      "account-group",
      "/staff/users",
    ],
    [
      "Management Chat",
      "Open management group chat",
      "message-text-lock",
      summary?.management_group_id
        ? `/staff/chat/${summary.management_group_id}`
        : "/staff/chat/management",
    ],
    [
      "Search Users",
      "Search by ID, phone, name or email",
      "account-search",
      "/staff/users/search",
    ],
    [
      "Flagged Properties",
      `${summary?.counts?.flagged_properties || 0} flagged properties`,
      "home-alert",
      "/staff/flagged-properties",
    ],
    [
      "Flagged Users",
      `${summary?.counts?.flagged_users || 0} flagged users`,
      "account-alert",
      "/staff/flagged-users",
    ],
    [
      "Complaints",
      `${summary?.counts?.complaints || 0} complaints`,
      "alert-circle",
      "/staff/complaints",
    ],
  ];

  const adminSections = [
    [
      "All Staff",
      `${summary?.counts?.staff || 0} staff members`,
      "account-tie",
      "/admin/staff",
    ],
    [
      "Property Delete Requests",
      `${summary?.counts?.property_delete_requests || 0} pending requests`,
      "home-remove",
      "/admin/property-delete-requests",
    ],
    [
      "Account Delete Requests",
      `${summary?.counts?.account_delete_requests || 0} pending requests`,
      "account-remove",
      "/admin/account-delete-requests",
    ],
  ];

  const Card = ({
    title,
    subtitle,
    icon,
    route,
  }: {
    title: string;
    subtitle: string;
    icon: string;
    route: string;
  }) => (
    <TouchableOpacity style={styles.listCard} onPress={() => goTo(route)}>
      <View style={styles.listIcon}>
        <MaterialCommunityIcons name={icon as any} size={24} color="#2563eb" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.listSubtitle}>{subtitle}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Protected>
        <ScreenWrapper>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
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
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.title}>OHLAM Dashboard</Text>
              <Text style={styles.roleText}>{role}</Text>
            </View>

            <TouchableOpacity
              style={styles.bell}
              onPress={() => goTo("/(tabs)/dashboard/notifications")}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color="#0f172a"
              />
              {(summary?.counts?.unread_notifications || 0) > 0 && (
                <View style={styles.dot} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.warning}>
            <MaterialCommunityIcons name="shield-lock" size={22} color="#92400e" />
            <Text style={styles.warningText}>
              Sharing private contact details violates OHLAM&apos;s ethical conduct.
              Use in-app messaging for safety.
            </Text>
          </View>

          <View style={styles.balanceRow}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceValue}>
                {money(summary?.wallet?.available_balance)}
              </Text>
              <Text style={styles.balanceHint}>Available funds</Text>
            </View>

            <View style={styles.balanceDark}>
              <Text style={styles.balanceLabelDark}>Escrow Deposit</Text>
              <Text style={styles.balanceValueDark}>
                {money(summary?.wallet?.escrow_balance)}
              </Text>
              <Text style={styles.balanceHintDark}>Protected funds</Text>
            </View>
          </View>

          <View style={styles.pointsCard}>
            <MaterialCommunityIcons name="star-circle" size={26} color="#ca8a04" />
            <View>
              <Text style={styles.pointsLabel}>Reward Points</Text>
              <Text style={styles.pointsValue}>
                {Number(summary?.wallet?.reward_points || 0).toLocaleString()} points
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickGrid}>
            {quickActions.map(([title, subtitle, icon, route]) => (
              <TouchableOpacity
                key={title}
                style={styles.quickCard}
                onPress={() => goTo(route)}
              >
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={26}
                    color="#2563eb"
                  />
                </View>
                <Text style={styles.quickTitle}>{title}</Text>
                <Text style={styles.quickSubtitle}>{subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>My Activity</Text>

          <View style={styles.list}>
            {activitySections.map(([title, subtitle, icon, route]) => (
              <Card
                key={title}
                title={title}
                subtitle={subtitle}
                icon={icon}
                route={route}
              />
            ))}
          </View>

          {(isStaff || isAdmin) && (
            <>
              <Text style={styles.sectionTitle}>Staff Section</Text>
              <View style={styles.list}>
                {staffSections.map(([title, subtitle, icon, route]) => (
                  <Card
                    key={title}
                    title={title}
                    subtitle={subtitle}
                    icon={icon}
                    route={route}
                  />
                ))}
              </View>
            </>
          )}

          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>Admin Section</Text>
              <View style={styles.list}>
                {adminSections.map(([title, subtitle, icon, route]) => (
                  <Card
                    key={title}
                    title={title}
                    subtitle={subtitle}
                    icon={icon}
                    route={route}
                  />
                ))}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </ScreenWrapper>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingHorizontal: 18 },
  center: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { marginTop: 10, color: "#64748b", fontWeight: "700" },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  title: { fontSize: 28, color: "#0f172a", fontWeight: "900", marginTop: 4 },
  roleText: { color: "#2563eb", fontWeight: "800", marginTop: 4 },
  bell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  dot: {
    position: "absolute",
    top: 12,
    right: 13,
    width: 9,
    height: 9,
    borderRadius: 10,
    backgroundColor: "#ef4444",
  },
  warning: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderWidth: 1,
    padding: 14,
    borderRadius: 18,
    marginBottom: 18,
  },
  warningText: {
    flex: 1,
    color: "#92400e",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  balanceRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  balanceCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    elevation: 3,
  },
  balanceDark: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 18,
    borderRadius: 22,
    elevation: 3,
  },
  balanceLabel: { color: "#64748b", fontSize: 13, fontWeight: "700" },
  balanceLabelDark: { color: "#cbd5e1", fontSize: 13, fontWeight: "700" },
  balanceValue: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
  },
  balanceValueDark: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
  },
  balanceHint: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  balanceHintDark: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  pointsCard: {
    backgroundColor: "#fefce8",
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 15,
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  pointsLabel: { color: "#854d0e", fontWeight: "800", fontSize: 13 },
  pointsValue: { color: "#713f12", fontWeight: "900", fontSize: 17, marginTop: 2 },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 14,
    marginTop: 6,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  quickCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  quickTitle: { fontSize: 15, fontWeight: "900", color: "#0f172a" },
  quickSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 5,
    lineHeight: 17,
  },
  list: { gap: 12, marginBottom: 24 },
  listCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  listIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listTitle: { fontSize: 15, fontWeight: "900", color: "#0f172a" },
  listSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 5,
    lineHeight: 17,
  },
});