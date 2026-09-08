import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type TrustScore = {
  score?: number | null;
  level?: string | null;
  event_count?: number | null;
};

type RejectionReason = {
  id: number | string;
  name: string;
  code: string;
};

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

    first_name?: string | null;

    name?: string | null;

    full_name?: string | null;

    trust_score?: TrustScore | null;

    trustScore?: TrustScore | null;
  } | null;

  property?: {
    id?: number | string;

    uuid?: string | null;

    title?: string | null;

    name?: string | null;

    /*
     * Existing column on
     * properties table.
     */
    meeting_place?: string | null;

    /*
     * Supports either:
     *
     * area: "Lekki"
     *
     * or:
     *
     * area: {
     *   id: 1,
     *   name: "Lekki"
     * }
     */
    area?:
      | string
      | {
          id?: number | string;
          name?: string | null;
          title?: string | null;
        }
      | null;

    /*
     * Keep these only as possible
     * fallback names from your API.
     * They are NOT displayed as
     * property address.
     */
    area_name?: string | null;

    city?: string | null;

    state?: string | null;
  } | null;
};

/*
|--------------------------------------------------------------------------
| Status Helpers
|--------------------------------------------------------------------------
*/

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

    case "appointment_accepted":
    case "accepted":
      return "Accepted";

    case "appointment_confirmed":
    case "confirmed":
      return "Confirmed";

    case "appointment_rejected":
    case "appointment_declined":
    case "rejected":
    case "declined":
      return "Rejected";

    case "appointment_rescheduled":
    case "rescheduled":
      return "Rescheduled";

    case "appointment_cancelled":
    case "cancelled":
      return "Cancelled";

    case "appointment_completed":
    case "completed":
      return "Completed";

    case "appointment_expired":
    case "expired":
      return "Expired";

    case "appointment_no_show":
    case "no_show":
      return "No Show";

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
  ].includes(
    getStatusCode(
      appointment
    )
  );
}

/*
|--------------------------------------------------------------------------
| Customer Helpers
|--------------------------------------------------------------------------
*/

function getCustomerFirstName(
  appointment: Appointment
): string {
  const customer =
    appointment.customer;

  if (!customer) {
    return "Customer";
  }

  if (
    customer.first_name &&
    customer.first_name.trim()
  ) {
    return customer
      .first_name
      .trim();
  }

  /*
   * Fallback in case current
   * API returns full_name/name
   * instead of first_name.
   */
  const fallback =
    customer.full_name ??
    customer.name;

  if (
    fallback &&
    fallback.trim()
  ) {
    return (
      fallback
        .trim()
        .split(/\s+/)[0] ??
      "Customer"
    );
  }

  return "Customer";
}

function getTrustScore(
  appointment: Appointment
): TrustScore | null {
  return (
    appointment.customer
      ?.trust_score ??
    appointment.customer
      ?.trustScore ??
    null
  );
}

function getTrustLevelLabel(
  level?: string | null
): string {
  switch (
    String(level ?? "")
      .trim()
      .toLowerCase()
  ) {
    case "very_low":
      return "Very Low";

    case "low":
      return "Low";

    case "fair":
      return "Fair";

    case "good":
      return "Good";

    case "high":
      return "High";

    case "excellent":
      return "Excellent";

    case "new":
    default:
      return "New";
  }
}

/*
|--------------------------------------------------------------------------
| Property Helpers
|--------------------------------------------------------------------------
*/

function getPropertyTitle(
  appointment: Appointment
): string {
  return (
    appointment.property?.title ??
    appointment.property?.name ??
    "Property"
  );
}

function getPropertyArea(
  appointment: Appointment
): string {
  const property =
    appointment.property;

  if (!property) {
    return "Area not available";
  }

  /*
   * First preference:
   * property.area
   */
  if (
    typeof property.area ===
      "string" &&
    property.area.trim()
  ) {
    return property.area.trim();
  }

  if (
    property.area &&
    typeof property.area ===
      "object"
  ) {
    const areaName =
      property.area.name ??
      property.area.title;

    if (
      areaName &&
      areaName.trim()
    ) {
      return areaName.trim();
    }
  }

  /*
   * Optional API fallback.
   */
  if (
    property.area_name &&
    property.area_name.trim()
  ) {
    return property
      .area_name
      .trim();
  }

  /*
   * If your backend has not yet
   * returned the area relationship,
   * city is safer than exposing
   * property address.
   */
  if (
    property.city &&
    property.city.trim()
  ) {
    return property.city.trim();
  }

  return "Area not available";
}

