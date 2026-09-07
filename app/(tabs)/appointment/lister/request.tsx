import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import API from "@/src/services/api";

type Appointment = {
  id: number | string;

  uuid?: string | null;

  customer_id?: number | string;

  lister_id?: number | string;

  property_id?: number | string;

  appointment_date?: string | null;

  start_time?: string | null;

  end_time?: string | null;

  scheduled_at?: string | null;

  starts_at?: string | null;

  status?: string | null;

  status_code?: string | null;

  status_data?: {
    id?: number | string;

    code?: string | null;

    name?: string | null;
  } | null;

  customer_note?: string | null;

  lister_note?: string | null;

  customer?: {
    id?: number | string;

    name?: string | null;

    full_name?: string | null;

    first_name?: string | null;

    last_name?: string | null;
  } | null;

  property?: {
    id?: number | string;

    uuid?: string | null;

    title?: string | null;

    name?: string | null;

    address?: string | null;

    city?: string | null;

    state?: string | null;
  } | null;
};

function getStatusCode(
  appointment: Appointment
): string {
  return String(
    appointment.status_data?.code ??
      appointment.status_code ??
      appointment.status ??
      ""
  )
    .trim()
    .toLowerCase();
}

function getStatusLabel(
  appointment: Appointment
): string {
  if (
    appointment.status_data?.name
  ) {
    return appointment
      .status_data
      .name;
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
      return "Confirmed";

    case "appointment_rejected":
    case "appointment_declined":
    case "rejected":
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

    case "appointment_reschedule_requested":
    case "reschedule_requested":
      return "Reschedule Requested";

    default:
      return code
        ? code
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
              (letter) =>
                letter.toUpperCase()
            )
        : "Unknown";
  }
}

function isPending(
  appointment: Appointment
): boolean {
  return [
    "pending",
    "appointment_pending",
    "reschedule_requested",
    "appointment_reschedule_requested",
  ].includes(
    getStatusCode(
      appointment
    )
  );
}

function getCustomerName(
  appointment: Appointment
): string {
  const customer =
    appointment.customer;

  if (!customer) {
    return "Customer";
  }

  if (
    customer.full_name
  ) {
    return customer.full_name;
  }

  if (customer.name) {
    return customer.name;
  }

  const fullName = [
    customer.first_name,
    customer.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    "Customer"
  );
}

function getPropertyTitle(
  appointment: Appointment
): string {
  return (
    appointment.property?.title ??
    appointment.property?.name ??
    "Property"
  );
}

function getPropertyLocation(
  appointment: Appointment
): string | null {
  if (
    appointment.property?.address
  ) {
    return appointment
      .property
      .address;
  }

  const location = [
    appointment.property?.city,
    appointment.property?.state,
  ]
    .filter(Boolean)
    .join(", ");

  return location || null;
}

