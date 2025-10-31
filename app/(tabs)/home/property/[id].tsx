import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import API from "@/src/config"; // your axios instance
import { format as formatMoney } from "currency-formatter"; // optional: install if you want nice money formatting
import { logger } from "react-native-logs";

const log = logger.createLogger();


// Helper: safe URL builder for Laravel storage files
const storageUrl = (path) => {
  if (!path) return null;
  // if path already has http(s) return it
  if (/^https?:\/\//.test(path)) return path;
  // many APIs return 'uploads/...' or 'storage/uploads/...'
  // ensure single slash between baseURL and path
  const base = API?.defaults?.baseURL?.replace(/\/$/, "") || "";
  // some backends already return 'storage/...' others return 'uploads/...'
  if (path.startsWith("/")) path = path.slice(1);
  return `${base}/${path}`;
};

// small helper for yes/no
const yesNo = (v) => (v === 1 || v === true || v === "1" ? "Yes" : "No");

// Extract image fields from media and fallback locations
const gatherMediaUrls = (property) => {
  const urls = [];

  // prefer property.media object if present
  const media = property?.media || {};

  // common media keys (from your blade): SittingRoom, sittingRoom, room1..5, kitchenpic, toiletpic, wholeBuilding, image, video (video separate)
  const imageKeys = [
    "wholeBuilding",
    "SittingRoom",
    "sittingRoom",
    "room1",
    "room2",
    "room3",
    "room4",
    "room5",
    "kitchenpic",
    "kitchen",
    "toiletpic",
    "toilet",
    "image",
  ];

  imageKeys.forEach((k) => {
    const v = media[k] ?? property[k] ?? null;
    if (v) {
      const u = storageUrl(v);
      if (u) urls.push({ uri: u, key: k });
    }
  });

  // If no media, try some alternate places
  if (!urls.length && media?.wholeBuilding) {
    urls.push({ uri: storageUrl(media.wholeBuilding), key: "wholeBuilding" });
  }

  return urls;
};

const PropertyRow = ({ label, value, bold = false }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, bold && styles.bold]}>{value ?? "—"}</Text>
  </View>
);

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams(); // expo-router param (or use route.params)
  const router = useRouter();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      // adjust endpoint if needed
      const res = await API.get(`/property/${id}`);
      // If your backend returns { property: { ... } } or just the property, adapt:
      const p = res.data?.property ?? res.data ?? null;
      setProperty(p);
    } catch (e) {
      console.error("Error fetching property:", e);
      Alert.alert("Error", "Failed to load property details.");
    } finally {
      setLoading(false);
    }
  };

  log.info("Property", property);

  const images = useMemo(() => (property ? gatherMediaUrls(property) : []), [property]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading property...</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <Text>No property found.</Text>
      </View>
    );
  }

  // determine type: rent, houseSale, landSale — some backends may include flags like property.rental_detail etc.
  const isRent = !!property.rental_detail || !!property.rentalDetail || !!property.rent || property.rented === 1;
  const isHouseSale = !!property.house_sale || !!property.houseSale || property.houseSale !== undefined;
  const isLandSale = !!property.land_sale || !!property.landSale || property.landSale !== undefined;
console.log("It is rent", property.rental_detail["building_type"]);
 
  // normalize rental detail

  const rental = property.rental_detail ?? property.rentalDetail ?? (property.rental || null);
const building = property.building ?? property.building_type ?? (property.buildingType || null);
const buildingType = property.buildingtype ?? property.building_type ?? (property.buildingType || null);
const flatType = property.flat_type ?? property.flattype ?? (property.flatType || null);

