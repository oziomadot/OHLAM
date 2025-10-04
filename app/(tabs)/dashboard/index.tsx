import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Protected from "components/Protected";

// Dashboard menu items
const menuItems = [
  { label: "Upload Property", route: "/dashboard/upload-property" },
  { label: "Upload House for Sale", route: "/dashboard/upload-house" },
  { label: "Upload Land for Sale", route: "/dashboard/upload-land" },
  { label: "Create Appointment", route: "/dashboard/create-appointment" },
  { label: "View Appointments", route: "/dashboard/view-appointments" },
  { label: "Profile", route: "/dashboard/profile" },
  { label: "Edit Profile", route: "/dashboard/edit-profile" },

  // Admin section
  { label: "Agents", route: "/dashboard/admin/agents", admin: true },
  { label: "Customers", route: "/dashboard/admin/customers", admin: true },
  { label: "Games", route: "/dashboard/admin/games", admin: true },
];

const Dashboard = () => {
  const router = useRouter();

  // ✅ Replace with real auth check (e.g., from context or redux)
  const isAdmin = true;

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    <Protected>
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Dashboard</Text>
      {/* "sdkVersion": "54.0.0", */}
      <View style={styles.menuGrid}>
        {menuItems
          .filter((item) => !item.admin || isAdmin)
          .map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={() => handleNavigation(item.route)}
            >
              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
      </View>
    </ScrollView>
    </Protected>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuCard: {
    backgroundColor: "#2563eb",
    padding: 20,
    borderRadius: 12,
    width: "47%", // two per row
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
});

export default Dashboard;
