import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "components/ScreenWrapper";
import Navbar from "components/Navbar";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: FaqItem[];
};

const FAQ_DATA: FaqCategory[] = [
  {
    category: "Getting Started",
    icon: "rocket-outline",
    items: [
      {
        question: "What is OHLAM?",
        answer:
          "OHLAM is a smart real estate trust platform that helps you find, rent, buy, and manage properties in Nigeria. It uses technology to verify listings, protect appointments, and make transactions safer.",
      },
      {
        question: "Do I need an account to browse properties?",
        answer:
          "No. You can browse all listed properties without an account. However, you need to register and verify your identity to book appointments, make offers, or list properties.",
      },
      {
        question: "How do I create an account?",
        answer:
          "Tap Register on the login screen, fill in your details, verify your email address, and complete the KYC (identity verification) steps. The whole process takes a few minutes.",
      },
    ],
  },
  {
    category: "Properties & Listings",
    icon: "home-outline",
    items: [
      {
        question: "How are properties verified?",
        answer:
          "Every property listing goes through a review process by our staff. Agents must complete identity verification before they can list. Properties are checked for duplicates and suspicious activity before going live.",
      },
      {
        question: "Can I list my property on OHLAM?",
        answer:
          "Yes. Register as an Agent, complete KYC verification, and then use the Property Management section in your dashboard to upload your property with photos and full details.",
      },
      {
        question: "What types of properties are listed?",
        answer:
          "OHLAM supports residential rentals, houses for sale, and land for sale. More property categories will be added over time.",
      },
      {
        question: "How do I report a suspicious listing?",
        answer:
          "Tap the report option on any property detail page. Our team will investigate and take action within 24 hours.",
      },
    ],
  },
  {
    category: "Appointments",
    icon: "calendar-outline",
    items: [
      {
        question: "How do I book a property viewing?",
        answer:
          "Open the property page, tap Book Appointment, and select from the agent's available slots. You will receive a confirmation notification once the agent accepts.",
      },
      {
        question: "What happens if an agent cancels my appointment?",
        answer:
          "You will be notified immediately. Any commitment deposit linked to that appointment is protected and can be refunded or transferred to a new booking.",
      },
      {
        question: "Is there a fee to book an appointment?",
        answer:
          "Browsing and booking are free. Some high-demand properties may require a small refundable commitment deposit to confirm your appointment slot.",
      },
    ],
  },
  {
    category: "Wallet & Escrow",
    icon: "wallet-outline",
    items: [
      {
        question: "What is the OHLAM wallet?",
        answer:
          "Your OHLAM wallet is a secure in-app balance you can fund and use for commitment deposits, escrow payments, and other transactions on the platform.",
      },
      {
        question: "How does escrow protection work?",
        answer:
          "When you make a commitment deposit for a property, the funds are held in escrow — not released to the agent — until the transaction conditions are met. This protects both parties.",
      },
      {
        question: "How do I fund my wallet?",
        answer:
          "Go to Wallet in your dashboard, tap Fund Wallet, and follow the instructions to transfer via your assigned virtual account number.",
      },
      {
        question: "How long do withdrawals take?",
        answer:
          "Withdrawals are typically processed within 1–3 business days depending on your bank.",
      },
    ],
  },
  {
    category: "Security & KYC",
    icon: "shield-checkmark-outline",
    items: [
      {
        question: "Why does OHLAM require identity verification?",
        answer:
          "KYC (Know Your Customer) verification helps us confirm that every user is a real person. This reduces fraud, fake listings, and scam attempts on the platform.",
      },
      {
        question: "What documents do I need for KYC?",
        answer:
          "You will need a valid government-issued ID (NIN slip, voter's card, driver's licence, or international passport) and a short face liveness check.",
      },
      {
        question: "Is my personal data safe?",
        answer:
          "Yes. All personal data is encrypted and stored securely. OHLAM never sells your data to third parties. See our Privacy Policy for full details.",
      },
    ],
  },
  {
    category: "Account & Support",
    icon: "person-circle-outline",
    items: [
      {
        question: "How do I reset my password?",
        answer:
          "Tap Forgot Password on the login screen, enter your registered email, and follow the link sent to your inbox to set a new password.",
      },
      {
        question: "How do I contact support?",
        answer:
          "Visit the Contact Us page or send a message through the in-app chat. Our support team is available Monday to Friday, 8am – 6pm WAT.",
      },
      {
        question: "Can I delete my account?",
        answer:
          "Yes. Go to Profile → Settings and tap Delete Account. Note that any active escrow holds or pending transactions must be resolved before deletion.",
      },
    ],
  },
];

