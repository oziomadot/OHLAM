import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/ScreenWrapper";
import Protected from "components/Protected";
import PropertyAction from "components/action";
import API from "@/src/services/api";

type MyProperty = {
  id: number;
  address?: string;

  property_type?:
    | string
    | {
        id: number;
        name: string;
        [key: string]: any;
      };

  propertyType?: {
    id: number;
    name: string;
    [key: string]: any;
  };

  category?: string;
  amount?: number | string;
  created_at?: string;

  status?:
    | string
    | {
        id: number;
        name: string;
        code?: string;
        display_name?: string;
        [key: string]: any;
      };

  registration_status?: {
    id: number;
    name: string;
    code?: string;
    display_name?: string;
    [key: string]: any;
  };
};

export default function MyProperties() {
  const router = useRouter();

  const [properties, setProperties] = useState<MyProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProperties = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const res = await API.myProperties();

      const list =
        res.data?.properties ??
        res.data?.data ??
        res.data ??
        [];

      setProperties(Array.isArray(list) ? list : []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to load your properties."
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadProperties(false);
    } finally {
      setRefreshing(false);
    }
  };

  const formatPrice = (amount?: number | string) => {
    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      return "₦0";
    }

    const value = Number(amount);

    if (Number.isNaN(value)) {
      return "₦0";
    }

    return `₦${value.toLocaleString()}`;
  };

  const formatDate = (date?: string) => {
    if (!date) {
      return "-";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleDateString();
  };

  const getPropertyType = (item: MyProperty) => {
    if (
      item.propertyType &&
      typeof item.propertyType === "object"
    ) {
      return item.propertyType.name;
    }

    if (
      item.property_type &&
      typeof item.property_type === "object"
    ) {
      return item.property_type.name;
    }

    if (typeof item.property_type === "string") {
      return item.property_type;
    }

    return item.category || "Property";
  };

  const getStatusName = (item: MyProperty) => {
    if (
      item.registration_status &&
      typeof item.registration_status === "object"
    ) {
      return (
        item.registration_status.display_name ||
        item.registration_status.name ||
        "Unknown"
      );
    }

    if (item.status && typeof item.status === "object") {
      return (
        item.status.display_name ||
        item.status.name ||
        "Unknown"
      );
    }

    if (typeof item.status === "string") {
      return item.status;
    }

    return "Available";
  };

  const openAppointments = (propertyId: number) => {
    router.push(
      `/(tabs)/properties/appointments/${propertyId}` as any
    );
  };

  const openCreateProperty = () => {
    router.push("/(tabs)/properties/create" as any);
  };

  return (
    <Protected>
      <ScreenWrapper>
        <View style={styles.screen}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>
                My Listed Properties
              </Text>

              <Text style={styles.subtitle}>
                Manage listings, appointments and property
                actions.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={openCreateProperty}
              activeOpacity={0.85}
            >
              <Ionicons
                name="add"
                size={20}
                color="#ffffff"
              />

              <Text style={styles.uploadButtonText}>
                Upload
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary */}
          {!loading && (
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryLabel}>
                  Total Properties
                </Text>

                <Text style={styles.summaryValue}>
                  {properties.length}
                </Text>
              </View>

              <Ionicons
                name="business-outline"
                size={28}
                color="#2563eb"
              />
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color="#2563eb"
              />

              <Text style={styles.loadingText}>
                Loading your properties...
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.scrollContent
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              }
            >
              {properties.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="home-outline"
                      size={38}
                      color="#64748b"
                    />
                  </View>

                  <Text style={styles.emptyTitle}>
                    No properties yet
                  </Text>

                  <Text style={styles.emptyText}>
                    You have not uploaded any property
                    listings yet.
                  </Text>

                  <TouchableOpacity
                    style={styles.emptyUploadButton}
                    onPress={openCreateProperty}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={19}
                      color="#ffffff"
                    />

                    <Text
                      style={
                        styles.emptyUploadButtonText
                      }
                    >
                      Upload Property
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                properties.map((item, index) => (
                  <View
                    key={item.id}
                    style={styles.propertyCard}
                  >
                    {/* Card heading */}
                    <View style={styles.cardHeader}>
                      <View
                        style={
                          styles.propertyNumberContainer
                        }
                      >
                        <Text
                          style={styles.propertyNumber}
                        >
                          {index + 1}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.cardTitleContainer
                        }
                      >
                        <Text
                          style={styles.propertyType}
                          numberOfLines={1}
                        >
                          {getPropertyType(item)}
                        </Text>

                        <View style={styles.addressRow}>
                          <Ionicons
                            name="location-outline"
                            size={15}
                            color="#64748b"
                          />

                          <Text
                            style={styles.address}
                            numberOfLines={2}
                          >
                            {item.address ||
                              "Address unavailable"}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={styles.statusBadge}
                      >
                        <Text
                          style={styles.statusText}
                          numberOfLines={1}
                        >
                          {getStatusName(item)}
                        </Text>
                      </View>
                    </View>

                    {/* Property details */}
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailItem}>
                        <Text
                          style={styles.detailLabel}
                        >
                          Price
                        </Text>

                        <Text
                          style={styles.priceValue}
                        >
                          {formatPrice(item.amount)}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.detailItem}>
                        <Text
                          style={styles.detailLabel}
                        >
                          Date Listed
                        </Text>

                        <Text
                          style={styles.detailValue}
                        >
                          {formatDate(
                            item.created_at
                          )}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.detailItem}>
                        <Text
                          style={styles.detailLabel}
                        >
                          Property ID
                        </Text>

                        <Text
                          style={styles.detailValue}
                        >
                          #{item.id}
                        </Text>
                      </View>
                    </View>

                    {/* Appointments */}
                    <View
                      style={
                        styles.appointmentSection
                      }
                    >
                      <View
                        style={
                          styles.sectionTitleRow
                        }
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#0f172a"
                        />

                        <Text
                          style={
                            styles.sectionTitle
                          }
                        >
                          Appointments
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={
                          styles.appointmentButton
                        }
                        onPress={() =>
                          openAppointments(
                            item.id
                          )
                        }
                      >
                        <Ionicons
                          name="eye-outline"
                          size={17}
                          color="#2563eb"
                        />

                        <Text
                          style={
                            styles.appointmentButtonText
                          }
                        >
                          View Appointments
                        </Text>

                        <Ionicons
                          name="chevron-forward"
                          size={17}
                          color="#2563eb"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Property actions */}
                    <View style={styles.actionsSection}>
                      <View
                        style={
                          styles.sectionTitleRow
                        }
                      >
                        <Ionicons
                          name="settings-outline"
                          size={18}
                          color="#0f172a"
                        />

                        <Text
                          style={
                            styles.sectionTitle
                          }
                        >
                          Property Actions
                        </Text>
                      </View>

                      <View
                        style={
                          styles.propertyActionContainer
                        }
                      >
                        <PropertyAction
                          property={item as any}
                          onStatusChanged={() =>
                            loadProperties(false)
                          }
                        />
                      </View>
                    </View>
                  </View>
                ))
              )}

              <View style={{ height: 30 }} />
            </ScrollView>
          )}
        </View>
      </ScreenWrapper>
    </Protected>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  /*
   * HEADER
   */
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
  },

  uploadButton: {
    flexShrink: 0,
    minHeight: 42,
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  uploadButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  /*
   * SUMMARY
   */
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  summaryLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },

  summaryValue: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },

  /*
   * LOADING
   */
  loadingContainer: {
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748b",
  },

  scrollContent: {
    paddingHorizontal: 16,
  },

  /*
   * PROPERTY CARD
   */
  propertyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 10,
  },

  propertyNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  propertyNumber: {
    color: "#2563eb",
    fontWeight: "900",
    fontSize: 13,
  },

  cardTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  propertyType: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginTop: 5,
  },

  address: {
    flex: 1,
    color: "#64748b",
    fontSize: 12,
    lineHeight: 17,
  },

  statusBadge: {
    flexShrink: 1,
    maxWidth: 110,
    backgroundColor: "#ecfdf5",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
    textTransform: "capitalize",
  },

  /*
   * DETAILS
   */
  detailsGrid: {
    minHeight: 72,
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 12,
  },

  detailItem: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: "center",
  },

  detailLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },

  detailValue: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },

  priceValue: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "900",
  },

  divider: {
    width: 1,
    backgroundColor: "#e2e8f0",
  },

  /*
   * SECTIONS
   */
  appointmentSection: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    padding: 14,
  },

  actionsSection: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    padding: 14,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },

  appointmentButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  appointmentButtonText: {
    flex: 1,
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "800",
  },

  propertyActionContainer: {
    width: "100%",
  },

  /*
   * EMPTY STATE
   */
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: "center",
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },

  emptyText: {
    marginTop: 6,
    maxWidth: 280,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  emptyUploadButton: {
    marginTop: 18,
    minHeight: 44,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  emptyUploadButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },
});