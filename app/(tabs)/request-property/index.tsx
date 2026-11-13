import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import AppSelect from "components/AppSelect";
import { useFocusEffect } from "expo-router";
import Navbar from "components/Navbar";
import Protected from "components/Protected";
import { API } from "@/src/services/api";

type Option = { id: number; name: string };
type Category = "rent" | "house_sale" | "land_sale";
type PropertyRequest = {
  id: number; category: Category; status: string; expires_at: string;
  state_id: number; area_id: number | null; max_budget: string | null;
  min_bedrooms: number | null; requirements_note: string | null;
  preferences?: Record<string, boolean> | null;
};

const categories: { label: string; value: Category }[] = [
  { label: "House for Rent", value: "rent" },
  { label: "House for Sale", value: "house_sale" },
  { label: "Land for Sale", value: "land_sale" },
];
const amenities = [
  ["electricity", "Electricity"],
  ["car_parking_space", "Parking space"],
  ["kitchen", "Kitchen"],
  ["kitchen_cabinet", "Kitchen cabinet"],
  ["dining", "Dining area"],
  ["wardrope", "Wardrobe"],
  ["wardrope_cabinet", "Wardrobe cabinet"],
  ["compound_cleaner", "Compound cleaner"],
] as const;

function extractOptions(response: any, key: "states" | "areas"): Option[] {
  // Both existing Laravel endpoint payloads and the shared API wrapper are
  // supported; ignore malformed data rather than crashing a protected screen.
  const payload = response?.data ?? response;
  const nested = payload?.data ?? payload;
  const value = Array.isArray(nested) ? nested : nested?.[key];
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: any) =>
      item && item.id !== undefined && item.id !== null &&
      (item.name || item.area_name || item.display_name))
    .map((item: any) => ({
      id: Number(item.id),
      name: String(item.name ?? item.area_name ?? item.display_name),
    }))
    .filter((item: Option) => Number.isInteger(item.id) && item.id > 0);
}

