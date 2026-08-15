import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

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

import {
  useRouter,
  useLocalSearchParams,
} from "expo-router";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import API from "@/src/services/api";
import Navbar from "components/Navbar";
import ScreenWrapper from "components/ScreenWrapper";

import usePreventScreenCapture from "@/hooks/usePreventScreenCapture";
import { useAuth } from "@/context/AuthContext";

/*
|--------------------------------------------------------------------------
| API BASE
|--------------------------------------------------------------------------
*/

const baseOrigin = () =>
  (API?.defaults?.baseURL || "")
    .replace(/\/$/, "")
    .replace(/\/api\/?$/, "");

/*
|--------------------------------------------------------------------------
| MEDIA URL
|--------------------------------------------------------------------------
|
| Preferred:
|
|     Laravel-generated absolute URL
|
| Example:
|
|     https://media.oramexhouseandland.com/...
|
| Fallback:
|
|     old local Laravel /storage/... URL
|
*/

const resolveMediaUrl = (
  url?: string | null,
  path?: string | null
) => {
  /*
   * Laravel-generated URL has priority.
   */
  if (
    url &&
    /^https?:\/\//i.test(url)
  ) {
    return url;
  }

  if (!path) {
    return null;
  }

  /*
   * Existing complete URL.
   */
  if (
    /^https?:\/\//i.test(path)
  ) {
    return path;
  }

  const clean =
    String(path).replace(
      /^\/+/,
      ""
    );

  /*
   * Existing path already contains storage/.
   */
  if (
    clean.startsWith(
      "storage/"
    )
  ) {
    return `${baseOrigin()}/${clean}`;
  }

  /*
   * Legacy public Laravel storage fallback.
   */
  return `${baseOrigin()}/storage/${clean}`;
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const yesNo = (value: any) => {
  return (
    value === true ||
    value === 1 ||
    value === "1"
  )
    ? "Yes"
    : "No";
};

const numberValue = (
  value: any
): number => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const cleaned =
    String(value)
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "");

  const parsed =
    Number(cleaned);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
};

const money = (
  value: any
) => {
  const amount =
    numberValue(value);

  return `₦${amount.toLocaleString(
    "en-NG",
    {
      maximumFractionDigits: 2,
    }
  )}`;
};

const firstValue = (
  ...values: any[]
) => {
  for (
    const value of values
  ) {
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

/*
|--------------------------------------------------------------------------
| ROW
|--------------------------------------------------------------------------
*/

const Row = ({
  label,
  value,
}: {
  label: string;
  value: any;
}) => (
  <View style={styles.row}>
    <Text
      style={styles.rowLabel}
    >
      {label}
    </Text>

    <Text
      style={styles.rowValue}
    >
      {value ??
        "—"}
    </Text>
  </View>
);

/*
|--------------------------------------------------------------------------
| SECTION
|--------------------------------------------------------------------------
*/

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.card}>
    <Text
      style={
        styles.sectionTitle
      }
    >
      {title}
    </Text>

    {children}
  </View>
);

/*
|--------------------------------------------------------------------------
| COST ROW
|--------------------------------------------------------------------------
*/

