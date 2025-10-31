import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  View,
  Platform,
} from "react-native";
import API from "../../../src/config";
import Navbar from "components/Navbar";
import Dashboard from "components/Dashboard";
import FilterBar from "components/FilterBar";
import { useAuth } from "context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { logger } from "react-native-logs";

const log = logger.createLogger();

const categories = [
  { name: "Rent", key: "rents" },
  { name: "House for Sale", key: "houseSales" },
  { name: "Land for Sale", key: "landSales" },
];

const IndexScreen = () => {
  const [properties, setProperties] = useState({});
  const [filters, setFilters] = useState({ min: "", max: "", search: "" });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [])
  );

  const loadProperties = async () => {
    try {
      setLoading(true);
      const res = await API.get("/home");
      const data = res.data?.properties || {};
      
      console.log("rent", data);
      setProperties(data);
    } catch (e) {
      console.log("❌ Error loading properties:", e);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = (items) => {
    const { min, max, search } = filters;
    return items.filter((item) => {
      const amount = Number(item.amount) || 0;
      const matchMin = min ? amount >= Number(min) : true;
      const matchMax = max ? amount <= Number(max) : true;
      const matchSearch = search
        ? `${item.state?.name || ""} ${item.area?.name || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true;
      return matchMin && matchMax && matchSearch;
    });
  };

  // 🧠 Only used for RENT category
  const groupByBuildingType = (items) => {
    const groups = {};

    console.log(" All property", items);


    items.forEach((item) => {
      const buildingType = item.rents?.building_type?.name || "Others";
      const flatType = item.rents?.building_type?.flat_type?.name || null;

      console.log("Building Type : ", buildingType);
      // If flatType exists, group by it under the parent buildingType
      const mainType = buildingType === "Flat" && flatType ? flatType : buildingType;

      if (!groups[mainType]) groups[mainType] = [];
      groups[mainType].push(item);
    });

    return groups;
  };


  const groupRentals = (rents) => {
  const groups = {};

  rents.forEach((item) => {
    const buildingType = item.rental_detail.building_type?.name;
    // item.rentalDetail?.buildingType?.name || "Others";
    const flatType = item.rental_detail?.flat_type?.name;
    console.log("Building Type the new : ", item);
    log.info("Building Type : ", flatType);

    // Group by buildingType
    if (buildingType !== "Flat") {
      if (!groups[buildingType]) groups[buildingType] = [];
      groups[buildingType].push(item);
    } else {
      // Nested grouping for Flats by flatType
      const subType = flatType || "Unspecified Flat Type";
      if (!groups[subType]) groups[subType] = [];
      groups[subType].push(item);
    }
  });

  return groups;
};


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading properties...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
      <Navbar />
      {isAuthenticated && <Dashboard />}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Houses & Land to Buy or Rent</Text>
        <Text style={styles.subtitle}>
          Explore properties across Nigeria with ease
        </Text>
        <FilterBar filters={filters} setFilters={setFilters} />
      </View>

{categories.map(({ name, key }) => {
  const items = filterItems(properties[key] || []);
  if (!items.length) return null;

  // Only group for Rent category
  let grouped = { [name]: items };
  if (key === "rents") {
    grouped = groupRentals(items);
  }

  return (
    <View key={key} style={styles.section}>
      <View style={styles.titleHead}>
        <Text style={styles.sectionTitle}>{name}</Text>
      </View>

      {Object.entries(grouped).map(([subcat, list]) => (
        <View key={subcat} style={styles.subSection}>
          <View style={styles.subHeader}>
            <Text style={styles.subTitle}>{subcat}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            {list.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/home/property/${item.id}`)}
                style={styles.itemCard}
              >
                <Image
                  source={{ uri: `${API.defaults.baseURL}/storage/${item.media?.wholeBuilding}` }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemText}>
                    <Text style={styles.itemTitle}>Address: </Text>
                    {item.address}
                  </Text>
                  <Text>
                    <Text style={styles.itemTitle}>Price: </Text>₦
                    {item.amount
                      ?.toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </Text>
                  <Text>
                    <Text style={styles.itemTitle}>State: </Text>
                    {item.state?.name}
                  </Text>
                  <Text>
                    <Text style={styles.itemTitle}>LGA: </Text>
                    {item.area?.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
})}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 15,
    justifyContent: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  subtitle: { marginTop: 5, fontSize: 18, color: "#624F15" },
  section: { marginBottom: 20, alignItems: "center" },
  titleHead: { marginVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  subSection: { marginBottom: 15 },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  subTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  horizontalScroll: { paddingHorizontal: 10 },
  itemCard: {
    width: 200,
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  itemImage: { width: "100%", height: 120 },
  itemDetails: { padding: 8 },
  itemText: { fontSize: 14 },
  itemTitle: { fontWeight: "600" },
});

export default IndexScreen;
