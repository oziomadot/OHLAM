import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "context/AuthContext";
import Protected from "components/Protected";
import { API_BASE_URL } from "@/config";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" || width > 768;

  const BASE_URL = API_BASE_URL.replace("/api", "");
  const role = user?.registration_status?.name;
  const roleName = user?.staff?.role?.name;

  /** Navigation helper */
  const goTo = (path: string) => {
    setMenuVisible(false);
    router.push(path);
  };

  /** Profile Dropdown Menu */
  const ProfileMenu = () => (
    <View style={styles.profileContainer}>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => setMenuVisible(!menuVisible)}
      >
        <Image
          source={
            user?.profile_picture
              ? { uri: `${BASE_URL}/storage/${user.profile_picture}` }
              : require("../assets/default-avatar.png")
          }
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{user?.firstname}</Text>
      </TouchableOpacity>

      {menuVisible && (
        <View
          style={[
            styles.dropdown,
            isWeb && { position: "absolute", right: 0, top: 50, zIndex: 99 },
          ]}
        >
          <TouchableOpacity
            onPress={() => goTo("/profile")}
            style={styles.dropdownItem}
          >
            <Text>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => goTo("/components/ReferralLink")}
            style={styles.dropdownItem}
          >
            <Text>Referral Link</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={logout} style={styles.dropdownItem}>
            <View style={styles.logoutBox}>
              <Text style={styles.logoutText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  /** Buttons per role */
  const Buttons = () => {
    const renderButton = (label: string, path?: string) => (
      <TouchableOpacity
        key={label}
        style={styles.button}
        onPress={() => path && router.push(path)}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    );

    if (roleName === "Admin") {
      return (
        <>
          {["Agents", "Staff", "House for Rent",  "Appointments"].map((label) =>
            renderButton(label)
          )}
          {renderButton("Generate Games", "/generateQuestion")}
          {renderButton("Refunds")}
        </>
      );
    }

    switch (role) {
      case "Customer":
        return renderButton("View Appointments");
      case "Agent":
        return (
          <>
            {["House for Rent", "House for Sale", "Land for Sale", "Appointments"].map((label) =>
              renderButton(label)
            )}
          </>
        );
      default:
        return (
          <>
            {[
              "Agents",             
              "Appointments",
              "Job Applications",
              "Email",
            ].map((label) => renderButton(label))}
          </>
        );
    }
  };

  return (
    <Protected>
      <View
        style={
          styles.container}
      >
        <Text style={styles.title}>Dashboard</Text>

        <View
          style={[
            styles.menuWrapper,
            isWeb
              ? { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }
              : {},
          ]}
        >
         
          <Buttons />
          
         <ProfileMenu />
        </View>

         
      </View>
    </Protected>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginVertical: 15,
    textAlign: "center",
  },
  menuWrapper: {
    marginTop: 10,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#57AAEF",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
    margin: 8,
    width: 200,
    flexDirection: "row",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  profileContainer: {
    position: "relative",
    alignSelf: "flex-end",
    marginTop: 20,
  },
  profileButton: {
    
    alignItems: "center",
    padding: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 10,
  },
  dropdownItem: {
    paddingVertical: 8,
  },
  logoutBox: {
    padding: 6,
    backgroundColor: "#FFE5E5",
    borderRadius: 6,
    marginTop: 4,
  },
  logoutText: {
    color: "red",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Dashboard;
