import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import API from "@/src/services/api";
import Navbar from "components/Navbar";
import ScreenWrapper from "components/ScreenWrapper";

const baseOrigin = () =>
  (API?.defaults?.baseURL || "").replace(/\/$/, "").replace(/\/api\/?$/, "");

const storageUrl = (path?: string | null) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;

  const clean = path.replace(/^\/+/, "");
  if (clean.startsWith("storage/")) return `${baseOrigin()}/${clean}`;

  return `${baseOrigin()}/storage/${clean}`;
};

const yesNo = (v: any) => (v === true || v === 1 || v === "1" ? "Yes" : "No");

const money = (v: any) => {
  if (v === null || v === undefined || v === "") return "—";
  return `₦${Number(String(v).replace(/,/g, "")).toLocaleString()}`;
};

const Row = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value ?? "—"}</Text>
  </View>
);

const Section = ({ title, children }: any) => (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const res = await API.getProperty(id);
      setProperty(res.data?.property || res.data);
    } catch (error: any) {
      console.log("PROPERTY DETAIL ERROR:", error?.response?.data || error?.message);
      Alert.alert("Error", "Failed to load property details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProperty();
  }, [id]);

  const images = useMemo(() => {
    if (!property?.media) return [];

    const media = property.media;

    return [
      ["Whole Building", media.wholeBuilding],
      ["Sitting Room", media.sittingRoom],
      ["Kitchen", media.kitchen],
      ["Room", media.room],
      ["Toilet", media.toilet],
      ["Floor Plan", media.floor_plan],
    ]
      .map(([title, path]: any) => ({
        title,
        uri: storageUrl(path),
      }))
      .filter((item) => item.uri);
  }, [property]);

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text>Loading property...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!property) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text>No property found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const typeId = Number(property.property_type_id);

  const isRental = typeId === 1;
  const isHouseSale = typeId === 2;
  const isLandSale = typeId === 3;

  const rental = property.rental_detail || {};
  const houseSale = property.house_sale || {};
  const landSale = property.land_sale || {};
  const media = property.media || {};

  const statusCode = property.status?.code?.toLowerCase();
  const statusName = property.status?.name || "Pending";

  const isAvailable = statusCode === "available";

  const isFlagged =
    property.is_hidden ||
    property.duplicate_flagged ||
    Number(property.risk_score || 0) >= 100 ||
    statusCode === "flagged";

  const canContact = isAvailable && !isFlagged;

  const title = isRental
    ? "Apartment / Rental Details"
    : isHouseSale
    ? "House for Sale Details"
    : isLandSale
    ? "Land for Sale Details"
    : "Property Details";

  const openLink = async (url?: string | null) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert("Invalid link", "This link cannot be opened.");
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container}>
        <Navbar />

        <View style={styles.header}>
          <Text style={styles.statusBadge}>{statusName}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.price}>{money(property.amount)}</Text>
          <Text style={styles.location}>
            {property.area?.name || "Area"}, {property.state?.name || "State"}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {images.length ? (
            images.map((img) => (
              <View key={img.uri} style={styles.imageBox}>
                <Image source={{ uri: img.uri }} style={styles.image} />
                <Text style={styles.imageLabel}>{img.title}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noImage}>
              <Text>No images available</Text>
            </View>
          )}
        </ScrollView>

        <Section title="Basic Information">
          <Row label="Property ID" value={property.id} />
          <Row label="Property Type" value={property.property_type?.name} />
          <Row label="Address" value={property.address} />
          <Row label="Meeting Place" value={property.meeting_place} />
          <Row label="Amount" value={money(property.amount)} />
          <Row label="Agent Fee" value={money(property.agent_fee)} />
          <Row label="Fence" value={property.fence?.name} />
          <Row label="Listed By" value={property.listing_role?.name || "Property Lister"} />
        </Section>

        {isRental && (
          <Section title="Rental Details">
            <Row label="Building" value={rental.building?.name} />
            <Row label="Building Type" value={rental.building_type?.name} />
            <Row label="Flat Type" value={rental.flat_type?.name} />
            <Row label="Building in Compound" value={rental.building_in_compound} />
            <Row label="Ground Floor" value={yesNo(rental.groundfloor)} />
            <Row label="First Floor" value={yesNo(rental.firstfloor)} />
            <Row label="Second Floor" value={yesNo(rental.secondfloor)} />
            <Row label="Third Floor" value={yesNo(rental.thirdfloor)} />
            <Row label="Fourth Floor" value={yesNo(rental.fourthfloor)} />
            <Row label="Dining" value={yesNo(rental.dining)} />
            <Row label="Electricity" value={yesNo(rental.electricity)} />
            <Row label="Car Parking Space" value={yesNo(rental.car_parking_space)} />
            <Row label="Kitchen" value={yesNo(rental.kitchen)} />
            <Row label="Kitchen Cabinet" value={yesNo(rental.kitchen_cabinet)} />
            <Row label="Wardrobe" value={yesNo(rental.wardrope)} />
            <Row label="Wardrobe Cabinet" value={yesNo(rental.wardrope_cabinet)} />
            <Row label="Compound Cleaner" value={yesNo(rental.compound_cleaner)} />
            <Row label="POP" value={rental.pop?.name} />
            <Row label="Meter Type" value={rental.typeof_meter?.name} />
            <Row label="Overhead Tank" value={rental.overheadtank?.name} />
            <Row label="Well" value={rental.well?.name} />
            <Row label="Security" value={rental.security?.name} />
            <Row label="Toilets" value={rental.toilet} />
            <Row label="Suite Rooms" value={rental.suite} />
            <Row label="Rent Payment Method" value={rental.rentpaymentmethod?.name} />
            <Row label="Caution Fee" value={money(rental.caution_fee)} />
            <Row label="Security Fee" value={money(rental.security_fee)} />
            <Row label="Cleaning Fee" value={money(rental.cleaning_fee)} />
          </Section>
        )}

        {isHouseSale && (
          <Section title="House Sale Details">
            <Row label="Building Type" value={houseSale.building_type?.name} />
            <Row label="Building" value={houseSale.building?.name} />
            <Row label="Building Status" value={houseSale.building_status?.name} />
            <Row label="Building in Compound" value={houseSale.building_in_compound} />
            <Row label="Number of Units" value={houseSale.number_of_units} />
            <Row label="Measurement" value={houseSale.measurement} />
            <Row label="Proof of Ownership" value={yesNo(houseSale.proof_of_ownership)} />
            <Row label="C of O" value={yesNo(houseSale.c_of_o)} />
          </Section>
        )}

        {isLandSale && (
          <Section title="Land Sale Details">
            <Row label="Measurement" value={landSale.measurement} />
            <Row label="Security Fee" value={money(landSale.security_fee)} />
            <Row label="Access Road" value={yesNo(landSale.access_road)} />
            <Row label="Survey Plan" value={yesNo(landSale.survey_plan)} />
            <Row label="C of O" value={yesNo(landSale.cofo)} />
          </Section>
        )}

        <Section title="Trust & Verification">
          <Row label="Ownership Verified" value={property.ownership_verified ? "Verified" : "Pending"} />
          <Row label="Agent Trust Score" value={`${property.agent_trust_score ?? 0}/100`} />
          <Row label="Duplicate Check" value={property.duplicate_flagged ? "Flagged" : "Passed"} />
          <Row label="Risk Score" value={property.risk_score ?? 0} />
          <Row label="Risk Reason" value={property.risk_reason || "None"} />
        </Section>

        {(media.video || media.three_sixty_video || property.virtual_tour_url) && (
          <Section title="Videos & Virtual Tour">
            {media.video && (
              <TouchableOpacity style={styles.linkBtn} onPress={() => openLink(storageUrl(media.video))}>
                <Text style={styles.linkText}>Open Property Video</Text>
              </TouchableOpacity>
            )}

            {media.three_sixty_video && (
              <TouchableOpacity style={styles.linkBtn} onPress={() => openLink(storageUrl(media.three_sixty_video))}>
                <Text style={styles.linkText}>Open 360° Video</Text>
              </TouchableOpacity>
            )}

            {property.virtual_tour_url && (
              <TouchableOpacity style={styles.linkBtn} onPress={() => openLink(property.virtual_tour_url)}>
                <Text style={styles.linkText}>Open 3D Virtual Tour</Text>
              </TouchableOpacity>
            )}
          </Section>
        )}

        <View style={styles.buttonContainer}>
          {canContact ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => router.push(`/interestform/${property.id}`)}
            >
              <Text style={styles.btnText}>I AM INTERESTED</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.unavailableBox}>
              <Text style={styles.unavailableTitle}>Property Not Available</Text>
              <Text style={styles.unavailableText}>
                This property is currently {statusName}. You can view details, but you cannot show interest now.
              </Text>
            </View>
          )}

          <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => router.back()}>
            <Text style={styles.btnText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  header: { backgroundColor: "#0f172a", padding: 18, borderRadius: 18, marginBottom: 14 },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    color: "#166534",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    fontWeight: "900",
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: "900", color: "#fff" },
  price: { fontSize: 26, fontWeight: "900", color: "#fff", marginTop: 10 },
  location: { color: "#cbd5e1", marginTop: 8, fontWeight: "700" },
  gallery: { marginVertical: 10, minHeight: 190 },
  imageBox: { marginRight: 10 },
  image: { width: 250, height: 165, borderRadius: 12, backgroundColor: "#e2e8f0" },
  imageLabel: { marginTop: 5, fontWeight: "700", color: "#475569" },
  noImage: {
    width: 250,
    height: 165,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
  },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginVertical: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "900", marginBottom: 8, color: "#065f46" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  rowLabel: { fontSize: 13, color: "#64748b", fontWeight: "800", flex: 1 },
  rowValue: { fontSize: 14, color: "#111827", textAlign: "right", flex: 1, fontWeight: "700" },
  buttonContainer: { marginTop: 16, gap: 12 },
  btn: { padding: 13, borderRadius: 10, alignItems: "center" },
  btnPrimary: { backgroundColor: "#16a34a" },
  btnCancel: { backgroundColor: "#ef4444" },
  btnText: { color: "#fff", fontWeight: "900" },
  linkBtn: { backgroundColor: "#eff6ff", padding: 13, borderRadius: 12, marginTop: 8 },
  linkText: { color: "#2563eb", textAlign: "center", fontWeight: "900" },
  unavailableBox: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    padding: 14,
    borderRadius: 12,
  },
  unavailableTitle: { color: "#9a3412", fontSize: 16, fontWeight: "900", marginBottom: 6 },
  unavailableText: { color: "#9a3412", fontSize: 14, lineHeight: 20 },
});