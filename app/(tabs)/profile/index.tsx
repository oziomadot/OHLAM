import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import QRCode from "react-native-qrcode-svg";

import Navbar from "components/Navbar";
import Protected from "components/Protected";
import API from "@/src/services/api";
import { getItem } from "../../utils/storage";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const router = useRouter();

  const BASE_URL = __DEV__
    ? "http://192.168.1.100:8000"
    : "https://api.oramexhouseandland.com";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const savedUser = await getItem("user");
      const parsedUser = savedUser ? JSON.parse(savedUser) : user;
      setProfileData(parsedUser);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const referralCode =
    profileData?.referral_code ||
    profileData?.oramex_id ||
    profileData?.oramexID ||
    "";

  const oramexId =
    profileData?.oramex_id ||
    profileData?.oramexID ||
    profileData?.ohlam_id ||
    "Not available";

  const referralLink = useMemo(() => {
    if (!referralCode) return "";

    return `https://oramexhouseandland.com/app/register?ref=${encodeURIComponent(
      referralCode
    )}`;
  }, [referralCode]);

  const copyReferralLink = async () => {
    if (!referralLink) return;

    await Clipboard.setStringAsync(referralLink);
    Alert.alert("Copied", "Referral link copied to clipboard.");
  };

  const shareReferralLink = async () => {
    if (!referralLink) return;

    try {
      await Sharing.shareAsync(referralLink);
    } catch {
      await Clipboard.setStringAsync(referralLink);
      Alert.alert("Copied", "Referral link copied to clipboard.");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will submit a request to delete your account. OHLAM may keep transaction records for security, fraud prevention, and legal compliance.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: async () => {
            try {
              await API.deleteAccount();
              Alert.alert(
                "Request Submitted",
                "Your account deletion request has been submitted."
              );
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  error?.message ||
                  "Failed to submit delete request."
              );
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/LoginScreen");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const profilePicture = profileData?.profile_picture
    ? { uri: `${BASE_URL}/storage/${profileData.profile_picture}` }
    : require("@/assets/default-avatar.png");

  return (
    <Protected>
      <View style={styles.container}>
        <Navbar />

        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image source={profilePicture} style={styles.avatar} />

              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={() => router.push("/(tabs)/profile/edit" as any)}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.name}>
              {profileData?.firstname || profileData?.name || ""}{" "}
              {profileData?.surname || profileData?.lastname || ""}
            </Text>

            <Text style={styles.role}>
              {profileData?.registration_status?.name || "User"}
            </Text>

            <View style={styles.idBadge}>
              <Ionicons name="id-card-outline" size={18} color="#2563eb" />
              <Text style={styles.idBadgeText}>OHLAM ID: {oramexId}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referral</Text>

            <InfoRow label="Referral Code" value={referralCode || "Not available"} />
            <InfoRow label="Referral Link" value={referralLink || "Not available"} />

            {referralLink ? (
              <View style={styles.qrBox}>
                <QRCode value={referralLink} size={170} />
                <Text style={styles.qrText}>
                  Scan to download OHLAM and register with my referral code.
                </Text>
              </View>
            ) : null}

            <View style={styles.referralButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={copyReferralLink}>
                <Ionicons name="copy-outline" size={18} color="#2563eb" />
                <Text style={styles.secondaryButtonText}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={shareReferralLink}>
                <Ionicons name="share-social-outline" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <InfoRow label="Email" value={profileData?.email} />
            <InfoRow label="Phone" value={profileData?.phonenumber || profileData?.phoneNumber} />
            <InfoRow label="WhatsApp" value={profileData?.whatsapp} />
            <InfoRow
              label="Date of Birth"
              value={
                profileData?.dob
                  ? new Date(profileData.dob).toLocaleDateString()
                  : null
              }
            />
          </View>

          {(profileData?.registration_status?.id === 3 ||
            profileData?.registration_status?.id === "3") && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Information</Text>

              <InfoRow label="Work Phone" value={profileData?.workPhoneNumber} />
              <InfoRow label="Instagram" value={profileData?.instagram} />
              <InfoRow label="LinkedIn" value={profileData?.linkedln} />
              <InfoRow label="Guiding Principle" value={profileData?.philosophy} />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Actions</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/profile/edit" as any)}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Protected>
  );
}

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined | null;
}) => {
  if (!value) return null;

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1, zIndex: Platform.OS === "web" ? -1 : 0 },
  header: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0f172a",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarContainer: { position: "relative", marginBottom: 15 },
  avatar: {
    width: 125,
    height: 125,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#fff",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#2563eb",
    width: 42,
    height: 42,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: { fontSize: 24, fontWeight: "900", color: "#fff", marginTop: 4 },
  role: { fontSize: 15, color: "#cbd5e1", marginTop: 5 },
  idBadge: {
    marginTop: 14,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  idBadgeText: { color: "#2563eb", fontWeight: "900" },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 22,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 15,
    color: "#0f172a",
  },
  infoRow: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 10,
  },
  infoLabel: {
    color: "#64748b",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoValue: { color: "#0f172a", fontWeight: "700", fontSize: 15 },
  qrBox: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 18,
    borderRadius: 18,
    marginTop: 8,
  },
  qrText: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
    fontWeight: "600",
  },
  referralButtons: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  primaryButtonText: { color: "#fff", fontWeight: "900" },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#eff6ff",
    padding: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  secondaryButtonText: { color: "#2563eb", fontWeight: "900" },
  actionButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionButtonText: { color: "#fff", fontWeight: "900" },
});