import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "context/AuthContext";



export default function Navbar() {
  const router = useRouter();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const { isAuthenticated, loading, user } = useAuth(); // assuming user info is in context
  const role = user?.registration_status?.name;
  const roleName = user?.staff?.role?.name;

  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const isWeb = Platform.OS === "web";
  const { width } = Dimensions.get("window");

  type ValidRoute =
    | "/"
    | "/home"
    | "/games"
    | "/dashboard"
    | "/upload"
    | "/upload/property"
    | "/upload/property/create"   
    | "/auth/LoginScreen"
    | "/auth/RegisterScreen"
    

    console.log("role", role);
    console.log('role name', roleName);
   

  const baseItems: { label: string; path: ValidRoute }[] = [
    { label: "Home", path: "/" },
    { label: "Upload", path: "/upload" },
    { label: "Games", path: "/games" },
   
    
    
  ];


 const handleMenuClick = (path: ValidRoute) => {
  
    if (path === "/upload") {
      // 🔒 Step 1: check authentication
      console.log("it is upload");
      if (!isAuthenticated) {
        router.push("/auth/LoginScreen");
        return;
      }

      // 🔒 Step 2: check user type
      if (role == "Customer") {
        Alert.alert(
          "Access Denied",
          "You need to register or change your account type to agent or landlord to upload properties."
        );
        return;
      }
      console.log("showing submenu");

      // ✅ Step 3: show submenu
      setShowUploadMenu((prev) => !prev);
      return;
    }

    // Default navigation
    router.push(path);
  };

 
   const uploadSubmenu = [
    { label: "Upload Property", path: "/upload/property/create" },
    { label: "View My Properties", path: "/upload/property" },
  ];

  const navigateTo = (path: ValidRoute) => {
    const nativePath = path === "/" ? "/(tabs)/home" : `/(tabs)${path}`;
    const target = isWeb ? path : (nativePath as any);
    router.push(target);
    setMobileMenuVisible(false);
  };

  const navigateProfileOption = (route: ValidRoute) => {
    setProfileMenuVisible(false);
    router.push(route);
  };

  
  const authItems: { label: string; path: ValidRoute }[] = !isAuthenticated ? [
    { label: "Login", path: "/auth/LoginScreen" },
    { label: "Register", path: "/auth/RegisterScreen" },
  ]:[];

const menuItems = [...baseItems, ...authItems];

 const renderDesktopMenu = () => (
  <View style={styles.menu}>
    {menuItems.map((item) => (
      <View key={item.path} style={styles.menuItemContainer}>
        <TouchableOpacity onPress={() => handleMenuClick(item.path)}>
          <Text style={styles.menuItem}>{item.label}</Text>
        </TouchableOpacity>

        {/* 🔽 Show submenu directly below the Upload Apartment item */}
        {item.path === "/upload" && showUploadMenu && (
          <View style={{ marginTop: 4, padding: 4, backgroundColor: "#f5f5f5" }}>
            {uploadSubmenu.map((sub) => (
              <TouchableOpacity
                key={sub.path}
                onPress={() => {
                  setShowUploadMenu(false);
                  router.push(sub.path);
                }}
              >
                <Text style={{ color: "#007bff", paddingVertical: 4 }}>
                  → {sub.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    ))}
  </View>
);


  const renderMobileMenu = () => (
    <View style={styles.mobileMenuContainer}>
      <TouchableOpacity
        onPress={() => setMobileMenuVisible(true)}
        style={styles.menuButton}
      >
        <Ionicons name="menu" size={32} color="#3b82f6" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={mobileMenuVisible}
        onRequestClose={() => setMobileMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.mobileMenu}>
            <View style={styles.mobileMenuHeader}>
              <Text style={styles.mobileMenuTitle}>Menu</Text>
              <TouchableOpacity
                onPress={() => setMobileMenuVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.mobileMenuItems}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.path}
                  onPress={() => handleMenuClick(item.path)}
                  style={styles.mobileMenuItem}
                >
                  <Text style={styles.mobileMenuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              {/* 🔽 Submenu for upload (only visible if user is agent/landlord) */}
      {showUploadMenu &&
        uploadSubmenu.map((sub) => (
          <TouchableOpacity
            key={sub.path}
            onPress={() => {
              setShowUploadMenu(false);
              router.push(sub.path);
            }}
            style={{ marginLeft: 20 }}
          >
            <Text style={{ color: "#007bff", paddingVertical: 4 }}>→ {sub.label}</Text>
          </TouchableOpacity>
        ))}

              {isAuthenticated && (
                <View style={{ marginTop: 20 }}>
                  <TouchableOpacity
                    onPress={() => navigateProfileOption("/profile")}
                    style={styles.mobileMenuItem}
                  >
                    <Text style={styles.mobileMenuItemText}>👤 View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>            
                    <Text style={styles.mobileMenuItemText}>🔗 Referral Link</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <View style={{ width: "100%" }}>
      <View style={styles.branding}>
        <View>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.appName}>
          {isWeb && width > 768 ? (
            <View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  marginTop: 5,
                  textAlign: "center",
                  color: "green",
                }}
              >
                Oramex House and Land Agency Management
              </Text>
              {renderDesktopMenu()}
            </View>
          ) : (
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: "80%" }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginTop: 5,
                    textAlign: "left",
                    color: "green",
                  }}
                >
                  Oramex House and Land Agency Management
                </Text>
              </View>
              <View style={{ width: "20%" }}>{renderMobileMenu()}</View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#1E40AF", // blue
  },
  navItem: {
    marginHorizontal: 8,
    marginVertical: 5,
  },
  navText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  branding: { 
    alignItems: "center", 
    marginTop: 10,
    paddingHorizontal: 16
  },
  logo: { 
    width: 70, 
    height: 70, 
    resizeMode: "contain" 
  },
  appName: { 
    alignItems: 'center'
  },
  menu: {
    flexDirection: "row",
    flexWrap: 'wrap',
    justifyContent: "center",
    marginVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingBottom: 5,
    paddingHorizontal: 16
  },
  menuItemContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderRadius: 8,
  },
  menuItem: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#3b82f6" 
  },
  mobileMenuContainer: {
    paddingHorizontal: 16,
    alignItems: 'flex-end'
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  mobileMenu: {
    backgroundColor: 'white',
    width: '80%',
    maxWidth: 300,
    height: '100%',
    padding: 16,
  },
  mobileMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingBottom: 12,
    marginBottom: 12
  },
  mobileMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  closeButton: {
    padding: 4
  },
  mobileMenuItems: {
    flex: 1
  },
  mobileMenuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: 8
  },
  mobileMenuItemText: {
    fontSize: 16,
    color: '#334155'
  },
  profileContainer: { marginLeft: 20, position: "relative" },
  profileButton: { alignItems: "center" },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  profileLabel: { fontSize: 12, color: "#333", marginTop: 4 },
  profileDropdown: {
    position: "absolute",
    top: 60,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    paddingVertical: 5,
    minWidth: 160,
  },
  profileDropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
});
