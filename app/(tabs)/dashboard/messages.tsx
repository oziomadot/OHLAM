import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Protected from "components/Protected";
import { messages } from "@/src/data/dashboard";

export default function Messages() {
  return (
    <Protected>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Messages</Text>

        <View style={styles.warning}>
          <MaterialCommunityIcons name="shield-lock" size={22} color="#92400e" />
          <Text style={styles.warningText}>
            Sharing phone numbers, WhatsApp numbers, email addresses or private contacts
            violates company ethical conduct.
          </Text>
        </View>

        {messages.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>

              <Text style={styles.message}>{item.message}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 18 },
  title: { fontSize: 26, fontWeight: "900", color: "#0f172a", marginBottom: 18 },
  warning: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderWidth: 1,
    padding: 14,
    borderRadius: 18,
    marginBottom: 18,
  },
  warningText: { flex: 1, color: "#92400e", fontSize: 13, lineHeight: 20, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: "#0f172a", fontWeight: "900", fontSize: 15 },
  time: { color: "#94a3b8", fontSize: 12 },
  message: { color: "#64748b", marginTop: 5, lineHeight: 20 },
});