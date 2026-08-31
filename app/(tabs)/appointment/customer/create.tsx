import React, {
  useCallback,
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

  property_type_id?:
    | number
    | string
    | null;

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

  availability_id?:
    | number
    | string;

  lister_id?:
    | number
    | string;
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
    Array.isArray(
      value
    )
  ) {
    return (
      value[0] ||
      null
    );
  }

  return (
    value ||
    null
  );
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
      String(
        value
      ).replace(
        /,/g,
        ""
      )
    );

  if (
    Number.isNaN(
      amount
    )
  ) {
    return "₦0";
  }

  return `₦${amount.toLocaleString(
    "en-NG"
  )}`;
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
        amount ??
          0
      ).replace(
        /,/g,
        ""
      )
    );

  if (
    Number.isNaN(
      numeric
    ) ||
    numeric <= 0
  ) {
    return 0;
  }

  return Math.round(
    numeric *
      0.01
  );
}

function getPropertyLocation(
  property: PropertyItem
): string {
  const parts = [
    property.area?.name,
    property.state?.name,
  ].filter(
    Boolean
  );

  if (
    parts.length >
    0
  ) {
    return parts.join(
      ", "
    );
  }

  return "Location available in property details";
}

function getPropertyTitle(
  property: PropertyItem
): string {
  if (
    Number(
      property.property_type_id
    ) === 1
  ) {
    return (
      property
        .rental_detail
        ?.flat_type
        ?.name ||
      property
        .rental_detail
        ?.building_type
        ?.name ||
      property
        .rental_detail
        ?.building
        ?.name ||
      "Rental Property"
    );
  }

  if (
    Number(
      property.property_type_id
    ) === 2
  ) {
    return (
      property
        .house_sale
        ?.building_type
        ?.name ||
      property
        .house_sale
        ?.building
        ?.name ||
      "House for Sale"
    );
  }

  if (
    Number(
      property.property_type_id
    ) === 3
  ) {
    return property
      .land_sale
      ?.measurement
      ? `${property.land_sale.measurement} Land`
      : "Land for Sale";
  }

  return (
    property
      .property_type
      ?.name ||
    "Property"
  );
}

