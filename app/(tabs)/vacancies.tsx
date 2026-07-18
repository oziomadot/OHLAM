import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import ScreenWrapper from "components/ScreenWrapper";
import Navbar from "components/Navbar";
import API from "@/src/services/api";

type Vacancy = {
  id: number;
  title: string;
  jobdesc: string;
  deadline: string;
  created_at: string;
};

type AppForm = {
  full_name: string;
  email: string;
  phone: string;
  cover_letter: string;
  cv: { name: string; uri: string; mimeType: string } | null;
};

const EMPTY_FORM: AppForm = {
  full_name: "",
  email: "",
  phone: "",
  cover_letter: "",
  cv: null,
};

export default function Vacancies() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [applying, setApplying] = useState<Vacancy | null>(null);
  const [form, setForm] = useState<AppForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.getVacancies();
        setVacancies(res.data ?? []);
      } catch (e: any) {
        Alert.alert("Error", e?.response?.data?.message || "Failed to load vacancies");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pickCV = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setForm((f) => ({
      ...f,
      cv: { name: asset.name, uri: asset.uri, mimeType: asset.mimeType ?? "application/pdf" },
    }));
  };

  const handleSubmit = async () => {
    if (!applying) return;
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) {
      Alert.alert("Validation", "Full name, email, and phone are required.");
      return;
    }
    if (!form.cv) {
      Alert.alert("Validation", "Please attach your CV.");
      return;
    }
    const data = new FormData();
    data.append("full_name", form.full_name);
    data.append("email", form.email);
    data.append("phone", form.phone);
    if (form.cover_letter.trim()) data.append("cover_letter", form.cover_letter);
    data.append("cv", { name: form.cv.name, uri: form.cv.uri, type: form.cv.mimeType } as any);

    setSubmitting(true);
    try {
      await API.applyVacancy(applying.id, data);
      Alert.alert("Success", "Your application has been submitted successfully!");
      setApplying(null);
      setForm(EMPTY_FORM);
    } catch (e: any) {
      const errors = e?.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join("\n")
        : e?.response?.data?.message || "Submission failed. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <ScreenWrapper>
      <Navbar />

      <View style={styles.hero}>
        <View style={styles.badge}>
          <Ionicons name="briefcase-outline" size={16} color="#2563eb" />
          <Text style={styles.badgeText}>Careers</Text>
        </View>
        <Text style={styles.heroTitle}>Join Our Team</Text>
        <Text style={styles.heroSubtitle}>
          Help us build Nigeria's most trusted real estate platform.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading vacancies...</Text>
        </View>
      ) : vacancies.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="briefcase-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Vacancies Available</Text>
          <Text style={styles.emptyText}>
            There are no open positions at the moment. Check back soon!
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLabel}>
            {vacancies.length} open position{vacancies.length !== 1 ? "s" : ""}
          </Text>

          {vacancies.map((v) => {
            const isOpen = expanded === v.id;
            return (
              <View key={v.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => setExpanded(isOpen ? null : v.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardIconBox}>
                    <Ionicons name="briefcase-outline" size={20} color="#2563eb" />
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardTitle}>{v.title}</Text>
                    <Text style={styles.cardDate}>Posted {formatDate(v.created_at)}</Text>
                    <Text style={styles.cardDeadline}>
                      <Ionicons name="time-outline" size={11} /> Deadline: {formatDate(v.deadline)}
                    </Text>
                  </View>
                  <View style={[styles.chevron, isOpen && styles.chevronActive]}>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={isOpen ? "#2563eb" : "#94a3b8"}
                    />
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.cardBody}>
                    <View style={styles.divider} />
                    <Text style={styles.descLabel}>Job Description</Text>
                    <Text style={styles.descText}>{v.jobdesc}</Text>
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => { setApplying(v); setForm(EMPTY_FORM); }}
                    >
                      <Ionicons name="send-outline" size={16} color="#fff" />
                      <Text style={styles.applyBtnText}>Apply Now</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!applying} animationType="slide" onRequestClose={() => setApplying(null)}>
        <ScrollView
          contentContainerStyle={styles.modal}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Apply for Position</Text>
              <Text style={styles.modalRole}>{applying?.title}</Text>
            </View>
            <TouchableOpacity onPress={() => setApplying(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Personal Details</Text>

          <Text style={styles.fieldLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Doe"
            placeholderTextColor="#94a3b8"
            value={form.full_name}
            onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
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

          <Text style={styles.fieldLabel}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 08012345678"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
          />

          <Text style={styles.sectionLabel}>Application</Text>

          <Text style={styles.fieldLabel}>Cover Letter (optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Tell us why you're a great fit..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={form.cover_letter}
            onChangeText={(v) => setForm((f) => ({ ...f, cover_letter: v }))}
          />

          <Text style={styles.fieldLabel}>CV / Resume * (PDF, DOC, DOCX — max 5MB)</Text>
          <TouchableOpacity style={styles.cvPicker} onPress={pickCV}>
            <Ionicons
              name={form.cv ? "document-text" : "cloud-upload-outline"}
              size={20}
              color={form.cv ? "#2563eb" : "#94a3b8"}
            />
            <Text style={[styles.cvPickerText, form.cv && styles.cvPickerTextActive]}>
              {form.cv ? form.cv.name : "Tap to attach your CV"}
            </Text>
            {form.cv && (
              <TouchableOpacity onPress={() => setForm((f) => ({ ...f, cv: null }))}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Application</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setApplying(null)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 12 },
  loadingText: { color: "#64748b", fontSize: 14, fontWeight: "600" },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  body: { padding: 18, paddingBottom: 40 },
  countLabel: { color: "#64748b", fontSize: 13, fontWeight: "700", marginBottom: 14 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginBottom: 14,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: "#0f172a" },
  cardDate: { fontSize: 12, fontWeight: "600", color: "#94a3b8", marginTop: 3 },
  cardDeadline: { fontSize: 11, fontWeight: "600", color: "#ef4444", marginTop: 2 },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  chevronActive: { backgroundColor: "#eff6ff" },
  cardBody: { paddingHorizontal: 18, paddingBottom: 18 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 14 },
  descLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descText: { fontSize: 14, lineHeight: 23, color: "#475569", fontWeight: "500", marginBottom: 16 },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 13,
    borderRadius: 14,
  },
  applyBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  modal: { padding: 24, paddingBottom: 50, backgroundColor: "#f8fafc", minHeight: "100%" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 12,
  },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#0f172a" },
  modalRole: { fontSize: 14, fontWeight: "700", color: "#2563eb", marginTop: 4 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 14,
  },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#ffffff",
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
  cvPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderStyle: "dashed",
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 24,
  },
  cvPickerText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#94a3b8" },
  cvPickerTextActive: { color: "#0f172a" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 12,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelBtnText: { color: "#94a3b8", fontWeight: "700", fontSize: 14 },
});