import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import API, {
  BASE_URL,
  AppointmentPreparationResponse,
} from "@/src/services/api";

import Protected from "components/Protected";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type PropertyItem = {
  id: number | string;

  uuid?: string | null;

  amount?: number | string | null;

  address?: string | null;

  meeting_place?: string | null;

  property_type_id?: number | string | null;

  property_type?: {
    id?: number | string;

    name?: string | null;
  } | null;

  area?: {
    id?: number | string;

    name?: string | null;
  } | null;

  state?: {
    id?: number | string;

    name?: string | null;
  } | null;

  rental_detail?: {
    building_type?: {
      name?: string | null;
    } | null;

    flat_type?: {
      name?: string | null;
    } | null;

    building?: {
      name?: string | null;
    } | null;
  } | null;

  house_sale?: {
    building_type?: {
      name?: string | null;
    } | null;

    building?: {
      name?: string | null;
    } | null;
  } | null;

  land_sale?: {
    measurement?: string | null;
  } | null;

  media?: {
    wholeBuilding?: string | null;

    sittingRoom?: string | null;

    kitchen?: string | null;

    room?: string | null;
  } | null;
};

type AppointmentEligibility = {
  allowed: boolean;

  required_escrow?: number;

  current_balance?: number;

  amount_needed?: number;

  property_amount?: number;

  message?: string;
};

type AvailableSlot = {
  date: string;

  start_time: string;

  end_time: string;

  availability_id?: number | string;

  lister_id?: number | string;
};


type AvailableDay = {
  date: string;
  label: string;
  slots: AvailableSlot[];
};


type BookablePropertiesResponse = {
  success?: boolean;

  properties?: PropertyItem[];

  data?: PropertyItem[];

  message?: string;
};

type AvailableSlotsResponse = {
  success?: boolean;

  data?: AvailableSlot[];

  available_slots?: AvailableSlot[];

  message?: string;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeParam(
  value:
    | string
    | string[]
    | undefined
): string | null {
  if (
    Array.isArray(value)
  ) {
    return value[0] || null;
  }

  return value || null;
}

function money(
  value:
    | string
    | number
    | null
    | undefined
): string {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "₦0";
  }

  const amount =
    Number(
      String(value).replace(
        /,/g,
        ""
      )
    );

  if (
    Number.isNaN(amount)
  ) {
    return "₦0";
  }

  return `₦${amount.toLocaleString()}`;
}

function getPropertyLocation(
  property: PropertyItem
): string {
  const parts = [
    property.area?.name,
    property.state?.name,
  ].filter(Boolean);

  if (
    parts.length > 0
  ) {
    return parts.join(", ");
  }

  return "Location available in property details";
}

function getPropertyTitle(
  property: PropertyItem
): string {
  /*
   * Rental
   */

  if (
    Number(
      property.property_type_id
    ) === 1
  ) {
    return (
      property.rental_detail
        ?.flat_type?.name ||
      property.rental_detail
        ?.building_type?.name ||
      property.rental_detail
        ?.building?.name ||
      "Rental Property"
    );
  }

  /*
   * House sale
   */

  if (Number(property.property_type_id) === 2) {
    return (
      property.house_sale
        ?.building_type?.name ||
      property.house_sale
        ?.building?.name ||
      "House for Sale"
    );
  }

  /*
   * Land
   */

  if (Number(property.property_type_id) === 3) {
    return property.land_sale
      ?.measurement
      ? `${property.land_sale.measurement} Land`
      : "Land for Sale";
  }

  return (
    property.property_type
      ?.name ||
    "Property"
  );
}

function calculateOnePercent(
  amount:
    | string
    | number
    | null
    | undefined
): number {
  const numeric =
    Number(
      String(
        amount ?? 0
      ).replace(/,/g, "")
    );

  if (Number.isNaN(numeric) ||  numeric <= 0) {
    return 0;
  }

  return Math.round(
    numeric * 0.01
  );
}

function formatSlotTime(
  value: string
): string {
  if (!value) {
    return "";
  }

  const parts =
    value.split(":");

  if (parts.length < 2) {
    return value;
  }

  const date = new Date();

  date.setHours(
    Number(parts[0])
  );

  date.setMinutes(
    Number(parts[1])
  );

  date.setSeconds(0);

  return date.toLocaleTimeString(
    [],
    {
      hour: "numeric",

      minute: "2-digit",
    }
  );
}

function getImageUrl(
  property: PropertyItem
): string | null {
  const raw =
    property.media
      ?.wholeBuilding ||
    property.media
      ?.sittingRoom ||
    property.media
      ?.kitchen ||
    property.media
      ?.room;

  if (!raw) {
    return null;
  }

  if (
    raw.startsWith("http")
  ) {
    return raw;
  }

  const baseOrigin =
    BASE_URL.replace(
      /\/api\/?$/,
      ""
    );

  return `${baseOrigin}/storage/${raw.replace(
    /^\/+/,
    ""
  )}`;
}



