import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Protected from "components/Protected";
import { interestedProperties } from "@/src/data/dashboard";
import ScreenWrapper from "components/ScreenWrapper";

export default function InterestedProperties() {
  return (
    <Protected>
      <ScreenWrapper>
        <Text style={styles.title}>Interested Properties</Text>

        {interestedProperties.map((property) => (
          <View key={property.id} style={styles.card}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="home-heart" size={30} color="#ef4444" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{property.title}</Text>
                <Text style={styles.text}>{property.location}</Text>
                <Text style={styles.price}>{property.price}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.label}>Appointment</Text>
              <Text style={styles.info}>{property.appointment}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.info}>{property.status}</Text>
            </View>

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Open Property</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScreenWrapper>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 18 },
  title: { fontSize: 26, fontWeight: "900", color: "#0f172a", marginBottom: 18 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 22, marginBottom: 14, elevation: 3 },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  cardTitle: { fontSize: 17, fontWeight: "900", color: "#0f172a" },
  text: { color: "#64748b", marginTop: 4 },
  price: { color: "#2563eb", fontWeight: "900", marginTop: 6 },
  infoBox: { backgroundColor: "#f1f5f9", padding: 12, borderRadius: 14, marginTop: 12 },
  label: { color: "#64748b", fontSize: 12, fontWeight: "800" },
  info: { color: "#0f172a", fontWeight: "900", marginTop: 4 },
  button: { backgroundColor: "#2563eb", padding: 14, borderRadius: 14, alignItems: "center", marginTop: 14 },
  buttonText: { color: "#fff", fontWeight: "900" },
});