function RequestPropertyContent() {
  const [category, setCategory] = useState<Category>("rent");
  const [states, setStates] = useState<Option[]>([]);
  const [areas, setAreas] = useState<Option[]>([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [stateId, setStateId] = useState<number | null>(null);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [budget, setBudget] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [note, setNote] = useState("");
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [opportunities, setOpportunities] = useState<(PropertyRequest & { state?: Option; area?: Option })[]>([]);
  const [canViewOpportunities, setCanViewOpportunities] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadRequests = useCallback(async () => {
    const response = await API.get("/property-requests");
    setRequests(response.data.data ?? []);
    try {
      const market = await API.get("/property-requests/opportunities");
      setCanViewOpportunities(true);
      setOpportunities(market.data?.data ?? []);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setCanViewOpportunities(false);
        setOpportunities([]);
      } else {
        console.warn("Unable to retrieve available property requests.");
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setStatesLoading(true);
    void API.get("/property/dropdowns")
      .then(response => {
        if (mounted) setStates(extractOptions(response, "states"));
      })
      .catch((error: any) => {
        if (!mounted) return;
        console.warn("Unable to load request property states", error?.response?.status ?? error?.message);
        Alert.alert("Error", "Unable to load states. Please retry.");
      })
      .finally(() => { if (mounted) setStatesLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setAreaId(null);
    setAreas([]);
    setAreaError(null);
    if (!stateId) {
      setAreasLoading(false);
      return;
    }

    setAreasLoading(true);
    // Use the same endpoint and state_id parameter as property upload.
    void API.get("/property/areas", { params: { state_id: stateId } })
      .then(response => {
        if (!mounted) return;
        const nextAreas = extractOptions(response, "areas");
        setAreas(nextAreas);
        if (!nextAreas.length) {
          setAreaError("No LGAs were returned for this state. You can still request anywhere in the state.");
        }
      })
      .catch((error: any) => {
        if (!mounted) return;
        console.warn("Request property LGA loading failed", {
          stateId,
          status: error?.response?.status,
          message: error?.response?.data?.message ?? error?.message,
        });
        setAreaError("Could not load LGAs. Check your connection or retry by selecting the state again.");
      })
      .finally(() => { if (mounted) setAreasLoading(false); });

    // Prevent an older state request from replacing the newer LGA options.
    return () => { mounted = false; };
  }, [stateId]);

  useFocusEffect(useCallback(() => {
    let active = true;
    void loadRequests().catch(() => {
      if (active) Alert.alert("Error", "Unable to load your requests.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadRequests]));

  const submit = async () => {
    if (busy) return;
    if (!stateId) {
      Alert.alert("Location required", "Select a state for your preferred property.");
      return;
    }
    if (budget && (!Number.isFinite(Number(budget)) || Number(budget) <= 0)) {
      Alert.alert("Invalid budget", "Enter an amount greater than zero.");
      return;
    }
    if (bedrooms && (category !== "rent" || !Number.isInteger(Number(bedrooms))
        || Number(bedrooms) < 0 || Number(bedrooms) > 30)) {
      Alert.alert("Invalid bedrooms", "Select a rental property and enter a valid bedroom count.");
      return;
    }
    setBusy(true);
    try {
      await API.post("/property-requests", {
        category, state_id: stateId, area_id: areaId,
        max_budget: budget ? Number(budget) : null,
        min_bedrooms: category === "rent" && bedrooms ? Number(bedrooms) : null,
        preferences: category === "rent" ? preferences : {},
        requirements_note: note.trim().slice(0, 1000) || null,
      });
      setBudget(""); setBedrooms(""); setNote(""); setPreferences({});
      await loadRequests();
      Alert.alert("Request submitted", "Your request is active for three months. OHLAM will look for matching properties.");
    } catch (error: any) {
      Alert.alert("Unable to submit", error?.response?.data?.message || "Please check your details and try again.");
    } finally { setBusy(false); }
  };

  const perform = (id: number, action: "pause" | "resume" | "fulfil" | "cancel" | "renew") => {
    Alert.alert("Confirm action", `Do you want to ${action} this property request?`, [
      { text: "No", style: "cancel" },
      { text: "Continue", onPress: async () => {
        setBusy(true);
        try {
          await API.post(`/property-requests/${id}/${action}`);
          await loadRequests();
        } catch (error: any) {
          Alert.alert("Unable to update", error?.response?.data?.message || "Please retry.");
        } finally { setBusy(false); }
      } },
    ]);
  };

  return (
    <View style={styles.page}>
      <Navbar />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Request Property</Text>
        <Text style={styles.caption}>
          Cannot find your preferred property? Tell OHLAM what you need.
          Your request is free and remains active for three months.
        </Text>
        <View style={styles.card}>
          <AppSelect
            testID="request-property-category"
            label="Property category"
            value={category}
            options={categories}
            onChange={value => {
              if (!value) return;
              setCategory(value);
              setBedrooms("");
              setPreferences({});
            }}
          />
          <AppSelect
            testID="request-property-state"
            label="State *"
            placeholder={statesLoading ? "Loading states..." : "Select a state"}
            value={stateId}
            options={states.map(state => ({ value: state.id, label: state.name }))}
            onChange={value => setStateId(value)}
            disabled={statesLoading}
            searchable
          />
          <AppSelect
            testID="request-property-area"
            label="LGA (optional)"
            placeholder={
              !stateId ? "Select a state first" :
              areasLoading ? "Loading LGAs..." : "Anywhere in the selected state"
            }
            value={areaId}
            options={areas.map(area => ({ value: area.id, label: area.name }))}
            onChange={value => setAreaId(value)}
            disabled={!stateId || areasLoading}
            allowClear
            clearLabel="Anywhere in the selected state"
            searchable
          />
          {areasLoading && <Text style={styles.caption}>Loading LGAs for your selected state...</Text>}
          {areaError && <Text style={styles.areaError}>{areaError}</Text>}
          <Text style={styles.label}>Maximum budget (₦, optional)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={budget}
            placeholder="e.g. 850000" onChangeText={setBudget} />
          {category === "rent" && <>
            <Text style={styles.label}>Minimum rooms (optional)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={bedrooms}
              placeholder="e.g. 2" onChangeText={setBedrooms} />
            <Text style={styles.label}>Preferred amenities (optional)</Text>
            {amenities.map(([key, label]) => (
              <TouchableOpacity key={key} style={styles.feature} onPress={() =>
                setPreferences(current => ({ ...current, [key]: !current[key] }))}>
                <Text style={styles.featureText}>{preferences[key] ? "☑" : "☐"}  {label}</Text>
              </TouchableOpacity>
            ))}
          </>}
          <Text style={styles.label}>Other requirements (private)</Text>
          <TextInput style={[styles.input, styles.note]} multiline maxLength={1000}
            value={note} onChangeText={setNote} placeholder="Describe your preferred property" />
          <TouchableOpacity style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={submit}>
            <Text style={styles.buttonText}>{busy ? "Please wait..." : "Submit Property Request"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.section}>My Property Requests</Text>
        {loading ? <ActivityIndicator /> : requests.length === 0 ? (
          <Text style={styles.caption}>You have no property requests yet.</Text>
        ) : requests.map(item => {
          const isClosed = ["fulfilled", "cancelled"].includes(item.status);
          const expired = new Date(item.expires_at).getTime() <= Date.now();
          return <View key={item.id} style={styles.card}>
            <Text style={styles.listTitle}>{categories.find(c => c.value === item.category)?.label || item.category} · #{item.id}</Text>
            <Text style={styles.caption}>Status: {expired && !isClosed ? "expired" : item.status} · Expires: {new Date(item.expires_at).toLocaleDateString()}</Text>
            <Text style={styles.caption}>Budget: {item.max_budget ? `₦${Number(item.max_budget).toLocaleString("en-NG")}` : "Flexible"}</Text>
            <View style={styles.actions}>
              {!isClosed && expired && <Action label="Renew 3 months" onPress={() => perform(item.id, "renew")} />}
              {!isClosed && !expired && item.status === "active" && <Action label="Pause" onPress={() => perform(item.id, "pause")} />}
              {!isClosed && !expired && item.status === "paused" && <Action label="Resume" onPress={() => perform(item.id, "resume")} />}
              {!isClosed && !expired && <Action label="Property found" onPress={() => perform(item.id, "fulfil")} />}
              {!isClosed && !expired && <Action label="Cancel" onPress={() => perform(item.id, "cancel")} />}
            </View>
          </View>;
        })}
        {canViewOpportunities && <>
          <Text style={styles.section}>Customer Property Requests</Text>
          <Text style={styles.caption}>
            Anonymous requests from customers looking for property. Only active requests
            are shown. Customer contact details are kept private.
          </Text>
          {opportunities.length === 0 ? <Text style={styles.caption}>No active customer requests at the moment.</Text> :
            opportunities.map(opportunity => (
              <View key={opportunity.id} style={styles.card}>
                <Text style={styles.listTitle}>
                  {categories.find(c => c.value === opportunity.category)?.label ?? opportunity.category}
                </Text>
                <Text style={styles.caption}>
                  {opportunity.area?.name ? opportunity.area.name + ", " : ""}
                  {opportunity.state?.name ?? "Nigeria"}
                </Text>
                <Text style={styles.caption}>
                  Budget: {opportunity.max_budget
                    ? `₦${Number(opportunity.max_budget).toLocaleString("en-NG")}`
                    : "Flexible"}
                </Text>
                {opportunity.min_bedrooms !== null && opportunity.min_bedrooms !== undefined &&
                  <Text style={styles.caption}>Minimum rooms: {opportunity.min_bedrooms}</Text>}
                {Object.entries(opportunity.preferences ?? {}).some(([, selected]) => selected) &&
                  <Text style={styles.caption}>
                    Preferences: {Object.entries(opportunity.preferences ?? {})
                      .filter(([, selected]) => selected)
                      .map(([key]) => key.replace(/_/g, " "))
                      .join(", ")}
                  </Text>}
                <Text style={styles.caption}>
                  Valid until {new Date(opportunity.expires_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
        </>}
      </ScrollView>
    </View>
  );
}
function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity style={styles.action} onPress={onPress}>
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>;
}
export default function RequestPropertyScreen() {
  return <Protected><RequestPropertyContent /></Protected>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f7fc" },
  content: { padding: 16, paddingBottom: 48 },
  heading: { fontSize: 26, fontWeight: "800", color: "#0f2747", marginBottom: 8 },
  caption: { fontSize: 14, color: "#52647d", lineHeight: 21, marginBottom: 12 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 18, elevation: 2 },
  label: { color: "#0f2747", fontWeight: "700", marginBottom: 6, marginTop: 12 },
  areaError: { color: "#8a4600", marginTop: 4, marginBottom: 10, fontSize: 13 },
  input: { borderWidth: 1, borderColor: "#d3dce9", borderRadius: 10, padding: 12, color: "#0f2747", fontSize: 16 },
  note: { minHeight: 85, textAlignVertical: "top" },
  feature: { paddingVertical: 5 },
  featureText: { fontSize: 15, color: "#1e3a5f" },
  button: { backgroundColor: "#1e59ae", borderRadius: 10, padding: 16, alignItems: "center", marginTop: 18 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  disabled: { opacity: 0.6 },
  section: { color: "#0f2747", fontWeight: "800", fontSize: 20, marginBottom: 12 },
  listTitle: { color: "#0f2747", fontSize: 16, fontWeight: "800", marginBottom: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: { paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: "#1e59ae", borderRadius: 8, marginTop: 4 },
  actionText: { color: "#1e59ae", fontWeight: "700" },
});
