import API from "@/src/services/api";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Appointment = {
  id:
    | number
    | string;

  property_id:
    | number
    | string;

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

  status?: {
    id?: number | string;
    code?: string | null;
    name?: string | null;
  } | string | null;

  property?: {
    id?: number | string;
    title?: string | null;

    property_type?: {
      name?: string | null;
    } | null;

    area?: {
      name?: string | null;
    } | null;

    state?: {
      name?: string | null;
    } | null;
  } | null;

  lister?: {
    id?: number | string;
    name?: string | null;
  } | null;
};

export default function CustomerAppointmentDetailScreen() {
  const router =
    useRouter();

  const params =
    useLocalSearchParams<{
      appointmentId?:
        | string
        | string[];
    }>();

  const rawId =
    params.appointmentId;

  const appointmentId =
    Array.isArray(
      rawId
    )
      ? rawId[0]
      : rawId;

  const [
    appointment,
    setAppointment,
  ] =
    useState<Appointment | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  /*
  |--------------------------------------------------------------------------
  | Load single appointment
  |--------------------------------------------------------------------------
  */

  const loadAppointment =
    useCallback(
      async () => {
        if (
          !appointmentId
        ) {
          Alert.alert(
            "Appointment unavailable",
            "Appointment ID was not provided."
          );

          router.back();

          return;
        }

        try {
          setLoading(
            true
          );

          console.log(
            "Loading customer appointment:",
            appointmentId
          );

          const response =
            await API.get(
              `/customer/appointments/${appointmentId}`
            );

          console.log(
            "Customer appointment response:",
            response.data
          );

          const data =
            response.data
              ?.data ||
            response.data
              ?.appointment ||
            response.data;

          if (!data?.id) {
            throw new Error(
              "Appointment could not be loaded."
            );
          }

          setAppointment(
            data
          );
        } catch (
          error: any
        ) {
          console.error(
            "CUSTOMER APPOINTMENT DETAIL ERROR",
            {
              status:
                error?.response
                  ?.status,

              response:
                error?.response
                  ?.data,

              message:
                error?.message,
            }
          );

          Alert.alert(
            "Could not load appointment",
            error?.response
              ?.data
              ?.message ||
              error?.message ||
              "Unable to load this appointment."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        appointmentId,
        router,
      ]
    );

  useFocusEffect(
    useCallback(
      () => {
        loadAppointment();
      },
      [
        loadAppointment,
      ]
    )
  );

  if (
    loading
  ) {
    return (
      <View
        style={
          styles.loading
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
          Loading appointment...
        </Text>
      </View>
    );
  }

  if (
    !appointment
  ) {
    return (
      <View
        style={
          styles.loading
        }
      >
        <MaterialCommunityIcons
          name="calendar-remove-outline"
          size={48}
          color="#94a3b8"
        />

        <Text
          style={
            styles.emptyTitle
          }
        >
          Appointment unavailable
        </Text>

        <TouchableOpacity
          style={
            styles.backAction
          }
          onPress={
            () =>
              router.back()
          }
        >
          <Text
            style={
              styles.backActionText
            }
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status =
    typeof appointment.status ===
      "string"
      ? appointment.status
      : appointment.status
          ?.code ||
        "unknown";

  const statusName =
    typeof appointment.status ===
      "object"
      ? appointment.status
          ?.name ||
        status
      : status;

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
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

        <View>
          <Text
            style={
              styles.title
            }
          >
            Appointment
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Property viewing details
          </Text>
        </View>
      </View>

      <View
        style={
          styles.card
        }
      >
        <Text
          style={
            styles.propertyTitle
          }
        >
          {appointment
            .property
            ?.title ||
            appointment
              .property
              ?.property_type
              ?.name ||
            `Property #${appointment.property_id}`}
        </Text>

        {(appointment
          .property
          ?.area?.name ||
          appointment
            .property
            ?.state?.name) && (
          <Text
            style={
              styles.location
            }
          >
            {[
              appointment
                .property
                ?.area?.name,

              appointment
                .property
                ?.state?.name,
            ]
              .filter(
                Boolean
              )
              .join(", ")}
          </Text>
        )}

        <View
          style={
            styles.divider
          }
        />

        <Detail
          icon="calendar-outline"
          label="Date"
          value={
            appointment.appointment_date ||
            "Not available"
          }
        />

        <Detail
          icon="clock-outline"
          label="Time"
          value={`${appointment.start_time || "--"} - ${appointment.end_time || "--"}`}
        />

        <Detail
          icon="information-outline"
          label="Status"
          value={
            String(
              statusName
            )
          }
        />

        {appointment
          .lister?.name && (
          <Detail
            icon="account-outline"
            label="Lister"
            value={
              appointment
                .lister
                .name
            }
          />
        )}

        {appointment
          .customer_note && (
          <View
            style={
              styles.noteCard
            }
          >
            <Text
              style={
                styles.noteLabel
              }
            >
              Your note
            </Text>

            <Text
              style={
                styles.noteText
              }
            >
              {
                appointment
                  .customer_note
              }
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.detail
      }
    >
      <MaterialCommunityIcons
        name={
          icon
        }
        size={21}
        color="#147D64"
      />

      <View>
        <Text
          style={
            styles.detailLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.detailValue
          }
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#f8fafc",
    },

    content: {
      padding: 18,
      paddingBottom: 50,
    },

    loading: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#f8fafc",
      padding: 30,
    },

    loadingText: {
      marginTop: 10,
      color: "#64748b",
    },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
      marginBottom: 20,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      backgroundColor:
        "#ffffff",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    title: {
      color: "#0f172a",
      fontSize: 22,
      fontWeight:
        "900",
    },

    subtitle: {
      color: "#64748b",
      marginTop: 3,
      fontSize: 12,
    },

    card: {
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    propertyTitle: {
      color: "#0f172a",
      fontWeight:
        "900",
      fontSize: 18,
    },

    location: {
      color: "#64748b",
      marginTop: 5,
    },

    divider: {
      height: 1,
      backgroundColor:
        "#e2e8f0",
      marginVertical: 17,
    },

    detail: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
      marginBottom: 16,
    },

    detailLabel: {
      color: "#64748b",
      fontSize: 11,
      fontWeight:
        "700",
    },

    detailValue: {
      color: "#0f172a",
      marginTop: 2,
      fontWeight:
        "800",
    },

    noteCard: {
      marginTop: 5,
      backgroundColor:
        "#f8fafc",
      borderRadius: 12,
      padding: 13,
    },

    noteLabel: {
      color: "#64748b",
      fontSize: 11,
      fontWeight:
        "800",
    },

    noteText: {
      color: "#334155",
      marginTop: 5,
      lineHeight: 19,
    },

    emptyTitle: {
      color: "#0f172a",
      marginTop: 12,
      fontSize: 18,
      fontWeight:
        "900",
    },

    backAction: {
      marginTop: 18,
      backgroundColor:
        "#147D64",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },

    backActionText: {
      color: "#ffffff",
      fontWeight:
        "800",
    },
  });