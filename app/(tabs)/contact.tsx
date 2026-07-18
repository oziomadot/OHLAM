import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ScreenWrapper from "components/ScreenWrapper";
import Navbar from "components/Navbar";
import API from "@/src/services/api";

const CONTACT = {
  email: "admin@oramexhouseandlandagencymanagement.com",
  phone: "+2347052578055",
  whatsapp: "+2347052578055",
};

const SOCIALS = [
  {
    label: "Facebook",
    handle: "Oramex House and Land Agency Management",
    url: "https://www.facebook.com/search/top?q=Oramex%20House%20and%20Land%20Agency%20Management",
    icon: "facebook" as const,
    color: "#1877f2",
    bg: "#e7f0fd",
  },
  {
    label: "Instagram",
    handle: "@ohlam_ng",
    url: "https://www.instagram.com/ohlam_ng",
    icon: "instagram" as const,
    color: "#e1306c",
    bg: "#fce4ec",
  },
  {
    label: "X (Twitter)",
    handle: "@ohlam_ng",
    url: "https://www.x.com/ohlam_ng",
    icon: "twitter" as const,
    color: "#000000",
    bg: "#f1f1f1",
  },
  {
    label: "TikTok",
    handle: "@ohlam_ng",
    url: "https://www.tiktok.com/@ohlam_ng",
    icon: "music-note" as const,
    color: "#010101",
    bg: "#f1f1f1",
  },
  {
    label: "WhatsApp",
    handle: "+2347052578055",
    url: `https://wa.me/2347052578055`,
    icon: "whatsapp" as const,
    color: "#25d366",
    bg: "#e6f9ee",
  },
];

type Form = { name: string; email: string; subject: string; message: string };
const EMPTY: Form = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [sending, setSending] = useState(false);

  const open = (url: string) =>
    Linking.canOpenURL(url).then((ok) => {
      if (ok) Linking.openURL(url);
      else Alert.alert("Error", "Cannot open this link on your device.");
    });

  const callPhone = () => open(`tel:${CONTACT.phone}`);
  const openEmail = (body = "") =>
    open(
      `mailto:${CONTACT.email}?subject=${encodeURIComponent(
        form.subject || "Enquiry"
      )}&body=${encodeURIComponent(body)}`
    );

 const handleSend = async () => {
  if (
    !form.name.trim() ||
    !form.email.trim() ||
    !form.subject.trim() ||
    !form.message.trim()
  ) {
    Alert.alert("Validation", "Name, email, subject, and message are required.");
    return;
  }

  setSending(true);

  try {
    const res = await API.sendContactMessage({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    });

    Alert.alert(
      "Message Sent",
      res?.message || "Your message has been sent to OHLAM management."
    );

    setForm(EMPTY);
  } catch (error: any) {
    Alert.alert(
      "Error",
      error?.response?.data?.message ||
        error?.message ||
        "Failed to send message. Please try again."
    );
  } finally {
    setSending(false);
  }
};

  return (
    <ScreenWrapper>
      <Navbar />

      <View style={styles.hero}>
        <View style={styles.badge}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#2563eb" />
          <Text style={styles.badgeText}>Get in Touch</Text>
        </View>
        <Text style={styles.heroTitle}>Contact Us</Text>
        <Text style={styles.heroSubtitle}>
          We'd love to hear from you. Reach out any time.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick Contact */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={callPhone}>
            <View style={[styles.quickIcon, { backgroundColor: "#eff6ff" }]}>
              <Ionicons name="call-outline" size={22} color="#2563eb" />
            </View>
            <Text style={styles.quickLabel}>Call Us</Text>
            <Text style={styles.quickValue}>{CONTACT.phone}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} onPress={() => openEmail()}>
            <View style={[styles.quickIcon, { backgroundColor: "#fef9ec" }]}>
              <Ionicons name="mail-outline" size={22} color="#d97706" />
            </View>
            <Text style={styles.quickLabel}>Email Us</Text>
            <Text style={styles.quickValue} numberOfLines={2}>
              {CONTACT.email}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map placeholder */}
        <View style={styles.mapCard}>
          <MaterialCommunityIcons name="map-marker-radius" size={36} color="#2563eb" />
          <Text style={styles.mapTitle}>Our Office</Text>
          <Text style={styles.mapAddress}>
            Oramex House & Land Agency Management{"\n"}Nigeria
          </Text>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() =>
              open(
                "https://www.google.com/maps/search/Oramex+House+and+Land+Agency+Management"
              )
            }
          >
            <Ionicons name="navigate-outline" size={15} color="#2563eb" />
            <Text style={styles.mapBtnText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Send a Message</Text>

          <Text style={styles.fieldLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Doe"
            placeholderTextColor="#94a3b8"
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          />

          <Text style={styles.fieldLabel}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. john@email.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
          />

          <Text style={styles.fieldLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Property Enquiry"
            placeholderTextColor="#94a3b8"
            value={form.subject}
            onChangeText={(v) => setForm((f) => ({ ...f, subject: v }))}
          />

          <Text style={styles.fieldLabel}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Write your message here..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={form.message}
            onChangeText={(v) => setForm((f) => ({ ...f, message: v }))}
          />

          <TouchableOpacity
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color="#fff" />
                <Text style={styles.sendBtnText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Social Links */}
        <Text style={styles.sectionTitle}>Follow Us</Text>
        <View style={styles.socialGrid}>
          {SOCIALS.map((s) => (
            <TouchableOpacity
              key={s.label}
              style={[styles.socialCard, { borderColor: s.color + "33" }]}
              onPress={() => open(s.url)}
              activeOpacity={0.75}
            >
              <View style={[styles.socialIcon, { backgroundColor: s.bg }]}>
                <MaterialCommunityIcons name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={styles.socialLabel}>{s.label}</Text>
              <Text style={styles.socialHandle} numberOfLines={1}>
                {s.handle}
              </Text>
            </TouchableOpacity>
          ))}
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
  badgeText: { color: "#2563eb", fontWeight: "900", fontSize: 12 },
  heroTitle: { color: "#ffffff", fontSize: 32, fontWeight: "900" },
  heroSubtitle: { color: "#94a3b8", fontSize: 14, fontWeight: "600", marginTop: 6 },
  body: { padding: 18, paddingBottom: 50 },
  quickRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  quickCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    gap: 6,
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: 11, fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  quickValue: { fontSize: 11, fontWeight: "700", color: "#0f172a", textAlign: "center" },
  mapCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    elevation: 2,
    marginBottom: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mapTitle: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
  mapAddress: { fontSize: 13, fontWeight: "600", color: "#64748b", textAlign: "center", lineHeight: 20 },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  mapBtnText: { color: "#2563eb", fontWeight: "800", fontSize: 13 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    marginBottom: 24,
  },
  cardTitle: { fontSize: 18, fontWeight: "900", color: "#0f172a", marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    marginBottom: 14,
  },
  textarea: { height: 120, paddingTop: 12 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#0f172a", marginBottom: 12 },
  socialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  socialCard: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    borderWidth: 1.5,
    gap: 6,
  },
  socialIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  socialLabel: { fontSize: 13, fontWeight: "900", color: "#0f172a" },
  socialHandle: { fontSize: 11, fontWeight: "600", color: "#64748b" },
});