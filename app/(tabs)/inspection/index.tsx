import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";

import API, { AppointmentInspectionSubmitPayload } from "@/src/services/api";
import Protected from "components/Protected";
import ScreenWrapper from "components/ScreenWrapper";

type Reason = { id: number; name: string; code: string };
type RatingProps = { label: string; value: number; onChange: (value: number) => void };

function Rating({ label, value, onChange }: RatingProps) {
  return <View style={styles.ratingBlock}><Text style={styles.label}>{label}</Text><View style={styles.stars}>
    {[1, 2, 3, 4, 5].map((star) => <TouchableOpacity key={star} onPress={() => onChange(star)} accessibilityLabel={`${label}: ${star} stars`}>
      <MaterialCommunityIcons name={star <= value ? "star" : "star-outline"} size={34} color="#f59e0b" />
    </TouchableOpacity>)}
  </View></View>;
}

export default function AppointmentInspectionScreen() {
  const router = useRouter();
  const raw = useLocalSearchParams<{ appointmentId?: string | string[] }>().appointmentId;
  const appointmentId = Array.isArray(raw) ? raw[0] : raw;
  const [appointment, setAppointment] = useState<any>(null);
  const [role, setRole] = useState<"customer" | "lister">("customer");
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [outcome, setOutcome] = useState<"inspection_completed" | "inspection_not_completed">("inspection_completed");
  const [reasonCode, setReasonCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [propertyRating, setPropertyRating] = useState(0);
  const [personRating, setPersonRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const [detail, inspection] = await Promise.all([
        API.getAppointment(appointmentId), API.getAppointmentInspection(appointmentId),
      ]);
      setAppointment(detail.data ?? detail.appointment);
      setRole(detail.viewer_role === "lister" ? "lister" : "customer");
      setReasons(inspection.data?.reasons ?? []);
    } catch (error: any) {
      Alert.alert("Unable to load inspection", error?.response?.data?.message || error.message);
    } finally { setLoading(false); }
  }, [appointmentId]);

  useEffect(() => { void load(); }, [load]);
  const completed = outcome === "inspection_completed";
  const valid = useMemo(() => completed
    ? personRating > 0 && (role === "lister" || propertyRating > 0)
    : Boolean(reasonCode), [completed, personRating, propertyRating, reasonCode, role]);

  const submit = async () => {
    if (!appointmentId || !appointment || !valid || submitting) return;
    try {
      setSubmitting(true);
      let locationPayload = {};
      if (completed) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") throw new Error("Precise location permission is required to confirm a completed inspection.");
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        locationPayload = {
          latitude: position.coords.latitude, longitude: position.coords.longitude,
          accuracy_metres: position.coords.accuracy ?? 999, captured_at: new Date(position.timestamp).toISOString(),
        };
      }
      const reviews: AppointmentInspectionSubmitPayload["reviews"] = completed ? [
        { subject_type: "user" as const, subject_id: role === "customer" ? appointment.lister_id : appointment.customer_id, rating: personRating },
        ...(role === "customer" ? [{ subject_type: "property" as const, subject_id: appointment.property_id, rating: propertyRating }] : []),
      ] : [];
      await API.submitAppointmentInspection(appointmentId, {
        outcome_code: outcome, reason_code: completed ? null : reasonCode,
        explanation: explanation.trim() || null, reviews, ...locationPayload,
      });
      Alert.alert("Submitted", "Your inspection report has been recorded.", [{ text: "OK", onPress: () => router.replace(`/appointment/${appointmentId}` as never) }]);
    } catch (error: any) {
      const errors = error?.response?.data?.errors;
      const message = errors ? Object.values(errors).flat().join("\n") : error?.response?.data?.message || error.message;
      Alert.alert("Could not submit", message);
    } finally { setSubmitting(false); }
  };

  if (loading) return <Protected><ScreenWrapper><View style={styles.center}><ActivityIndicator size="large" /></View></ScreenWrapper></Protected>;

  return <Protected><ScreenWrapper><ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Inspection outcome</Text>
    <Text style={styles.notice}>{role === "lister" ? "Ask the customer to submit their own result at the property. Their verified submission finalizes completion." : "Submit this only at the property. OHLAM checks your current GPS location."}</Text>
    <View style={styles.row}>{[
      ["inspection_completed", "Completed"], ["inspection_not_completed", "Not completed"],
    ].map(([code, label]) => <TouchableOpacity key={code} style={[styles.choice, outcome === code && styles.choiceActive]} onPress={() => setOutcome(code as any)}><Text style={outcome === code ? styles.choiceTextActive : styles.choiceText}>{label}</Text></TouchableOpacity>)}</View>

    {!completed ? <View><Text style={styles.label}>Why was it not completed?</Text>{reasons.map((reason) => <TouchableOpacity key={reason.id} style={[styles.reason, reasonCode === reason.code && styles.reasonActive]} onPress={() => setReasonCode(reason.code)}><Text>{reason.name}</Text></TouchableOpacity>)}</View> : <>
      {role === "customer" ? <Rating label="Rate the property" value={propertyRating} onChange={setPropertyRating} /> : null}
      <Rating label={role === "customer" ? "Rate the lister" : "Rate the customer"} value={personRating} onChange={setPersonRating} />
    </>}

    <Text style={styles.label}>More details (optional)</Text>
    <TextInput style={styles.input} multiline maxLength={2000} value={explanation} onChangeText={setExplanation} placeholder="Add useful details about what happened" />
    <TouchableOpacity disabled={!valid || submitting} style={[styles.submit, (!valid || submitting) && styles.disabled]} onPress={() => void submit()}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit inspection report</Text>}</TouchableOpacity>
  </ScrollView></ScreenWrapper></Protected>;
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 }, center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "800", color: "#0f172a" }, notice: { color: "#92400e", backgroundColor: "#fffbeb", padding: 14, borderRadius: 12, lineHeight: 21 },
  row: { flexDirection: "row", gap: 10 }, choice: { flex: 1, padding: 14, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, alignItems: "center" }, choiceActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" }, choiceText: { color: "#334155", fontWeight: "700" }, choiceTextActive: { color: "#fff", fontWeight: "700" },
  label: { fontWeight: "700", color: "#1e293b", marginBottom: 8 }, reason: { padding: 13, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, marginBottom: 8 }, reasonActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  ratingBlock: { gap: 4 }, stars: { flexDirection: "row", gap: 7 }, input: { minHeight: 110, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, padding: 12, textAlignVertical: "top" },
  submit: { backgroundColor: "#2563eb", borderRadius: 10, minHeight: 50, alignItems: "center", justifyContent: "center" }, disabled: { opacity: 0.45 }, submitText: { color: "#fff", fontWeight: "800" },
});