console.log("Building type", buildingType);

  // video url (open externally)
  const videoUrl =
    (property.media && (property.media.video || property.media.video_url)) ||
    property.video ||
    null;

  const openVideo = async (url) => {
    if (!url) return;
    const full = storageUrl(url);
    const supported = await Linking.canOpenURL(full);
    if (supported) {
      Linking.openURL(full);
    } else {
      Alert.alert("Cannot open video", full);
    }
  };

  const onInterest = () => {
    // navigate to interest form: adjust route to your app
    router.push(`/interestform/${property.id}`);
  };

  const onCancel = () => {
    router.replace("/"); // or goBack()
  };

  // helper to format money (fallback simple)
  const formatNaira = (amt) => {
    try {
      if (!amt && amt !== 0) return "—";
      // currency-formatter usage (optional)
      // return formatMoney(Number(amt), { code: "NGN" });
      // simple grouping:
      return `₦${Number(amt).toLocaleString()}`;
    } catch {
      return `${amt}`;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isRent ? "APARTMENT DETAILS" : isHouseSale ? "HOUSE FOR SALE DETAILS" : "LAND FOR SALE DETAILS"}
        </Text>
      </View>

      {/* Image gallery */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
        {images.length ? (
          images.map((img) => (
            <Image key={img.key || img.uri} source={{ uri: img.uri }} style={styles.image} />
          ))
        ) : (
          <View style={styles.noImage}>
            <Text>No images available</Text>
          </View>
        )}

        {/* video thumbnail / link */}
        {videoUrl ? (
          <TouchableOpacity style={styles.videoBtn} onPress={() => openVideo(videoUrl)}>
            <Text style={styles.videoBtnText}>Play Video</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* Details table for Rent */}
      {isRent && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Facilities</Text>

          {/* Building & types */}
          <PropertyRow label="Type of building" value={property.rental_detail?.building?.name || "—"} />
          <PropertyRow label="Number in compound" value={property.rental_detail?.building_in_compound || "—"} />
          <PropertyRow label="Type of apartment" value={ property.rental_detail?.building_type?.name || 
                                   "—"} />

          { (property.rental_detail?.building_type?.name === "Flats" ) && (
            <PropertyRow label="Flat type" value={property.rental_detail?.flat_type?.name || "—"} />
          )}

          { (property.rental_detail?.building_type?.name === "Duplex" ) && (
            <PropertyRow label="Number of rooms" value={`${property.rental_detail?.duplexrooms ?? property.rental_detail?.duplex_rooms ?? "—"} Bedrooms`} />
          )}

          {/* Available floors */}
          <Text style={styles.sectionTitle}>Available floor</Text>
          <PropertyRow label="Ground Floor" value={yesNo(property.rental_detail?.groundfloor ?? property.ground_floor ?? property.groundFloor)} />
          {property.rental_detail?.building?.name === "Upstair" || property.building === "Upstair" ? (
            <>
              <PropertyRow label="First Floor" value={yesNo(property.rental_detail?.firstfloor ?? property.first_floor ?? property.firstFloor)} />
              <PropertyRow label="Second Floor" value={yesNo(property.rental_detail?.secondfloor ?? property.second_floor ?? property.secondFloor)} />
              <PropertyRow label="Third Floor" value={yesNo(property.rental_detail?.thirdfloor ?? property.third_floor ?? property.thirdFloor)} />
              <PropertyRow label="Fourth Floor" value={yesNo(property.rental_detail?.fourthfloor ?? property.fourth_floor ?? property.fourthFloor)} />
              
            </>
          ) : null}

          {/* Facilities available */}
          <Text style={styles.sectionTitle}>Facilities available</Text>
          <PropertyRow label="Dining Space" value={yesNo(property.rental_detail?.dining ?? property.dining)} />
          <PropertyRow label="Electricity" value={yesNo(property.rental_deatil?.electricity)} />
          <PropertyRow label="Fenced" value={property.fence?.name || "None"} />
          <PropertyRow label="Car Parking Space" value={yesNo(property.rental_detail?.car_parking_space ?? property.car_parking_space)} />
          <PropertyRow label="Compound Cleaner" value={yesNo(property.rental_detail?.compoundcleaner)} />
          <PropertyRow label="Kitchen" value={yesNo(property.rental_detail?.kitchen)} />
          <PropertyRow label="Kitchen cabinet" value={yesNo(property.rental_detail?.kitchencabinet)} />
          <PropertyRow label="Woodrope" value={yesNo(property.rental_detail?.woodrope)} />
          <PropertyRow label="Woodrope cabinet" value={yesNo(property.rental_detail?.woodropecabinet)} />
          <PropertyRow label="POP" value={property.rental_detail?.pop?.name ?? property.rental_detail?.pop ?? "None"} />
          <PropertyRow label="Type of meter" value={property.rental_detail?.typeof_meter?.name || "—"} />
          <PropertyRow label="Overhead Tank" value={property.rental_detail?.overheadtank?.name ?? "—"} />
          <PropertyRow label="Well" value={property.rental_detail?.well?.name ?? "—"} />
          <PropertyRow label="Security" value={property.rental_detail?.security?.name ?? "—"} />
          <PropertyRow label="Number of toilets" value={property.rental_detail?.toilet ?? property.toilets ?? "—"} />
          <PropertyRow label="Number of suite rooms" value={property.rental_detail?.suite ?? "—"} />

          <Text style={styles.sectionTitle}>Rent Payment</Text>
          <PropertyRow label="Rent Payment Method" value={property.rental_detail?.rentpaymentmethod?.name || "—"} />
          <PropertyRow label="Rent Amount" value={formatNaira(property.amount)} />

          <Text style={styles.sectionTitle}>Additional Service Charges</Text>
          <PropertyRow label="Barrister fee" value={formatNaira(property.BarrFee ?? property.barrFee ?? property.barr_fee)} />
          <PropertyRow label="Agent fee" value={formatNaira(property.AgentFee ?? property.agentFee ?? property.agent_fee)} />
          <PropertyRow label="Caution fee" value={formatNaira(property.CautionFee ?? property.cautionFee ?? property.rental_detail?.caution_fee)} />
          <PropertyRow label="Security fee" value={formatNaira(property.SecurityFee ?? property.rental_detail?.security_fee)} />
          <PropertyRow label="Compound Cleaning Levy" value={formatNaira(property.CompoundCleaningFee ?? property.rental_detail?.cleaning_fee)} />

          <Text style={styles.sectionTitle}>Address</Text>
          <PropertyRow label="Address of the apartment" value={property.address} />
          <PropertyRow label="LGA" value={property.area?.name} />
          <PropertyRow label="State" value={property.state?.name} />
          <PropertyRow label="Meeting place" value={property.MeetingAddress ?? property.meetingplace ?? property.meeting_place} />
        </View>
      )}

      {/* House for sale */}
      {isHouseSale && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>House Details</Text>
          <PropertyRow label="House ID" value={property.houseId ?? property.house_id} />
          <PropertyRow label="LGA" value={property.area?.name} />
          <PropertyRow label="State" value={property.state?.name} />
          <PropertyRow label="Type of building" value={property.building?.name} />
          <PropertyRow label="Number of building" value={property.number} />
          <PropertyRow label="Type of apartment" value={property.buildingtype?.name} />
          <PropertyRow label="Units of apartment" value={property.unitofapartment} />
          <PropertyRow label="Amount" value={formatNaira(property.amount)} />
          <PropertyRow label="Agent Fee" value={formatNaira(property.agentFee ?? property.agent_fee)} />
          <PropertyRow label="Fenced" value={yesNo(property.fenced)} />
          <PropertyRow label="Proof of ownership" value={yesNo(property.proofOfOwnership ?? property.proof_of_ownership)} />
          <PropertyRow label="C of O" value={yesNo(property.CofO ?? property.cof_o)} />
          <PropertyRow label="Measurement" value={property.measurement} />
          <PropertyRow label="Address" value={property.address} />
          <PropertyRow label="Meeting place" value={property.meetingplace} />
        </View>
      )}

      {/* Land for sale */}
      {isLandSale && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Land Details</Text>
          <PropertyRow label="Land ID" value={property.landId ?? property.land_id} />
          <PropertyRow label="LGA" value={property.area?.name} />
          <PropertyRow label="State" value={property.state?.name} />
          <PropertyRow label="Amount" value={formatNaira(property.amount)} />
          <PropertyRow label="Agent Fee" value={formatNaira(property.agentFee ?? property.agent_fee)} />
          <PropertyRow label="Access Road" value={yesNo(property.accessRoad ?? property.access_road)} />
          <PropertyRow label="Fenced" value={yesNo(property.fenced)} />
          <PropertyRow label="Survey Plan" value={yesNo(property.surveyPlan ?? property.survey_plan)} />
          <PropertyRow label="C of O" value={yesNo(property.CofO ?? property.cof_o)} />
          <PropertyRow label="Measurement" value={property.measurement} />
          <PropertyRow label="Address" value={property.address} />
          <PropertyRow label="Meeting place" value={property.meetingplace} />
        </View>
      )}

      {/* Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onInterest}>
          <Text style={styles.btnText}>I AM INTERESTED</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onCancel}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 60, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  header: { alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#134e4a", marginVertical: 6 },
  gallery: { marginVertical: 10, minHeight: 140 },
  image: { width: 240, height: 160, marginRight: 10, borderRadius: 8, backgroundColor: "#eee" },
  noImage: { width: 240, height: 160, alignItems: "center", justifyContent: "center", backgroundColor: "#eee", borderRadius: 8 },
  videoBtn: { width: 120, height: 160, alignItems: "center", justifyContent: "center", backgroundColor: "#111827", borderRadius: 8, marginRight: 10 },
  videoBtnText: { color: "#fff", fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginVertical: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6, color: "#065f46" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#e6e6e6" },
  rowLabel: { fontSize: 14, color: "#8b1d1d", fontWeight: "700", width: "60%" },
  rowValue: { fontSize: 14, color: "#111827", textAlign: "right", width: "40%" },
  bold: { fontWeight: "800" },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 6 },
  btnPrimary: { backgroundColor: "#84cc16" },
  btnCancel: { backgroundColor: "#ef4444" },
  btnText: { color: "#fff", fontWeight: "700" },
});
