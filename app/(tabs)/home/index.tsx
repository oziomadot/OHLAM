import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../../src/config";
import AppHeader from "../../../src/components/AppHeader";
import Navbar from "components/Navbar";

const categories = [
  "Duplex",
  "Four bedroom flats",
  "Three bedroom flats",
  "Two bedroom flats",
  "One bedroom flats",
  "Selfcon",
  "One room",
  "Public House",
  "Public Land",
];

const keyMap: Record<string, string> = {
  "Duplex": "duplex",
  "Four bedroom flats": "bedroom4",
  "Three bedroom flats": "bedroom3",
  "Two bedroom flats": "bedroom2",
  "One bedroom flats": "bedroom1",
  "Selfcon": "selfcon",
  "One room": "singleroom",
  "Public House": "publichouse",
  "Public Land": "publicland",
};

const Index = () => {
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadProperty = async () => {
      setIsLoading(true);
      try {
        const response = await API.get("/properties");
        console.log("Payload", response.data);
        const props = response.data?.properties ?? {};
  
        const normalized: Record<string, any[]> = {};
        Object.keys(keyMap).forEach((category) => {
          const key = keyMap[category];
          // flatten because each entry is an array inside an array [[obj], [obj]]
          normalized[key] = Array.isArray(props[key])
            ? props[key].flat()
            : [];
        });
  
        console.log("Normalized properties:", normalized);
        setProperties(normalized);
      } catch (err) {
        setError("Failed to load properties");
        setProperties({});
      } finally {
        setIsLoading(false);
      }
    };
  
    loadProperty();
  }, []);
  
  

  // Filter properties inside each category
  const filterItems = (items: any[]) => {
    return items.filter((item) => {
      const amount = Number(item?.amount) || 0;
      const matchMin = minAmount ? amount >= Number(minAmount) : true;
      const matchMax = maxAmount ? amount <= Number(maxAmount) : true;
      const matchSearch = search
        ? (item?.state?.name || item?.state || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (item?.area?.name || item?.area || "")
            .toLowerCase()
            .includes(search.toLowerCase())
        : true;

      return matchMin && matchMax && matchSearch;
    });
  };

  const renderCard = (item: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/screens/PropertyDetailScreen",
          params: { id: item?.id },
        })
      }
    >
      <View
        style={[styles.imageWrapper, !item?.image && { backgroundColor: "#e1e4e8" }]}
      >
        {item?.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
          />
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardText} numberOfLines={1}>
          {typeof item?.state === "object"
            ? item.state?.name || "N/A"
            : item?.state || "N/A"}
        </Text>
        <Text style={styles.cardText}>
          {typeof item?.area === "object"
            ? item.area?.name || "N/A"
            : item?.area || "N/A"}
        </Text>
        <Text style={styles.cardText}>
          {item?.amount
            ? `₦${Number(item.amount).toLocaleString()}`
            : "Price not available"}
        </Text>
        <Text style={styles.cardText}>
          {typeof item?.agent === "object"
            ? item.agent?.name || "N/A"
            : item?.agent || "N/A"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}
    contentContainerStyle={{ paddingBottom: 50 }}
    >
      <Navbar/>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          FIND HOUSE/LAND TO BUY/RENT IN{" "}
          {Object.keys(properties).length ? Object.keys(properties).length : "many"} STATES OF NIGERIA
        </Text>
        <Text style={styles.subtitle}>WE MAKE IT EASY FOR YOU</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="Min Amount"
          keyboardType="numeric"
          value={minAmount}
          onChangeText={setMinAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Max Amount"
          keyboardType="numeric"
          value={maxAmount}
          onChangeText={setMaxAmount}
        />
        <TextInput
          style={[styles.input, { width: "100%" }]}
          placeholder="Find by State/Area"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "red" }]}
          onPress={() => {
            setMinAmount("");
            setMaxAmount("");
            setSearch("");
          }}
        >
          <Text style={styles.buttonText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Loading & Errors */}
      {isLoading && <Text style={styles.loadingText}>Loading properties...</Text>}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.note}>Note: Using mock data for development</Text>
        </View>
      )}

      {/* Category Sections */}
      {categories.map((category) => {
  const key = keyMap[category];
  const items = key && Array.isArray(properties[key]) ? filterItems(properties[key]) : [];

  if (!items.length) return null;

  return (
    <View key={category} style={{ marginBottom: 20 }}>
    <Text style={styles.sectionTitle}>{category}</Text>

    {items.length > 0 ? (
      <FlatList
        horizontal
        nestedScrollEnabled
        data={items}
        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => renderCard(item)}
        showsHorizontalScrollIndicator={false}
      />
    ) : (
      <Text style={styles.noItems}>No properties found in this category</Text>
    )}
  </View>
  );
})}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { alignItems: "center", paddingHorizontal: 15 },
  title: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  subtitle: { marginTop: 5, fontSize: 14, color: "#84cc16" },
  filters: {
    marginVertical: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  input: {
    backgroundColor: "#e5e7eb",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    width: "30%",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  noItems: {
    fontSize: 12,
    color: "#888",
    paddingLeft: 10,
    fontStyle: "italic",
  },
  
  buttonText: { color: "white", fontWeight: "bold" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 10, paddingLeft: 10 },
  card: {
    backgroundColor: "#f1f5f9",
    borderRadius: 15,
    marginRight: 15,
    width: 200,
    overflow: "hidden",
  },
  imageWrapper: { width: "100%", height: 120 },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  cardContent: { padding: 8 },
  cardText: { fontSize: 12 },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  errorText: { color: "#b91c1c", marginBottom: 5, fontWeight: "500" },
  note: { color: "#666", fontSize: 12, fontStyle: "italic" },
});

export default Index;
