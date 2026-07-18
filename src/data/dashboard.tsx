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

type RoutePath = Parameters<ReturnType<typeof useRouter>["push"]>[0];

const Dashboard = () => {
  const router = useRouter();

  const isAdmin = true;

  const walletBalance = "₦25,000";
  const escrowBalance = "₦500,000";

  const quickActions = [
    {
      title: "Upload Property",
      subtitle: "Rent listing",
      icon: "home-plus",
      route: "/dashboard/upload-property",
    },
    {
      title: "House for Sale",
      subtitle: "Sell building",
      icon: "home-city",
      route: "/dashboard/upload-house",
    },
    {
      title: "Land for Sale",
      subtitle: "Sell land",
      icon: "map-marker-radius",
      route: "/dashboard/upload-land",
    },
    {
      title: "Create Appointment",
      subtitle: "Schedule viewing",
      icon: "calendar-plus",
      route: "/dashboard/create-appointment",
    },
  ];

  const userSections = [
    {
      title: "My Uploaded Properties",
      subtitle: "View, edit, check verification status and appointments.",
      icon: "office-building-marker",
      route: "/dashboard/my-properties",
    },
    {
      title: "Interested Properties",
      subtitle: "Properties you want to rent or buy.",
      icon: "home-heart",
      route: "/dashboard/interested-properties",
    },
    {
      title: "Appointments",
      subtitle: "View appointment time, status and property details.",
      icon: "calendar-clock",
      route: "/dashboard/view-appointments",
    },
    {
      title: "Messages",
      subtitle: "Chat safely with listers and interested customers.",
      icon: "message-text-lock",
      route: "/dashboard/messages",
      badge: "3",
    },
    {
      title: "Notifications",
      subtitle: "Property updates, appointment alerts and system messages.",
      icon: "bell-ring",
      route: "/dashboard/notifications",
      badge: "5",
    },
    {
      title: "Wallet & Escrow",
      subtitle: "View wallet coins, deposits and escrow protection.",
      icon: "wallet",
      route: "/dashboard/wallet",
    },
    {
      title: "Games",
      subtitle: "Play games and earn reward coins.",
      icon: "gamepad-variant",
      route: "/dashboard/games",
    },
    {
      title: "Profile",
      subtitle: "Manage your personal information and verification.",
      icon: "account-circle",
      route: "/dashboard/profile",
    },
  ];

  const adminSections = [
    {
      title: "Agents",
      icon: "account-tie",
      route: "/dashboard/admin/agents",
    },
    {
      title: "Customers",
      icon: "account-group",
      route: "/dashboard/admin/customers",
    },
    {
      title: "Games Admin",
      icon: "controller-classic",
      route: "/dashboard/admin/games",
    },
  ];

  const goTo = (route: string) => {
    router.push(route as RoutePath);
  };

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
              style={styles.notificationButton}
              onPress={() => goTo("/dashboard/notifications")}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color="#0f172a" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.warningBox}>
            <MaterialCommunityIcons name="shield-lock" size={22} color="#92400e" />
            <Text style={styles.warningText}>
              Sharing private contact details violates OHLAM ethical conduct. Use in-app
              messaging for safety and record keeping.
            </Text>
          </View>

          <View style={styles.balanceRow}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Wallet Coins</Text>
              <Text style={styles.balanceValue}>{walletBalance}</Text>
              <Text style={styles.balanceHint}>Available balance</Text>
            </View>

            <View style={styles.balanceCardDark}>
              <Text style={styles.balanceLabelDark}>Escrow Deposit</Text>
              <Text style={styles.balanceValueDark}>{escrowBalance}</Text>
              <Text style={styles.balanceHintDark}>Protected funds</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickGrid}>
            {quickActions.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.quickCard}
                onPress={() => goTo(item.route)}
              >
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={26}
                    color="#2563eb"
                  />
                </View>
                <Text style={styles.quickTitle}>{item.title}</Text>
                <Text style={styles.quickSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>My Activity</Text>

          <View style={styles.list}>
            {userSections.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.listCard}
                onPress={() => goTo(item.route)}
              >
                <View style={styles.listIcon}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={24}
                    color="#2563eb"
                  />
                </View>

                <View style={styles.listContent}>
                  <View style={styles.listTitleRow}>
                    <Text style={styles.listTitle}>{item.title}</Text>

                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.listSubtitle}>{item.subtitle}</Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            ))}
          </View>

          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>Admin</Text>

              <View style={styles.adminGrid}>
                {adminSections.map((item) => (
                  <TouchableOpacity
                    key={item.title}
                    style={styles.adminCard}
                    onPress={() => goTo(item.route)}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={26}
                      color="#ffffff"
                    />
                    <Text style={styles.adminText}>{item.title}</Text>
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
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    color: "#0f172a",
    fontWeight: "900",
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  notificationDot: {
    position: "absolute",
    top: 12,
    right: 13,
    width: 9,
    height: 9,
    borderRadius: 10,
    backgroundColor: "#ef4444",
  },
  warningBox: {
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
  balanceRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 22,
    elevation: 3,
  },
  balanceCardDark: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 18,
    borderRadius: 22,
    elevation: 3,
  },
  balanceLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
  balanceLabelDark: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
  },
  balanceValue: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
  },
  balanceValueDark: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
  },
  balanceHint: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
  balanceHintDark: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
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
    backgroundColor: "#ffffff",
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
  quickTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },
  quickSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 5,
    lineHeight: 17,
  },
  list: {
    gap: 12,
    marginBottom: 24,
  },
  listCard: {
    backgroundColor: "#ffffff",
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
  listContent: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },
  listSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 5,
    lineHeight: 17,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 11,
  },
  adminGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  adminCard: {
    width: "31%",
    backgroundColor: "#2563eb",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  adminText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});