export default function FAQ() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const toggle = (key: string) =>
    setOpenKey((prev) => (prev === key ? null : key));

  const query = search.trim().toLowerCase();

  const filtered: FaqCategory[] = query
    ? FAQ_DATA.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        ),
      })).filter((cat) => cat.items.length > 0)
    : FAQ_DATA;

  const totalResults = filtered.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <ScreenWrapper>
      <Navbar />

      <View style={styles.hero}>
        <View style={styles.badge}>
          <Ionicons name="help-circle-outline" size={16} color="#2563eb" />
          <Text style={styles.badgeText}>Help Center</Text>
        </View>
        <Text style={styles.heroTitle}>Frequently Asked{"\n"}Questions</Text>
        <Text style={styles.heroSubtitle}>
          Everything you need to know about OHLAM.
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {query.length > 0 && (
          <Text style={styles.resultsLabel}>
            {totalResults === 0
              ? "No results found"
              : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${search}"`}
          </Text>
        )}

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={52} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyText}>
              Try a different keyword or browse all categories below.
            </Text>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setSearch("")}
            >
              <Text style={styles.clearBtnText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((cat) => (
            <View key={cat.category} style={styles.categoryBlock}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIconBox}>
                  <Ionicons name={cat.icon} size={18} color="#2563eb" />
                </View>
                <Text style={styles.categoryTitle}>{cat.category}</Text>
              </View>

              <View style={styles.card}>
                {cat.items.map((item, idx) => {
                  const key = `${cat.category}-${idx}`;
                  const isOpen = openKey === key;
                  const isLast = idx === cat.items.length - 1;

                  return (
                    <View key={key}>
                      <TouchableOpacity
                        style={styles.row}
                        onPress={() => toggle(key)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.question,
                            isOpen && styles.questionActive,
                          ]}
                        >
                          {item.question}
                        </Text>
                        <View
                          style={[
                            styles.chevronBox,
                            isOpen && styles.chevronBoxActive,
                          ]}
                        >
                          <Ionicons
                            name={isOpen ? "chevron-up" : "chevron-down"}
                            size={16}
                            color={isOpen ? "#2563eb" : "#94a3b8"}
                          />
                        </View>
                      </TouchableOpacity>

                      {isOpen && (
                        <View style={styles.answerBox}>
                          <Text style={styles.answer}>{item.answer}</Text>
                        </View>
                      )}

                      {!isLast && <View style={styles.separator} />}
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <View style={styles.contactCard}>
          <Ionicons name="chatbubbles-outline" size={28} color="#2563eb" />
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactText}>
            Our support team is happy to help you.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#0f172a",
    padding: 24,
    paddingTop: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  badgeText: {
    color: "#2563eb",
    fontWeight: "900",
    fontSize: 12,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.3,
    lineHeight: 42,
  },
  heroSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  searchInput: {
    flex: 1,
    color: "#f1f5f9",
    fontSize: 14,
    fontWeight: "600",
  },
  body: {
    padding: 18,
    paddingBottom: 40,
  },
  resultsLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 14,
  },
  categoryBlock: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  categoryIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  question: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 21,
  },
  questionActive: {
    color: "#2563eb",
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  chevronBoxActive: {
    backgroundColor: "#eff6ff",
  },
  answerBox: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 2,
  },
  answer: {
    fontSize: 14,
    lineHeight: 23,
    color: "#475569",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  clearBtn: {
    marginTop: 8,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  clearBtnText: {
    color: "#2563eb",
    fontWeight: "800",
    fontSize: 14,
  },
  contactCard: {
    marginTop: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1e3a8a",
  },
  contactText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
    textAlign: "center",
  },
});