function formatSlotTime(
  value: string
): string {
  if (!value) {
    return "";
  }

  const [
    hourString,
    minuteString,
  ] =
    value.split(
      ":"
    );

  const hour =
    Number(
      hourString
    );

  const minute =
    Number(
      minuteString
    );

  if (
    Number.isNaN(
      hour
    ) ||
    Number.isNaN(
      minute
    )
  ) {
    return value;
  }

  const date =
    new Date();

  date.setHours(
    hour,
    minute,
    0,
    0
  );

  return date.toLocaleTimeString(
    [],
    {
      hour:
        "numeric",

      minute:
        "2-digit",
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
    raw.startsWith(
      "http"
    )
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
  ] =
    useState<
      PropertyItem[]
    >([]);

  const [
    selectedProperty,
    setSelectedProperty,
  ] =
    useState<PropertyItem | null>(
      null
    );

  const [
    eligibility,
    setEligibility,
  ] =
    useState<AppointmentEligibility | null>(
      null
    );

  const [
    availableDays,
    setAvailableDays,
  ] =
    useState<
      AvailableDay[]
    >([]);

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState<string | null>(
      null
    );

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState<AvailableSlot | null>(
      null
    );

  const [
    dateDropdownOpen,
    setDateDropdownOpen,
  ] =
    useState(
      false
    );

  const [
    timeDropdownOpen,
    setTimeDropdownOpen,
  ] =
    useState(
      false
    );

  const [
    customerNote,
    setCustomerNote,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    preparing,
    setPreparing,
  ] =
    useState(
      false
    );

  const [
    booking,
    setBooking,
  ] =
    useState(
      false
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  /*
  |--------------------------------------------------------------------------
  | Selected available day
  |--------------------------------------------------------------------------
  */

  const selectedAvailableDay =
    useMemo(
      () => {
        if (
          !selectedDate
        ) {
          return null;
        }

        return (
          availableDays.find(
            (
              day
            ) =>
              day.date ===
              selectedDate
          ) ||
          null
        );
      },
      [
        availableDays,
        selectedDate,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Bookable properties
  |--------------------------------------------------------------------------
  */

  const loadBookableProperties =
    useCallback(
      async () => {
        const response =
          await API
            .getAppointmentBookableProperties();

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
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Prepare appointment
  |--------------------------------------------------------------------------
  */

  const prepareAppointment =
    useCallback(
      async (
        property: PropertyItem
      ) => {
        try {
          setPreparing(
            true
          );

          setPreparation(
            null
          );

          setEligibility(
            null
          );

          setAvailableDays(
            []
          );

          setSelectedDate(
            null
          );

          setSelectedSlot(
            null
          );

          setDateDropdownOpen(
            false
          );

          setTimeDropdownOpen(
            false
          );

          const data =
            await API
              .preparePropertyAppointment(
                property.id
              );

          setPreparation(
            data
          );

          const escrowSatisfied =
            data.code ===
              "READY_TO_BOOK" ||
            data.code ===
              "LISTER_NO_AVAILABILITY";

          setEligibility({
            allowed:
              escrowSatisfied,

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
            data.availability ||
            [];

          setAvailableDays(
            days.map(
              (
                day
              ) => ({
                date:
                  day.date,

                label:
                  day.formatted_date,

                slots:
                  Array.isArray(
                    day.slots
                  )
                    ? day.slots
                    : [],
              })
            )
          );
        } catch (
          error: any
        ) {
          console.error(
            "Appointment preparation error:",
            error
              ?.response
              ?.data ||
              error
          );

          setPreparation(
            null
          );

          setEligibility(
            null
          );

          setAvailableDays(
            []
          );

          setSelectedDate(
            null
          );

          setSelectedSlot(
            null
          );

          Alert.alert(
            "Unable to prepare appointment",
            error
              ?.response
              ?.data
              ?.message ||
              "Unable to prepare this property for appointment booking."
          );
        } finally {
          setPreparing(
            false
          );
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Initial load
  |--------------------------------------------------------------------------
  */

  const initialize =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          if (
            initialPropertyId
          ) {
            const response =
              await API
                .getProperty(
                  initialPropertyId
                );

            const property =
              response.data
                ?.property ||
              response.data;

            if (
              !property?.id
            ) {
              throw new Error(
                "Property could not be loaded."
              );
            }

            setSelectedProperty(
              property
            );

            await prepareAppointment(
              property
            );

            return;
          }

          await loadBookableProperties();
        } catch (
          error: any
        ) {
          console.error(
            "Appointment initialization error:",
            error
              ?.response
              ?.data ||
              error
          );

          Alert.alert(
            "Unable to continue",
            error
              ?.response
              ?.data
              ?.message ||
              error
                ?.message ||
              "Unable to prepare appointment booking."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        initialPropertyId,
        loadBookableProperties,
        prepareAppointment,
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

      setCustomerNote(
        ""
      );

      await prepareAppointment(
        property
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Required escrow
  |--------------------------------------------------------------------------
  */

  const requiredEscrow =
    useMemo(
      () => {
        if (
          eligibility
            ?.required_escrow !==
          undefined
        ) {
          return Number(
            eligibility
              .required_escrow
          );
        }

        return calculateOnePercent(
          selectedProperty
            ?.amount
        );
      },
      [
        eligibility,
        selectedProperty,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Fund escrow
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
        preparation
          ?.code !==
        "READY_TO_BOOK"
      ) {
        Alert.alert(
          "Appointment not ready",
          preparation
            ?.message ||
            "This appointment cannot currently be booked."
        );

        return;
      }

      if (
        !selectedSlot
      ) {
        Alert.alert(
          "Choose viewing time",
          "Select an available date and viewing time."
        );

        return;
      }

      try {
        setBooking(
          true
        );

        const response =
          await API
            .createAppointment({
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
              text:
                "View Appointments",

              onPress:
                () => {
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
        const data =
          error
            ?.response
            ?.data;

        const code =
          data?.code;

        console.error(
          "Appointment booking error:",
          data ||
            error
        );

        if (
          code ===
          "INSUFFICIENT_ESCROW"
        ) {
          setEligibility({
            allowed:
              false,

            required_escrow:
              data.required_escrow,

            current_balance:
              data.current_balance,

            amount_needed:
              data.amount_needed,

            message:
              data.message,
          });

          setSelectedSlot(
            null
          );

          Alert.alert(
            "Escrow balance changed",
            data?.message ||
              "Your escrow balance is no longer sufficient."
          );

          return;
        }

        if (
          code ===
            "ACTIVE_APPOINTMENT_EXISTS" ||
          code ===
            "EXISTING_APPOINTMENT"
        ) {
          Alert.alert(
            "Appointment already exists",
            data?.message ||
              "You already have an active viewing appointment for this property.",
            [
              {
                text:
                  "View Appointments",

                onPress:
                  () =>
                    router.replace(
                      "/appointment" as never
                    ),
              },
            ]
          );

          await prepareAppointment(
            selectedProperty
          );

          return;
        }

        if (
          code ===
          "PROPERTY_NOT_AVAILABLE"
        ) {
          Alert.alert(
            "Property no longer available",
            data?.message ||
              "This property is no longer available for viewing."
          );

          await prepareAppointment(
            selectedProperty
          );

          return;
        }

        if (
          error
            ?.response
            ?.status ===
          409
        ) {
          Alert.alert(
            "Viewing time changed",
            data?.message ||
              "This viewing time is no longer available. The available times will be refreshed."
          );

          setSelectedSlot(
            null
          );

          setSelectedDate(
            null
          );

          await prepareAppointment(
            selectedProperty
          );

          return;
        }

        Alert.alert(
          "Could not book appointment",
          data?.message ||
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

      try {
        if (
          selectedProperty
        ) {
          await prepareAppointment(
            selectedProperty
          );
        } else {
          await loadBookableProperties();
        }
      } finally {
        setRefreshing(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Change property
  |--------------------------------------------------------------------------
  */

  const clearSelectedProperty =
    () => {
      setSelectedProperty(
        null
      );

      setPreparation(
        null
      );

      setEligibility(
        null
      );

      setAvailableDays(
        []
      );

      setSelectedDate(
        null
      );

      setSelectedSlot(
        null
      );

      setDateDropdownOpen(
        false
      );

      setTimeDropdownOpen(
        false
      );

      setCustomerNote(
        ""
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (
    loading
  ) {
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
          <View
            style={
              styles.header
            }
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              onPress={
                () =>
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
                Choose an available viewing time provided by the property lister.
              </Text>
            </View>
          </View>

          {!selectedProperty && (
            <>
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
                Choose from properties you have shown interest in.
              </Text>

              {bookableProperties
                .length ===
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
                    No properties ready for viewing
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Open an available property and tap I AM INTERESTED to begin the viewing process.
                  </Text>

                  <TouchableOpacity
                    style={
                      styles.browseButton
                    }
                    onPress={
                      () =>
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
                      key={
                        String(
                          property.id
                        )
                      }
                      property={
                        property
                      }
                      onChoose={
                        () =>
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
                onChange={
                  clearSelectedProperty
                }
              />

              {preparing && (
                <View
                  style={
                    styles.preparingCard
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
                        styles.preparingTitle
                      }
                    >
                      Checking appointment
                    </Text>

                    <Text
                      style={
                        styles.preparingText
                      }
                    >
                      Checking property availability, your appointment status, escrow and the lister&apos;s next four weeks of availability.
                    </Text>
                  </View>
                </View>
              )}

              {!preparing &&
                preparation
                  ?.code ===
                  "PROPERTY_NOT_AVAILABLE" && (
                  <StatusCard
                    icon="home-remove-outline"
                    title="Property No Longer Available"
                    message={
                      preparation.message ||
                      "This property is no longer available for viewing."
                    }
                    type="warning"
                  >
                    <TouchableOpacity
                      style={
                        styles.primaryButton
                      }
                      onPress={
                        () =>
                          router.replace(
                            "/home" as never
                          )
                      }
                    >
                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Browse Other Properties
                      </Text>
                    </TouchableOpacity>
                  </StatusCard>
                )}

              {!preparing &&
                preparation
                  ?.code ===
                  "OWN_PROPERTY" && (
                  <StatusCard
                    icon="account-cancel-outline"
                    title="Your Own Listing"
                    message={
                      preparation.message ||
                      "You cannot book a viewing appointment for your own property."
                    }
                    type="warning"
                  />
                )}

              {!preparing &&
                preparation
                  ?.code ===
                  "EXISTING_APPOINTMENT" && (
                  <StatusCard
                    icon="calendar-check"
                    title="Appointment Already Exists"
                    message={
                      preparation.message ||
                      "You already have an active viewing appointment for this property."
                    }
                    type="info"
                  >
                    {preparation
                      .existing_appointment && (
                      <View
                        style={
                          styles.existingAppointmentBox
                        }
                      >
                        <Text
                          style={
                            styles.existingAppointmentLabel
                          }
                        >
                          Appointment
                        </Text>

                        <Text
                          style={
                            styles.existingAppointmentValue
                          }
                        >
                          {
                            preparation
                              .existing_appointment
                              .appointment_date
                          }
                          {" · "}
                          {formatSlotTime(
                            preparation
                              .existing_appointment
                              .start_time
                          )}
                          {" - "}
                          {formatSlotTime(
                            preparation
                              .existing_appointment
                              .end_time
                          )}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={
                        styles.primaryButton
                      }
                      onPress={
                        () =>
                          router.replace(
                            "/appointment" as never
                          )
                      }
                    >
                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        View My Appointment
                      </Text>
                    </TouchableOpacity>
                  </StatusCard>
                )}

              {!preparing &&
                (
                  preparation
                    ?.code ===
                    "INSUFFICIENT_ESCROW" ||
                  preparation
                    ?.code ===
                    "READY_TO_BOOK" ||
                  preparation
                    ?.code ===
                    "LISTER_NO_AVAILABILITY"
                ) && (
                  <>
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

                    <View
                      style={
                        preparation
                          ?.code !==
                        "INSUFFICIENT_ESCROW"
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
                          name={
                            preparation
                              ?.code !==
                            "INSUFFICIENT_ESCROW"
                              ? "shield-check"
                              : "shield-alert"
                          }
                          size={28}
                          color={
                            preparation
                              ?.code !==
                            "INSUFFICIENT_ESCROW"
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
                            style={
                              styles.escrowTitle
                            }
                          >
                            {preparation
                              ?.code !==
                            "INSUFFICIENT_ESCROW"
                              ? "Escrow requirement met"
                              : "Escrow deposit required"}
                          </Text>

                          <Text
                            style={
                              styles.escrowDescription
                            }
                          >
                            Your appointment eligibility includes an escrow requirement before a viewing can be booked.
                          </Text>
                        </View>
                      </View>

                      <MoneyRow
                        label="Property amount"
                        value={
                          money(
                            selectedProperty.amount
                          )
                        }
                      />

                      <MoneyRow
                        label="Required escrow"
                        value={
                          money(
                            requiredEscrow
                          )
                        }
                      />

                      <MoneyRow
                        label="Current escrow balance"
                        value={
                          money(
                            eligibility
                              ?.current_balance ??
                              0
                          )
                        }
                      />

                      {preparation
                        ?.code ===
                        "INSUFFICIENT_ESCROW" && (
                        <>
                          <MoneyRow
                            label="Amount needed"
                            value={
                              money(
                                eligibility
                                  ?.amount_needed ??
                                  requiredEscrow
                              )
                            }
                            danger
                          />

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
                  </>
                )}

              {!preparing &&
                preparation
                  ?.code ===
                  "LISTER_NO_AVAILABILITY" && (
                  <StatusCard
                    icon="calendar-remove-outline"
                    title="No Viewing Times Available Yet"
                    message={
                      preparation.message ||
                      "The lister currently has no available viewing times within the next four weeks. OHLAM has notified the lister to add availability."
                    }
                    type="info"
                  >
                    <Text
                      style={
                        styles.notificationInfo
                      }
                    >
                      You do not need to contact the lister outside OHLAM. Check again later after they update their viewing availability.
                    </Text>

                    <TouchableOpacity
                      style={
                        styles.primaryButton
                      }
                      disabled={
                        preparing
                      }
                      onPress={
                        () =>
                          prepareAppointment(
                            selectedProperty
                          )
                      }
                    >
                      <MaterialCommunityIcons
                        name="refresh"
                        size={19}
                        color="#ffffff"
                      />

                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Check Again
                      </Text>
                    </TouchableOpacity>
                  </StatusCard>
                )}

              {!preparing &&
                preparation
                  ?.code ===
                  "READY_TO_BOOK" && (
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
                      First select an available date, then choose a viewing time.
                    </Text>

                    {availableDays.length ===
                    0 ? (
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
                            styles.emptyTitle
                          }
                        >
                          No available times
                        </Text>

                        <Text
                          style={
                            styles.emptyText
                          }
                        >
                          No available viewing times were returned.
                        </Text>

                        <TouchableOpacity
                          style={
                            styles.primaryButton
                          }
                          onPress={
                            () =>
                              prepareAppointment(
                                selectedProperty
                              )
                          }
                        >
                          <Text
                            style={
                              styles.primaryButtonText
                            }
                          >
                            Refresh Availability
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View
                        style={
                          styles.bookingSelectorCard
                        }
                      >
                        <Text
                          style={
                            styles.selectorLabel
                          }
                        >
                          Available Date
                        </Text>

                        <TouchableOpacity
                          activeOpacity={
                            0.8
                          }
                          style={[
                            styles.selectInput,

                            dateDropdownOpen &&
                              styles.selectInputActive,
                          ]}
                          onPress={
                            () => {
                              setDateDropdownOpen(
                                (
                                  current
                                ) =>
                                  !current
                              );

                              setTimeDropdownOpen(
                                false
                              );
                            }
                          }
                        >
                          <View
                            style={
                              styles.selectInputLeft
                            }
                          >
                            <MaterialCommunityIcons
                              name="calendar-outline"
                              size={21}
                              color="#2563eb"
                            />

                            <Text
                              style={
                                selectedDate
                                  ? styles.selectValue
                                  : styles.selectPlaceholder
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {selectedAvailableDay
                                ?.label ||
                                "Select available date"}
                            </Text>
                          </View>

                          <MaterialCommunityIcons
                            name={
                              dateDropdownOpen
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={23}
                            color="#64748b"
                          />
                        </TouchableOpacity>

                        {dateDropdownOpen && (
                          <View
                            style={
                              styles.dropdownBox
                            }
                          >
                            {availableDays.map(
                              (
                                day
                              ) => {
                                const selected =
                                  selectedDate ===
                                  day.date;

                                return (
                                  <TouchableOpacity
                                    key={
                                      day.date
                                    }
                                    style={[
                                      styles.dropdownOption,

                                      selected &&
                                        styles.dropdownOptionSelected,
                                    ]}
                                    onPress={
                                      () => {
                                        setSelectedDate(
                                          day.date
                                        );

                                        setSelectedSlot(
                                          null
                                        );

                                        setDateDropdownOpen(
                                          false
                                        );

                                        setTimeDropdownOpen(
                                          false
                                        );
                                      }
                                    }
                                  >
                                    <View
                                      style={{
                                        flex: 1,
                                      }}
                                    >
                                      <Text
                                        style={[
                                          styles.dropdownOptionTitle,

                                          selected &&
                                            styles.dropdownOptionTitleSelected,
                                        ]}
                                      >
                                        {
                                          day.label
                                        }
                                      </Text>

                                      <Text
                                        style={
                                          styles.dropdownOptionSubtitle
                                        }
                                      >
                                        {
                                          day
                                            .slots
                                            .length
                                        }{" "}
                                        {day
                                          .slots
                                          .length ===
                                        1
                                          ? "time available"
                                          : "times available"}
                                      </Text>
                                    </View>

                                    {selected && (
                                      <MaterialCommunityIcons
                                        name="check-circle"
                                        size={21}
                                        color="#2563eb"
                                      />
                                    )}
                                  </TouchableOpacity>
                                );
                              }
                            )}
                          </View>
                        )}

                        <Text
                          style={[
                            styles.selectorLabel,
                            {
                              marginTop:
                                16,
                            },
                          ]}
                        >
                          Available Time
                        </Text>

                        <TouchableOpacity
                          activeOpacity={
                            0.8
                          }
                          disabled={
                            !selectedAvailableDay
                          }
                          style={[
                            styles.selectInput,

                            !selectedAvailableDay &&
                              styles.selectInputDisabled,

                            timeDropdownOpen &&
                              styles.selectInputActive,
                          ]}
                          onPress={
                            () => {
                              if (
                                !selectedAvailableDay
                              ) {
                                return;
                              }

                              setTimeDropdownOpen(
                                (
                                  current
                                ) =>
                                  !current
                              );

                              setDateDropdownOpen(
                                false
                              );
                            }
                          }
                        >
                          <View
                            style={
                              styles.selectInputLeft
                            }
                          >
                            <MaterialCommunityIcons
                              name="clock-outline"
                              size={21}
                              color={
                                selectedAvailableDay
                                  ? "#2563eb"
                                  : "#94a3b8"
                              }
                            />

                            <Text
                              style={
                                selectedSlot
                                  ? styles.selectValue
                                  : styles.selectPlaceholder
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {selectedSlot
                                ? `${formatSlotTime(
                                    selectedSlot.start_time
                                  )} - ${formatSlotTime(
                                    selectedSlot.end_time
                                  )}`
                                : selectedAvailableDay
                                ? "Select available time"
                                : "Select a date first"}
                            </Text>
                          </View>

                          <MaterialCommunityIcons
                            name={
                              timeDropdownOpen
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={23}
                            color={
                              selectedAvailableDay
                                ? "#64748b"
                                : "#94a3b8"
                            }
                          />
                        </TouchableOpacity>

                        {timeDropdownOpen &&
                          selectedAvailableDay && (
                            <View
                              style={
                                styles.dropdownBox
                              }
                            >
                              {selectedAvailableDay
                                .slots.map(
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
                                          styles.dropdownOption,

                                          selected &&
                                            styles.dropdownOptionSelected,
                                        ]}
                                        onPress={
                                          () => {
                                            setSelectedSlot(
                                              slot
                                            );

                                            setTimeDropdownOpen(
                                              false
                                            );
                                          }
                                        }
                                      >
                                        <View
                                          style={
                                            styles.timeOptionRow
                                          }
                                        >
                                          <MaterialCommunityIcons
                                            name="clock-outline"
                                            size={19}
                                            color={
                                              selected
                                                ? "#2563eb"
                                                : "#64748b"
                                            }
                                          />

                                          <Text
                                            style={[
                                              styles.dropdownOptionTitle,

                                              selected &&
                                                styles.dropdownOptionTitleSelected,
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

                                        {selected && (
                                          <MaterialCommunityIcons
                                            name="check-circle"
                                            size={21}
                                            color="#2563eb"
                                          />
                                        )}
                                      </TouchableOpacity>
                                    );
                                  }
                                )}
                            </View>
                          )}
                      </View>
                    )}

                    <Text
                      style={[
                        styles.label,
                        {
                          marginTop:
                            20,
                        },
                      ]}
                    >
                      Note to Lister{" "}
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
                            {
                              selectedAvailableDay
                                ?.label
                            }
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

                        (
                          !selectedSlot ||
                          booking
                        ) &&
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
| Status Card
|--------------------------------------------------------------------------
*/

function StatusCard({
  icon,
  title,
  message,
  type,
  children,
}: {
  icon: any;

  title: string;

  message: string;

  type:
    | "warning"
    | "info";

  children?:
    React.ReactNode;
}) {
  const warning =
    type ===
    "warning";

  return (
    <View
      style={[
        styles.statusCard,

        warning
          ? styles.statusWarningCard
          : styles.statusInfoCard,
      ]}
    >
      <MaterialCommunityIcons
        name={
          icon
        }
        size={32}
        color={
          warning
            ? "#b45309"
            : "#2563eb"
        }
      />

      <Text
        style={
          styles.statusTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.statusMessage
        }
      >
        {message}
      </Text>

      {children}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Money Row
|--------------------------------------------------------------------------
*/

function MoneyRow({
  label,
  value,
  danger = false,
}: {
  label: string;

  value: string;

  danger?: boolean;
}) {
  return (
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
        {label}
      </Text>

      <Text
        style={[
          styles.moneyValue,

          danger && {
            color:
              "#dc2626",
          },
        ]}
      >
        {value}
      </Text>
    </View>
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

  onChoose:
    () => void;
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
              uri:
                imageUrl,
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
            Check Viewing Availability
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
| Selected Property Card
|--------------------------------------------------------------------------
*/

function SelectedPropertyCard({
  property,
  canChange,
  onChange,
}: {
  property: PropertyItem;

  canChange: boolean;

  onChange:
    () => void;
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
            uri:
              imageUrl,
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
      fontWeight:
        "700",
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
      fontWeight:
        "900",
      color: "#0f172a",
    },

    headingSubtitle: {
      color: "#64748b",
      marginTop: 5,
      lineHeight: 20,
      fontWeight:
        "600",
    },

    sectionTitle: {
      color: "#0f172a",
      fontSize: 19,
      fontWeight:
        "900",
      marginBottom: 5,
    },

    sectionSubtitle: {
      color: "#64748b",
      lineHeight: 19,
      fontSize: 13,
      fontWeight:
        "600",
    },

    emptyCard: {
      marginTop: 14,
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
      fontWeight:
        "900",
      textAlign:
        "center",
    },

    emptyText: {
      color: "#64748b",
      marginTop: 7,
      lineHeight: 20,
      textAlign:
        "center",
      fontWeight:
        "600",
    },

    browseButton: {
      marginTop: 16,
      backgroundColor:
        "#2563eb",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 12,
    },

    browseButtonText: {
      color: "#ffffff",
      fontWeight:
        "900",
    },

    propertyCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 20,
      overflow:
        "hidden",
      marginTop: 14,
      marginBottom: 2,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
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

    propertyBody: {
      padding: 15,
    },

    propertyTitle: {
      color: "#0f172a",
      fontSize: 18,
      fontWeight:
        "900",
    },

    propertyLocation: {
      color: "#64748b",
      marginTop: 5,
      fontWeight:
        "600",
    },

    propertyAmount: {
      color: "#0f172a",
      marginTop: 9,
      fontSize: 20,
      fontWeight:
        "900",
    },

    chooseButton: {
      backgroundColor:
        "#2563eb",
      paddingVertical: 12,
      paddingHorizontal: 14,
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
      fontWeight:
        "900",
      fontSize: 14,
    },

    selectedPropertyCard: {
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

    selectedPropertyImage: {
      width: 92,
      height: 92,
      borderRadius: 14,
      backgroundColor:
        "#e2e8f0",
    },

    selectedPropertyNoImage: {
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

    selectedPropertyTitle: {
      color: "#0f172a",
      fontSize: 16,
      fontWeight:
        "900",
    },

    selectedPropertyLocation: {
      color: "#64748b",
      marginTop: 4,
      fontSize: 12,
      fontWeight:
        "600",
    },

    selectedPropertyAmount: {
      color: "#0f172a",
      marginTop: 7,
      fontSize: 17,
      fontWeight:
        "900",
    },

    changeProperty: {
      marginTop: 7,
      color: "#2563eb",
      fontSize: 12,
      fontWeight:
        "900",
    },

    preparingCard: {
      marginTop: 20,
      backgroundColor:
        "#eff6ff",
      borderWidth: 1,
      borderColor:
        "#bfdbfe",
      borderRadius: 17,
      padding: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
    },

    preparingTitle: {
      color: "#1e3a8a",
      fontWeight:
        "900",
    },

    preparingText: {
      color: "#475569",
      fontSize: 12,
      fontWeight:
        "600",
      lineHeight: 18,
      marginTop: 3,
    },

    statusCard: {
      marginTop: 20,
      borderRadius: 18,
      padding: 20,
      alignItems:
        "center",
      borderWidth: 1,
    },

    statusWarningCard: {
      backgroundColor:
        "#fffbeb",
      borderColor:
        "#fde68a",
    },

    statusInfoCard: {
      backgroundColor:
        "#eff6ff",
      borderColor:
        "#bfdbfe",
    },

    statusTitle: {
      marginTop: 10,
      color: "#0f172a",
      fontSize: 17,
      fontWeight:
        "900",
      textAlign:
        "center",
    },

    statusMessage: {
      marginTop: 7,
      color: "#475569",
      textAlign:
        "center",
      lineHeight: 20,
      fontWeight:
        "600",
    },

    existingAppointmentBox: {
      width: "100%",
      marginTop: 14,
      backgroundColor:
        "#ffffff",
      borderRadius: 12,
      padding: 12,
    },

    existingAppointmentLabel: {
      color: "#64748b",
      fontSize: 11,
      fontWeight:
        "800",
    },

    existingAppointmentValue: {
      color: "#0f172a",
      marginTop: 4,
      fontWeight:
        "900",
    },

    notificationInfo: {
      marginTop: 12,
      color: "#475569",
      textAlign:
        "center",
      fontSize: 12,
      lineHeight: 18,
      fontWeight:
        "600",
    },

    primaryButton: {
      marginTop: 16,
      backgroundColor:
        "#2563eb",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 6,
    },

    primaryButtonText: {
      color: "#ffffff",
      fontWeight:
        "900",
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
      color: "#0f172a",
      fontSize: 15,
      fontWeight:
        "900",
    },

    escrowDescription: {
      color: "#475569",
      lineHeight: 18,
      fontSize: 12,
      marginTop: 4,
      fontWeight:
        "600",
    },

    moneyRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor:
        "rgba(100,116,139,0.15)",
      gap: 12,
    },

    moneyLabel: {
      color: "#64748b",
      fontSize: 12,
      fontWeight:
        "700",
      flex: 1,
    },

    moneyValue: {
      color: "#0f172a",
      fontSize: 13,
      fontWeight:
        "900",
    },

    fundEscrowButton: {
      marginTop: 14,
      backgroundColor:
        "#d97706",
      paddingVertical: 13,
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
      fontWeight:
        "900",
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

    bookingSelectorCard: {
      marginTop: 16,
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    selectorLabel: {
      color: "#334155",
      fontSize: 13,
      fontWeight:
        "800",
      marginBottom: 7,
    },

    selectInput: {
      minHeight: 54,
      borderWidth: 1,
      borderColor:
        "#cbd5e1",
      backgroundColor:
        "#ffffff",
      borderRadius: 13,
      paddingHorizontal: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    selectInputActive: {
      borderColor:
        "#2563eb",
    },

    selectInputDisabled: {
      backgroundColor:
        "#f8fafc",
      opacity: 0.7,
    },

    selectInputLeft: {
      flex: 1,
      minWidth: 0,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
    },

    selectValue: {
      flex: 1,
      color: "#0f172a",
      fontSize: 14,
      fontWeight:
        "800",
    },

    selectPlaceholder: {
      flex: 1,
      color: "#94a3b8",
      fontSize: 14,
      fontWeight:
        "600",
    },

    dropdownBox: {
      marginTop: 7,
      backgroundColor:
        "#ffffff",
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      overflow:
        "hidden",
    },

    dropdownOption: {
      minHeight: 52,
      paddingHorizontal: 14,
      paddingVertical: 11,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        "#f1f5f9",
    },

    dropdownOptionSelected: {
      backgroundColor:
        "#eff6ff",
    },

    dropdownOptionTitle: {
      color: "#0f172a",
      fontSize: 14,
      fontWeight:
        "800",
    },

    dropdownOptionTitleSelected: {
      color: "#1d4ed8",
    },

    dropdownOptionSubtitle: {
      color: "#64748b",
      fontSize: 11,
      fontWeight:
        "600",
      marginTop: 3,
    },

    timeOptionRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
    },

    label: {
      marginTop: 16,
      marginBottom: 7,
      color: "#334155",
      fontWeight:
        "800",
      fontSize: 13,
    },

    optional: {
      color: "#94a3b8",
      fontWeight:
        "600",
    },

    input: {
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#cbd5e1",
      borderRadius: 13,
      paddingHorizontal: 14,
      paddingVertical: 13,
      color: "#0f172a",
      fontSize: 14,
    },

    noteInput: {
      minHeight: 100,
      textAlignVertical:
        "top",
    },

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
      fontWeight:
        "900",
    },

    summaryText: {
      marginTop: 3,
      color: "#047857",
      fontSize: 12,
      fontWeight:
        "700",
    },

    bookButton: {
      marginTop: 20,
      backgroundColor:
        "#16a34a",
      paddingVertical: 15,
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
      fontWeight:
        "900",
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
      fontWeight:
        "600",
    },
  });