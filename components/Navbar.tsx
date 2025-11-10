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
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as Audio from "expo-audio";
import { useAuth } from "context/AuthContext";
import API, { API_BASE_URL } from "@/config";
import { ROUTES } from "@/utils/routes";



export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [menuVisible, setMenuVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAppointmentSubmenu, setShowAppointmentSubmenu] = useState(false);
  const [showProfileSubmenu, setShowProfileSubmenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const isWeb = Platform.OS === "web";
  const BASE_URL = API_BASE_URL.replace("/api", "");
  const role = user?.registration_status?.name;

  // ✅ Fix route mapping for (tabs)
  const ROUTES: Record<string, string> = {
    "/": "/(tabs)/home",
    "/games": "/(tabs)/games",
    "/about": "/(tabs)/about",
    "/contact": "/(tabs)/contact",
    "/appointment": "/(tabs)/appointment",
    "/appointment/view": "/(tabs)/appointment/view",
    "/appointment/create": "/(tabs)/appointment/create",
    "/profile": "/(tabs)/profile",
    "/upload": "/(tabs)/upload",
    "/agents": "/(tabs)/agents",
    "/auth/LoginScreen": "/auth/LoginScreen",
    "/auth/RegisterScreen": "/auth/RegisterScreen",
  };

  const goTo = (path: string) => {
    setShowMenu(false);
    setShowAppointmentSubmenu(false);
    setShowProfileSubmenu(false);
    const route = ROUTES[path] || path;
    router.push(route);
  };

  // 🔔 Load notifications
  const loadNotifications = async () => {
    // if (!isAuthenticated) return;
    // try {
    //   const res = await API.get("/notification", {
    //     headers: { Authorization: `Bearer ${user?.token}` },
    //   });
    //   setNotifications(res.data.notifications || []);
    // } catch (err) {
    //   console.error("Failed to load notifications:", err);
    // }
  };

  // 🔊 Notification sound
  const playNotificationSound = async () => {
    // try {
    //   const { sound } = await Audio.Sound.createAsync(
    //     require("../assets/notification.mp3")
    //   );
    //   await sound.playAsync();
    //   Vibration.vibrate(300);
    // } catch (err) {
    //   console.error("Error playing sound:", err);
    // }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      playNotificationSound();
    }
  }, [isAuthenticated]);

  // 📤 Share referral link
  const shareReferral = async (code: string) => {
    try {
      const link = `https://play.google.com/store/apps/details?id=com.oramexapp&referrer=referral_code%3D${code}`;
      await Clipboard.setStringAsync(link);
      await Sharing.shareAsync(link);
    } catch {
      Alert.alert("Error", "Unable to share referral link");
    }
  };

  // 👇 Menus
  const generalMenu = [
    { label: "Home", path: "/" },
    { label: "Games", path: "/games" },
    { label: "About", path: "/about" },
    { label: "Contact Us", path: "/contact" },
  ];

  const authMenu = [
    { label: "Appointment", path: "/appointment" },
    { label: "Profile", path: "/profile" },
  ];

  const agentMenu = [
    { label: "Upload", path: "/upload" },
    { label: "Appointment", path: "/appointment" },
    { label: "Profile", path: "/profile" },
  ];

  const staffMenu = [{ label: "Agents", path: "/agents" }, ...agentMenu];

  let activeMenu = generalMenu;
  if (isAuthenticated) {
    if (role === "Staff") activeMenu = [...generalMenu, ...staffMenu];
    else if (role === "Agent") activeMenu = [...generalMenu, ...agentMenu];
    else activeMenu = [...generalMenu, ...authMenu];
  }

  // 🔔 Notification Icon
  const NotificationIcon = () => (
    <TouchableOpacity
      onPress={() => goTo("/notifications")}
      style={{ marginLeft: 16, position: "relative" }}
    >
      <Ionicons name="notifications-outline" size={28} color="#2563eb" />
      {notifications.some((n) => !n.read_at) && (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            backgroundColor: "red",
            borderRadius: 10,
            width: 10,
            height: 10,
          }}
        />
      )}
    </TouchableOpacity>
  );

  // 👤 Profile Submenu
  const ProfileSubmenu = () =>
    showProfileSubmenu && (
      <View style={styles.submenu}>
        <TouchableOpacity onPress={() => goTo("/profile")}>
          <Text style={styles.submenuItem}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => shareReferral(user?.referral_code)}>
          <Text style={[styles.submenuItem, { color: "#007bff" }]}>
            Referral Link
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout}>
          <Text style={[styles.submenuItem, { color: "red" }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    );

  // 📅 Appointment Submenu
  const AppointmentSubmenu = () =>
    showAppointmentSubmenu && (
      <View style={styles.submenu}>
        <TouchableOpacity onPress={() => goTo("/appointment/view")}>
          <Text style={styles.submenuItem}>View Appointments</Text>
        </TouchableOpacity>
        {role === "Agent" && (
          <TouchableOpacity onPress={() => goTo("/appointment/create")}>
            <Text style={styles.submenuItem}>Create Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    );

  // 🧭 Web Menu
  const WebMenu = () => (
    <View style={styles.menu}>
      {activeMenu.map((item) => (
        <View key={item.path} style={{ position: "relative" }}>
          <TouchableOpacity
            onPress={() => {
              if (item.label === "Profile")
                return setShowProfileSubmenu((p) => !p);
              if (item.label === "Appointment")
                return setShowAppointmentSubmenu((p) => !p);
              goTo(item.path);
            }}
          >
            <Text style={styles.menuItem}>{item.label}</Text>
          </TouchableOpacity>

          {item.label === "Profile" && <ProfileSubmenu />}
          {item.label === "Appointment" && <AppointmentSubmenu />}
        </View>
      ))}

      {isAuthenticated && <NotificationIcon />}

      {!isAuthenticated && (
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

  // 📱 Mobile Menu
  const MobileMenu = () => (
    <Modal visible={showMenu} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.mobileMenuContainer}>
          <View style={styles.mobileMenuHeader}>
            <Text style={styles.mobileMenuTitle}>Menu</Text>
            <TouchableOpacity onPress={() => setShowMenu(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.mobileMenuContent}>
            {activeMenu.map((item) => (
              <TouchableOpacity
                key={item.path}
                onPress={() => {
                  if (item.label === "Profile")
                    return setShowProfileSubmenu((p) => !p);
                  if (item.label === "Appointment")
                    return setShowAppointmentSubmenu((p) => !p);
                  goTo(item.path);
                }}
              >
                <Text style={styles.mobileItem}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            {showProfileSubmenu && <ProfileSubmenu />}
            {showAppointmentSubmenu && <AppointmentSubmenu />}

            {!isAuthenticated && (
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.title}>Oramex House & Land Agency</Text>

        {!isWeb && (
          <TouchableOpacity onPress={() => setShowMenu(true)}>
            <Ionicons name="menu" size={32} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>

      {isWeb ? <WebMenu /> : <MobileMenu />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", elevation: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: { width: 45, height: 45, resizeMode: "contain" },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "green",
  },
  menu: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 10,
    flexWrap: "wrap",
  },
  menuItem: {
    color: "#2563eb",
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  submenu: {
    backgroundColor: "#fff",
    position: "absolute",
    top: 28,
    right: 0,
    borderRadius: 8,
    padding: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 999,
  },
  submenuItem: { paddingVertical: 4, color: "#333", fontSize: 15 },
  submenuHeader: { fontWeight: "bold", marginTop: 10, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  mobileMenuContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  mobileMenuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  mobileMenuTitle: { fontSize: 18, fontWeight: "bold", color: "#2563eb" },
  closeButton: { fontSize: 22, color: "red" },
  mobileMenuContent: { padding: 20 },
  mobileItem: { fontSize: 18, color: "#2563eb", marginVertical: 10 },
});
