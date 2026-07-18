import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import ScreenWrapper from "components/ScreenWrapper";
import Protected from "components/Protected";
import API from "@/src/services/api";
import { useAuth } from "@/context/AuthContext";
import PropertyAction from "components/action";

type MyProperty = {
  id: number;
  address?: string;
  property_type?: string | { id: number; name: string; [key: string]: any };
  propertyType?: { id: number; name: string; [key: string]: any };
  category?: string;
  amount?: number | string;
  created_at?: string;
  status?: string | { id: number; name: string; [key: string]: any };
  registration_status?: { id: number; name: string; display_name?: string; [key: string]: any };
};

export default function MyProperties() {
  const router = useRouter();
  const [properties, setProperties] = useState<MyProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userId = user?.id;

  const loadProperties = async () => {
    try {
      setLoading(true);
      const res = await API.myProperties();
      const list = res.data?.properties || res.data || [];

      if (list.length > 0) {
        setProperties(list);
      } else {
        Alert.alert("Message", "You have no properties listed yet");
      }

    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const requestDelete = (property: MyProperty) => {
    router.push({
      pathname: "/(tabs)/properties/delete-reason",
      params: { id: String(property.id) },
    } as any);
  };

  const formatPrice = (amount?: number | string) => {
    if (!amount) return "₦0";
    return `₦${Number(amount).toLocaleString()}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <Protected>
      <ScreenWrapper>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Listed Properties</Text>
            <Text style={styles.subtitle}>Manage your property listings professionally.</Text>
          </View>

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => router.push("/(tabs)/properties/create")}
          >
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView horizontal>
            <View>
              <View style={[styles.row, styles.headRow]}>
                <Text style={[styles.cell, styles.no]}>No</Text>
                <Text style={[styles.cell, styles.address]}>Address</Text>
                <Text style={[styles.cell, styles.type]}>Type</Text>
                <Text style={[styles.cell, styles.price]}>Price</Text>
                <Text style={[styles.cell, styles.date]}>Date Listed</Text>
                <Text style={[styles.cell, styles.status]}>Status</Text>
                <Text style={[styles.cell, styles.appointment]}>Appointment</Text>
                <Text style={[styles.cell, styles.actions]}>Actions</Text>
              
              </View>

              {properties.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No property uploaded yet.</Text>
                </View>
              ) : (
                (properties as MyProperty[]).map((item, index) => (
                  <View key={item.id} style={styles.row}>
                    <Text style={[styles.cell, styles.no]}>{index + 1}</Text>
                    <Text style={[styles.cell, styles.address]} numberOfLines={2}>
                      {item.address || "-"}
                    </Text>
                    <Text style={[styles.cell, styles.type]}>
                      {(typeof item.propertyType === 'object' ? item.propertyType?.name : null)
                        || (typeof item.property_type === 'object' ? (item.property_type as any)?.name : item.property_type)
                        || item.category || "-"}
                    </Text>
                    <Text style={[styles.cell, styles.price]}>{formatPrice(item.amount)}</Text>
                    <Text style={[styles.cell, styles.date]}>{formatDate(item.created_at)}</Text>
                    <Text style={[styles.cell, styles.status]}>
                      {(typeof item.registration_status === 'object' ? item.registration_status?.display_name || item.registration_status?.name : null)
                        || (typeof item.status === 'object' ? (item.status as any)?.name : item.status)
                        || "available"}
                    </Text>

                    <View style={[styles.cell, styles.actions, styles.actionWrap]}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push(`/(tabs)/properties/appointments/${item.id}` as any)}
                      >
                        <Text style={styles.actionText}>View</Text>
                      </TouchableOpacity>

                      {/* <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push(`/(tabs)/properties/${item.id}` as any)}
                      >
                        <Text style={styles.actionText}>Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push(`/(tabs)/properties/update/${item.id}` as any)}
                      >
                        <Text style={styles.actionText}>Update</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => requestDelete(item)}
                      >
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity> */}
 </View>
                    <View style={styles.actionWrap}>
                      <PropertyAction
                        property={item as any}
                        onStatusChanged={loadProperties}
                      />
                    </View>
                   
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </ScreenWrapper>
    </Protected>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "900", color: "#0f172a" },
  subtitle: { color: "#64748b", marginTop: 4 },
  uploadBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  uploadText: { color: "#fff", fontWeight: "800" },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 58,
    alignItems: "center",
  },
  headRow: { backgroundColor: "#eff6ff" },
  cell: { padding: 10, fontSize: 13, color: "#334155" },
  no: { width: 50 },
  address: { width: 220 },
  type: { width: 150 },
  price: { width: 120 },
  date: { width: 120 },
  status: { width: 110, fontWeight: "800" },
  appointment: { width: 110 },
  actions: { width: 430 },
  actionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  actionBtn: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  actionText: { color: "#2563eb", fontWeight: "700", fontSize: 12 },
  deleteBtn: { backgroundColor: "#fee2e2" },
  deleteText: { color: "#dc2626", fontWeight: "800", fontSize: 12 },
  empty: { padding: 30, backgroundColor: "#fff" },
  emptyText: { color: "#64748b", textAlign: "center" },
});