import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  View,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import API, { BASE_URL } from "@/src/services/api";
import Navbar from "components/Navbar";
import FilterBar from "components/FilterBar";
import { useFocusEffect } from "@react-navigation/native";
import ScreenWrapper from "components/ScreenWrapper";

const categories = [
  { name: "Rent", key: "rents" },
  { name: "House for Sale", key: "houseSales" },
  { name: "Land for Sale", key: "landSales" },
];

const IndexScreen = () => {
  const [properties, setProperties] = useState<any>({});
  const [filters, setFilters] = useState({ min: "", max: "", search: "" });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [])
  );

  const loadProperties = async () => {
    try {
      setLoading(true);
      const res = await API.getProperties();

      console.log("list of uploads: ", res);
      
      setProperties(res.data?.properties || {});
    } catch (e) {
      console.log("❌ Error loading properties:", e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const formatMoney = (amount: any) => {
    if (!amount) return "Price on request";
    return `₦${Number(amount).toLocaleString()}`;
  };

  const getImageUrl = (item: any) => {
    const raw =
      item?.media?.wholeBuilding ||
      item?.wholeBuilding ||
      item?.media?.sittingRoom ||
      item?.media?.SittingRoom ||
      item?.sittingRoom ||
      item?.SittingRoom ||
      item?.media?.kitchenImage ||
      item?.media?.kitchen_image ||
      item?.media?.kitchen ||
      item?.kitchenImage ||
      item?.kitchen_image ||
      item?.media?.room ||
      item?.room ||
      item?.media?.toilet ||
      item?.media?.toiletImage ||
      item?.toilet ||
      item?.image;

    if (!raw) {
      if (__DEV__) console.log('No image found for item:', item.id);
      return null;
    }

    const baseOrigin = BASE_URL.replace(/\/api\/?$/, "");
    const image =
      typeof raw === "string" && raw.startsWith("http")
        ? raw
        : `${baseOrigin}/storage/${raw.replace(/^\/+/, "")}`;

    if (__DEV__) console.log('Using image URL:', image);
    return image;
  };

  const getSafeLocation = (item: any) => {
    const area = item?.area?.name || item?.popular_name;
    const state = item?.state?.name;

    if (area && state) return `${area}, ${state}`;
    if (area) return area;
    if (state) return state;

    return "Location available after verification";
  };

  const getListerRole = (item: any) => {
    return (
      item?.listingRole?.name ||
      item?.registrationStatus?.name ||
      item?.lister_role ||
      "Property Lister"
    );
  };

  const isListerVerified = (item: any) => {
    return Boolean(
      item?.user?.is_verified ||
        item?.user?.verified ||
        item?.lister_verified ||
        item?.agent?.is_verified
    );
  };

  const isPropertyVerified = (item: any) => {
    return Boolean(
      item?.is_verified ||
        item?.verified ||
        item?.verification_status_id === 2 ||
        item?.verification_status?.name?.toLowerCase() === "verified"
    );
  };

  const isCompleted = (item: any) => {
    return Boolean(
      item?.transaction_completed ||
        item?.status?.name?.toLowerCase() === "completed"
    );
  };

  const getUnavailableLabel = (item: any, categoryKey: string) => {
    return item?.status?.name || (categoryKey === "rents" ? "Available" : "For Sale");
  };

  const filterItems = (items: any[]) => {
    const { min, max, search } = filters;

    return items.filter((item) => {
      const amount = Number(item.amount) || 0;
      const matchMin = min ? amount >= Number(min) : true;
      const matchMax = max ? amount <= Number(max) : true;

      const searchableText = `
        ${item.state?.name || ""}
        ${item.area?.name || ""}
        ${item.listing_role?.name || ""}
        ${item.verification_status?.name || ""}
      `.toLowerCase();

      const matchSearch = search
        ? searchableText.includes(search.toLowerCase())
        : true;

      return matchMin && matchMax && matchSearch;
    });
  };

  const groupRentals = (rents: any[]) => {
    const groups: any = {};

    rents.forEach((item) => {
      const buildingType = item?.rental_detail?.building_type?.name || "Others";
      const flatType = item?.rental_detail?.flat_type?.name;

      const groupName =
        buildingType === "Flat"
          ? flatType || "Unspecified Flat Type"
          : buildingType;

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item);
    });

    return groups;
  };

  const PropertyCard = ({ item, categoryKey }: any) => {
    const imageUrl = getImageUrl(item);
    const listerVerified = isListerVerified(item);
    const propertyVerified = isPropertyVerified(item);
    const completed = isCompleted(item);
    const statusLabel = getUnavailableLabel(item, categoryKey);
    const unavailable =
      statusLabel.toLowerCase().includes("sold") ||
      statusLabel.toLowerCase().includes("rented");

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => router.push(`/home/property/${item.id}`)}
        style={styles.card}
      >
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.noImage}>
              <MaterialCommunityIcons name="image-off" size={34} color="#94a3b8" />
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}

          <View
            style={[
              styles.statusBadge,
              unavailable ? styles.dangerBadge : styles.successBadge,
            ]}
          >
            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
          </View>

          {completed && (
            <View style={styles.completedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={13} color="#fff" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.price}>{formatMoney(item.amount)}</Text>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={15} color="#64748b" />
            <Text style={styles.location} numberOfLines={1}>
              {getSafeLocation(item)}
            </Text>
          </View>

          <Text style={styles.privacyText}>
            Exact address is hidden until safe verification.
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <MaterialCommunityIcons name="account-tie" size={14} color="#334155" />
              <Text style={styles.metaText}>{getListerRole(item)}</Text>
            </View>

            <View style={styles.metaPill}>
              <MaterialCommunityIcons name="shield-lock" size={14} color="#334155" />
              <Text style={styles.metaText}>Secure Chat</Text>
            </View>
          </View>

          <View style={styles.trustGrid}>
            <View
              style={[
                styles.trustItem,
                listerVerified ? styles.trustGood : styles.trustPending,
              ]}
            >
              <MaterialCommunityIcons
                name={listerVerified ? "account-check" : "account-clock"}
                size={15}
                color={listerVerified ? "#047857" : "#92400e"}
              />
              <Text
                style={[
                  styles.trustText,
                  { color: listerVerified ? "#047857" : "#92400e" },
                ]}
              >
                {listerVerified ? "Lister Verified" : "Lister Pending"}
              </Text>
            </View>

            <View
              style={[
                styles.trustItem,
                propertyVerified ? styles.trustGood : styles.trustPending,
              ]}
            >
              <MaterialCommunityIcons
                name={propertyVerified ? "home-circle-outline" : "home-alert"}
                size={15}
                color={propertyVerified ? "#047857" : "#92400e"}
              />
              <Text
                style={[
                  styles.trustText,
                  { color: propertyVerified ? "#047857" : "#92400e" },
                ]}
              >
                {propertyVerified ? "Property Verified" : "Property Pending"}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => router.push(`/home/property/${item.id}`)}
            >
              <Text style={styles.primaryActionText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconAction}>
              <MaterialCommunityIcons name="heart-outline" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading verified properties...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Navbar />

      <ScrollView
        style={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>Smart Real Estate Marketplace</Text>
          <Text style={styles.headerTitle}>
            Find safer houses, flats and land across Nigeria
          </Text>
          <Text style={styles.subtitle}>
            Verified listings, protected messaging, escrow support and privacy-safe
            property discovery.
          </Text>

          <FilterBar filters={filters} setFilters={setFilters} />

          <View style={styles.trustBanner}>
            <View style={styles.trustBannerItem}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#2563eb" />
              <Text style={styles.trustBannerText}>Verification</Text>
            </View>

            <View style={styles.trustBannerItem}>
              <MaterialCommunityIcons name="message-lock" size={20} color="#2563eb" />
              <Text style={styles.trustBannerText}>Safe Chat</Text>
            </View>

            <View style={styles.trustBannerItem}>
              <MaterialCommunityIcons name="wallet" size={20} color="#2563eb" />
              <Text style={styles.trustBannerText}>Escrow</Text>
            </View>
          </View>
        </View>

        {categories.map(({ name, key }) => {
          const items = filterItems(properties[key] || []);
          if (!items.length) return null;

          let grouped: any = { [name]: items };

          if (key === "rents") {
            grouped = groupRentals(items);
          }

          return (
            <View key={key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>{name}</Text>
                  <Text style={styles.sectionSubtitle}>
                    {items.length} trusted listing{items.length > 1 ? "s" : ""}
                  </Text>
                </View>

                <TouchableOpacity>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>

              {Object.entries(grouped).map(([subcat, list]: any) => (
                <View key={subcat} style={styles.subSection}>
                  <Text style={styles.subTitle}>{subcat}</Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalContent}
                  >
                    {list.map((item: any) => (
                      <PropertyCard key={item.id} item={item} categoryKey={key} />
                    ))}
                  </ScrollView>
                </View>
              ))}
            </View>
          );
        })}

        <View style={styles.safetyCard}>
          <MaterialCommunityIcons name="alert-decagram" size={28} color="#92400e" />
          <Text style={styles.safetyTitle}>Safety Reminder</Text>
          <Text style={styles.safetyText}>
            Do not pay directly to strangers. Use verified listings, in-app messaging,
            property inspection appointments and escrow deposit protection.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontWeight: "700",
  },
  hero: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  kicker: {
    color: "#2563eb",
    fontWeight: "900",
    fontSize: 13,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 36,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 23,
    marginBottom: 16,
  },
  trustBanner: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  trustBannerItem: {
    flex: 1,
    backgroundColor: "#eff6ff",
    paddingVertical: 11,
    borderRadius: 16,
    alignItems: "center",
    gap: 5,
  },
  trustBannerText: {
    color: "#1e40af",
    fontSize: 11,
    fontWeight: "900",
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    paddingHorizontal: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
  },
  sectionSubtitle: {
    color: "#64748b",
    marginTop: 3,
    fontSize: 13,
  },
  seeAll: {
    color: "#2563eb",
    fontWeight: "900",
  },
  subSection: {
    marginBottom: 20,
  },
  subTitle: {
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: "900",
    color: "#334155",
    marginBottom: 10,
  },
  horizontalContent: {
    paddingLeft: 18,
    paddingRight: 8,
  },
  card: {
    width: 285,
    marginRight: 14,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
    elevation: 4,
  },
  imageWrap: {
    width: "100%",
    height: 165,
    backgroundColor: "#e2e8f0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: {
    color: "#94a3b8",
    fontWeight: "700",
    marginTop: 6,
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  successBadge: {
    backgroundColor: "#16a34a",
  },
  dangerBadge: {
    backgroundColor: "#dc2626",
  },
  statusBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  completedBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  completedText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  cardBody: {
    padding: 14,
  },
  price: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  locationRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    flex: 1,
    color: "#475569",
    fontWeight: "700",
  },
  privacyText: {
    marginTop: 5,
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "800",
  },
  trustGrid: {
    gap: 8,
    marginTop: 12,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  trustGood: {
    backgroundColor: "#ecfdf5",
  },
  trustPending: {
    backgroundColor: "#fffbeb",
  },
  trustText: {
    fontSize: 12,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryActionText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  iconAction: {
    width: 46,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  safetyCard: {
    marginHorizontal: 18,
    marginTop: 10,
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderWidth: 1,
    padding: 18,
    borderRadius: 24,
  },
  safetyTitle: {
    marginTop: 8,
    color: "#92400e",
    fontSize: 17,
    fontWeight: "900",
  },
  safetyText: {
    marginTop: 8,
    color: "#92400e",
    lineHeight: 22,
    fontWeight: "600",
  },
});

export default IndexScreen;