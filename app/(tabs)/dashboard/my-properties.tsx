import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Protected from "components/Protected";
import { walletSummary } from "@/src/data/dashboard";

const Dashboard = () => {
  const router = useRouter();
  const isAdmin = true;

  const goTo = (route: string) => router.push(route as any);

  const quickActions = [
    ["Upload Property", "Rent listing", "home-plus", "/dashboard/upload-property"],
    ["House for Sale", "Sell building", "home-city", "/dashboard/upload-house"],
    ["Land for Sale", "Sell land", "map-marker-radius", "/dashboard/upload-land"],
    ["Appointment", "Schedule viewing", "calendar-plus", "/dashboard/create-appointment"],
  ];

  const sections = [
    ["My Properties", "See uploaded properties and status", "office-building-marker", "/dashboard/my-properties"],
    ["Interested Properties", "Rent/buy interests and appointments", "heart-home", "/dashboard/interested-properties"],
    ["Appointments", "View inspection time and status", "calendar-clock", "/dashboard/view-appointments"],
    ["Messages", "Safe in-app chat", "message-text-lock", "/dashboard/messages"],
    ["Notifications", "System and property updates", "bell-ring", "/dashboard/notifications"],
    ["Wallet & Escrow", "Coins and protected deposits", "wallet", "/dashboard/wallet"],
    ["Games", "Play and earn coins", "gamepad-variant", "/dashboard/games"],
    ["Profile", "Manage account and verification", "account-circle", "/dashboard/profile"],
  ];

  const admin = [
    ["Agents", "account-tie", "/dashboard/admin/agents"],
    ["Customers", "account-group", "/dashboard/admin/customers"],
    ["Games Admin", "controller-classic", "/dashboard/admin/games"],
  ];

  return (
    <Protected>
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.title}>OHLAM Dashboard</Text>
            </View>

            <TouchableOpacity
              style={styles.bell}
              onPress={() => goTo("/dashboard/notifications")}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="#0f172a" />
              <View style={styles.dot} />
            </TouchableOpacity>
          </View>

          <View style={styles.warning}>
            <MaterialCommunityIcons name="shield-lock" size={22} color="#92400e" />
            <Text style={styles.warningText}>
              Sharing private contact details violates this company&apos;s ethical conduct.
              Use in-app messaging for safety.
            </Text>
          </View>

          <View style={styles.balanceRow}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Wallet Coins</Text>
              <Text style={styles.balanceValue}>{walletSummary.walletBalance}</Text>
              <Text style={styles.balanceHint}>Available balance</Text>
            </View>

            <View style={styles.balanceDark}>
              <Text style={styles.balanceLabelDark}>Escrow Deposit</Text>
              <Text style={styles.balanceValueDark}>{walletSummary.escrowBalance}</Text>
              <Text style={styles.balanceHintDark}>Protected funds</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickGrid}>
            {quickActions.map(([title, subtitle, icon, route]) => (
              <TouchableOpacity key={title} style={styles.quickCard} onPress={() => goTo(route)}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name={icon as any} size={26} color="#2563eb" />
                </View>
                <Text style={styles.quickTitle}>{title}</Text>
                <Text style={styles.quickSubtitle}>{subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>My Activity</Text>

          <View style={styles.list}>
            {sections.map(([title, subtitle, icon, route]) => (
              <TouchableOpacity key={title} style={styles.listCard} onPress={() => goTo(route)}>
                <View style={styles.listIcon}>
                  <MaterialCommunityIcons name={icon as any} size={24} color="#2563eb" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{title}</Text>
                  <Text style={styles.listSubtitle}>{subtitle}</Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>

          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>Admin</Text>
              <View style={styles.adminGrid}>
                {admin.map(([title, icon, route]) => (
                  <TouchableOpacity key={title} style={styles.adminCard} onPress={() => goTo(route)}>
                    <MaterialCommunityIcons name={icon as any} size={26} color="#fff" />
                    <Text style={styles.adminText}>{title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Protected>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, paddingHorizontal: 18 },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  title: { fontSize: 28, color: "#0f172a", fontWeight: "900", marginTop: 4 },
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
  warningText: { flex: 1, color: "#92400e", fontSize: 13, lineHeight: 20, fontWeight: "600" },
  balanceRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  balanceCard: { flex: 1, backgroundColor: "#fff", padding: 18, borderRadius: 22, elevation: 3 },
  balanceDark: { flex: 1, backgroundColor: "#0f172a", padding: 18, borderRadius: 22, elevation: 3 },
  balanceLabel: { color: "#64748b", fontSize: 13, fontWeight: "700" },
  balanceLabelDark: { color: "#cbd5e1", fontSize: 13, fontWeight: "700" },
  balanceValue: { color: "#0f172a", fontSize: 22, fontWeight: "900", marginTop: 8 },
  balanceValueDark: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 8 },
  balanceHint: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  balanceHintDark: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 19, fontWeight: "900", color: "#0f172a", marginBottom: 14, marginTop: 6 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 22 },
  quickCard: { width: "48%", backgroundColor: "#fff", borderRadius: 22, padding: 16, marginBottom: 14, elevation: 3 },
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
  quickSubtitle: { fontSize: 12, color: "#64748b", marginTop: 5, lineHeight: 17 },
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
  listSubtitle: { fontSize: 12, color: "#64748b", marginTop: 5, lineHeight: 17 },
  adminGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  adminCard: {
    width: "31%",
    backgroundColor: "#2563eb",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  adminText: { color: "#fff", fontWeight: "800", fontSize: 12, marginTop: 8, textAlign: "center" },
});

export default Dashboard;