function getAppointmentDate(
  appointment: Appointment
): string {
  const value =
    appointment.appointment_date ??
    appointment.starts_at ??
    appointment.scheduled_at;

  if (!value) {
    return "Date not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    [],
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatTime(
  value?: string | null
): string {
  if (!value) {
    return "--:--";
  }

  /*
   * If backend gives a complete
   * date/time value.
   */
  if (
    value.includes("T")
  ) {
    const date =
      new Date(value);

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date.toLocaleTimeString(
        [],
        {
          hour: "numeric",
          minute: "2-digit",
        }
      );
    }
  }

  /*
   * Handle:
   * 10:00
   * 10:00:00
   */
  const parts =
    value.split(":");

  if (
    parts.length >= 2
  ) {
    const hour =
      Number(parts[0]);

    const minute =
      Number(parts[1]);

    if (
      Number.isFinite(hour) &&
      Number.isFinite(minute)
    ) {
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
  }

  return value;
}

export default function ListerAppointmentRequests() {
  const router =
    useRouter();

  const [
    appointments,
    setAppointments,
  ] = useState<
    Appointment[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    processingId,
    setProcessingId,
  ] = useState<
    number | string | null
  >(null);

  const loadAppointments =
    useCallback(
      async (
        showLoader = true
      ) => {
        try {
          if (
            showLoader
          ) {
            setLoading(true);
          }

         const response =
  await API.get(
    "/lister/appointments"
  );

console.log(
  "LISTER APPOINTMENTS RAW:",
  JSON.stringify(
    response.data,
    null,
    2
  )
);

const body: any =
  response.data;

let list: Appointment[] = [];

if (
  Array.isArray(body)
) {
  list = body;
} else if (
  body &&
  Array.isArray(body.data)
) {
  list = body.data;
} else if (
  body &&
  Array.isArray(
    body.appointments
  )
) {
  list =
    body.appointments;
} else if (
  body &&
  body.data &&
  Array.isArray(
    body.data.appointments
  )
) {
  list =
    body.data.appointments;
}

console.log(
  "LISTER APPOINTMENTS NORMALIZED:",
  list
);

setAppointments(list);
        } catch (
          error: any
        ) {
          console.error(
            "Lister appointments error:",
            error?.response?.data ??
              error
          );

          setAppointments([]);

          Alert.alert(
            "Unable to Load Requests",
            error?.response?.data
              ?.message ??
              "Could not load appointment requests."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  /*
   * Reload every time user
   * returns to this screen.
   */
  useFocusEffect(
    useCallback(() => {
      loadAppointments(true);
    }, [loadAppointments])
  );

  const acceptAppointment =
    async (
      id: number | string
    ) => {
      try {
        setProcessingId(id);

        const response =
          await API.post(
            `/appointments/${id}/accept`
          );

        const responseBody: any =
  response.data;

Alert.alert(
  "Appointment Rejected",
  responseBody &&
  responseBody.message
    ? responseBody.message
    : "The appointment request has been rejected."
);

        await loadAppointments(
          false
        );
      } catch (
        error: any
      ) {
        console.error(
          "Accept appointment error:",
          error?.response?.data ??
            error
        );

        Alert.alert(
          "Unable to Accept",
          error?.response?.data
            ?.message ??
            "Could not accept this appointment."
        );
      } finally {
        setProcessingId(null);
      }
    };

  const rejectAppointment =
    (
      appointment:
        Appointment
    ) => {
      Alert.alert(
        "Reject Appointment",
        "Are you sure you want to reject this viewing request?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Reject",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  setProcessingId(
                    appointment.id
                  );

                  const response =
                    await API.post(
                      `/appointments/${appointment.id}/reject`,
                      {
                        lister_note:
                          "I am not available at this time.",
                      }
                    );

                 const responseBody: any =
  response.data;

Alert.alert(
  "Appointment Rejected",
  responseBody &&
  responseBody.message
    ? responseBody.message
    : "The appointment request has been rejected."
);
                  await loadAppointments(
                    false
                  );
                } catch (
                  error: any
                ) {
                  console.error(
                    "Reject appointment error:",
                    error
                      ?.response
                      ?.data ??
                      error
                  );

                  Alert.alert(
                    "Unable to Reject",
                    error
                      ?.response
                      ?.data
                      ?.message ??
                      "Could not reject this appointment."
                  );
                } finally {
                  setProcessingId(
                    null
                  );
                }
              },
          },
        ]
      );
    };

  const openAppointment =
    (
      appointment:
        Appointment
    ) => {
      const appointmentId =
        String(
          appointment.uuid ??
            appointment.id
        );

      router.push({
        pathname:
          "/appointment/lister/view" as never,

        params: {
          appointmentId,
        },
      });
    };

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
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
            Loading appointment
            requests...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
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
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#17202A"
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Appointment Requests
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Review viewing
              requests for your
              properties.
            </Text>
          </View>
        </View>

        <FlatList
          data={
            appointments
          }
          keyExtractor={(
            item
          ) =>
            String(
              item.uuid ??
                item.id
            )
          }
          showsVerticalScrollIndicator={
            false
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
              tintColor="#147D64"
              onRefresh={() => {
                setRefreshing(
                  true
                );

                loadAppointments(
                  false
                );
              }}
            />
          }
          renderItem={({
            item,
          }) => {
            const pending =
              isPending(item);

            const processing =
              processingId ===
              item.id;

            const location =
              getPropertyLocation(
                item
              );

            return (
              <TouchableOpacity
                activeOpacity={
                  0.9
                }
                onPress={() =>
                  openAppointment(
                    item
                  )
                }
                style={
                  styles.card
                }
              >
                <View
                  style={
                    styles.cardTop
                  }
                >
                  <View
                    style={
                      styles.propertyIcon
                    }
                  >
                    <Ionicons
                      name="home-outline"
                      size={22}
                      color="#147D64"
                    />
                  </View>

                  <View
                    style={
                      styles.propertyInfo
                    }
                  >
                    <Text
                      style={
                        styles.propertyTitle
                      }
                      numberOfLines={
                        2
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
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#64748b"
                        />

                        <Text
                          style={
                            styles.locationText
                          }
                          numberOfLines={
                            2
                          }
                        >
                          {location}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.statusBadge,

                      pending
                        ? styles.pendingBadge
                        : styles.normalBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,

                        pending
                          ? styles.pendingText
                          : styles.normalText,
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
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color="#64748b"
                  />

                  <View
                    style={
                      styles.detailContent
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Customer
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {getCustomerName(
                        item
                      )}
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.detailRow
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#64748b"
                  />

                  <View
                    style={
                      styles.detailContent
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Viewing Date
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {getAppointmentDate(
                        item
                      )}
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.detailRow
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color="#64748b"
                  />

                  <View
                    style={
                      styles.detailContent
                    }
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Viewing Time
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {formatTime(
                        item.start_time ??
                          item.starts_at
                      )}

                      {item.end_time
                        ? ` – ${formatTime(
                            item.end_time
                          )}`
                        : ""}
                    </Text>
                  </View>
                </View>

                {item.customer_note ? (
                  <View
                    style={
                      styles.noteCard
                    }
                  >
                    <Ionicons
                      name="chatbox-ellipses-outline"
                      size={17}
                      color="#64748b"
                    />

                    <Text
                      style={
                        styles.noteText
                      }
                    >
                      {
                        item.customer_note
                      }
                    </Text>
                  </View>
                ) : null}

                {pending && (
                  <View
                    style={
                      styles.actionRow
                    }
                  >
                    <TouchableOpacity
                      disabled={
                        processing
                      }
                      style={[
                        styles.acceptButton,

                        processing &&
                          styles.disabledButton,
                      ]}
                      onPress={(
                        event
                      ) => {
                        event.stopPropagation();

                        acceptAppointment(
                          item.id
                        );
                      }}
                    >
                      {processing ? (
                        <ActivityIndicator
                          size="small"
                          color="#FFFFFF"
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color="#FFFFFF"
                          />

                          <Text
                            style={
                              styles.buttonText
                            }
                          >
                            Accept
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={
                        processing
                      }
                      style={[
                        styles.rejectButton,

                        processing &&
                          styles.disabledButton,
                      ]}
                      onPress={(
                        event
                      ) => {
                        event.stopPropagation();

                        rejectAppointment(
                          item
                        );
                      }}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        Reject
                      </Text>
                    </TouchableOpacity>
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
                    View appointment
                    details
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
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
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Ionicons
                  name="calendar-clear-outline"
                  size={34}
                  color="#147D64"
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No appointment
                requests
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                When a customer
                requests a viewing
                for one of your
                properties, the
                request will appear
                here.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    container: {
      flex: 1,
      paddingHorizontal: 16,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 14,
      paddingBottom: 18,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 12,
      borderWidth: 1,
      borderColor:
        "#e5e7eb",
    },

    headerText: {
      flex: 1,
    },

    title: {
      fontSize: 23,
      fontWeight: "800",
      color: "#17202A",
    },

    subtitle: {
      marginTop: 3,
      color: "#64748b",
      fontSize: 13,
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
    },

    loadingText: {
      marginTop: 10,
      color: "#64748b",
    },

    list: {
      paddingBottom: 40,
    },

    emptyList: {
      flexGrow: 1,
      paddingBottom: 40,
    },

    card: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        "#e5e7eb",
      padding: 16,
      marginBottom: 14,
    },

    cardTop: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 10,
    },

    propertyIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor:
        "#EAF4F1",
      alignItems: "center",
      justifyContent:
        "center",
    },

    propertyInfo: {
      flex: 1,
    },

    propertyTitle: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "800",
      color: "#17202A",
    },

    locationRow: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      marginTop: 5,
      gap: 3,
    },

    locationText: {
      flex: 1,
      fontSize: 12,
      color: "#64748b",
      lineHeight: 17,
    },

    statusBadge: {
      borderRadius: 20,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    pendingBadge: {
      backgroundColor:
        "#FFF2D7",
    },

    normalBadge: {
      backgroundColor:
        "#E5F4EC",
    },

    statusText: {
      fontSize: 10,
      fontWeight: "800",
    },

    pendingText: {
      color: "#885E00",
    },

    normalText: {
      color: "#217A48",
    },

    divider: {
      height: 1,
      backgroundColor:
        "#f1f5f9",
      marginVertical: 14,
    },

    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 11,
      gap: 10,
    },

    detailContent: {
      flex: 1,
    },

    detailLabel: {
      fontSize: 11,
      color: "#94a3b8",
      fontWeight: "600",
    },

    detailValue: {
      marginTop: 2,
      fontSize: 13.5,
      color: "#334155",
      fontWeight: "600",
    },

    noteCard: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 8,
      backgroundColor:
        "#f8fafc",
      borderRadius: 11,
      padding: 11,
      marginTop: 4,
    },

    noteText: {
      flex: 1,
      color: "#64748b",
      fontSize: 12.5,
      lineHeight: 18,
    },

    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
    },

    acceptButton: {
      flex: 1,
      minHeight: 45,
      backgroundColor:
        "#16a34a",
      borderRadius: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
    },

    rejectButton: {
      flex: 1,
      minHeight: 45,
      backgroundColor:
        "#dc2626",
      borderRadius: 11,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
    },

    disabledButton: {
      opacity: 0.55,
    },

    buttonText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 13,
    },

    viewRow: {
      marginTop: 15,
      borderTopWidth: 1,
      borderTopColor:
        "#f1f5f9",
      paddingTop: 12,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    viewText: {
      color: "#147D64",
      fontWeight: "700",
      fontSize: 12.5,
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor:
        "#EAF4F1",
      alignItems: "center",
      justifyContent:
        "center",
    },

    emptyTitle: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: "800",
      color: "#17202A",
      textAlign: "center",
    },

    emptyDescription: {
      marginTop: 7,
      color: "#64748b",
      lineHeight: 20,
      textAlign: "center",
      maxWidth: 320,
    },
  });