import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import ScreenWrapper from "components/ScreenWrapper";

export default function PropertiesIndex() {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Properties</Text>
        <Text style={styles.subtitle}>
          Browse, manage, upload and track property appointments.
        </Text>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/(tabs)/properties/view")}>
          <Text style={styles.cardTitle}>My Listed Properties</Text>
          <Text style={styles.cardText}>View and manage properties you uploaded.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push("/(tabs)/properties/create")}>
          <Text style={styles.cardTitle}>Upload Property</Text>
          <Text style={styles.cardText}>List rent, sale, land or house property.</Text>
        </TouchableOpacity>

         
       
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  subtitle: { marginTop: 8, color: "#64748b", fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginTop: 16,
    elevation: 3,
  },
  cardTitle: { fontSize: 17, fontWeight: "900", color: "#2563eb" },
  cardText: { marginTop: 6, color: "#64748b", fontSize: 13 },
});