function getMeetingPlace(
  appointment: Appointment
): string {
  const meetingPlace =
    appointment.property
      ?.meeting_place;

  if (
    meetingPlace &&
    meetingPlace.trim()
  ) {
    return meetingPlace.trim();
  }

  return "Meeting place not available";
}

/*
|--------------------------------------------------------------------------
| Date / Time Helpers
|--------------------------------------------------------------------------
*/

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

  /*
   * Prevent timezone changes for
   * plain YYYY-MM-DD values.
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
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
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
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

/*
|--------------------------------------------------------------------------
| Screen
|--------------------------------------------------------------------------
*/

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
    rejectionReasons,
    setRejectionReasons,
  ] = useState<
    RejectionReason[]
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

  /*
  |--------------------------------------------------------------------------
  | Reject Modal State
  |--------------------------------------------------------------------------
  */

  const [
    rejectModalVisible,
    setRejectModalVisible,
  ] = useState(false);

  const [
    rejectingAppointment,
    setRejectingAppointment,
  ] = useState<
    Appointment | null
  >(null);

  const [
    selectedReason,
    setSelectedReason,
  ] = useState<
    RejectionReason | null
  >(null);

  const [
    rejectionNote,
    setRejectionNote,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Appointments
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
            setLoading(true);
          }

          const response =
            await API.get(
              "/lister/appointments"
            );

          const body: any =
            response.data;

          console.log(
            "LISTER APPOINTMENTS RAW:",
            JSON.stringify(
              body,
              null,
              2
            )
          );

          let list:
            Appointment[] =
              [];

          if (
            Array.isArray(body)
          ) {
            list = body;
          } else if (
            body &&
            Array.isArray(
              body.data
            )
          ) {
            list =
              body.data;
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
              body.data
                .appointments
            )
          ) {
            list =
              body.data
                .appointments;
          }

          console.log(
            "LISTER APPOINTMENTS NORMALIZED:",
            list
          );

          setAppointments(
            list
          );
        } catch (
          error: any
        ) {
          console.error(
            "Lister appointments error:",
            error?.response
              ?.data ??
              error
          );

          setAppointments(
            []
          );

          Alert.alert(
            "Unable to Load Requests",
            error?.response
              ?.data
              ?.message ??
              "Could not load appointment requests."
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Load Rejection Reasons
  |--------------------------------------------------------------------------
  */

  const loadRejectionReasons =
    useCallback(
      async () => {
        try {
          const response =
            await API.get(
              "/appointments/rejection-reasons"
            );

          const body: any =
            response.data;

          console.log(
            "REJECTION REASONS RAW:",
            JSON.stringify(
              body,
              null,
              2
            )
          );

          let reasons:
            RejectionReason[] =
              [];

          if (
            Array.isArray(body)
          ) {
            reasons = body;
          } else if (
            body &&
            Array.isArray(
              body.reasons
            )
          ) {
            reasons =
              body.reasons;
          } else if (
            body &&
            Array.isArray(
              body.data
            )
          ) {
            reasons =
              body.data;
          } else if (
            body &&
            body.data &&
            Array.isArray(
              body.data.reasons
            )
          ) {
            reasons =
              body.data
                .reasons;
          }

          setRejectionReasons(
            reasons
          );
        } catch (
          error: any
        ) {
          console.error(
            "Rejection reasons error:",
            error?.response
              ?.data ??
              error
          );

          setRejectionReasons(
            []
          );
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Reload On Focus
  |--------------------------------------------------------------------------
  */

  useFocusEffect(
    useCallback(() => {
      loadAppointments(
        true
      );

      loadRejectionReasons();
    }, [
      loadAppointments,
      loadRejectionReasons,
    ])
  );

  /*
  |--------------------------------------------------------------------------
  | Accept Appointment
  |--------------------------------------------------------------------------
  */

  const acceptAppointment =
    (
      appointment:
        Appointment
    ) => {
      Alert.alert(
        "Accept Appointment",
        `Accept ${getCustomerFirstName(
          appointment
        )}'s appointment request?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Accept",

            onPress:
              async () => {
                try {
                  setProcessingId(
                    appointment.id
                  );

                  const response =
                    await API.post(
                      `/appointments/${appointment.id}/accept`
                    );

                  const responseBody: any =
                    response.data;

                  Alert.alert(
                    "Appointment Accepted",
                    responseBody &&
                      responseBody.message
                      ? responseBody.message
                      : "The appointment request has been accepted."
                  );

                  await loadAppointments(
                    false
                  );
                } catch (
                  error: any
                ) {
                  console.error(
                    "Accept appointment error:",
                    error
                      ?.response
                      ?.data ??
                      error
                  );

                  Alert.alert(
                    "Unable to Accept",
                    error
                      ?.response
                      ?.data
                      ?.message ??
                      "Could not accept this appointment."
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

  /*
  |--------------------------------------------------------------------------
  | Open Reject Modal
  |--------------------------------------------------------------------------
  */

  const openRejectModal =
    (
      appointment:
        Appointment
    ) => {
      if (
        rejectionReasons.length ===
        0
      ) {
        Alert.alert(
          "Reasons Not Available",
          "The rejection reasons could not be loaded. Please try again."
        );

        loadRejectionReasons();

        return;
      }

      setRejectingAppointment(
        appointment
      );

      setSelectedReason(
        null
      );

      setRejectionNote(
        ""
      );

      setRejectModalVisible(
        true
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Close Reject Modal
  |--------------------------------------------------------------------------
  */

  const closeRejectModal =
    () => {
      if (
        processingId !==
        null
      ) {
        return;
      }

      setRejectModalVisible(
        false
      );

      setRejectingAppointment(
        null
      );

      setSelectedReason(
        null
      );

      setRejectionNote(
        ""
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Reject Appointment
  |--------------------------------------------------------------------------
  */

  const submitRejection =
    async () => {
      if (
        !rejectingAppointment
      ) {
        return;
      }

      if (
        !selectedReason
      ) {
        Alert.alert(
          "Reason Required",
          "Please choose a reason for rejecting this appointment."
        );

        return;
      }

      const isOther =
        selectedReason.code ===
        "appointment_rejection_other";

      if (
        isOther &&
        !rejectionNote.trim()
      ) {
        Alert.alert(
          "Explanation Required",
          "Please write a short explanation when choosing Other."
        );

        return;
      }

      try {
        setProcessingId(
          rejectingAppointment.id
        );

        const response =
          await API.post(
            `/appointments/${rejectingAppointment.id}/reject`,
            {
              rejection_reason_status_id:
                selectedReason.id,

              lister_note:
                rejectionNote.trim()
                  ? rejectionNote.trim()
                  : null,
            }
          );

        const responseBody: any =
          response.data;

        setRejectModalVisible(
          false
        );

        setRejectingAppointment(
          null
        );

        setSelectedReason(
          null
        );

        setRejectionNote(
          ""
        );

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
          error?.response
            ?.data ??
            error
        );

        const backendErrors =
          error?.response
            ?.data
            ?.errors;

        let message =
          error?.response
            ?.data
            ?.message ??
          "Could not reject this appointment.";

        if (
          backendErrors &&
          typeof backendErrors ===
            "object"
        ) {
          const firstKey =
            Object.keys(
              backendErrors
            )[0];

          if (
            firstKey &&
            Array.isArray(
              backendErrors[
                firstKey
              ]
            ) &&
            backendErrors[
              firstKey
            ].length > 0
          ) {
            message =
              backendErrors[
                firstKey
              ][0];
          }
        }

        Alert.alert(
          "Unable to Reject",
          message
        );
      } finally {
        setProcessingId(
          null
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | View Full Appointment
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

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
        {/* HEADER */}

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

        {/* APPOINTMENT LIST */}

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

                loadRejectionReasons();
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

            const trust =
              getTrustScore(
                item
              );

            const trustLevel =
              getTrustLevelLabel(
                trust?.level
              );

            const isNewTrust =
              !trust ||
              !trust.level ||
              trust.level ===
                "new";

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
                {/* PROPERTY */}

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

                    {/* AREA ONLY */}

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
                          1
                        }
                      >
                        {getPropertyArea(
                          item
                        )}
                      </Text>
                    </View>
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

                {/* CUSTOMER + TRUST */}

                <View
                  style={
                    styles.customerCard
                  }
                >
                  <View
                    style={
                      styles.customerAvatar
                    }
                  >
                    <Ionicons
                      name="person"
                      size={21}
                      color="#147D64"
                    />
                  </View>

                  <View
                    style={
                      styles.customerInfo
                    }
                  >
                    <Text
                      style={
                        styles.customerLabel
                      }
                    >
                      Customer
                    </Text>

                    <Text
                      style={
                        styles.customerName
                      }
                    >
                      {getCustomerFirstName(
                        item
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.trustContainer
                    }
                  >
                    <Text
                      style={
                        styles.trustLabel
                      }
                    >
                      Trust
                    </Text>

                    {isNewTrust ? (
                      <>
                        <Text
                          style={
                            styles.trustNew
                          }
                        >
                          New
                        </Text>

                        <Text
                          style={
                            styles.trustHint
                          }
                        >
                          Limited history
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text
                          style={
                            styles.trustScore
                          }
                        >
                          {Number(
                            trust
                              ?.score ??
                              50
                          )}
                          /100
                        </Text>

                        <Text
                          style={
                            styles.trustLevel
                          }
                        >
                          {
                            trustLevel
                          }
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* VIEWING DATE */}

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

                {/* VIEWING TIME */}

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

                {/* MEETING PLACE */}

                <View
                  style={
                    styles.detailRow
                  }
                >
                  <Ionicons
                    name="navigate-outline"
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
                      Meeting Place
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {getMeetingPlace(
                        item
                      )}
                    </Text>
                  </View>
                </View>

                {/* CUSTOMER NOTE */}

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

                    <View
                      style={
                        styles.noteContent
                      }
                    >
                      <Text
                        style={
                          styles.noteLabel
                        }
                      >
                        Customer Note
                      </Text>

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
                  </View>
                ) : null}

                {/* ACCEPT / REJECT */}

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
                          item
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
                            size={19}
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

                        openRejectModal(
                          item
                        );
                      }}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={19}
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

                {/* FULL DETAILS */}

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

        {/* REJECT APPOINTMENT MODAL */}

        <Modal
          visible={
            rejectModalVisible
          }
          transparent
          animationType="slide"
          onRequestClose={
            closeRejectModal
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={
                styles.modalContainer
              }
            >
              {/* MODAL HEADER */}

              <View
                style={
                  styles.modalHeader
                }
              >
                <View
                  style={
                    styles.modalHeaderText
                  }
                >
                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Reject Appointment
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Choose the reason
                    you cannot accept
                    this appointment
                    request.
                  </Text>
                </View>

                <TouchableOpacity
                  disabled={
                    processingId !==
                    null
                  }
                  onPress={
                    closeRejectModal
                  }
                  style={
                    styles.modalClose
                  }
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color="#334155"
                  />
                </TouchableOpacity>
              </View>

              {/* CUSTOMER */}

              {rejectingAppointment && (
                <View
                  style={
                    styles.modalCustomer
                  }
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={22}
                    color="#147D64"
                  />

                  <Text
                    style={
                      styles.modalCustomerText
                    }
                  >
                    Request from{" "}
                    <Text
                      style={
                        styles.modalCustomerName
                      }
                    >
                      {getCustomerFirstName(
                        rejectingAppointment
                      )}
                    </Text>
                  </Text>
                </View>
              )}

              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
              >
                {/* REASONS */}

                <Text
                  style={
                    styles.formLabel
                  }
                >
                  Reason *
                </Text>

                {rejectionReasons.map(
                  (
                    reason
                  ) => {
                    const selected =
                      String(
                        selectedReason
                          ?.id
                      ) ===
                      String(
                        reason.id
                      );

                    return (
                      <TouchableOpacity
                        key={String(
                          reason.id
                        )}
                        style={[
                          styles.reasonOption,

                          selected &&
                            styles.reasonOptionSelected,
                        ]}
                        onPress={() =>
                          setSelectedReason(
                            reason
                          )
                        }
                      >
                        <Ionicons
                          name={
                            selected
                              ? "radio-button-on"
                              : "radio-button-off"
                          }
                          size={20}
                          color={
                            selected
                              ? "#147D64"
                              : "#94a3b8"
                          }
                        />

                        <Text
                          style={[
                            styles.reasonText,

                            selected &&
                              styles.reasonTextSelected,
                          ]}
                        >
                          {
                            reason.name
                          }
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}

                {/* NOTE */}

                <Text
                  style={[
                    styles.formLabel,
                    styles.noteFormLabel,
                  ]}
                >
                  {selectedReason
                    ?.code ===
                  "appointment_rejection_other"
                    ? "Explanation *"
                    : "Additional note"}
                </Text>

                <Text
                  style={
                    styles.formHint
                  }
                >
                  {selectedReason
                    ?.code ===
                  "appointment_rejection_other"
                    ? "Please explain why you are rejecting this request."
                    : "Optional. Add any useful information for the customer."}
                </Text>

                <TextInput
                  value={
                    rejectionNote
                  }
                  onChangeText={
                    setRejectionNote
                  }
                  multiline
                  maxLength={
                    1000
                  }
                  textAlignVertical="top"
                  placeholder={
                    selectedReason
                      ?.code ===
                    "appointment_rejection_other"
                      ? "Enter your reason..."
                      : "Add a note if necessary..."
                  }
                  placeholderTextColor="#94a3b8"
                  style={
                    styles.noteInput
                  }
                />

                <Text
                  style={
                    styles.characterCount
                  }
                >
                  {
                    rejectionNote.length
                  }
                  /1000
                </Text>
              </ScrollView>

              {/* MODAL BUTTONS */}

              <View
                style={
                  styles.modalActions
                }
              >
                <TouchableOpacity
                  disabled={
                    processingId !==
                    null
                  }
                  style={
                    styles.modalCancelButton
                  }
                  onPress={
                    closeRejectModal
                  }
                >
                  <Text
                    style={
                      styles.modalCancelText
                    }
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={
                    processingId !==
                    null
                  }
                  style={[
                    styles.modalRejectButton,

                    processingId !==
                      null &&
                      styles.disabledButton,
                  ]}
                  onPress={
                    submitRejection
                  }
                >
                  {processingId !==
                  null ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
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
                        Reject Request
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

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

    /*
    |--------------------------------------------------------------------------
    | Header
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | List
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Property
    |--------------------------------------------------------------------------
    */

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
      alignItems: "center",
      marginTop: 5,
      gap: 4,
    },

    locationText: {
      flex: 1,
      fontSize: 12.5,
      color: "#64748b",
      lineHeight: 17,
    },

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Customer / Trust
    |--------------------------------------------------------------------------
    */

    customerCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#f8fafc",
      borderRadius: 13,
      padding: 11,
      marginBottom: 15,
    },

    customerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        "#EAF4F1",
      justifyContent:
        "center",
      alignItems: "center",
    },

    customerInfo: {
      flex: 1,
      marginLeft: 10,
    },

    customerLabel: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: "700",
    },

    customerName: {
      marginTop: 2,
      fontSize: 15,
      fontWeight: "800",
      color: "#17202A",
    },

    trustContainer: {
      alignItems:
        "flex-end",
      marginLeft: 8,
    },

    trustLabel: {
      fontSize: 10,
      color: "#94a3b8",
      fontWeight: "700",
    },

    trustScore: {
      marginTop: 1,
      color: "#147D64",
      fontSize: 15,
      fontWeight: "900",
    },

    trustLevel: {
      marginTop: 1,
      color: "#64748b",
      fontSize: 10.5,
      fontWeight: "700",
    },

    trustNew: {
      marginTop: 2,
      color: "#147D64",
      fontSize: 14,
      fontWeight: "900",
    },

    trustHint: {
      marginTop: 1,
      color: "#94a3b8",
      fontSize: 9.5,
      fontWeight: "600",
    },

    /*
    |--------------------------------------------------------------------------
    | Details
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Customer Note
    |--------------------------------------------------------------------------
    */

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

    noteContent: {
      flex: 1,
    },

    noteLabel: {
      fontSize: 10.5,
      color: "#94a3b8",
      fontWeight: "700",
      marginBottom: 3,
    },

    noteText: {
      color: "#64748b",
      fontSize: 12.5,
      lineHeight: 18,
    },

    /*
    |--------------------------------------------------------------------------
    | Actions
    |--------------------------------------------------------------------------
    */

    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
    },

    acceptButton: {
      flex: 1,
      minHeight: 46,
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
      minHeight: 46,
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

    /*
    |--------------------------------------------------------------------------
    | Empty
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Modal
    |--------------------------------------------------------------------------
    */

    modalOverlay: {
      flex: 1,
      backgroundColor:
        "rgba(15, 23, 42, 0.55)",
      justifyContent:
        "flex-end",
    },

    modalContainer: {
      backgroundColor:
        "#FFFFFF",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 22,
      maxHeight: "90%",
    },

    modalHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      marginBottom: 14,
    },

    modalHeaderText: {
      flex: 1,
      paddingRight: 12,
    },

    modalTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: "#17202A",
    },

    modalSubtitle: {
      marginTop: 4,
      fontSize: 12.5,
      lineHeight: 18,
      color: "#64748b",
    },

    modalClose: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor:
        "#f1f5f9",
      justifyContent:
        "center",
      alignItems: "center",
    },

    modalCustomer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      backgroundColor:
        "#EAF4F1",
      borderRadius: 11,
      padding: 10,
      marginBottom: 16,
    },

    modalCustomerText: {
      color: "#475569",
      fontSize: 12.5,
    },

    modalCustomerName: {
      color: "#147D64",
      fontWeight: "800",
    },

    formLabel: {
      color: "#334155",
      fontWeight: "800",
      marginBottom: 9,
      fontSize: 13,
    },

    formHint: {
      color: "#94a3b8",
      fontSize: 11.5,
      lineHeight: 17,
      marginBottom: 8,
      marginTop: -4,
    },

    reasonOption: {
      minHeight: 48,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      borderRadius: 11,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 12,
      marginBottom: 8,
    },

    reasonOptionSelected: {
      borderColor:
        "#147D64",
      backgroundColor:
        "#EAF4F1",
    },

    reasonText: {
      flex: 1,
      color: "#475569",
      fontSize: 13,
      fontWeight: "600",
    },

    reasonTextSelected: {
      color: "#147D64",
      fontWeight: "800",
    },

    noteFormLabel: {
      marginTop: 14,
    },

    noteInput: {
      minHeight: 110,
      borderWidth: 1,
      borderColor:
        "#dbe2ea",
      borderRadius: 12,
      padding: 12,
      color: "#17202A",
      fontSize: 13.5,
      backgroundColor:
        "#f8fafc",
    },

    characterCount: {
      alignSelf:
        "flex-end",
      marginTop: 5,
      fontSize: 10.5,
      color: "#94a3b8",
    },

    modalActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 17,
    },

    modalCancelButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        "#dbe2ea",
      justifyContent:
        "center",
      alignItems: "center",
    },

    modalCancelText: {
      fontWeight: "800",
      color: "#475569",
    },

    modalRejectButton: {
      flex: 1.4,
      minHeight: 48,
      borderRadius: 11,
      backgroundColor:
        "#dc2626",
      flexDirection: "row",
      justifyContent:
        "center",
      alignItems: "center",
      gap: 6,
    },
  });