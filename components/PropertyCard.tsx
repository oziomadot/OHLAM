import React from "react";
import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";

export default function PropertyCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: item.image || "https://via.placeholder.com/200" }}
        style={styles.image}
      />
      <View style={styles.details}>
        <Text style={styles.location}>{item.area?.name || item.area}</Text>
        <Text style={styles.price}>₦{Number(item.amount).toLocaleString()}</Text>
        <Text style={styles.agent}>Agent: {item.agent?.name || "N/A"}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  details: { padding: 8 },
  location: { fontSize: 14, fontWeight: "600", color: "#333" },
  price: { fontSize: 14, color: "green", marginVertical: 4 },
  agent: { fontSize: 12, color: "#666" },
});
