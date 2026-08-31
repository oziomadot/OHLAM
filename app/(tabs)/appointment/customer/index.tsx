import API from "@/src/services/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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

type AppointmentStatus = {
  id?: number | string;
  code?: string | null;
  name?: string | null;
};

type AppointmentProperty = {
  id?: number | string;
  title?: string | null;
  name?: string | null;

  property_type?: {
    name?: string | null;
  } | null;

  area?: {
    name?: string | null;
  } | null;

  state?: {
    name?: string | null;
  } | null;
};

type Appointment = {
  id: number | string;

  property_id: number | string;

  customer_id?: number | string;

  lister_id?: number | string;

  appointment_date: string;

  start_time: string;

  end_time: string;

  customer_note?: string | null;

  status_id?: number | string;

  status?: AppointmentStatus | string | null;

  property?: AppointmentProperty | null;

  lister?: {
    id?: number | string;
    name?: string | null;
  } | null;
};

export default function CustomerAppointmentView() {
  const router =
    useRouter();

  const [
    appointments,
    setAppointments,
  ] =
    useState<Appointment[]>([]);

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
  | Status helper
  |--------------------------------------------------------------------------
  */

  const getStatusCode = (
    appointment: Appointment
  ): string => {
    if (
      typeof appointment.status ===
      "string"
    ) {
      return appointment.status;
    }

    return (
      appointment.status?.code ||
      ""
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Human-readable status
  |--------------------------------------------------------------------------
  */

  const getStatusLabel = (
    code: string
  ): string => {
    switch (code) {
      case "appointment_pending":
      case "pending":
        return "Pending";

      case "appointment_confirmed":
      case "appointment_accepted":
      case "accepted":
      case "confirmed":
        return "Confirmed";

      case "appointment_rejected":
      case "rejected":
        return "Rejected";

      case "appointment_cancelled":
      case "cancelled":
        return "Cancelled";

      case "appointment_expired":
      case "expired":
        return "Expired";

      case "appointment_rescheduled":
      case "rescheduled":
        return "Rescheduled";

      case "appointment_completed":
      case "completed":
        return "Completed";

      default:
        return (
          code
            ?.replace(
              /^appointment_/,
              ""
            )
            ?.replace(
              /_/g,
              " "
            )
            ?.replace(
              /\b\w/g,
              char =>
                char.toUpperCase()
            ) ||
          "Unknown"
        );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Status color
  |--------------------------------------------------------------------------
  */

  const statusColor = (
    code: string
  ) => {
    switch (code) {
      case "appointment_confirmed":
      case "appointment_accepted":
      case "accepted":
      case "confirmed":
        return "#16a34a";

      case "appointment_pending":
      case "pending":
        return "#ca8a04";

      case "appointment_rejected":
      case "rejected":
        return "#dc2626";

      case "appointment_cancelled":
      case "cancelled":
        return "#64748b";

      case "appointment_expired":
      case "expired":
        return "#64748b";

      case "appointment_completed":
      case "completed":
        return "#2563eb";

      default:
        return "#334155";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load appointments
  |--------------------------------------------------------------------------
  */

  const loadAppointments =
    useCallback(
      async (
        showLoading = true
      ) => {
        try {
          if (
            showLoading
          ) {
            setLoading(
              true
            );
          }

          console.log(
            "Loading customer appointments..."
          );

          const response =
            await API.get(
              "/customer/interested-appointments"
            );

          console.log(
            "Customer appointments response:",
            response.data
          );

          /*
           * Accept:
           *
           * {
           *   success: true,
           *   data: [...]
           * }
           *
           * and protect against malformed/null responses.
           */
          const result =
            response?.data?.data;

          if (
            !Array.isArray(
              result
            )
          ) {
            console.warn(
              "Appointments response was not an array:",
              result
            );

            setAppointments(
              []
            );

            return;
          }

          setAppointments(
            result
          );
        } catch (
          error: any
        ) {
          console.error(
            "CUSTOMER APPOINTMENTS ERROR"
          );

          console.error(
            "Status:",
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

          Alert.alert(
            "Could not load appointments",
            error?.response
              ?.data
              ?.message ||
              error?.message ||
              "OHLAM could not load your appointments."
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
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Reload whenever screen receives focus
  |--------------------------------------------------------------------------
  */

  useFocusEffect(
    useCallback(
      () => {
        loadAppointments();
      },
      [
        loadAppointments,
      ]
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const refresh =
    () => {
      setRefreshing(
        true
      );

      loadAppointments(
        false
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Property title
  |--------------------------------------------------------------------------
  */

  const propertyTitle = (
    appointment: Appointment
  ) => {
    return (
      appointment
        .property
        ?.title ||
      appointment
        .property
        ?.name ||
      appointment
        .property
        ?.property_type
        ?.name ||
      `Property #${appointment.property_id}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Location
  |--------------------------------------------------------------------------
  */

  const propertyLocation = (
    appointment: Appointment
  ) => {
    const values = [
      appointment
        .property
        ?.area
        ?.name,

      appointment
        .property
        ?.state
        ?.name,
    ].filter(
      Boolean
    );

    return values.length
      ? values.join(
          ", "
        )
      : null;
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
          color="#2563eb"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading appointments...
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
            size={23}
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
            My Appointments
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Property viewing appointments you have requested.
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
              item.id
            )
        }
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
        contentContainerStyle={
          appointments.length ===
          0
            ? styles.emptyList
            : styles.list
        }
        renderItem={({
          item,
        }) => {
          const code =
            getStatusCode(
              item
            );

          const label =
            getStatusLabel(
              code
            );

          const location =
            propertyLocation(
              item
            );

          const waiting =
            code ===
              "appointment_pending" ||
            code ===
              "pending";

          const confirmed =
            [
              "appointment_confirmed",
              "appointment_accepted",
              "confirmed",
              "accepted",
            ].includes(
              code
            );

          const canBookAgain =
            [
              "appointment_rejected",
              "appointment_cancelled",
              "appointment_expired",
              "appointment_rescheduled",
              "rejected",
              "cancelled",
              "expired",
              "rescheduled",
            ].includes(
              code
            );

          return (
            <View
              style={
                styles.card
              }
            >
              <View
                style={
                  styles.cardHeader
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
                    {propertyTitle(
                      item
                    )}
                  </Text>

                  {location && (
                    <Text
                      style={
                        styles.location
                      }
                    >
                      {
                        location
                      }
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.statusBadge,

                    {
                      borderColor:
                        statusColor(
                          code
                        ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.status,

                      {
                        color:
                          statusColor(
                            code
                          ),
                      },
                    ]}
                  >
                    {
                      label
                    }
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.detailRow
                }
              >
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={20}
                  color="#64748b"
                />

                <Text
                  style={
                    styles.detailText
                  }
                >
                  {
                    item.appointment_date
                  }
                </Text>
              </View>

              <View
                style={
                  styles.detailRow
                }
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="#64748b"
                />

                <Text
                  style={
                    styles.detailText
                  }
                >
                  {
                    item.start_time
                  }
                  {" - "}
                  {
                    item.end_time
                  }
                </Text>
              </View>

              {waiting && (
                <View
                  style={
                    styles.pendingBox
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

              {confirmed && (
                <TouchableOpacity
                  style={
                    styles.chatButton
                  }
                  onPress={
                    () => {
                      Alert.alert(
                        "SecureChat",
                        "SecureChat integration will open the conversation with this property lister."
                      );
                    }
                  }
                >
                  <MaterialCommunityIcons
                    name="chat-lock-outline"
                    size={19}
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.chatText
                    }
                  >
                    Chat with Lister
                  </Text>
                </TouchableOpacity>
              )}

              {canBookAgain && (
                <TouchableOpacity
                  style={
                    styles.bookAgainButton
                  }
                  onPress={
                    () =>
                      router.push({
                        pathname:
                          "/appointment/customer/create" as never,

                        params: {
                          property_id:
                            String(
                              item.property_id
                            ),
                        },
                      })
                  }
                >
                  <MaterialCommunityIcons
                    name="calendar-refresh"
                    size={19}
                    color="#111827"
                  />

                  <Text
                    style={
                      styles.bookAgainText
                    }
                  >
                    Choose New Time
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
              size={50}
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
                styles.empty
              }
            >
              Property viewing appointments you request will appear here.
            </Text>
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
      paddingHorizontal: 16,
      backgroundColor:
        "#f8fafc",
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
      paddingBottom: 16,
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
      fontSize: 22,
      fontWeight:
        "800",
      color: "#0f172a",
    },

    subtitle: {
      color: "#64748b",
      marginTop: 3,
      fontSize: 12,
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
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    cardHeader: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 10,
      marginBottom: 14,
    },

    propertyTitle: {
      fontSize: 16,
      fontWeight:
        "800",
      color: "#0f172a",
    },

    location: {
      color: "#64748b",
      marginTop: 4,
      fontSize: 12,
    },

    statusBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
    },

    status: {
      fontWeight:
        "800",
      fontSize: 11,
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
      fontWeight:
        "600",
    },

    pendingBox: {
      marginTop: 14,
      padding: 11,
      borderRadius: 10,
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

    chatButton: {
      backgroundColor:
        "#111827",
      padding: 12,
      borderRadius: 10,
      marginTop: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
    },

    chatText: {
      color: "#ffffff",
      textAlign:
        "center",
      fontWeight:
        "700",
    },

    bookAgainButton: {
      borderWidth: 1,
      borderColor:
        "#111827",
      padding: 12,
      borderRadius: 10,
      marginTop: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,
    },

    bookAgainText: {
      color: "#111827",
      textAlign:
        "center",
      fontWeight:
        "700",
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
      marginTop: 12,
      color: "#0f172a",
      fontSize: 18,
      fontWeight:
        "800",
    },

    empty: {
      textAlign:
        "center",
      color: "#64748b",
      marginTop: 7,
      lineHeight: 20,
    },
  });