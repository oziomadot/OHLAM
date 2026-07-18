import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ScreenWrapper from "components/ScreenWrapper";
import Navbar from "components/Navbar";

const steps = [
  {
    icon: "account-check",
    title: "Create & Verify Your Account",
    body: "Sign up and complete identity verification. Depending on your role, this may include email, phone, government ID, face verification, and profile completion.",
  },
  {
    icon: "home-search",
    title: "Explore Available Properties",
    body: "Browse houses for rent, houses for sale, land, commercial properties, and shared accommodation. Each listing includes photos, pricing, location, status, and owner details.",
  },
  {
    icon: "thumb-up",
    title: "Express Interest",
    body: "When you find a property you like, express interest directly on OHLAM. This helps track genuine demand, protect you from scams, and enable appointment scheduling.",
  },
  {
    icon: "calendar-check",
    title: "Book an Inspection",
    body: "Request an inspection appointment. Listers can create available time slots, and customers can book the one that works best. Every appointment is traceable and transparent.",
  },
  {
    icon: "chat-processing",
    title: "Secure Communication",
    body: "Use OHLAM SecureChat to communicate only with people you have a legitimate relationship with, such as property interest or an approved appointment.",
  },
  {
    icon: "wallet",
    title: "Wallet & Escrow Protection",
    body: "Fund your wallet through approved channels. For certain transactions, funds are held in escrow until agreed conditions are met, reducing disputes and protecting both parties.",
  },
  {
    icon: "handshake",
    title: "Complete the Transaction",
    body: "After inspection and agreement, proceed with rental or sale agreements. Escrow funds are released where applicable, and records are kept for accountability.",
  },
  {
    icon: "gift",
    title: "Earn Rewards",
    body: "Earn OHLAM Reward Points through referrals, participation, promotions, education, games, and competitions. Redeem them for eligible services in the OHLAM ecosystem.",
  },
  {
    icon: "shield-check",
    title: "Help Keep OHLAM Safe",
    body: "Report suspicious listings, fraudulent activity, unethical behavior, and provide feedback. Your reports help us protect the community and maintain a trusted marketplace.",
  },
];

const protections = [
  "Identity verification",
  "Face verification",
  "Device verification",
  "Appointment tracking",
  "Escrow protection",
  "SecureChat controls",
  "Community reporting",
  "Listing review processes",
];

export default function HowItWorks() {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <Navbar />

      <View style={styles.hero}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="information" size={18} color="#2563eb" />
          <Text style={styles.badgeText}>How It Works</Text>
        </View>

        <Text style={styles.heroTitle}>How OHLAM Works</Text>
        <Text style={styles.heroSubtitle}>
          A smarter, safer way to rent, buy, sell, and manage property.
        </Text>

        <Text style={styles.heroText}>
          OHLAM connects genuine property seekers with verified listers using
          verification, appointment tracking, escrow protection, and intelligent
          fraud detection.
        </Text>

        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.primaryBtnText}>Explore Properties</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push("/dashboard/upload-property")}
          >
            <Text style={styles.secondaryBtnText}>List Property</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.introCard}>
        <Text style={styles.introTitle}>Welcome to OHLAM</Text>
        <Text style={styles.introText}>
          OHLAM (Oramex House and Land Agency Management) is a smart real estate
          platform designed to make property transactions safer, more transparent,
          and more rewarding for everyone.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Step-by-Step Guide</Text>
        {steps.map((step, index) => (
          <View key={step.title} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons
                  name={step.icon as any}
                  size={22}
                  color="#2563eb"
                />
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
            </View>
            <Text style={styles.stepBody}>{step.body}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Anti-Fraud Commitment</Text>
        <Text style={styles.sectionSubtext}>
          OHLAM uses multiple layers of protection to create a safer real estate experience.
        </Text>
        <View style={styles.protectionGrid}>
          {protections.map((item) => (
            <View key={item} style={styles.protectionPill}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#16a34a" />
              <Text style={styles.protectionText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.missionCard}>
        <Text style={styles.missionTitle}>Our Mission</Text>
        <Text style={styles.missionText}>
          To simplify property transactions while building trust between property
          owners, agents, buyers, and tenants. By combining technology, transparency,
          and accountability, OHLAM aims to become one of the most trusted real
          estate platforms in Africa.
        </Text>
      </View>

      <View style={styles.finalCard}>
        <Text style={styles.finalTitle}>Safe Properties. Secure Transactions. Trusted Relationships.</Text>
        <TouchableOpacity
          style={styles.finalBtn}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.finalBtnText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#0f172a",
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    marginHorizontal: -24,
    marginTop: -40,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 18,
  },
  badgeText: {
    color: "#2563eb",
    fontWeight: "900",
    fontSize: 12,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroSubtitle: {
    color: "#bfdbfe",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 8,
    lineHeight: 25,
  },
  heroText: {
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 16,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  introCard: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e3a8a",
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#1e40af",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#ffffff",
    marginBottom: 16,
    padding: 18,
    borderRadius: 24,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 14,
  },
  sectionSubtext: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 23,
    marginBottom: 14,
    fontWeight: "600",
  },
  stepCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  stepBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "#64748b",
    fontWeight: "600",
    paddingLeft: 38,
  },
  protectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  protectionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },
  protectionText: {
    color: "#166534",
    fontWeight: "800",
    fontSize: 13,
  },
  missionCard: {
    backgroundColor: "#ffffff",
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    elevation: 2,
    borderLeftWidth: 6,
    borderLeftColor: "#2563eb",
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
  },
  missionText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#475569",
    fontWeight: "600",
  },
  finalCard: {
    marginBottom: 40,
    padding: 24,
    borderRadius: 26,
    backgroundColor: "#0f172a",
    alignItems: "center",
  },
  finalTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
    textAlign: "center",
  },
  finalBtn: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  finalBtnText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },
});