export default Dashboard;

// Exported for use in other dashboard screens
export const walletSummary = {
  walletBalance: "₦25,000",
  escrowBalance: "₦500,000",
};

export const notifications = [
  {
    id: 1,
    title: "Property Verified",
    message: "Your uploaded property at Lekki Phase 1 has been verified.",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "New Appointment Request",
    message: "A customer wants to view your 3 Bedroom Apartment on June 15.",
    time: "5 hours ago",
  },
  {
    id: 3,
    title: "Escrow Payment Received",
    message: "₦500,000 has been deposited into your escrow account.",
    time: "Yesterday",
  },
  {
    id: 4,
    title: "Message Received",
    message: "You have a new message from a potential buyer.",
    time: "Yesterday",
  },
  {
    id: 5,
    title: "Appointment Confirmed",
    message: "Your viewing appointment for 2 Bedroom Flat has been confirmed.",
    time: "2 days ago",
  },
];

export const interestedProperties = [
  {
    id: 1,
    title: "3 Bedroom Apartment",
    location: "Lekki Phase 1, Lagos",
    price: "₦2,500,000/year",
    appointment: "2024-06-15, 2:00 PM",
    status: "Pending",
  },
  {
    id: 2,
    title: "2 Bedroom Flat",
    location: "Ikeja, Lagos",
    price: "₦1,800,000/year",
    appointment: "2024-06-18, 10:00 AM",
    status: "Confirmed",
  },
  {
    id: 3,
    title: "4 Bedroom Duplex",
    location: "Victoria Island, Lagos",
    price: "₦5,000,000/year",
    appointment: "2024-06-20, 3:30 PM",
    status: "Pending",
  },
];

export const messages = [
  {
    id: 1,
    name: "John Smith",
    message: "Is the property still available for viewing this weekend?",
    time: "10:30 AM",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    message: "Can you send me more photos of the apartment?",
    time: "Yesterday",
  },
  {
    id: 3,
    name: "Michael Brown",
    message: "I'm interested in scheduling a viewing for tomorrow.",
    time: "Yesterday",
  },
];