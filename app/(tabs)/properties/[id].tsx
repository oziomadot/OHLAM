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

  /**
   * Load property details
   */
  const loadProperty = async () => {
    try {
      setLoading(true);

      console.log("Loading full property details");

      const res = await API.get<any>(`/properties/${id}`);

      setProperty(res.data?.property || res.data);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Unable to load property details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProperty();
    }

    console.log("Property ID:", id);
  }, [id]);

  /**
   * Safely convert money coming from Laravel/database.
   *
   * Handles:
   * 1500000
   * "1500000"
   * "1,500,000"
   * null
   * undefined
   */
  const numberValue = (value: any): number => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    const cleaned = String(value)
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "");

    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : 0;
  };

  /**
   * Nigerian Naira formatter
   */
  const money = (value: any) => {
    const amount = numberValue(value);

    return `₦${amount.toLocaleString("en-NG", {
      maximumFractionDigits: 2,
    })}`;
  };

  /**
   * Return the first actual value.
   *
   * Unlike ||, this does not accidentally discard 0.
   */
  const firstValue = (...values: any[]) => {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return null;
  };

  const boolText = (value: any) => {
    return value === true ||
      value === 1 ||
      value === "1"
      ? "Yes"
      : "No";
  };

  const getAvailableFloors = (rental: any): string => {
  const floors = [
    {
      label: "Ground Floor",
      value: rental.groundfloor,
    },
    {
      label: "First Floor",
      value: rental.firstfloor,
    },
    {
      label: "Second Floor",
      value: rental.secondfloor,
    },
    {
      label: "Third Floor",
      value: rental.thirdfloor,
    },
    {
      label: "Fourth Floor",
      value: rental.fourthfloor,
    },
  ];

  const availableFloors = floors
    .filter(
      (floor) =>
        floor.value === true ||
        floor.value === 1 ||
        floor.value === "1" ||
        floor.value === "true"
    )
    .map((floor) => floor.label);

  return availableFloors.length > 0
    ? availableFloors.join(", ")
    : "Not provided";
};

  const valueText = (value: any) => {
    return value || value === 0
      ? String(value)
      : "Not provided";
  };

 const resolveMediaUrl = (
  url?: string | null,
  path?: string | null
) => {
  // Preferred: Laravel/R2-generated absolute URL.
  if (
    url &&
    /^https?:\/\//i.test(url)
  ) {
    return url;
  }

  if (!path) {
    return null;
  }

  // Already absolute.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Legacy Laravel public-storage fallback.
  const baseOrigin = BASE_URL.replace(/\/api\/?$/, "");

  const cleanPath = String(path).replace(/^\/+/, "");

  if (cleanPath.startsWith("storage/")) {
    return `${baseOrigin}/${cleanPath}`;
  }

  return `${baseOrigin}/storage/${cleanPath}`;
};

  const openUrl = async (url?: string) => {
    if (!url) return;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Invalid link",
          "This link cannot be opened."
        );
      }
    } catch (error) {
      console.error("Unable to open URL:", error);

      Alert.alert(
        "Unable to open link",
        "The requested link could not be opened."
      );
    }
  };

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: any;
  }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>
        {valueText(value)}
      </Text>
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
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color="#2563eb"
        />

        <Text style={styles.sectionTitle}>
          {title}
        </Text>
      </View>

      {children}
    </View>
  );

  const MediaImage = ({
  title,
  url,
  path,
}: {
  title: string;
  url?: string | null;
  path?: string | null;
}) => {
  const resolvedUrl = resolveMediaUrl(
    url,
    path
  );

  if (!resolvedUrl) {
    return null;
  }

  return (
    <View style={styles.mediaBox}>
      <Text style={styles.mediaTitle}>
        {title}
      </Text>

      <Image
        source={{
          uri: resolvedUrl,
        }}
        style={styles.mediaImage}
        resizeMode="cover"
        onError={(event) => {
          console.log(
            "PROPERTY IMAGE LOAD FAILED:",
            {
              title,
              url: resolvedUrl,
              error: event.nativeEvent.error,
            }
          );
        }}
      />
    </View>
  );
};

  /**
   * Loading
   */
  if (loading) {
    return (
      <Protected>
        <ScreenWrapper>
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color="#2563eb"
            />

            <Text style={styles.loadingText}>
              Loading property details...
            </Text>
          </View>
        </ScreenWrapper>
      </Protected>
    );
  }

  /**
   * Property not found
   */
  if (!property) {
    return (
      <Protected>
        <ScreenWrapper>
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>
              Property not found
            </Text>
          </View>
        </ScreenWrapper>
      </Protected>
    );
  }

  /**
   * Resolve property type
   */
  const propertyType =
    property.property_type?.name ||
    property.propertyType?.name ||
    property.propertyTypes?.name ||
    property.type ||
    property.category ||
    "Property";

  /**
   * Property detail groups
   */
  const rental =
    property.rental_detail ||
    property.rentalDetails ||
    property.rental ||
    {};

  const houseSale =
    property.house_sale_detail ||
    property.houseSaleDetails ||
    property.house_sale ||
    {};

  const landSale =
    property.land_sale_detail ||
    property.landSaleDetails ||
    property.land_sale ||
    {};

  const media = property.media || {};
  const documents = property.documents || {};

  const status =
    property.status?.name ||
    property.status ||
    "Available";

  /**
   * Determine type
   */
  const isRental =
    Number(
      property.propertyTypes ||
        property.property_type_id
    ) === 1 ||
    propertyType.toLowerCase().includes("rent");

  const isHouseSale =
    Number(
      property.propertyTypes ||
        property.property_type_id
    ) === 2 ||
    propertyType.toLowerCase().includes("house");

  const isLandSale =
    Number(
      property.propertyTypes ||
        property.property_type_id
    ) === 3 ||
    propertyType.toLowerCase().includes("land");

  /**
   * ==========================================================
   * RENTAL MOVE-IN COSTS
   * ==========================================================
   *
   * We support both:
   *
   * rental_detail.legal_fee
   *
   * and:
   *
   * property.legal_fee
   *
   * This means the frontend remains compatible while your
   * Laravel API structure evolves.
   */

  const rentAmount = numberValue(property.amount);

  const agentFee = numberValue(
    firstValue(
      rental.agent_fee,
      property.agent_fee
    )
  );

  const legalFee = numberValue(
    firstValue(
      rental.legal_fee,
      property.legal_fee
    )
  );

  const cautionFee = numberValue(
    firstValue(
      rental.caution_fee,
      property.caution_fee
    )
  );

  const securityFee = numberValue(
    firstValue(
      rental.security_fee,
      property.security_fee
    )
  );

  const cleaningFee = numberValue(
    firstValue(
      rental.cleaning_fee,
      property.cleaning_fee
    )
  );

  const additionalFee = numberValue(
    firstValue(
      rental.additional_fee,
      property.additional_fee
    )
  );

  const additionalFeeDescription =
    firstValue(
      rental.additional_fee_description,
      property.additional_fee_description
    );

  /**
   * Total amount renter could initially be asked to pay.
   */
  const estimatedInitialPayment =
    rentAmount +
    agentFee +
    legalFee +
    cautionFee +
    securityFee +
    cleaningFee +
    additionalFee;

  /**
   * Reusable cost row
   */
  const CostRow = ({
    label,
    amount,
    emphasized = false,
  }: {
    label: string;
    amount: number;
    emphasized?: boolean;
  }) => (
    <View
      style={[
        styles.costRow,
        emphasized && styles.costRowEmphasized,
      ]}
    >
      <Text
        style={[
          styles.costLabel,
          emphasized && styles.costLabelEmphasized,
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.costValue,
          emphasized && styles.costValueEmphasized,
        ]}
      >
        {money(amount)}
      </Text>
    </View>
  );

  return (
    <Protected>
      <ScreenWrapper>
        <ScrollView
          contentContainerStyle={styles.container}
        >
          {/* =====================================================
              HERO
          ====================================================== */}

          <View style={styles.hero}>
            <Text style={styles.badge}>
              {status}
            </Text>

            <Text style={styles.title}>
              {propertyType}
            </Text>

            <Text style={styles.address}>
              {property.address}
            </Text>

            <Text style={styles.price}>
              {money(property.amount)}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  router.push(
                    `/(tabs)/properties/update/${property.id}` as any
                  )
                }
              >
                <Text style={styles.primaryText}>
                  Update Property
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  router.push(
                    `/(tabs)/properties/appointments/${property.id}` as any
                  )
                }
              >
                <Text style={styles.secondaryText}>
                  Appointments
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* =====================================================
              BASIC INFORMATION
          ====================================================== */}

          <Section
            title="Basic Information"
            icon="home-city-outline"
          >
          <DetailRow
    label="Property Type"
    value={propertyType}
  />

  <DetailRow
    label={
      isRental
        ? "Rent"
        : "Asking Price"
    }
    value={money(property.amount)}
  />

  <DetailRow
    label="State"
    value={
      property.state?.name ||
      property.state_name
    }
  />

  <DetailRow
    label="Area"
    value={
      property.area?.name ||
      property.area_name
    }
  />

  <DetailRow
    label="Listing Role"
    value={
      property.listingRole?.name ||
      property.listing_role?.name ||
      property.listing_role_name
    }
  />

  <DetailRow
    label="Status"
    value={status}
  />

  <DetailRow
    label="Date Listed"
    value={
      property.created_at
        ? new Date(
            property.created_at
          ).toLocaleDateString()
        : "Not provided"
    }
  />
            <DetailRow
              label="Agent Fee"
              value={money(property.agent_fee)}
            />

            <DetailRow
              label="Fence"
              value={
                property.fence?.name ||
                property.fence_name
              }
            />

           
          
          </Section>

          {/* =====================================================
              MOVE-IN COST BREAKDOWN
              RENTAL ONLY
          ====================================================== */}

          {isRental && (
            <View style={styles.costSection}>
              <View style={styles.costHeader}>
                <View style={styles.costHeaderIcon}>
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={24}
                    color="#166534"
                  />
                </View>

                <View style={styles.costHeaderText}>
                  <Text style={styles.costTitle}>
                    Move-in Cost Breakdown
                  </Text>

                  <Text style={styles.costSubtitle}>
                    Review all declared charges before
                    proceeding with this rental.
                  </Text>
                </View>
              </View>

              <View style={styles.costTable}>
                <CostRow
                  label="Annual Rent"
                  amount={rentAmount}
                />

                <CostRow
                  label="Agent Fee"
                  amount={agentFee}
                />

                <CostRow
                  label="Legal / Tenancy Agreement Fee"
                  amount={legalFee}
                />

                <CostRow
                  label="Caution / Refundable Deposit"
                  amount={cautionFee}
                />

                <CostRow
                  label="Security Fee"
                  amount={securityFee}
                />

                <CostRow
                  label="Cleaning Fee"
                  amount={cleaningFee}
                />

                <CostRow
                  label="Additional Fee"
                  amount={additionalFee}
                />

                <View style={styles.costDivider} />

                <CostRow
                  label="Estimated Initial Payment"
                  amount={estimatedInitialPayment}
                  emphasized
                />
              </View>

              {/* ===============================================
                  ADDITIONAL FEE DISCLOSURE
              ================================================ */}

              {additionalFee > 0 && (
                <View style={styles.additionalFeeBox}>
                  <View
                    style={
                      styles.additionalFeeHeader
                    }
                  >
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={22}
                      color="#92400e"
                    />

                    <Text
                      style={
                        styles.additionalFeeTitle
                      }
                    >
                      Additional Fee Disclosure
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.additionalFeeReasonLabel
                    }
                  >
                    Reason provided by lister
                  </Text>

                  <Text
                    style={
                      styles.additionalFeeReason
                    }
                  >
                    {additionalFeeDescription ||
                      "The lister has not provided an explanation for this additional fee."}
                  </Text>

                  <View style={styles.warningBox}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={22}
                      color="#9a3412"
                      style={
                        styles.warningIcon
                      }
                    />

                    <View
                      style={
                        styles.warningContent
                      }
                    >
                      <Text
                        style={
                          styles.warningTitle
                        }
                      >
                        Lister-declared charge
                      </Text>

                      <Text
                        style={
                          styles.warningText
                        }
                      >
                        This amount is requested by
                        the property lister or an
                        associated party. It is not
                        an OHLAM fee and has not been
                        independently determined by
                        OHLAM to be legally required.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.costInfoBox}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={21}
                  color="#1e40af"
                />

                <Text style={styles.costInfoText}>
                  OHLAM displays declared rental
                  charges separately so you can
                  understand the estimated cost before
                  deciding whether to proceed with the
                  property.
                </Text>
              </View>
            </View>
          )}

          {/* =====================================================
              RENTAL DETAILS
          ====================================================== */}

         {isRental && (
  <Section
    title="Rental Features"
    icon="key-outline"
  >
    <DetailRow
      label="Building Type"
      value={rental.building_type?.name}
    />

    <DetailRow
      label="Building"
      value={rental.building?.name}
    />

    <DetailRow
      label="Flat Type"
      value={rental.flat_type?.name}
    />

<DetailRow
  label="Available Floor"
  value={getAvailableFloors(rental)}
/>
    <DetailRow
      label="Bedrooms / Suite Rooms"
      value={rental.suite}
    />

    <DetailRow
      label="Toilets"
      value={rental.toilet}
    />

    <DetailRow
      label="Kitchen"
      value={boolText(rental.kitchen)}
    />

    <DetailRow
      label="Dining"
      value={boolText(rental.dining)}
    />

    <DetailRow
      label="Electricity"
      value={boolText(rental.electricity)}
    />

    <DetailRow
      label="Parking"
      value={boolText(rental.car_parking_space)}
    />

    <DetailRow
      label="POP Ceiling"
      value={rental.pop?.name}
    />

    <DetailRow
      label="Meter Type"
      value={
        rental.typeof_meter?.name
      }
    />

    <DetailRow
      label="Water Tank"
      value={
        rental.overhead_tank?.name ||
        rental.overheadtank?.name
      }
    />

    <DetailRow
      label="Well"
      value={rental.well?.name}
    />

    <DetailRow
      label="Security"
      value={rental.security?.name}
    />

    <DetailRow
      label="Rent Payment Method"
      value={
        rental.rentpayment_method?.name ||
        rental.rentpaymentmethod?.name
      }
    />
  </Section>
)}

          {/* =====================================================
              HOUSE SALE DETAILS
          ====================================================== */}

          {isHouseSale && (
  <Section
    title="House Details"
    icon="home-modern"
  >
    <DetailRow
      label="Building Type"
      value={
        houseSale
          .building_type
          ?.name
      }
    />

    <DetailRow
      label="Building"
      value={
        houseSale
          .building
          ?.name
      }
    />

    <DetailRow
      label="Number of Units"
      value={
        houseSale
          .number_of_units
      }
    />

    <DetailRow
      label="Building Condition"
      value={
        houseSale
          .building_status
          ?.name
      }
    />

    <DetailRow
      label="Measurement"
      value={
        houseSale.measurement
      }
    />

    <DetailRow
      label="Proof of Ownership Declared"
      value={
        boolText(
          houseSale
            .proof_of_ownership
        )
      }
    />

    <DetailRow
      label="C of O Declared"
      value={
        boolText(
          houseSale.c_of_o
        )
      }
    />
  </Section>
)}          {/* =====================================================
              LAND SALE DETAILS
          ====================================================== */}

          {isLandSale && (
  <Section
    title="Land Details"
    icon="map-marker-radius-outline"
  >
    <DetailRow
      label="Land Measurement"
      value={
        landSale.measurement
      }
    />

    <DetailRow
      label="Access Road"
      value={
        boolText(
          landSale.access_road
        )
      }
    />

    <DetailRow
      label="Security"
      value={
        landSale
          .security
          ?.name
      }
    />

    <DetailRow
      label="Survey Plan Declared"
      value={
        boolText(
          landSale.survey_plan
        )
      }
    />

    <DetailRow
      label="C of O Declared"
      value={
        boolText(
          landSale.cofo ??
          landSale.c_of_o
        )
      }
    />

    {numberValue(
      landSale.security_fee
    ) > 0 && (
      <DetailRow
        label="Security Fee"
        value={
          money(
            landSale.security_fee
          )
        }
      />
    )}
  </Section>
)}
          {/* =====================================================
              MEDIA
          ====================================================== */}

          <Section
  title="Property Photos"
  icon="image-multiple-outline"