const CostRow = ({
  label,
  value,
  total = false,
}: {
  label: string;
  value: any;
  total?: boolean;
}) => (
  <View
    style={[
      styles.costRow,

      total &&
        styles.costTotalRow,
    ]}
  >
    <Text
      style={[
        styles.costLabel,

        total &&
          styles.costTotalLabel,
      ]}
    >
      {label}
    </Text>

    <Text
      style={[
        styles.costValue,

        total &&
          styles.costTotalValue,
      ]}
    >
      {money(value)}
    </Text>
  </View>
);

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function PropertyDetailScreen() {
  const {
    id,
  } =
    useLocalSearchParams();

  const router =
    useRouter();

  const {
    isAuthenticated,
    user,
  } =
    useAuth();

  usePreventScreenCapture(
    true
  );

  const [
    property,
    setProperty,
  ] =
    useState<any>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const propertyId =
    Array.isArray(id)
      ? id[0]
      : id;

  /*
  |--------------------------------------------------------------------------
  | LOAD PROPERTY
  |--------------------------------------------------------------------------
  */

  const fetchProperty =
    async () => {
      if (
        !propertyId
      ) {
        return;
      }

      try {
        setLoading(
          true
        );

        const res =
          await API.getProperty(
            propertyId
          );

        const data =
          res.data?.property ||
          res.data;

        console.log(
          "PROPERTY DETAIL:",
          JSON.stringify(
            data,
            null,
            2
          )
        );

        setProperty(
          data
        );
      } catch (
        error: any
      ) {
        console.log(
          "PROPERTY DETAIL ERROR:",
          error
            ?.response
            ?.data ||
            error
              ?.message
        );

        Alert.alert(
          "Error",
          error
            ?.response
            ?.data
            ?.message ||
            "Failed to load property details."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(
    () => {
      if (
        propertyId
      ) {
        fetchProperty();
      }
    },
    [
      propertyId,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | INTEREST
  |--------------------------------------------------------------------------
  */

  const handleInterested =
    async () => {
      if (
        !isAuthenticated
      ) {
        router.push({
          pathname:
            "/login",

          params: {
            redirectTo:
              `/home/property/${property.id}`,
          },
        });

        return;
      }

      try {
        await API.storePropertyInterest(
          property.id
        );

        router.push({
          pathname:
            "/appointment/customer/create",

          params: {
            property_id:
              String(
                property.id
              ),
          },
        });
      } catch (
        error: any
      ) {
        Alert.alert(
          "Unable to continue",

          error
            ?.response
            ?.data
            ?.message ||
            "Could not register your interest in this property."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | MEDIA LIST
  |--------------------------------------------------------------------------
  */

  const images =
    useMemo(
      () => {
        if (
          !property?.media
        ) {
          return [];
        }

        const media =
          property.media;

        const candidates =
          [
            {
              title:
                "Whole Building",

              url:
                media
                  .whole_building_url,

              path:
                media
                  .wholeBuilding ||
                media
                  .whole_building,
            },

            {
              title:
                "Sitting Room",

              url:
                media
                  .sitting_room_url,

              path:
                media
                  .sittingRoom ||
                media
                  .sitting_room,
            },

            {
              title:
                "Kitchen",

              url:
                media
                  .kitchen_url,

              path:
                media
                  .kitchen ||
                media
                  .kitchenImage ||
                media
                  .kitchen_image,
            },

            {
              title:
                "Room",

              url:
                media
                  .room_url,

              path:
                media
                  .room,
            },

            {
              title:
                "Toilet",

              url:
                media
                  .toilet_url,

              path:
                media
                  .toilet ||
                media
                  .toiletImage ||
                media
                  .toilet_image,
            },

            {
              title:
                "Floor Plan",

              url:
                media
                  .floor_plan_url,

              path:
                media
                  .floor_plan,
            },
          ];

        return candidates
          .map(
            (
              item
            ) => ({
              title:
                item.title,

              uri:
                resolveMediaUrl(
                  item.url,
                  item.path
                ),
            })
          )
          .filter(
            (
              item
            ): item is {
              title: string;
              uri: string;
            } =>
              Boolean(
                item.uri
              )
          );
      },
      [
        property,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading
  ) {
    return (
      <ScreenWrapper>
        <View
          style={
            styles.center
          }
        >
          <ActivityIndicator
            size="large"
            color="#2563eb"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading
            property...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (
    !property
  ) {
    return (
      <ScreenWrapper>
        <View
          style={
            styles.center
          }
        >
          <Text
            style={
              styles.emptyText
            }
          >
            No property
            found.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PROPERTY TYPE
  |--------------------------------------------------------------------------
  */

  const typeId =
    Number(
      property
        .property_type_id
    );

  const isRental =
    typeId === 1;

  const isHouseSale =
    typeId === 2;

  const isLandSale =
    typeId === 3;

  const rental =
    property
      .rental_detail ||
    {};

  const houseSale =
    property
      .house_sale ||
    {};

  const landSale =
    property
      .land_sale ||
    {};

  const media =
    property.media ||
    {};

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const statusCode =
    String(
      property
        .status
        ?.code ||
        ""
    )
      .trim()
      .toLowerCase();

  const statusName =
    property
      .status
      ?.display_name ||
    property
      .status
      ?.name ||
    "Pending";

  /*
   * IMPORTANT:
   *
   * Your Laravel code uses:
   *
   * property_available
   *
   * NOT:
   *
   * available
   */
  const isAvailable =
    statusCode ===
      "property_available" ||
    statusCode ===
      "available";

  const isFlagged =
    Boolean(
      property
        .is_hidden
    ) ||
    Boolean(
      property
        .duplicate_flagged
    ) ||
    statusCode ===
      "property_flagged" ||
    statusCode ===
      "flagged" ||
    statusCode ===
      "property_under_investigation";

  /*
   * The owner should not express interest
   * in their own listing.
   */
  const isOwnProperty =
    Boolean(
      user?.id &&
        Number(
          property
            .user_id
        ) ===
          Number(
            user.id
          )
    );

  /*
   * Prefer backend decision if
   * API already provides it.
   */
  const backendCanExpressInterest =
    property
      .can_express_interest;

  const canContact =
    typeof backendCanExpressInterest ===
    "boolean"
      ? backendCanExpressInterest
      : (
          isAvailable &&
          !isFlagged &&
          !isOwnProperty
        );

  const unavailableReason =
    property
      .interest_unavailable_reason ||
    (
      isOwnProperty
        ? "This is your property listing. You cannot register interest in your own property."
        : isFlagged
        ? "This property is currently undergoing review and cannot receive new expressions of interest."
        : !isAvailable
        ? `This property is currently ${statusName}.`
        : "This property is not accepting expressions of interest at this time."
    );

  /*
  |--------------------------------------------------------------------------
  | PAGE TITLE
  |--------------------------------------------------------------------------
  */

  const title =
    isRental
      ? "Apartment / Rental Details"
      : isHouseSale
      ? "House for Sale Details"
      : isLandSale
      ? "Land for Sale Details"
      : "Property Details";

  /*
  |--------------------------------------------------------------------------
  | RENTAL COSTS
  |--------------------------------------------------------------------------
  */

  const rentAmount =
    numberValue(
      property
        .amount
    );

  const agentFee =
    numberValue(
      firstValue(
        rental
          .agent_fee,

        property
          .agent_fee
      )
    );

  const legalFee =
    numberValue(
      firstValue(
        rental
          .legal_fee,

        property
          .legal_fee
      )
    );

  const cautionFee =
    numberValue(
      firstValue(
        rental
          .caution_fee,

        property
          .caution_fee
      )
    );

  const securityFee =
    numberValue(
      firstValue(
        rental
          .security_fee,

        property
          .security_fee
      )
    );

  const cleaningFee =
    numberValue(
      firstValue(
        rental
          .cleaning_fee,

        property
          .cleaning_fee
      )
    );

  const additionalFee =
    numberValue(
      firstValue(
        rental
          .additional_fee,

        property
          .additional_fee
      )
    );

  const additionalFeeDescription =
    firstValue(
      rental
        .additional_fee_description,

      property
        .additional_fee_description
    );

  const totalMoveInCost =
    rentAmount +
    agentFee +
    legalFee +
    cautionFee +
    securityFee +
    cleaningFee +
    additionalFee;

  /*
  |--------------------------------------------------------------------------
  | OPEN LINK
  |--------------------------------------------------------------------------
  */

  const openLink =
    async (
      url?: string | null
    ) => {
      if (
        !url
      ) {
        return;
      }

      try {
        const supported =
          await Linking
            .canOpenURL(
              url
            );

        if (
          supported
        ) {
          await Linking
            .openURL(
              url
            );
        } else {
          Alert.alert(
            "Invalid link",
            "This link cannot be opened."
          );
        }
      } catch (
        error
      ) {
        console.log(
          "OPEN LINK ERROR:",
          error
        );

        Alert.alert(
          "Unable to open link",
          "This link could not be opened."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <ScreenWrapper>
      <ScrollView
        style={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Navbar />

        {/* =====================================================
            HEADER
        ====================================================== */}

        <View
          style={
            styles.header
          }
        >
          <Text
            style={
              styles.statusBadge
            }
          >
            {statusName}
          </Text>

          <Text
            style={
              styles.title
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.price
            }
          >
            {money(
              property
                .amount
            )}
          </Text>

          <Text
            style={
              styles.location
            }
          >
            {property
              .area
              ?.name ||
              "Area"}
            ,{" "}
            {property
              .state
              ?.name ||
              "State"}
          </Text>
        </View>

        {/* =====================================================
            IMAGES
        ====================================================== */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          style={
            styles.gallery
          }
          contentContainerStyle={
            styles.galleryContent
          }
        >
          {images.length >
          0 ? (
            images.map(
              (
                img
              ) => (
                <View
                  key={`${img.title}-${img.uri}`}
                  style={
                    styles.imageBox
                  }
                >
                  <Image
                    source={{
                      uri:
                        img.uri,
                    }}
                    style={
                      styles.image
                    }
                    resizeMode="cover"
                    onError={(
                      event
                    ) => {
                      console.log(
                        "PROPERTY IMAGE FAILED:",
                        {
                          title:
                            img.title,

                          uri:
                            img.uri,

                          error:
                            event
                              .nativeEvent
                              .error,
                        }
                      );
                    }}
                  />

                  <Text
                    style={
                      styles.imageLabel
                    }
                  >
                    {
                      img.title
                    }
                  </Text>
                </View>
              )
            )
          ) : (
            <View
              style={
                styles.noImage
              }
            >
              <MaterialCommunityIcons
                name="image-off-outline"
                size={36}
                color="#94a3b8"
              />

              <Text
                style={
                  styles.noImageText
                }
              >
                No images
                available
              </Text>
            </View>
          )}
        </ScrollView>

        {/* =====================================================
            BASIC INFORMATION
        ====================================================== */}

        <Section
          title="Basic Information"
        >
          <Row
            label="Property ID"
            value={
              property.id
            }
          />

          <Row
            label="Property Type"
            value={
              property
                .property_type
                ?.name ||
              property
                .propertyType
                ?.name
            }
          />

          <Row
            label="Viewing Location"
           value={[
    property.area?.name,
    property.state?.name,
  ]
    .filter(Boolean)
    .join(", ")}
          />

          <Row
            label="Meeting Place"
            value={
              property
                .meeting_place
            }
          />

          <Row
            label="Amount"
            value={
              money(
                property
                  .amount
              )
            }
          />

          <Row
            label="Agent Fee"
            value={
              money(
                property
                  .agent_fee
              )
            }
          />

          <Row
            label="Fence"
            value={
              property
                .fence
                ?.name
            }
          />

          <Row
            label="Listed By"
            value={
              property
                .listing_role
                ?.name ||
              property
                .listingRole
                ?.name ||
              "Property Lister"
            }
          />
        </Section>

        {/* =====================================================
            MOVE-IN COST
        ====================================================== */}

        {isRental && (
          <View
            style={
              styles.costCard
            }
          >
            <View
              style={
                styles.costHeader
              }
            >
              <View
                style={
                  styles.costIcon
                }
              >
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={24}
                  color="#166534"
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.costTitle
                  }
                >
                  Move-in
                  Cost
                  Breakdown
                </Text>

                <Text
                  style={
                    styles.costSubtitle
                  }
                >
                  Review all
                  declared
                  charges before
                  proceeding.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.costTable
              }
            >
              <CostRow
                label="Rent"
                value={
                  rentAmount
                }
              />

              <CostRow
                label="Agent Fee"
                value={
                  agentFee
                }
              />

              <CostRow
                label="Legal / Tenancy Agreement Fee"
                value={
                  legalFee
                }
              />

              <CostRow
                label="Caution / Refundable Deposit"
                value={
                  cautionFee
                }
              />

              <CostRow
                label="Security Fee"
                value={
                  securityFee
                }
              />

              <CostRow
                label="Cleaning Fee"
                value={
                  cleaningFee
                }
              />

              <CostRow
                label="Additional Fee"
                value={
                  additionalFee
                }
              />

              <CostRow
                label="Estimated Initial Payment"
                value={
                  totalMoveInCost
                }
                total
              />
            </View>

            {/* ===============================================
                ADDITIONAL FEE REASON
            ================================================ */}

            {additionalFee >
              0 && (
              <View
                style={
                  styles.additionalFeeBox
                }
              >
                <View
                  style={
                    styles.additionalFeeHeading
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
                    Additional
                    Fee
                  </Text>
                </View>

                <Text
                  style={
                    styles.additionalFeeLabel
                  }
                >
                  Reason
                  provided by
                  lister
                </Text>

                <Text
                  style={
                    styles.additionalFeeReason
                  }
                >
                  {additionalFeeDescription ||
                    "No reason was supplied for this additional fee."}
                </Text>

                <View
                  style={
                    styles.additionalFeeWarning
                  }
                >
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={21}
                    color="#9a3412"
                  />

                  <Text
                    style={
                      styles.additionalFeeWarningText
                    }
                  >
                    This is a
                    lister-declared
                    charge. It is
                    not an OHLAM
                    fee.
                  </Text>
                </View>
              </View>
            )}

            <View
              style={
                styles.costNotice
              }
            >
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={20}
                color="#1e40af"
              />

              <Text
                style={
                  styles.costNoticeText
                }
              >
                OHLAM shows
                declared charges
                separately so
                customers can
                understand the
                estimated cost
                before deciding
                whether to
                proceed.
              </Text>
            </View>
          </View>
        )}

        {/* =====================================================
            RENTAL DETAILS
        ====================================================== */}

        {isRental && (
          <Section
            title="Rental Details"
          >
            <Row
              label="Building"
              value={
                rental
                  .building
                  ?.name
              }
            />

            <Row
              label="Building Type"
              value={
                rental
                  .building_type
                  ?.name
              }
            />

            <Row
              label="Flat Type"
              value={
                rental
                  .flat_type
                  ?.name
              }
            />

            <Row
              label="Building in Compound"
              value={
                rental
                  .building_in_compound
              }
            />

            <Row
              label="Ground Floor"
              value={
                yesNo(
                  rental
                    .groundfloor
                )
              }
            />

            <Row
              label="First Floor"
              value={
                yesNo(
                  rental
                    .firstfloor
                )
              }
            />

            <Row
              label="Second Floor"
              value={
                yesNo(
                  rental
                    .secondfloor
                )
              }
            />

            <Row
              label="Third Floor"
              value={
                yesNo(
                  rental
                    .thirdfloor
                )
              }
            />

            <Row
              label="Fourth Floor"
              value={
                yesNo(
                  rental
                    .fourthfloor
                )
              }
            />

            <Row
              label="Dining"
              value={
                yesNo(
                  rental
                    .dining
                )
              }
            />

            <Row
              label="Electricity"
              value={
                yesNo(
                  rental
                    .electricity
                )
              }
            />

            <Row
              label="Car Parking Space"
              value={
                yesNo(
                  rental
                    .car_parking_space
                )
              }
            />

            <Row
              label="Kitchen"
              value={
                yesNo(
                  rental
                    .kitchen
                )
              }
            />

            <Row
              label="Kitchen Cabinet"
              value={
                yesNo(
                  rental
                    .kitchen_cabinet
                )
              }
            />

            <Row
              label="Wardrobe"
              value={
                yesNo(
                  rental
                    .wardrobe ??
                    rental
                      .wardrope
                )
              }
            />

            <Row
              label="Wardrobe Cabinet"
              value={
                yesNo(
                  rental
                    .wardrobe_cabinet ??
                    rental
                      .wardrope_cabinet
                )
              }
            />

            <Row
              label="Compound Cleaner"
              value={
                yesNo(
                  rental
                    .compound_cleaner
                )
              }
            />

            <Row
              label="POP"
              value={
                rental
                  .pop
                  ?.name
              }
            />

            <Row
              label="Meter Type"
              value={
                rental
                  .typeof_meter
                  ?.name
              }
            />

            <Row
              label="Overhead Tank"
              value={
                rental
                  .overheadtank
                  ?.name ||
                rental
                  .overhead_tank
                  ?.name
              }
            />

            <Row
              label="Well"
              value={
                rental
                  .well
                  ?.name
              }
            />

            <Row
              label="Security"
              value={
                rental
                  .security
                  ?.name
              }
            />

            <Row
              label="Toilets"
              value={
                rental
                  .toilet
              }
            />

            <Row
              label="Suite Rooms"
              value={
                rental
                  .suite
              }
            />

            <Row
              label="Rent Payment Method"
              value={
                rental
                  .rentpaymentmethod
                  ?.name ||
                rental
                  .rentpayment_method
                  ?.name
              }
            />

            <Row
              label="Caution Fee"
              value={
                money(
                  cautionFee
                )
              }
            />

            <Row
              label="Security Fee"
              value={
                money(
                  securityFee
                )
              }
            />

            <Row
              label="Cleaning Fee"
              value={
                money(
                  cleaningFee
                )
              }
            />

            <Row
              label="Legal Fee"
              value={
                money(
                  legalFee
                )
              }
            />

            <Row
              label="Additional Fee"
              value={
                money(
                  additionalFee
                )
              }
            />

            {additionalFee >
              0 && (
              <Row
                label="Additional Fee Reason"
                value={
                  additionalFeeDescription ||
                  "Not provided"
                }
              />
            )}
          </Section>
        )}

        {/* =====================================================
            HOUSE SALE
        ====================================================== */}

        {isHouseSale && (
          <Section
            title="House Sale Details"
          >
            <Row
              label="Building Type"
              value={
                houseSale
                  .building_type
                  ?.name
              }
            />

            <Row
              label="Building"
              value={
                houseSale
                  .building
                  ?.name
              }
            />

            <Row
              label="Building Status"
              value={
                houseSale
                  .building_status
                  ?.name
              }
            />

            <Row
              label="Building in Compound"
              value={
                houseSale
                  .building_in_compound
              }
            />

            <Row
              label="Number of Units"
              value={
                houseSale
                  .number_of_units
              }
            />

            <Row
              label="Measurement"
              value={
                houseSale
                  .measurement
              }
            />

            <Row
              label="Proof of Ownership"
              value={
                yesNo(
                  houseSale
                    .proof_of_ownership
                )
              }
            />

            <Row
              label="C of O"
              value={
                yesNo(
                  houseSale
                    .c_of_o
                )
              }
            />
          </Section>
        )}

        {/* =====================================================
            LAND SALE
        ====================================================== */}

        {isLandSale && (
          <Section
            title="Land Sale Details"
          >
            <Row
              label="Measurement"
              value={
                landSale
                  .measurement
              }
            />

            <Row
              label="Security Fee"
              value={
                money(
                  landSale
                    .security_fee
                )
              }
            />

            <Row
              label="Access Road"
              value={
                yesNo(
                  landSale
                    .access_road
                )
              }
            />

            <Row
              label="Survey Plan"
              value={
                yesNo(
                  landSale
                    .survey_plan
                )
              }
            />

            <Row
              label="C of O"
              value={
                yesNo(
                  landSale
                    .cofo ??
                    landSale
                      .c_of_o
                )
              }
            />
          </Section>
        )}

        {/* =====================================================
            TRUST
        ====================================================== */}

        <Section
          title="Trust & Verification"
        >
          <Row
            label="Ownership Verified"
            value={
              property
                .ownership_verified
                ? "Verified"
                : "Pending"
            }
          />

          <Row
            label="Lister Trust Score"
            value={`${property.agent_trust_score ?? 0}/100`}
          />

          <Row
            label="Duplicate Check"
            value={
              property
                .duplicate_flagged
                ? "Flagged"
                : "Passed"
            }
          />

          <Row
            label="Risk Score"
            value={
              property
                .risk_score ??
              0
            }
          />

          <Row
            label="Risk Reason"
            value={
              property
                .risk_reason ||
              "None"
            }
          />
        </Section>

        {/* =====================================================
            VIDEOS
        ====================================================== */}

        {(
          media.video ||
          media.video_url ||
          media
            .three_sixty_video ||
          media
            .three_sixty_video_url ||
          property
            .virtual_tour_url
        ) && (
          <Section
            title="Videos & Virtual Tour"
          >
            {(
              media.video ||
              media
                .video_url
            ) && (
              <TouchableOpacity
                style={
                  styles.linkBtn
                }
                onPress={() =>
                  openLink(
                    resolveMediaUrl(
                      media
                        .video_url,

                      media
                        .video
                    )
                  )
                }
              >
                <Text
                  style={
                    styles.linkText
                  }
                >
                  Open Property
                  Video
                </Text>
              </TouchableOpacity>
            )}

            {(
              media
                .three_sixty_video ||
              media
                .three_sixty_video_url
            ) && (
              <TouchableOpacity
                style={
                  styles.linkBtn
                }
                onPress={() =>
                  openLink(
                    resolveMediaUrl(
                      media
                        .three_sixty_video_url,

                      media
                        .three_sixty_video
                    )
                  )
                }
              >
                <Text
                  style={
                    styles.linkText
                  }
                >
                  Open 360°
                  Video
                </Text>
              </TouchableOpacity>
            )}

            {property
              .virtual_tour_url && (
              <TouchableOpacity
                style={
                  styles.linkBtn
                }
                onPress={() =>
                  openLink(
                    property
                      .virtual_tour_url
                  )
                }
              >
                <Text
                  style={
                    styles.linkText
                  }
                >
                  Open 3D
                  Virtual Tour
                </Text>
              </TouchableOpacity>
            )}
          </Section>
        )}

        {/* =====================================================
            INTEREST
        ====================================================== */}

        <View
          style={
            styles.buttonContainer
          }
        >
          {canContact ? (
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnPrimary,
              ]}
              onPress={
                handleInterested
              }
            >
              <Text
                style={
                  styles.btnText
                }
              >
                I AM
                INTERESTED
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={
                styles.unavailableBox
              }
            >
              <Text
                style={
                  styles.unavailableTitle
                }
              >
                Interest
                Unavailable
              </Text>

              <Text
                style={
                  styles.unavailableText
                }
              >
                {
                  unavailableReason
                }
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnCancel,
            ]}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.btnText
              }
            >
              Back
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            height: 40,
          }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor:
        "#f8fafc",
    },

    center: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 20,
    },

    loadingText: {
      marginTop: 10,
      color:
        "#64748b",
    },

    emptyText: {
      color:
        "#64748b",
      fontWeight:
        "700",
    },

    header: {
      backgroundColor:
        "#0f172a",
      padding: 18,
      borderRadius: 18,
      marginBottom: 14,
    },

    statusBadge: {
      alignSelf:
        "flex-start",
      backgroundColor:
        "#dcfce7",
      color:
        "#166534",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      fontWeight:
        "900",
      marginBottom: 10,
    },

    title: {
      fontSize: 24,
      fontWeight:
        "900",
      color: "#fff",
    },

    price: {
      fontSize: 26,
      fontWeight:
        "900",
      color: "#fff",
      marginTop: 10,
    },

    location: {
      color:
        "#cbd5e1",
      marginTop: 8,
      fontWeight:
        "700",
    },

    gallery: {
      marginVertical: 10,
      minHeight: 190,
    },

    galleryContent: {
      paddingRight: 10,
    },

    imageBox: {
      marginRight: 10,
    },

    image: {
      width: 250,
      height: 165,
      borderRadius: 12,
      backgroundColor:
        "#e2e8f0",
    },

    imageLabel: {
      marginTop: 5,
      fontWeight:
        "700",
      color:
        "#475569",
    },

    noImage: {
      width: 250,
      height: 165,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#e2e8f0",
      borderRadius: 12,
    },

    noImageText: {
      marginTop: 7,
      color:
        "#64748b",
      fontWeight:
        "700",
    },

    card: {
      backgroundColor:
        "#fff",
      borderRadius: 16,
      padding: 14,
      marginVertical: 8,
      elevation: 2,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight:
        "900",
      marginBottom: 8,
      color:
        "#065f46",
    },

    row: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      paddingVertical: 9,
      borderBottomWidth:
        0.5,
      borderBottomColor:
        "#e5e7eb",
      gap: 12,
    },

    rowLabel: {
      fontSize: 13,
      color:
        "#64748b",
      fontWeight:
        "800",
      flex: 1,
    },

    rowValue: {
      fontSize: 14,
      color:
        "#111827",
      textAlign:
        "right",
      flex: 1,
      fontWeight:
        "700",
    },

    /*
     * COST
     */

    costCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor:
        "#bbf7d0",
      elevation: 2,
    },

    costHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
      marginBottom: 14,
    },

    costIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor:
        "#dcfce7",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    costTitle: {
      color:
        "#0f172a",
      fontSize: 19,
      fontWeight:
        "900",
    },

    costSubtitle: {
      marginTop: 3,
      color:
        "#64748b",
      fontSize: 12,
      lineHeight: 18,
    },

    costTable: {
      borderRadius: 14,
      overflow:
        "hidden",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    costRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",
      backgroundColor:
        "#f8fafc",
      gap: 10,
    },

    costLabel: {
      flex: 1,
      color:
        "#475569",
      fontWeight:
        "700",
      fontSize: 13,
    },

    costValue: {
      color:
        "#0f172a",
      fontWeight:
        "900",
      fontSize: 14,
    },

    costTotalRow: {
      backgroundColor:
        "#ecfdf5",
      borderBottomWidth: 0,
    },

    costTotalLabel: {
      color:
        "#166534",
      fontWeight:
        "900",
    },

    costTotalValue: {
      color:
        "#166534",
      fontSize: 16,
    },

    /*
     * ADDITIONAL FEE
     */

    additionalFeeBox: {
      marginTop: 14,
      backgroundColor:
        "#fffbeb",
      borderWidth: 1,
      borderColor:
        "#fde68a",
      borderRadius: 14,
      padding: 13,
    },

    additionalFeeHeading: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
      marginBottom: 10,
    },

    additionalFeeTitle: {
      color:
        "#78350f",
      fontWeight:
        "900",
      fontSize: 16,
    },

    additionalFeeLabel: {
      color:
        "#92400e",
      fontSize: 11,
      textTransform:
        "uppercase",
      fontWeight:
        "900",
      marginBottom: 5,
    },

    additionalFeeReason: {
      color:
        "#451a03",
      fontSize: 14,
      fontWeight:
        "700",
      lineHeight: 21,
    },

    additionalFeeWarning: {
      marginTop: 12,
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 7,
      padding: 10,
      borderRadius: 10,
      backgroundColor:
        "#fff7ed",
    },

    additionalFeeWarningText: {
      flex: 1,
      color:
        "#9a3412",
      fontWeight:
        "700",
      fontSize: 12,
      lineHeight: 18,
    },

    costNotice: {
      marginTop: 14,
      flexDirection:
        "row",
      gap: 8,
      alignItems:
        "flex-start",
      padding: 11,
      backgroundColor:
        "#eff6ff",
      borderRadius: 12,
    },

    costNoticeText: {
      flex: 1,
      color:
        "#1e3a8a",
      fontSize: 12,
      lineHeight: 18,
      fontWeight:
        "600",
    },

    /*
     * BUTTONS
     */

    buttonContainer: {
      marginTop: 16,
      gap: 12,
    },

    btn: {
      padding: 13,
      borderRadius: 10,
      alignItems:
        "center",
    },

    btnPrimary: {
      backgroundColor:
        "#16a34a",
    },

    btnCancel: {
      backgroundColor:
        "#ef4444",
    },

    btnText: {
      color:
        "#fff",
      fontWeight:
        "900",
    },

    linkBtn: {
      backgroundColor:
        "#eff6ff",
      padding: 13,
      borderRadius: 12,
      marginTop: 8,
    },

    linkText: {
      color:
        "#2563eb",
      textAlign:
        "center",
      fontWeight:
        "900",
    },

    unavailableBox: {
      backgroundColor:
        "#fff7ed",
      borderWidth: 1,
      borderColor:
        "#fed7aa",
      padding: 14,
      borderRadius: 12,
    },

    unavailableTitle: {
      color:
        "#9a3412",
      fontSize: 16,
      fontWeight:
        "900",
      marginBottom: 6,
    },

    unavailableText: {
      color:
        "#9a3412",
      fontSize: 14,
      lineHeight: 20,
    },
  });