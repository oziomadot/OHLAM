import React from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet,
  Platform
 } from "react-native";

export default function FilterBar({ filters, setFilters }) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Min Amount"
        keyboardType="numeric"
        value={filters.min}
        onChangeText={(v) => setFilters({ ...filters, min: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="Max Amount"
        keyboardType="numeric"
        value={filters.max}
        onChangeText={(v) => setFilters({ ...filters, max: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="Search by State/Area"
        value={filters.search}
        onChangeText={(v) => setFilters({ ...filters, search: v })}
      />
      <TouchableOpacity
        style={styles.clearBtn}
        onPress={() => setFilters({ min: "", max: "", search: "" })}
      >
        <Text style={styles.clearText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, gap: 8, 
    width: Platform.OS === "web" ? "40%": "100%", 
    flexDirection: "row",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },
  clearBtn: {
    backgroundColor: "red",
    borderRadius: 10,
    alignItems: "center",
    padding: 10,
  },
  clearText: { color: "#fff", fontWeight: "bold" },
});