>
  <MediaImage
    title={
      isLandSale
        ? "Land / Site"
        : "Whole Building"
    }
    url={media.whole_building_url}
    path={
      media.wholeBuilding ||
      media.whole_building
    }
  />

  {isRental && (
    <>
      <MediaImage
        title="Sitting Room"
        url={media.sitting_room_url}
        path={
          media.sittingRoom ||
          media.sitting_room
        }
      />

      <MediaImage
        title="Kitchen"
        url={media.kitchen_url}
        path={
          media.kitchen ||
          media.kitchenImage ||
          media.kitchen_image
        }
      />

      <MediaImage
        title="Room"
        url={media.room_url}
        path={media.room}
      />

      <MediaImage
        title="Toilet"
        url={media.toilet_url}
        path={
          media.toilet ||
          media.toiletImage ||
          media.toilet_image
        }
      />
    </>
  )}

  {(media.video_url || media.video) && (
    <TouchableOpacity
      style={styles.linkBtn}
      onPress={() =>
        openUrl(
          resolveMediaUrl(
            media.video_url,
            media.video
          ) || ""
        )
      }
    >
      <Text style={styles.linkText}>
        Open Property Video
      </Text>
    </TouchableOpacity>
  )}

  {!media.wholeBuilding &&
    !media.whole_building_url &&
    !media.video &&
    !media.video_url && (
      <Text style={styles.muted}>
        No property media available.
      </Text>
    )}