function formatDateKey(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function formatViewingDate(
  value: string
): string {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return date.toLocaleDateString(
    [],
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}


/*
|--------------------------------------------------------------------------
| Main Screen
|--------------------------------------------------------------------------
*/

export default function CustomerCreateAppointment() {
  const router =
    useRouter();

  const params =
    useLocalSearchParams<{
      property_id?:
        | string
        | string[];
    }>();

  /*
   * property_id exists when user comes from:
   *
   * Property Details
   *      ↓
   * I AM INTERESTED
   *      ↓
   * Appointment Create
   */

  const initialPropertyId =
    normalizeParam(
      params.property_id
    );

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */


  const [
  preparation,
  setPreparation,
] =
  useState<AppointmentPreparationResponse | null>(
    null
  );

  const [
    bookableProperties,
    setBookableProperties,
  ] = useState<
    PropertyItem[]
  >([]);

  const [
    selectedProperty,
    setSelectedProperty,
  ] =
    useState<PropertyItem | null>(
      null
    );

  const [eligibility,
    setEligibility,
  ] = useState<AppointmentEligibility | null>(null);


const [
  availableDays,
  setAvailableDays,
] =
  useState<AvailableDay[]>(
    []
  );

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState<AvailableSlot | null>(
      null
    );

  const [
    customerNote,
    setCustomerNote,
  ] =
    useState<string>("");

  const [
    loading,
    setLoading,
  ] =
    useState<boolean>(
      true
    );

  const [
    loadingSlots,
    setLoadingSlots,
  ] =
    useState<boolean>(
      false
    );

  const [
    checkingEligibility,
    setCheckingEligibility,
  ] =
    useState<boolean>(
      false
    );

  const [
    booking,
    setBooking,
  ] =
    useState<boolean>(
      false
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState<boolean>(
      false
    );

  /*
  |--------------------------------------------------------------------------
  | Load initial screen
  |--------------------------------------------------------------------------
  */

  const initialize =
    useCallback(
      async () => {
        try {
          setLoading(true);

          /*
           * PATH 1
           *
           * Property Details
           *      ↓
           * Appointment Create
           *
           * We already know which property
           * customer wants.
           */

          if (initialPropertyId
          ) {
            const response =
              await API.getProperty(
                initialPropertyId
              );

            const property =
              response.data
                ?.property ||
              response.data;

            setSelectedProperty(
              property
            );

            /*
             * Check 1% escrow immediately.
             */

          await prepareAppointment(
            property
          );
          return;
        }

          /*
           * PATH 2
           *
           * Appointment Dashboard
           *      ↓
           * Create Appointment
           *      ↓
           * Show interested/bookable properties.
           */

          await loadBookableProperties();
        } catch (
          error: any
        ) {
          console.error(
            "Appointment initialization error:",
            error?.response
              ?.data ||
              error
          );

          Alert.alert(
            "Unable to continue",
            error?.response?.data
              ?.message ||
              "Unable to prepare appointment booking."
          );
        } finally {
          setLoading(false);

          setRefreshing(
            false
          );
        }
      },
      [
        initialPropertyId,
      ]
    );

  useFocusEffect(
    useCallback(
      () => {
        initialize();
      },
      [
        initialize,
      ]
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Load interested/bookable properties
  |--------------------------------------------------------------------------
  */

  const loadBookableProperties =
    async () => {
      try {
        /*
         * This should return properties:
         *
         * - customer has shown interest in
         * - still available
         * - not owned by customer
         * - allowed for appointment booking
         *
         * Backend is the authority.
         */

        const response =
          await API.getAppointmentBookableProperties();

        const responseData:
          BookablePropertiesResponse =
          response.data;

        const properties =
          responseData
            ?.properties ||
          responseData
            ?.data ||
          [];

        setBookableProperties(
          Array.isArray(
            properties
          )
            ? properties
            : []
        );
      } catch (
        error: any
      ) {
        console.error(
          "Bookable properties error:",
          error?.response
            ?.data ||
            error
        );

        setBookableProperties(
          []
        );

        throw error;
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Choose property
  |--------------------------------------------------------------------------
  */

  const chooseProperty =
  async (
    property: PropertyItem
  ) => {
    setSelectedProperty(
      property
    );

    /*
     * Reset previous appointment choice.
     */
    setAvailableDays(
      []
    );

    setSelectedSlot(
      null
    );

    setEligibility(
      null
    );

    await checkEligibility(
      property
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Check escrow eligibility
  |--------------------------------------------------------------------------
  */

  const checkEligibility =
    async (
      property: PropertyItem
    ) => {
      try {
        setCheckingEligibility(
          true
        );

        const response =
          await API.getAppointmentEligibility(
            property.id
          );

        const data:
          AppointmentEligibility =
          response.data;

        setEligibility(
          data
        );

        /*
         * Do NOT automatically redirect.
         *
         * Show user exactly what is required first.
         */

        if (
          !data.allowed
        ) {
          setAvailableDays([]);

          setSelectedSlot(
            null
          );
        }
      } catch (
        error: any
      ) {
        console.error(
          "Appointment eligibility error:",
          error?.response
            ?.data ||
            error
        );

        setEligibility(
          null
        );

        Alert.alert(
          "Unable to check escrow",
          error?.response?.data
            ?.message ||
            "Unable to check appointment eligibility."
        );
      } finally {
        setCheckingEligibility(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Required escrow
  |--------------------------------------------------------------------------
  |
  | Display server value whenever available.
  |
  | Frontend calculation is only a preview/fallback.
  |
  */

  const requiredEscrow =
    useMemo(() => {
      if (
        eligibility
          ?.required_escrow !==
          undefined
      ) {
        return Number(
          eligibility.required_escrow
        );
      }

      return calculateOnePercent(
        selectedProperty
          ?.amount
      );
    }, [
      eligibility,
      selectedProperty,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Open escrow wallet
  |--------------------------------------------------------------------------
  */

  const goToEscrow =
    () => {
      if (
        !selectedProperty
      ) {
        return;
      }

      router.push({
        pathname:
          "/dashboard/escrow" as never,

        params: {
          propertyId:
            String(
              selectedProperty.id
            ),

          requiredEscrow:
            String(
              requiredEscrow
            ),

          currentBalance:
            String(
              eligibility
                ?.current_balance ??
                0
            ),

          amountNeeded:
            String(
              eligibility
                ?.amount_needed ??
                requiredEscrow
            ),

          message:
            eligibility
              ?.message ||
            "Your escrow balance must meet the appointment requirement before booking.",
        },
      });
    };

  



  useEffect(
  () => {
    if (
      !selectedProperty ||
      !eligibility?.allowed
    ) {
      return;
    }

   
  },
  [
    selectedProperty?.id,
    eligibility?.allowed,
   
  ]
);

  /*
  |--------------------------------------------------------------------------
  | Book appointment
  |--------------------------------------------------------------------------
  */

  const bookAppointment =
    async () => {
      if (
        !selectedProperty
      ) {
        return;
      }

      if (
        !eligibility
          ?.allowed
      ) {
        Alert.alert(
          "Escrow required",
          "You must meet the escrow requirement before booking this property."
        );

        return;
      }

      if (
        !selectedSlot
      ) {
        Alert.alert(
          "Choose viewing time",
          "Select one of the available viewing times."
        );

        return;
      }

      try {
        setBooking(
          true
        );

        /*
         * IMPORTANT:
         *
         * customer_id is NOT sent.
         *
         * Laravel must obtain customer from:
         *
         * $request->user()
         *
         * This prevents customer impersonation.
         */

        const response =
          await API.createAppointment({
            property_id:
              selectedProperty.id,

            appointment_date:
              selectedSlot.date,

            start_time:
              selectedSlot.start_time,

            end_time:
              selectedSlot.end_time,

            customer_note:
              customerNote
                .trim() ||
              null,
          });

        Alert.alert(
          "Appointment requested",
          response.data
            ?.message ||
            "Your property viewing appointment has been submitted.",
          [
            {
              text: "View Appointments",

              onPress: () => {
                router.replace(
                  "/appointment" as never
                );
              },
            },
          ]
        );
      } catch (
        error: any
      ) {
        console.error(
          "Appointment booking error:",
          error?.response
            ?.data ||
            error
        );

        /*
         * Important:
         *
         * Backend checks escrow AGAIN during booking.
         *
         * Even if customer passed the earlier eligibility
         * check, balance may have changed.
         */

        if (
          error?.response
            ?.data?.code ===
          "INSUFFICIENT_ESCROW"
        ) {
          setEligibility(
            error.response
              .data
          );

          Alert.alert(
            "Escrow balance changed",
            error?.response
              ?.data
              ?.message ||
              "Your escrow balance is no longer sufficient for this appointment."
          );

          return;
        }

        if (
          error?.response
            ?.status === 409
        ) {
          Alert.alert(
            "Slot no longer available",
            error?.response
              ?.data
              ?.message ||
              "Someone else has booked this viewing time. Please select another slot."
          );

          setSelectedSlot(null);

       

          return;
        }

        Alert.alert(
          "Could not book appointment",
          error?.response
            ?.data
            ?.message ||
            "Unable to book this appointment."
        );
      } finally {
        setBooking(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const refresh =
    async () => {
      setRefreshing(
        true
      );

      await initialize();
    };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <Protected>
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
            Preparing appointment...
          </Text>
        </View>
      </Protected>
    );
  }



  const prepareAppointment =
  async (
    property: PropertyItem
  ) => {
    try {
      setCheckingEligibility(
        true
      );

      setAvailableDays(
        []
      );

      setSelectedSlot(
        null
      );

      const data =
        await API
          .preparePropertyAppointment(
            property.id
          );

      setPreparation(
        data
      );

      setEligibility({
        allowed:
          data.can_book,

        required_escrow:
          data.required_escrow,

        current_balance:
          data.current_balance,

        amount_needed:
          data.amount_needed,

        message:
          data.message,
      });

      const days =
        data.availability ??
        [];

      setAvailableDays(
        days.map(
          (day) => ({
            date:
              day.date,

            label:
              day.formatted_date,

            slots:
              day.slots,
          })
        )
      );
    } catch (
      error: any
    ) {
      console.error(
        "Appointment preparation error:",
        error?.response
          ?.data ||
          error
      );

      setPreparation(
        null
      );

      setAvailableDays(
        []
      );

      Alert.alert(
        "Unable to prepare appointment",
        error?.response
          ?.data
          ?.message ||
          "Unable to prepare this property for appointment booking."
      );
    } finally {
      setCheckingEligibility(
        false
      );
    }
  };
  /*
  |--------------------------------------------------------------------------
  | Screen
  |--------------------------------------------------------------------------
  */

  return (
    <Protected>
      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          style={
            styles.page
          }
          contentContainerStyle={
            styles.container
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                refresh
              }
            />
          }
        >
          {/*
          |--------------------------------------------------------------------------
          | Header
          |--------------------------------------------------------------------------
          */}

          <View
            style={
              styles.header
            }
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              onPress={() =>
                router.back()
              }
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="#0f172a"
              />
            </TouchableOpacity>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.heading
                }
              >
                Create Appointment
              </Text>

              <Text
                style={
                  styles.headingSubtitle
                }
              >
                Choose a property and one of the lister&apos;s available viewing times.
              </Text>
            </View>
          </View>

          {/*
          |--------------------------------------------------------------------------
          | No property passed:
          | Choose interested property
          |--------------------------------------------------------------------------
          */}

          {!selectedProperty && (
            <>
              <View
                style={
                  styles.sectionHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Choose Property
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Properties you have shown interest in and that are still available for viewing.
                  </Text>
                </View>
              </View>

              {bookableProperties.length ===
              0 ? (
                <View
                  style={
                    styles.emptyCard
                  }
                >
                  <MaterialCommunityIcons
                    name="heart-search"
                    size={42}
                    color="#64748b"
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No interested properties yet
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Open a property from the marketplace and tap I AM INTERESTED to request a viewing.
                  </Text>

                  <TouchableOpacity
                    style={
                      styles.browseButton
                    }
                    onPress={() =>
                      router.push(
                        "/home" as never
                      )
                    }
                  >
                    <Text
                      style={
                        styles.browseButtonText
                      }
                    >
                      Browse Properties
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                bookableProperties.map(
                  (
                    property
                  ) => (
                    <PropertyChoiceCard
                      key={String(
                        property.id
                      )}
                      property={
                        property
                      }
                      onChoose={() =>
                        chooseProperty(
                          property
                        )
                      }
                    />
                  )
                )
              )}
            </>
          )}

          {/*
          |--------------------------------------------------------------------------
          | Selected property
          |--------------------------------------------------------------------------
          */}

          {selectedProperty && (
            <>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Property
              </Text>

              <SelectedPropertyCard
                property={
                  selectedProperty
                }
                canChange={
                  !initialPropertyId
                }
               onChange={() => {
  setSelectedProperty(
    null
  );

  setEligibility(
    null
  );

  setAvailableDays(
    []
  );

  setSelectedSlot(
    null
  );
}}
              />

              {/*
              |--------------------------------------------------------------------------
              | Escrow
              |--------------------------------------------------------------------------
              */}

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    marginTop:
                      22,
                  },
                ]}
              >
                Appointment Escrow
              </Text>

              {checkingEligibility ? (
                <View
                  style={
                    styles.loadingCard
                  }
                >
                  <ActivityIndicator
                    color="#2563eb"
                  />

                  <Text
                    style={
                      styles.loadingCardText
                    }
                  >
                    Checking escrow balance...
                  </Text>
                </View>
              ) : (
                <View
                  style={
                    eligibility?.allowed
                      ? styles.escrowSuccessCard
                      : styles.escrowWarningCard
                  }
                >
                  <View
                    style={
                      styles.escrowHeader
                    }
                  >
                    <MaterialCommunityIcons
                      name={eligibility?.allowed ? "shield-check" : "shield-alert"}
                      size={28}
                      color={
                        eligibility?.allowed
                          ? "#047857"
                          : "#92400e"
                      }
                    />

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={[
                          styles.escrowTitle,

                          {
                            color:
                              eligibility?.allowed
                                ? "#065f46"
                                : "#92400e",
                          },
                        ]}
                      >
                        {eligibility?.allowed
                          ? "Escrow requirement met"
                          : "Escrow deposit required"}
                      </Text>

                      <Text
                        style={
                          styles.escrowDescription
                        }
                      >
                        OHLAM requires an escrow balance equal to 1% of the property amount before a viewing appointment can be booked.
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.moneyRow
                    }
                  >
                    <Text
                      style={
                        styles.moneyLabel
                      }
                    >
                      Property amount
                    </Text>

                    <Text
                      style={
                        styles.moneyValue
                      }
                    >
                      {money(
                        selectedProperty.amount
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.moneyRow
                    }
                  >
                    <Text
                      style={
                        styles.moneyLabel
                      }
                    >
                      Required escrow (1%)
                    </Text>

                    <Text
                      style={
                        styles.moneyValue
                      }
                    >
                      {money(
                        requiredEscrow
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.moneyRow
                    }
                  >
                    <Text
                      style={
                        styles.moneyLabel
                      }
                    >
                      Current escrow balance
                    </Text>

                    <Text
                      style={
                        styles.moneyValue
                      }
                    >
                      {money(
                        eligibility
                          ?.current_balance ??
                          0
                      )}
                    </Text>
                  </View>

                  {!eligibility?.allowed && (
                    <>
                      <View
                        style={
                          styles.moneyRow
                        }
                      >
                        <Text
                          style={
                            styles.moneyLabel
                          }
                        >
                          Amount needed
                        </Text>

                        <Text
                          style={[
                            styles.moneyValue,

                            {
                              color:
                                "#dc2626",
                            },
                          ]}
                        >
                          {money(
                            eligibility
                              ?.amount_needed ??
                              requiredEscrow
                          )}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={
                          styles.fundEscrowButton
                        }
                        onPress={
                          goToEscrow
                        }
                      >
                        <MaterialCommunityIcons
                          name="wallet-plus"
                          size={20}
                          color="#ffffff"
                        />

                        <Text
                          style={
                            styles.fundEscrowText
                          }
                        >
                          Fund Escrow
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/*
              |--------------------------------------------------------------------------
              | Appointment date and slots
              |--------------------------------------------------------------------------
              */}

              {eligibility?.allowed && (
                <>
                  <Text
                    style={[
                      styles.sectionTitle,

                      {
                        marginTop:
                          24,
                      },
                    ]}
                  >
                    Choose Viewing Time
                  </Text>

                

<Text
  style={
    styles.sectionSubtitle
  }
>
  Select one of the lister&apos;s available viewing dates within the next four weeks.
</Text>

{loadingSlots && (
  <View
    style={
      styles.availabilityLoadingCard
    }
  >
    <ActivityIndicator
      color="#2563eb"
    />

    <View
      style={{
        flex: 1,
      }}
    >
      <Text
        style={
          styles.availabilityLoadingTitle
        }
      >
        Checking lister availability
      </Text>

      <Text
        style={
          styles.availabilityLoadingText
        }
      >
        Looking for available viewing times over the next four weeks.
      </Text>
    </View>
  </View>
)}

{!loadingSlots &&
availableDays.length ===
  0 && (
  <View
    style={
      styles.noAvailabilityCard
    }
  >
    <MaterialCommunityIcons
      name="calendar-remove-outline"
      size={34}
      color="#64748b"
    />

    <Text
      style={
        styles.noAvailabilityTitle
      }
    >
      No available viewing dates
    </Text>

    <Text
      style={
        styles.noAvailabilityText
      }
    >
      The lister has not made any viewing times available within the next four weeks.
    </Text>

    <TouchableOpacity
      style={
        styles.refreshAvailabilityButton
      }
    
    >
      <MaterialCommunityIcons
        name="refresh"
        size={19}
        color="#ffffff"
      />

      <Text
        style={
          styles.refreshAvailabilityText
        }
      >
        Check Again
      </Text>
    </TouchableOpacity>
  </View>
)}

{!loadingSlots &&
  availableDays.map(
    (
      day
    ) => (
      <View
        key={
          day.date
        }
        style={
          styles.availableDayCard
        }
      >
        <View
          style={
            styles.availableDayHeader
          }
        >
          <View
            style={
              styles.calendarIconBox
            }
          >
            <MaterialCommunityIcons
              name="calendar"
              size={22}
              color="#2563eb"
            />
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.availableDayTitle
              }
            >
              {day.label}
            </Text>

            <Text
              style={
                styles.availableDayCount
              }
            >
              {day.slots.length}
              {" "}
              {day.slots.length === 1
                ? "available time"
                : "available times"}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.daySlotsContainer
          }
        >
          {day.slots.map(
            (
              slot,
              index
            ) => {
              const selected =
                selectedSlot
                  ?.date ===
                  slot.date &&
                selectedSlot
                  ?.start_time ===
                  slot.start_time &&
                selectedSlot
                  ?.end_time ===
                  slot.end_time;

              return (
                <TouchableOpacity
                  key={`${slot.date}-${slot.start_time}-${slot.end_time}-${index}`}
                  style={[
                    styles.slotCard,

                    selected &&
                      styles.selectedSlotCard,
                  ]}
                  onPress={() =>
                    setSelectedSlot(
                      slot
                    )
                  }
                >
                  <View
                    style={
                      styles.slotTimeRow
                    }
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={19}
                      color={
                        selected
                          ? "#ffffff"
                          : "#2563eb"
                      }
                    />

                    <View>
                      <Text
                        style={[
                          styles.slotTime,

                          selected && {
                            color:
                              "#ffffff",
                          },
                        ]}
                      >
                        {formatSlotTime(
                          slot.start_time
                        )}
                        {" - "}
                        {formatSlotTime(
                          slot.end_time
                        )}
                      </Text>
                    </View>
                  </View>

                  <MaterialCommunityIcons
                    name={
                      selected
                        ? "check-circle"
                        : "circle-outline"
                    }
                    size={23}
                    color={
                      selected
                        ? "#ffffff"
                        : "#2563eb"
                    }
                  />
                </TouchableOpacity>
              );
            }
          )}
        </View>
      </View>
    )
  )}

 
                  {/*
                  |--------------------------------------------------------------------------
                  | Note
                  |--------------------------------------------------------------------------
                  */}

                  <Text
                    style={[
                      styles.label,

                      {
                        marginTop:
                          20,
                      },
                    ]}
                  >
                    Note to Lister
                    {" "}
                    <Text
                      style={
                        styles.optional
                      }
                    >
                      optional
                    </Text>
                  </Text>

                  <TextInput
                    value={
                      customerNote
                    }
                    onChangeText={
                      setCustomerNote
                    }
                    placeholder="Example: I would like to inspect the property before making a decision."
                    placeholderTextColor="#94a3b8"
                    style={[
                      styles.input,

                      styles.noteInput,
                    ]}
                    multiline
                    maxLength={
                      500
                    }
                  />

                  {/*
                  |--------------------------------------------------------------------------
                  | Selected summary
                  |--------------------------------------------------------------------------
                  */}

                  {selectedSlot && (
                    <View
                      style={
                        styles.summaryCard
                      }
                    >
                      <MaterialCommunityIcons
                        name="calendar-check"
                        size={24}
                        color="#047857"
                      />

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.summaryTitle
                          }
                        >
                          Viewing selected
                        </Text>

                        <Text
                          style={
                            styles.summaryText
                          }
                        >
                          {selectedSlot.date}
                          {" · "}
                          {formatSlotTime(
                            selectedSlot.start_time
                          )}
                          {" - "}
                          {formatSlotTime(
                            selectedSlot.end_time
                          )}
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.bookButton,

                      (!selectedSlot ||
                        booking) &&
                        styles.disabledButton,
                    ]}
                    disabled={
                      !selectedSlot ||
                      booking
                    }
                    onPress={
                      bookAppointment
                    }
                  >
                    {booking ? (
                      <ActivityIndicator
                        color="#ffffff"
                      />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="calendar-check"
                          size={21}
                          color="#ffffff"
                        />

                        <Text
                          style={
                            styles.bookButtonText
                          }
                        >
                          Request Appointment
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View
                    style={
                      styles.safetyCard
                    }
                  >
                    <MaterialCommunityIcons
                      name="shield-lock"
                      size={22}
                      color="#1e40af"
                    />

                    <Text
                      style={
                        styles.safetyText
                      }
                    >
                      Keep appointment communication and payments inside OHLAM. Do not send money directly to a lister or share private contact details unnecessarily.
                    </Text>
                  </View>
                </>
              )}
            </>
          )}

          <View
            style={{
              height: 50,
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Protected>
  );
}

/*
|--------------------------------------------------------------------------
| Property Choice Card
|--------------------------------------------------------------------------
*/

function PropertyChoiceCard({
  property,
  onChoose,
}: {
  property: PropertyItem;

  onChoose: () => void;
}) {
  const imageUrl =
    getImageUrl(
      property
    );

  return (
    <View
      style={
        styles.propertyCard
      }
    >
      <View
        style={
          styles.propertyImageContainer
        }
      >
        {imageUrl ? (
          <Image
            source={{
              uri: imageUrl,
            }}
            style={
              styles.propertyImage
            }
          />
        ) : (
          <View
            style={
              styles.noImage
            }
          >
            <MaterialCommunityIcons
              name="home-outline"
              size={36}
              color="#94a3b8"
            />
          </View>
        )}

        <View
          style={
            styles.interestedBadge
          }
        >
          <MaterialCommunityIcons
            name="heart"
            size={14}
            color="#dc2626"
          />

          <Text
            style={
              styles.interestedText
            }
          >
            Interested
          </Text>
        </View>
      </View>

      <View
        style={
          styles.propertyBody
        }
      >
        <Text
          style={
            styles.propertyTitle
          }
        >
          {getPropertyTitle(
            property
          )}
        </Text>

        <Text
          style={
            styles.propertyLocation
          }
        >
          {getPropertyLocation(
            property
          )}
        </Text>

        <Text
          style={
            styles.propertyAmount
          }
        >
          {money(
            property.amount
          )}
        </Text>

        <Text
          style={
            styles.escrowPreview
          }
        >
          Viewing escrow requirement:{" "}
          {money(
            calculateOnePercent(
              property.amount
            )
          )}
        </Text>

        <TouchableOpacity
          style={
            styles.chooseButton
          }
          onPress={
            onChoose
          }
        >
          <Text
            style={
              styles.chooseButtonText
            }
          >
            Choose
          </Text>

          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Selected Property
|--------------------------------------------------------------------------
*/

function SelectedPropertyCard({
  property,

  canChange,

  onChange,
}: {
  property: PropertyItem;

  canChange: boolean;

  onChange: () => void;
}) {
  const imageUrl =
    getImageUrl(
      property
    );

  return (
    <View
      style={
        styles.selectedPropertyCard
      }
    >
      {imageUrl ? (
        <Image
          source={{
            uri: imageUrl,
          }}
          style={
            styles.selectedPropertyImage
          }
        />
      ) : (
        <View
          style={
            styles.selectedPropertyNoImage
          }
        >
          <MaterialCommunityIcons
            name="home"
            size={32}
            color="#64748b"
          />
        </View>
      )}

      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={
            styles.selectedPropertyTitle
          }
        >
          {getPropertyTitle(
            property
          )}
        </Text>

        <Text
          style={
            styles.selectedPropertyLocation
          }
        >
          {getPropertyLocation(
            property
          )}
        </Text>

        <Text
          style={
            styles.selectedPropertyAmount
          }
        >
          {money(
            property.amount
          )}
        </Text>

        {canChange && (
          <TouchableOpacity
            onPress={
              onChange
            }
          >
            <Text
              style={
                styles.changeProperty
              }
            >
              Choose another property
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    page: {
      flex: 1,

      backgroundColor:
        "#f8fafc",
    },

    container: {
      padding: 18,

      flexGrow: 1,
    },

    center: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding: 20,

      backgroundColor:
        "#f8fafc",
    },

    loadingText: {
      marginTop: 12,

      color: "#64748b",

      fontWeight: "700",
    },

    header: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 12,

      marginBottom: 24,
    },

    backButton: {
      width: 42,

      height: 42,

      borderRadius: 21,

      backgroundColor:
        "#ffffff",

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth: 1,

      borderColor:
        "#e2e8f0",
    },

    heading: {
      fontSize: 26,

      fontWeight: "900",

      color: "#0f172a",
    },

    headingSubtitle: {
      color: "#64748b",

      marginTop: 5,

      lineHeight: 20,

      fontWeight: "600",
    },

    sectionHeader: {
      marginBottom: 14,
    },

    sectionTitle: {
      color: "#0f172a",

      fontSize: 19,

      fontWeight: "900",

      marginBottom: 5,
    },

    sectionSubtitle: {
      color: "#64748b",

      lineHeight: 19,

      fontSize: 13,

      fontWeight: "600",
    },

    /*
    |--------------------------------------------------------------------------
    | Empty
    |--------------------------------------------------------------------------
    */

    emptyCard: {
      backgroundColor:
        "#ffffff",

      padding: 26,

      borderRadius: 20,

      alignItems:
        "center",

      borderWidth: 1,

      borderColor:
        "#e2e8f0",
    },

    emptyTitle: {
      marginTop: 12,

      color: "#0f172a",

      fontSize: 17,

      fontWeight: "900",

      textAlign:
        "center",
    },

    emptyText: {
      color: "#64748b",

      marginTop: 7,

      lineHeight: 20,

      textAlign:
        "center",

      fontWeight: "600",
    },

    browseButton: {
      marginTop: 16,

      backgroundColor:
        "#2563eb",

      paddingHorizontal:
        18,

      paddingVertical:
        12,

      borderRadius: 12,
    },

    browseButtonText: {
      color: "#ffffff",

      fontWeight: "900",
    },

    /*
    |--------------------------------------------------------------------------
    | Property choice
    |--------------------------------------------------------------------------
    */

    propertyCard: {
      backgroundColor:
        "#ffffff",

      borderRadius: 20,

      overflow:
        "hidden",

      marginBottom: 16,

      borderWidth: 1,

      borderColor:
        "#e2e8f0",

      elevation: 2,
    },

    propertyImageContainer: {
      height: 155,

      backgroundColor:
        "#e2e8f0",
    },

    propertyImage: {
      width: "100%",

      height: "100%",
    },

    noImage: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    interestedBadge: {
      position:
        "absolute",

      top: 12,

      left: 12,

      backgroundColor:
        "#ffffff",

      borderRadius: 999,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,

      paddingHorizontal:
        10,

      paddingVertical:
        6,
    },

    interestedText: {
      color: "#991b1b",

      fontSize: 11,

      fontWeight: "900",
    },

    propertyBody: {
      padding: 15,
    },

    propertyTitle: {
      color: "#0f172a",

      fontSize: 18,

      fontWeight: "900",
    },

    propertyLocation: {
      color: "#64748b",

      marginTop: 5,

      fontWeight: "600",
    },

    propertyAmount: {
      color: "#0f172a",

      marginTop: 9,

      fontSize: 20,

      fontWeight: "900",
    },

    escrowPreview: {
      color: "#475569",

      marginTop: 6,

      fontSize: 12,

      fontWeight: "700",
    },

    chooseButton: {
      backgroundColor:
        "#2563eb",

      paddingVertical:
        12,

      paddingHorizontal:
        14,

      borderRadius: 13,

      marginTop: 14,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 5,
    },

    chooseButtonText: {
      color: "#ffffff",

      fontWeight: "900",

      fontSize: 14,
    },

    /*
    |--------------------------------------------------------------------------
    | Selected property
    |--------------------------------------------------------------------------
    */

    selectedPropertyCard:
      {
        backgroundColor:
          "#ffffff",

        borderRadius: 18,

        padding: 12,

        flexDirection:
          "row",

        gap: 12,

        borderWidth: 1,

        borderColor:
          "#e2e8f0",
      },

    selectedPropertyImage:
      {
        width: 92,

        height: 92,

        borderRadius: 14,

        backgroundColor:
          "#e2e8f0",
      },

    selectedPropertyNoImage:
      {
        width: 92,

        height: 92,

        borderRadius: 14,

        backgroundColor:
          "#e2e8f0",

        alignItems:
          "center",

        justifyContent:
          "center",
      },

    selectedPropertyTitle:
      {
        color: "#0f172a",

        fontSize: 16,

        fontWeight: "900",
      },

    selectedPropertyLocation:
      {
        color: "#64748b",

        marginTop: 4,

        fontSize: 12,

        fontWeight: "600",
      },

    selectedPropertyAmount:
      {
        color: "#0f172a",

        marginTop: 7,

        fontSize: 17,

        fontWeight: "900",
      },

    changeProperty: {
      marginTop: 7,

      color: "#2563eb",

      fontSize: 12,

      fontWeight: "900",
    },

    /*
    |--------------------------------------------------------------------------
    | Escrow
    |--------------------------------------------------------------------------
    */

    loadingCard: {
      backgroundColor:
        "#ffffff",

      borderRadius: 16,

      padding: 20,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 10,

      borderWidth: 1,

      borderColor:
        "#e2e8f0",
    },

    loadingCardText: {
      color: "#64748b",

      fontWeight: "700",
    },

    escrowSuccessCard: {
      backgroundColor:
        "#ecfdf5",

      borderWidth: 1,

      borderColor:
        "#a7f3d0",

      borderRadius: 18,

      padding: 16,
    },

    escrowWarningCard: {
      backgroundColor:
        "#fffbeb",

      borderWidth: 1,

      borderColor:
        "#fde68a",

      borderRadius: 18,

      padding: 16,
    },

    escrowHeader: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 10,

      marginBottom: 14,
    },

    escrowTitle: {
      fontSize: 15,

      fontWeight: "900",
    },

    escrowDescription: {
      color: "#475569",

      lineHeight: 18,

      fontSize: 12,

      marginTop: 4,

      fontWeight: "600",
    },

    moneyRow: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      paddingVertical:
        8,

      borderTopWidth: 1,

      borderTopColor:
        "rgba(100,116,139,0.15)",

      gap: 12,
    },

    moneyLabel: {
      color: "#64748b",

      fontSize: 12,

      fontWeight: "700",

      flex: 1,
    },

    moneyValue: {
      color: "#0f172a",

      fontSize: 13,

      fontWeight: "900",
    },

    fundEscrowButton: {
      marginTop: 14,

      backgroundColor:
        "#d97706",

      paddingVertical:
        13,

      borderRadius: 13,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 7,
    },

    fundEscrowText: {
      color: "#ffffff",

      fontWeight: "900",
    },

    /*
    |--------------------------------------------------------------------------
    | Date / Slots
    |--------------------------------------------------------------------------
    */

    label: {
      marginTop: 16,

      marginBottom: 7,

      color: "#334155",

      fontWeight: "800",

      fontSize: 13,
    },

    optional: {
      color: "#94a3b8",

      fontWeight: "600",
    },

    input: {
      backgroundColor:
        "#ffffff",

      borderWidth: 1,

      borderColor:
        "#cbd5e1",

      borderRadius: 13,

      paddingHorizontal:
        14,

      paddingVertical:
        13,

      color: "#0f172a",

      fontSize: 14,
    },

    noteInput: {
      minHeight: 100,

      textAlignVertical:
        "top",
    },

   

   
    slotsContainer: {
      marginTop: 14,

      gap: 9,
    },

    slotCard: {
      backgroundColor:
        "#ffffff",

      borderWidth: 1,

      borderColor:
        "#bfdbfe",

      borderRadius: 14,

      padding: 14,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    selectedSlotCard: {
      backgroundColor:
        "#2563eb",

      borderColor:
        "#2563eb",
    },

    slotTime: {
      color: "#0f172a",

      fontWeight: "900",

      fontSize: 15,
    },

   
    /*
    |--------------------------------------------------------------------------
    | Summary / Booking
    |--------------------------------------------------------------------------
    */

    summaryCard: {
      marginTop: 18,

      backgroundColor:
        "#ecfdf5",

      borderRadius: 14,

      padding: 14,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 10,

      borderWidth: 1,

      borderColor:
        "#a7f3d0",
    },

    summaryTitle: {
      color: "#065f46",

      fontWeight: "900",
    },

    summaryText: {
      marginTop: 3,

      color: "#047857",

      fontSize: 12,

      fontWeight: "700",
    },

    bookButton: {
      marginTop: 20,

      backgroundColor:
        "#16a34a",

      paddingVertical:
        15,

      borderRadius: 14,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 7,
    },

    disabledButton: {
      opacity: 0.5,
    },

    bookButtonText: {
      color: "#ffffff",

      fontWeight: "900",

      fontSize: 15,
    },

    safetyCard: {
      marginTop: 16,

      backgroundColor:
        "#eff6ff",

      borderRadius: 15,

      padding: 14,

      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 9,

      borderWidth: 1,

      borderColor:
        "#bfdbfe",
    },

    safetyText: {
      flex: 1,

      color: "#1e3a8a",

      lineHeight: 19,

      fontSize: 12,

      fontWeight: "600",
    },

    availabilityLoadingCard: {
  marginTop: 16,

  backgroundColor:
    "#eff6ff",

  borderRadius: 16,

  padding: 16,

  flexDirection:
    "row",

  alignItems:
    "center",

  gap: 12,

  borderWidth: 1,

  borderColor:
    "#bfdbfe",
},

availabilityLoadingTitle: {
  color: "#1e3a8a",

  fontWeight: "900",

  fontSize: 14,
},

availabilityLoadingText: {
  color: "#64748b",

  fontWeight: "600",

  fontSize: 12,

  marginTop: 3,

  lineHeight: 17,
},

noAvailabilityCard: {
  marginTop: 16,

  backgroundColor:
    "#ffffff",

  borderRadius: 18,

  padding: 22,

  alignItems:
    "center",

  borderWidth: 1,

  borderColor:
    "#e2e8f0",
},

noAvailabilityTitle: {
  marginTop: 10,

  color: "#0f172a",

  fontWeight: "900",

  fontSize: 16,

  textAlign:
    "center",
},

noAvailabilityText: {
  marginTop: 6,

  color: "#64748b",

  lineHeight: 19,

  textAlign:
    "center",

  fontWeight: "600",

  fontSize: 12,
},

refreshAvailabilityButton: {
  marginTop: 15,

  backgroundColor:
    "#2563eb",

  paddingHorizontal: 18,

  paddingVertical: 11,

  borderRadius: 11,

  flexDirection:
    "row",

  alignItems:
    "center",

  gap: 6,
},

refreshAvailabilityText: {
  color: "#ffffff",

  fontWeight: "900",
},

availableDayCard: {
  marginTop: 15,

  backgroundColor:
    "#ffffff",

  borderRadius: 18,

  borderWidth: 1,

  borderColor:
    "#e2e8f0",

  padding: 14,
},

availableDayHeader: {
  flexDirection:
    "row",

  alignItems:
    "center",

  gap: 10,

  marginBottom: 12,
},

calendarIconBox: {
  width: 42,

  height: 42,

  borderRadius: 12,

  alignItems:
    "center",

  justifyContent:
    "center",

  backgroundColor:
    "#eff6ff",
},

availableDayTitle: {
  color: "#0f172a",

  fontSize: 15,

  fontWeight: "900",
},

availableDayCount: {
  color: "#64748b",

  fontSize: 11,

  fontWeight: "700",

  marginTop: 3,
},

daySlotsContainer: {
  gap: 8,
},

slotTimeRow: {
  flexDirection:
    "row",

  alignItems:
    "center",

  gap: 9,
},
  });