import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ScreenWrapper from "components/ScreenWrapper";
import Protected from "components/Protected";
import API, { BASE_URL } from "@/src/services/api";

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProperty = async () => {
    try {
      setLoading(true);
console.log("Listing the full details");
      const res = await API.get(`/properties/${id}`);

      setProperty(res.data?.property || res.data);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Unable to load property details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadProperty();
    console.log("property Id :", id);
  }, [id]);

  const money = (value: any) => {
    if (!value) return "₦0";
    return `₦${Number(String(value).replace(/,/g, "")).toLocaleString()}`;
  };

  const boolText = (value: any) => {
    return value === true || value === 1 || value === "1" ? "Yes" : "No";
  };

  const valueText = (value: any) => {
    return value || value === 0 ? String(value) : "Not provided";
  };

  const imageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const baseOrigin = BASE_URL.replace(/\/api\/?$/, "");
    return `${baseOrigin}/storage/${path.replace(/^\/+/, "")}`;
  };

  const openUrl = async (url?: string) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Invalid link", "This link cannot be opened.");
    }
  };

  const DetailRow = ({ label, value }: { label: string; value: any }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{valueText(value)}</Text>
    </View>
  );

  const Section = ({
    title,
    icon,
    children,
  }: {
    title: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={22} color="#2563eb" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const MediaImage = ({ title, path }: { title: string; path?: string }) => {
    const url = imageUrl(path || "");

    if (!url) return null;

    return (
      <View style={styles.mediaBox}>
        <Text style={styles.mediaTitle}>{title}</Text>
        <Image source={{ uri: url }} style={styles.mediaImage} />
      </View>
    );
  };

  if (loading) {
    return (
      <Protected>
        <ScreenWrapper>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading property details...</Text>
          </View>
        </ScreenWrapper>
      </Protected>
    );
  }

  if (!property) {
    return (
      <Protected>
        <ScreenWrapper>
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Property not found</Text>
          </View>
        </ScreenWrapper>
      </Protected>
    );
  }

  const propertyType =
    property.property_type?.name ||
    property.propertyType?.name ||
    property.propertyTypes?.name ||
    property.type ||
    property.category ||
    "Property";

  const rental = property.rental_detail || property.rentalDetails || property.rental || {};
  const houseSale =
    property.house_sale_detail || property.houseSaleDetails || property.house_sale || {};
  const landSale =
    property.land_sale_detail || property.landSaleDetails || property.land_sale || {};

  const media = property.media || {};
  const documents = property.documents || {};
  const status = property.status?.name || property.status || "Available";

  const isRental =
    Number(property.propertyTypes || property.property_type_id) === 1 ||
    propertyType.toLowerCase().includes("rent");

  const isHouseSale =
    Number(property.propertyTypes || property.property_type_id) === 2 ||
    propertyType.toLowerCase().includes("house");

  const isLandSale =
    Number(property.propertyTypes || property.property_type_id) === 3 ||
    propertyType.toLowerCase().includes("land");

  return (
    <Protected>
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.hero}>
            <Text style={styles.badge}>{status}</Text>
            <Text style={styles.title}>{propertyType}</Text>
            <Text style={styles.address}>{property.address}</Text>
            <Text style={styles.price}>{money(property.amount)}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  router.push(`/(tabs)/properties/update/${property.id}` as any)
                }
              >
                <Text style={styles.primaryText}>Update Property</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  router.push(`/(tabs)/properties/appointments/${property.id}` as any)
                }
              >
                <Text style={styles.secondaryText}>Appointments</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Section title="Basic Information" icon="home-city-outline">
            <DetailRow label="Property ID" value={property.id} />
            <DetailRow label="Address" value={property.address} />
            <DetailRow label="State" value={property.state?.name || property.state_name} />
            <DetailRow label="Area" value={property.area?.name || property.area_name} />
            <DetailRow label="Meeting Place" value={property.meeting_place} />
            <DetailRow label="Amount" value={money(property.amount)} />
            <DetailRow label="Agent Fee" value={money(property.agent_fee)} />
            <DetailRow label="Fence" value={property.fence?.name || property.fence_name} />
            <DetailRow
              label="Listing Role"
              value={
                property.listing_role?.name ||
                property.registration_status?.name ||
                property.listing_role_name
              }
            />
            <DetailRow
              label="Date Listed"
              value={
                property.created_at
                  ? new Date(property.created_at).toLocaleDateString()
                  : "Not provided"
              }
            />
          </Section>

          {isRental && (
            <Section title="Rental Details" icon="key-outline">
              <DetailRow label="Building" value={rental.building?.name || property.building?.name} />
              <DetailRow
                label="Building Type"
                value={rental.building_type?.name || property.building_type?.name}
              />
              <DetailRow label="Flat Type" value={rental.flat_type?.name || property.flat_type?.name} />
              <DetailRow label="Ground Floor" value={boolText(rental.groundfloor)} />
              <DetailRow label="First Floor" value={boolText(rental.firstfloor)} />
              <DetailRow label="Second Floor" value={boolText(rental.secondfloor)} />
              <DetailRow label="Third Floor" value={boolText(rental.thirdfloor)} />
              <DetailRow label="Fourth Floor" value={boolText(rental.fourthfloor)} />
              <DetailRow label="Dining" value={boolText(rental.dining)} />
              <DetailRow label="Electricity" value={boolText(rental.electricity)} />
              <DetailRow label="Car Parking Space" value={boolText(rental.car_parking_space)} />
              <DetailRow label="Kitchen" value={boolText(rental.kitchen)} />
              <DetailRow label="Kitchen Cabinet" value={boolText(rental.kitchen_cabinet)} />
              <DetailRow label="Wardrobe" value={boolText(rental.wardrobe)} />
              <DetailRow label="Wardrobe Cabinet" value={boolText(rental.wardrobe_cabinet)} />
              <DetailRow label="Compound Cleaner" value={boolText(rental.compound_cleaner)} />
              <DetailRow label="Suite Rooms" value={rental.suite || property.suite} />
              <DetailRow label="POP" value={rental.pop?.name || property.pop?.name} />
              <DetailRow
                label="Type of Meter"
                value={rental.typeof_meter?.name || property.typeof_meter?.name}
              />
              <DetailRow
                label="Overhead Tank"
                value={rental.overhead_tank?.name || property.overhead_tank?.name}
              />
              <DetailRow label="Well" value={rental.well?.name || property.well?.name} />
              <DetailRow label="Security" value={rental.security?.name || property.security?.name} />
              <DetailRow label="Number of Toilet" value={rental.toilet || property.toilet} />
              <DetailRow label="Caution Fee" value={money(rental.caution_fee || property.caution_fee)} />
              <DetailRow label="Security Fee" value={money(rental.security_fee || property.security_fee)} />
              <DetailRow label="Cleaning Fee" value={money(rental.cleaning_fee || property.cleaning_fee)} />
              <DetailRow
                label="Rent Payment Method"
                value={rental.rentpayment_method?.name || property.rentpayment_method?.name}
              />
            </Section>
          )}

          {isHouseSale && (
            <Section title="House Sale Details" icon="home-modern">
              <DetailRow label="Building Type" value={houseSale.building_type?.name || property.building_type?.name} />
              <DetailRow label="Building" value={houseSale.building?.name || property.building?.name} />
              <DetailRow label="Number of Units" value={houseSale.number_of_units || property.number_of_units} />
              <DetailRow
                label="Status of Building"
                value={houseSale.building_status?.name || property.building_status?.name}
              />
              <DetailRow label="Measurement" value={houseSale.measurement || property.measurement} />
              <DetailRow label="Proof of Ownership" value={boolText(houseSale.proof_of_ownership || property.proof_of_ownership)} />
              <DetailRow label="C of O" value={boolText(houseSale.c_of_o || property.c_of_o)} />
            </Section>
          )}

          {isLandSale && (
            <Section title="Land Sale Details" icon="map-marker-radius-outline">
              <DetailRow label="Measurement" value={landSale.measurement || property.measurement} />
              <DetailRow label="Security Type" value={landSale.security?.name || property.security?.name} />
              <DetailRow label="Security Fee" value={money(landSale.security_fee || property.security_fee)} />
              <DetailRow label="Access Road" value={boolText(landSale.access_road || property.access_road)} />
              <DetailRow label="Survey Plan" value={boolText(landSale.survey_plan || property.survey_plan)} />
              <DetailRow label="C of O" value={boolText(landSale.c_of_o || property.c_of_o)} />
            </Section>
          )}

          <Section title="Media" icon="image-multiple-outline">
            <MediaImage title="Whole Building" path={media.wholeBuilding || media.whole_building || property.wholeBuilding} />
            <MediaImage title="Sitting Room" path={media.sittingRoom || media.sitting_room || property.sittingRoom} />
            <MediaImage title="Kitchen" path={media.kitchenImage || media.kitchen_image || property.kitchenImage} />
            <MediaImage title="Room" path={media.room || property.room} />
            <MediaImage title="Toilet" path={media.toiletImage || media.toilet_image || property.toiletImage} />

            {media.video || property.video ? (
              <TouchableOpacity style={styles.linkBtn} onPress={() => openUrl(imageUrl(media.video || property.video) || "")}>
                <Text style={styles.linkText}>Open Property Video</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.muted}>No property video uploaded.</Text>
            )}
          </Section>

          <Section title="Enhancements" icon="cube-scan">
            <DetailRow label="Virtual Tour URL" value={property.virtual_tour_url} />

            {property.virtual_tour_url ? (
              <TouchableOpacity style={styles.linkBtn} onPress={() => openUrl(property.virtual_tour_url)}>
                <Text style={styles.linkText}>Open 3D Virtual Tour</Text>
              </TouchableOpacity>
            ) : null}

            {documents.floor_plan || property.floor_plan ? (
              <TouchableOpacity style={styles.linkBtn} onPress={() => openUrl(imageUrl(documents.floor_plan || property.floor_plan) || "")}>
                <Text style={styles.linkText}>Open Floor Plan</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.muted}>No floor plan uploaded.</Text>
            )}

            {documents.three_sixty_video || property.three_sixty_video ? (
              <TouchableOpacity style={styles.linkBtn} onPress={() => openUrl(imageUrl(documents.three_sixty_video || property.three_sixty_video) || "")}>
                <Text style={styles.linkText}>Open 360° Video</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.muted}>No 360° video uploaded.</Text>
            )}
          </Section>

          <Section title="Verification & Documents" icon="shield-check-outline">
            <DetailRow label="Proof Document" value={documents.proof_document || property.proof_document ? "Uploaded" : "Not uploaded"} />

            {documents.proof_document || property.proof_document ? (
              <TouchableOpacity style={styles.linkBtn} onPress={() => openUrl(imageUrl(documents.proof_document || property.proof_document) || "")}>
                <Text style={styles.linkText}>Open Proof Document</Text>
              </TouchableOpacity>
            ) : null}
          </Section>

          <Section title="GPS Location" icon="crosshairs-gps">
            <DetailRow label="Latitude" value={property.latitude || property.lat} />
            <DetailRow label="Longitude" value={property.longitude || property.long} />

            {property.latitude || property.lat ? (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => {
                  const lat = property.latitude || property.lat;
                  const lng = property.longitude || property.long;
                  openUrl(`https://www.google.com/maps?q=${lat},${lng}`);
                }}
              >
                <Text style={styles.linkText}>Open Location on Map</Text>
              </TouchableOpacity>
            ) : null}
          </Section>

          <View style={{ height: 40 }} />

          <Section title="Interest Form" icon="account-plus">
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => {
                router.push(`/properties/index`);
              }}
            >
              <Text style={styles.linkText}>BACK TO PROPERTIES</Text>
            </TouchableOpacity>
          </Section>
        </ScrollView>
      </ScreenWrapper>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#64748b",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  hero: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    color: "#166534",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    fontWeight: "800",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
  },
  address: {
    color: "#cbd5e1",
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  price: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "900",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  detailRow: {
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "700",
  },
  mediaBox: {
    marginBottom: 14,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  mediaImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  linkBtn: {
    backgroundColor: "#eff6ff",
    padding: 13,
    borderRadius: 14,
    marginTop: 10,
  },
  linkText: {
    color: "#2563eb",
    fontWeight: "900",
    textAlign: "center",
  },
  muted: {
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 8,
  },
});