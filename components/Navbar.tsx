import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { useAuth } from "@/context/AuthContext";

type MenuItem = { 
  label: string; 
  path?: string; 
  children?: { label: string; path: string }[] 
};

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [menuVisible, setMenuVisible] = useState(false);
  const [showAppointmentSubmenu, setShowAppointmentSubmenu] = useState(false);

  const isWeb = Platform.OS === "web";
  const role = user?.registration_status?.name || "";

  // Protected routes that should redirect to login if not authenticated
  const protectedRoutes = [
    "/upload", "/appointment", "/profile", "/dashboard",
    "/(tabs)/profile", "/(tabs)/dashboard", "/appointment/create",
    "/appointment/view", "/appointment/appointments", "/appointment/requests",
  ];

  const goTo = (path: string) => {
    setMenuVisible(false);
    setShowAppointmentSubmenu(false);

    const basePath = path.split("?")[0];

    // Redirect to login if trying to access protected route while not authenticated
    if (protectedRoutes.includes(basePath) && !isAuthenticated) {
      router.push("/auth/LoginScreen");
      return;
    }

    router.push(path);
  };

  // ==================== MENU DEFINITIONS ====================

  const PUBLIC_MENU: MenuItem[] = [
    { label: "Home", path: "/(tabs)/home" },
    { label: "Properties", path: "/(tabs)/properties" },
    { label: "How It Works", path: "/(tabs)/how-it-works" },
    { label: "About Us", path: "/(tabs)/about" },
    { label: "Policies", path: "/(tabs)/policies" },
    { label: "FAQ", path: "/(tabs)/faq" },
    { label: "Vacancies", path: "/(tabs)/vacancies" },
    { label: "Contact Us", path: "/(tabs)/contact" },
  ];

  const AUTH_MENU: MenuItem[] = [
    { label: "Dashboard", path: "/(tabs)/dashboard" },
    { 
      label: "Appointment", 
      children: [
        { label: "My Appointments", path: "/appointment/my-appointments" },
        { label: "Create Slot", path: "/appointment/create" },
      ]
    },
    { label: "Games", path: "/(tabs)/games" },
    { label: "Chat", path: "/(tabs)/chat/index" },
    { label: "Wallet", path: "/dashboard/wallet" },
    { label: "Profile", path: "/profile" },
  ];

  const AGENT_MENU: MenuItem[] = [ /* your agent menu */ ];
  const STAFF_MENU: MenuItem[] = [ /* your staff menu */ ];
  const ADMIN_MENU: MenuItem[] = [ /* your admin menu */ ];

  // Build active menu based on auth + role
  let activeMenu: MenuItem[] = [...PUBLIC_MENU];

  if (isAuthenticated) {
    if (role === "Agent") {
      activeMenu = [...PUBLIC_MENU, ...AGENT_MENU];
    } else if (role === "Staff") {
      activeMenu = [...PUBLIC_MENU, ...STAFF_MENU];
    } else if (role === "Admin") {
      activeMenu = [...PUBLIC_MENU, ...ADMIN_MENU];
    } else {
      activeMenu = [...PUBLIC_MENU, ...AUTH_MENU];
    }
  }

  // ==================== NOTIFICATIONS & REFERRAL ====================

  const shareReferral = async () => {
    if (!user?.referral_code) return;
    try {
      const link = `https://play.google.com/store/apps/details?id=com.oramexapp&referrer=referral_code%3D${user.referral_code}`;
      await Clipboard.setStringAsync(link);
      await Sharing.shareAsync(link);
    } catch {
      Alert.alert("Error", "Unable to share referral link");
    }
  };

  // ==================== RENDER ====================

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.title}>Oramex House & Land Agency</Text>

        {!isWeb && (
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={32} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>

      {/* Web Menu */}
      {isWeb ? (
        <WebMenu 
          activeMenu={activeMenu} 
          isAuthenticated={isAuthenticated} 
          goTo={goTo} 
          logout={logout}
          shareReferral={shareReferral}
        />
      ) : (
        <MobileMenu 
          activeMenu={activeMenu} 
          isAuthenticated={isAuthenticated} 
          menuVisible={menuVisible}
          setMenuVisible={setMenuVisible}
          goTo={goTo}
          logout={logout}
          shareReferral={shareReferral}
        />
      )}
    </View>
  );
}

/* ==================== Web & Mobile Menu Components ==================== */

const WebMenu = ({ activeMenu, isAuthenticated, goTo, logout, shareReferral }: any) => (
  <View style={styles.menu}>
    {activeMenu.map((item: MenuItem) => (
      <View key={item.label} style={{ position: "relative" }}>
        <TouchableOpacity onPress={() => goTo(item.path || "#")}>
          <Text style={styles.menuItem}>{item.label}</Text>
        </TouchableOpacity>
      </View>
    ))}

    {isAuthenticated ? (
      <>
        <TouchableOpacity onPress={shareReferral}>
          <Text style={styles.menuItem}>Referral</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout}>
          <Text style={[styles.menuItem, { color: "red" }]}>Logout</Text>
        </TouchableOpacity>
      </>
    ) : (
      <>
        <TouchableOpacity onPress={() => goTo("/auth/LoginScreen")}>
          <Text style={styles.menuItem}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goTo("/auth/RegisterScreen")}>
          <Text style={styles.menuItem}>Register</Text>
        </TouchableOpacity>
      </>
    )}
  </View>
);

const MobileMenu = ({ activeMenu, isAuthenticated, menuVisible, setMenuVisible, goTo, logout, shareReferral }: any) => (
  <Modal visible={menuVisible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.mobileMenuContainer}>
        <View style={styles.mobileMenuHeader}>
          <Text style={styles.mobileMenuTitle}>Menu</Text>
          <TouchableOpacity onPress={() => setMenuVisible(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.mobileMenuContent}>
          {activeMenu.map((item: MenuItem) => (
            <TouchableOpacity key={item.label} onPress={() => goTo(item.path || "#")}>
              <Text style={styles.mobileItem}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {isAuthenticated ? (
            <>
              <TouchableOpacity onPress={shareReferral}>
                <Text style={styles.mobileItem}>Share Referral</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={logout}>
                <Text style={[styles.mobileItem, { color: "red" }]}>Logout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => goTo("/auth/LoginScreen")}>
                <Text style={styles.mobileItem}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => goTo("/auth/RegisterScreen")}>
                <Text style={styles.mobileItem}>Register</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", elevation: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  logo: { width: 45, height: 45, resizeMode: "contain" },
  title: { flex: 1, fontSize: 18, fontWeight: "bold", textAlign: "center", color: "green" },
  menu: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", paddingBottom: 10 },
  menuItem: { color: "#2563eb", marginHorizontal: 12, fontSize: 16, fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  mobileMenuContainer: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%" },
  mobileMenuHeader: { flexDirection: "row", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderColor: "#ddd" },
  mobileMenuTitle: { fontSize: 18, fontWeight: "bold", color: "#2563eb" },
  closeButton: { fontSize: 22, color: "red" },
  mobileMenuContent: { padding: 20 },
  mobileItem: { fontSize: 18, color: "#2563eb", marginVertical: 12 },
});