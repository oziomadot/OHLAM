import API from "@/src/services/api";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type AppointmentStatus = {
  id?: number | string;
  code?: string | null;
  name?: string | null;
};

type Property = {
  id?: number | string;

  title?: string | null;
  name?: string | null;

  amount?: string | number | null;

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
};

type Appointment = {
  id: number | string;

  uuid?: string | null;

  property_id:
    | number
    | string;

  customer_id:
    | number
    | string;

  lister_id:
    | number
    | string;

  status_id?:
    | number
    | string;

  status?:
    | AppointmentStatus
    | string
    | null;

  status_code?:
    | string
    | null;

  appointment_date?:
    | string
    | null;

  start_time?:
    | string
    | null;

  end_time?:
    | string
    | null;

  customer_note?:
    | string
    | null;

  property?:
    | Property
    | null;

  lister?: {
    id?: number | string;
    name?: string | null;
  } | null;
};

type CustomerAppointmentsResponse = {
  success?: boolean;

  message?: string;

  data?: Appointment[];

  appointments?: Appointment[];
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getStatusCode(
  appointment: Appointment
): string {
  if (
    typeof appointment.status ===
    "string"
  ) {
    return appointment.status
      .trim()
      .toLowerCase();
  }

  if (
    appointment.status &&
    typeof appointment.status ===
      "object"
  ) {
    return (
      appointment.status.code ||
      ""
    )
      .trim()
      .toLowerCase();
  }

  return (
    appointment.status_code ||
    ""
  )
    .trim()
    .toLowerCase();
}

function getStatusLabel(
  appointment: Appointment
): string {
  if (
    typeof appointment.status ===
      "object" &&
    appointment.status?.name
  ) {
    return appointment.status.name;
  }

  const code =
    getStatusCode(
      appointment
    );

  switch (code) {
    case "appointment_pending":
    case "pending":
      return "Pending";

    case "appointment_confirmed":
    case "confirmed":
    case "appointment_accepted":
    case "accepted":
      return "Confirmed";

    case "appointment_rejected":
    case "rejected":
    case "appointment_declined":
    case "declined":
      return "Rejected";

    case "appointment_cancelled":
    case "cancelled":
      return "Cancelled";

    case "appointment_completed":
    case "completed":
      return "Completed";

    case "appointment_expired":
    case "expired":
      return "Expired";

    case "appointment_rescheduled":
    case "rescheduled":
      return "Rescheduled";

    case "appointment_reschedule_requested":
    case "reschedule_requested":
      return "Reschedule Requested";

    default:
      return (
        code
          .replace(
            /^appointment_/,
            ""
          )
          .replace(
            /_/g,
            " "
          )
          .replace(
            /\b\w/g,
            character =>
              character.toUpperCase()
          ) ||
        "Unknown"
      );
  }
}

function getStatusColor(
  appointment: Appointment
): string {
  const code =
    getStatusCode(
      appointment
    );

  if (
    [
      "appointment_confirmed",
      "appointment_accepted",
      "confirmed",
      "accepted",
      "appointment_completed",
      "completed",
    ].includes(code)
  ) {
    return "#16a34a";
  }

  if (
    [
      "appointment_pending",
      "pending",
      "appointment_reschedule_requested",
      "reschedule_requested",
    ].includes(code)
  ) {
    return "#ca8a04";
  }

  if (
    [
      "appointment_rejected",
      "appointment_declined",
      "rejected",
      "declined",
    ].includes(code)
  ) {
    return "#dc2626";
  }

  return "#64748b";
}

function getPropertyTitle(
  appointment: Appointment
): string {
  const property =
    appointment.property;

  if (!property) {
    return `Property #${appointment.property_id}`;
  }

  if (
    property.title
  ) {
    return property.title;
  }

  if (
    property.name
  ) {
    return property.name;
  }

  if (
    Number(
      property.property_type?.id
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

  if (
    Number(
      property.property_type?.id
    ) === 2
  ) {
    return (
      property.house_sale
        ?.building_type?.name ||
      property.house_sale
        ?.building?.name ||
      "House for Sale"
    );
  }

  if (
    Number(
      property.property_type?.id
    ) === 3
  ) {
    return property.land_sale
      ?.measurement
      ? `${property.land_sale.measurement} Land`
      : "Land for Sale";
  }

  return (
    property.property_type
      ?.name ||
    `Property #${appointment.property_id}`
  );
}

function getLocation(
  appointment: Appointment
): string | null {
  const parts = [
    appointment.property
      ?.area?.name,

    appointment.property
      ?.state?.name,
  ].filter(Boolean);

  return parts.length
    ? parts.join(", ")
    : null;
}

function formatTime(
  value?:
    | string
    | null
): string {
  if (!value) {
    return "--";
  }

  const parts =
    value.split(":");

  if (
    parts.length <
    2
  ) {
    return value;
  }

  const hour =
    Number(parts[0]);

  const minute =
    Number(parts[1]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
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
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

/*
|--------------------------------------------------------------------------
| Screen
|--------------------------------------------------------------------------
*/

export default function CustomerAppointmentsScreen() {
  const router =
    useRouter();

  const [
    appointments,
    setAppointments,
  ] =
    useState<Appointment[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load appointments where user is CUSTOMER
  |--------------------------------------------------------------------------
  */

  const loadAppointments =
    useCallback(
      async (
        showLoader = true
      ) => {
        try {
          if (
            showLoader
          ) {
            setLoading(
              true
            );
          }

          console.log(
            "======================================"
          );

          console.log(
            "Loading CUSTOMER appointments..."
          );

          const response =
            await API.get<CustomerAppointmentsResponse>(
              "/customer/interested-appointments"
            );

          console.log(
            "Customer appointment API response:",
            JSON.stringify(
              response.data,
              null,
              2
            )
          );

          const responseData =
            response.data;

          const loadedAppointments =
            Array.isArray(
              responseData?.data
            )
              ? responseData.data
              : Array.isArray(
                    responseData
                      ?.appointments
                  )
                ? responseData.appointments
                : [];

          console.log(
            "Appointment count:",
            loadedAppointments.length
          );

          setAppointments(
            loadedAppointments
          );
        } catch (
          error: any
        ) {
          console.error(
            "CUSTOMER APPOINTMENT LIST ERROR"
          );

          console.error(
            "HTTP status:",
            error?.response
              ?.status
          );

          console.error(
            "Response:",
            error?.response
              ?.data
          );

          console.error(
            "Message:",
            error?.message
          );

          setAppointments(
            []
          );

          if (
            error?.response
              ?.status === 401
          ) {
            Alert.alert(
              "Session expired",
              "Please sign in again.",
              [
                {
                  text:
                    "Sign In",

                  onPress: () =>
                    router.replace(
                      "/login" as never
                    ),
                },
              ]
            );

            return;
          }

          Alert.alert(
            "Could not load appointments",
            error?.response
              ?.data?.message ||
              error?.message ||
              "Unable to load your property appointments."
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
        router,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Refresh every time screen receives focus
  |--------------------------------------------------------------------------
  */

  useFocusEffect(
    useCallback(
      () => {
        loadAppointments(
          true
        );
      },
      [
        loadAppointments,
      ]
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Open ONE appointment
  |--------------------------------------------------------------------------
  */

  const openAppointment =
    (
      appointment: Appointment
    ) => {
      const appointmentId =
        String(
          appointment.uuid ||
            appointment.id
        );

      console.log(
        "Opening customer appointment:",
        appointmentId
      );

      router.push({
        pathname:
          "/appointment/customer/view" as never,

        params: {
          appointmentId,
        },
      });
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
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#147D64"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading your appointments...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.container
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
              styles.title
            }
          >
            Appointments I Booked
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Property viewings where you are the customer.
          </Text>
        </View>
      </View>

      <FlatList
        data={
          appointments
        }
        keyExtractor={
          item =>
            String(
              item.uuid ||
                item.id
            )
        }
        contentContainerStyle={
          appointments.length ===
          0
            ? styles.emptyList
            : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              () => {
                setRefreshing(
                  true
                );

                loadAppointments(
                  false
                );
              }
            }
          />
        }
        renderItem={({
          item,
        }) => {
          const code =
            getStatusCode(
              item
            );

          const location =
            getLocation(
              item
            );

          const pending =
            [
              "appointment_pending",
              "pending",
            ].includes(
              code
            );

          return (
            <TouchableOpacity
              style={
                styles.card
              }
              activeOpacity={
                0.85
              }
              onPress={
                () =>
                  openAppointment(
                    item
                  )
              }
            >
              <View
                style={
                  styles.cardTop
                }
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      styles.propertyTitle
                    }
                  >
                    {getPropertyTitle(
                      item
                    )}
                  </Text>

                  {location && (
                    <View
                      style={
                        styles.locationRow
                      }
                    >
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={17}
                        color="#64748b"
                      />

                      <Text
                        style={
                          styles.location
                        }
                      >
                        {
                          location
                        }
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.statusBadge,

                    {
                      borderColor:
                        getStatusColor(
                          item
                        ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,

                      {
                        color:
                          getStatusColor(
                            item
                          ),
                      },
                    ]}
                  >
                    {getStatusLabel(
                      item
                    )}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.divider
                }
              />

              <View
                style={
                  styles.detailRow
                }
              >
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={19}
                  color="#147D64"
                />

                <Text
                  style={
                    styles.detailText
                  }
                >
                  {item.appointment_date ||
                    "Date unavailable"}
                </Text>
              </View>

              <View
                style={
                  styles.detailRow
                }
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={19}
                  color="#147D64"
                />

                <Text
                  style={
                    styles.detailText
                  }
                >
                  {formatTime(
                    item.start_time
                  )}
                  {" - "}
                  {formatTime(
                    item.end_time
                  )}
                </Text>
              </View>

              {pending && (
                <View
                  style={
                    styles.pendingCard
                  }
                >
                  <MaterialCommunityIcons
                    name="clock-alert-outline"
                    size={19}
                    color="#92400e"
                  />

                  <Text
                    style={
                      styles.pendingText
                    }
                  >
                    Waiting for the property lister to confirm this appointment.
                  </Text>
                </View>
              )}

              <View
                style={
                  styles.viewRow
                }
              >
                <Text
                  style={
                    styles.viewText
                  }
                >
                  View Appointment
                </Text>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={21}
                  color="#147D64"
                />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View
            style={
              styles.emptyContainer
            }
          >
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={52}
              color="#94a3b8"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No appointments yet
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Viewing appointments you request as a customer will appear here.
            </Text>

            <TouchableOpacity
              style={
                styles.createButton
              }
              onPress={
                () =>
                  router.push(
                    "/appointment/customer/create" as never
                  )
              }
            >
              <MaterialCommunityIcons
                name="calendar-plus"
                size={19}
                color="#ffffff"
              />

              <Text
                style={
                  styles.createButtonText
                }
              >
                Book a Viewing
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
      paddingHorizontal: 16,
    },

    loadingContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f8fafc",
    },

    loadingText: {
      marginTop: 12,
      color: "#64748b",
      fontWeight:
        "600",
    },

    header: {
      paddingTop: 18,
      paddingBottom: 18,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    title: {
      color: "#0f172a",
      fontSize: 21,
      fontWeight:
        "900",
    },

    subtitle: {
      color: "#64748b",
      marginTop: 3,
      fontSize: 12,
      lineHeight: 17,
    },

    list: {
      paddingBottom: 40,
    },

    emptyList: {
      flexGrow: 1,
    },

    card: {
      backgroundColor:
        "#ffffff",
      padding: 16,
      borderRadius: 17,
      marginBottom: 13,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    cardTop: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 10,
    },

    propertyTitle: {
      color: "#0f172a",
      fontWeight:
        "900",
      fontSize: 16,
    },

    locationRow: {
      marginTop: 5,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
    },

    location: {
      color: "#64748b",
      fontSize: 12,
    },

    statusBadge: {
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    statusText: {
      fontWeight:
        "800",
      fontSize: 11,
    },

    divider: {
      height: 1,
      backgroundColor:
        "#f1f5f9",
      marginVertical: 14,
    },

    detailRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      marginTop: 7,
    },

    detailText: {
      color: "#334155",
      fontSize: 13,
      fontWeight:
        "700",
    },

    pendingCard: {
      marginTop: 14,
      borderRadius: 11,
      padding: 11,
      backgroundColor:
        "#fffbeb",
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    pendingText: {
      flex: 1,
      color: "#92400e",
      fontSize: 12,
      lineHeight: 17,
      fontWeight:
        "600",
    },

    viewRow: {
      marginTop: 15,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor:
        "#f1f5f9",
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    viewText: {
      color: "#147D64",
      fontWeight:
        "800",
      fontSize: 13,
    },

    emptyContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 30,
    },

    emptyTitle: {
      marginTop: 13,
      color: "#0f172a",
      fontWeight:
        "900",
      fontSize: 18,
    },

    emptyText: {
      marginTop: 7,
      textAlign:
        "center",
      color: "#64748b",
      lineHeight: 20,
    },

    createButton: {
      marginTop: 18,
      backgroundColor:
        "#147D64",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    createButtonText: {
      color: "#ffffff",
      fontWeight:
        "800",
    },
  });