</Section>

          {/* =====================================================
              ENHANCEMENTS
          ====================================================== */}

          <Section
            title="Enhancements"
            icon="cube-scan"
          >
            <DetailRow
              label="Virtual Tour URL"
              value={property.virtual_tour_url}
            />

            {property.virtual_tour_url ? (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() =>
                  openUrl(
                    property.virtual_tour_url
                  )
                }
              >
                <Text style={styles.linkText}>
                  Open 3D Virtual Tour
                </Text>
              </TouchableOpacity>
            ) : null}

            {documents.floor_plan ||
            property.floor_plan ? (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() =>
                  openUrl(
                    resolveMediaUrl(
                      documents.floor_plan_url,
                      documents.floor_plan ||
                        property.floor_plan
                    ) || ""
                  )
                }
              >
                <Text style={styles.linkText}>
                  Open Floor Plan
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.muted}>
                No floor plan uploaded.
              </Text>
            )}

            {documents.three_sixty_video ||
            property.three_sixty_video ? (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() =>
                  openUrl(
                    resolveMediaUrl(
                      documents.three_sixty_video_url,
                      documents.three_sixty_video ||
                        property.three_sixty_video
                    ) || ""
                  )
                }
              >
                <Text style={styles.linkText}>
                  Open 360° Video
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.muted}>
                No 360° video uploaded.
              </Text>
            )}
          </Section>

          {/* =====================================================
              VERIFICATION
          ====================================================== */}

          <Section
            title="Verification & Documents"
            icon="shield-check-outline"
          >
            <DetailRow
              label="Proof Document"
              value={
                documents.proof_document ||
                property.proof_document
                  ? "Uploaded"
                  : "Not uploaded"
              }
            />

            {documents.proof_document ||
            property.proof_document ? (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() =>
                  openUrl(
                    resolveMediaUrl(
                      documents.proof_document_url,
                      documents.proof_document ||
                        property.proof_document
                    ) || ""
                  )
                }
              >
                <Text style={styles.linkText}>
                  Open Proof Document
                </Text>
              </TouchableOpacity>
            ) : null}
          </Section>

          {/* =====================================================
              GPS LOCATION
          ====================================================== */}

          <Section
            title="GPS Location"
            icon="crosshairs-gps"
          >
            <DetailRow
              label="Latitude"
              value={
                property.latitude ||
                property.lat
              }
            />

            <DetailRow
              label="Longitude"
              value={
                property.longitude ||
                property.long
              }
            />

            {property.latitude ||
            property.lat ? (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => {
                  const lat =
                    property.latitude ||
                    property.lat;

                  const lng =
                    property.longitude ||
                    property.long;

                  openUrl(
                    `https://www.google.com/maps?q=${lat},${lng}`
                  );
                }}
              >
                <Text style={styles.linkText}>
                  Open Location on Map
                </Text>
              </TouchableOpacity>
            ) : null}
          </Section>

          <View style={{ height: 40 }} />

          {/* =====================================================
              BACK
          ====================================================== */}

          <Section
            title="Interest Form"
            icon="account-plus"
          >
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => {
                // router.push(
                //   `/properties/index`
                // );
router.back();

              }}
            >
              <Text style={styles.linkText}>
                BACK TO PROPERTIES
              </Text>
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

  /**
   * =========================================================
   * MOVE-IN COST BREAKDOWN
   * =========================================================
   */

  costSection: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dcfce7",
    elevation: 2,
  },

  costHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  costHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  costHeaderText: {
    flex: 1,
  },

  costTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },

  costSubtitle: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
  },

  costTable: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 12,
  },

  costRowEmphasized: {
    borderBottomWidth: 0,
    backgroundColor: "#ecfdf5",
    marginHorizontal: -14,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },

  costLabel: {
    flex: 1,
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  costValue: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },

  costLabelEmphasized: {
    color: "#166534",
    fontSize: 15,
    fontWeight: "900",
  },

  costValueEmphasized: {
    color: "#166534",
    fontSize: 18,
    fontWeight: "900",
  },

  costDivider: {
    height: 2,
    backgroundColor: "#cbd5e1",
  },

  /**
   * ADDITIONAL FEE
   */

  additionalFeeBox: {
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
  },

  additionalFeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
  },

  additionalFeeTitle: {
    color: "#78350f",
    fontSize: 16,
    fontWeight: "900",
  },

  additionalFeeReasonLabel: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 5,
  },

  additionalFeeReason: {
    color: "#451a03",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 14,
  },

  warningBox: {
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fed7aa",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  warningIcon: {
    marginRight: 9,
    marginTop: 1,
  },

  warningContent: {
    flex: 1,
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#9a3412",
    marginBottom: 4,
  },

  warningText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#7c2d12",
    fontWeight: "600",
  },

  costInfoBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  costInfoText: {
    flex: 1,
    color: "#1e3a8a",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },

  /**
   * MEDIA
   */

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