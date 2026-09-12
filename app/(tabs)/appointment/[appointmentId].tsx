import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import API from "@/src/services/api";
import Protected from "components/Protected";
import ScreenWrapper from "components/ScreenWrapper";

type AppointmentDetail = {
  id: number | string;
  customer_id?: number | string;
  lister_id?: number | string;
  appointment_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  customer_note?: string | null;
  lister_note?: string | null;
  meeting_place?: string | null;
  status?: {
    code?: string | null;
    name?: string | null;
  } | null;
  property?: {
    id?: number | string;
    uuid?: string | null;
    address?: string | null;
    meeting_place?: string | null;
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
    name?: string | null;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
};

function firstParam(
  value: string | string[] | undefined
): string | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function formatTime(value?: string | null): string {
  if (!value) {
    return "Not provided";
  }

  const [hourValue, minuteValue] = value.split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return value;
  }

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusLabel(appointment: AppointmentDetail): string {
  if (appointment.status?.name) {
    return appointment.status.name;
  }

  return String(
    appointment.status?.code || "Appointment"
  )
    .replace(/^appointment_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function listerName(appointment: AppointmentDetail): string {
  const lister = appointment.lister;

  return (
    lister?.full_name ||
    lister?.name ||
    [lister?.first_name, lister?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Property lister"
  );
}

type AppointmentViewerRole =
  | "customer"
  | "lister";

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    appointmentId?: string | string[];
  }>();
  const appointmentId = firstParam(params.appointmentId);

  const [appointment, setAppointment] =
    useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [viewerRole, setViewerRole] =
    useState<AppointmentViewerRole | null>(null);
  const [openingChat, setOpeningChat] =
    useState(false);

  const loadAppointment = useCallback(
    async (showLoading = true) => {
      if (!appointmentId) {
        setErrorMessage("The appointment ID is missing.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        setErrorMessage(null);

        const response =
          await API.getAppointment(appointmentId);

        const loadedAppointment =
          response?.data ?? response?.appointment ?? null;

        if (!loadedAppointment?.id) {
          throw new Error("Appointment could not be loaded.");
        }

        setAppointment(loadedAppointment);
        setViewerRole(
          response?.viewer_role === "lister"
            ? "lister"
            : "customer"
        );
      } catch (error: any) {
        setAppointment(null);
        setViewerRole(null);
        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load this appointment."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appointmentId]
  );

  useFocusEffect(
    useCallback(() => {
      void loadAppointment();
    }, [loadAppointment])
  );

  const openAppointmentChat = async () => {
    if (!appointment?.id || openingChat) {
      return;
    }

    try {
      setOpeningChat(true);

      const response =
        await API.createAppointmentConversation(
          appointment.id
        );

      const conversation =
        response?.data?.conversation ??
        response?.data ??
        response?.conversation;

      if (!conversation?.id) {
        throw new Error(
          "The conversation could not be opened."
        );
      }

      router.push({
        pathname:
          "/(tabs)/chat/[conversationId]" as never,
        params: {
          conversationId:
            String(conversation.id),
        },
      });
    } catch (error: any) {
      Alert.alert(
        "Unable to Open Chat",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to open the appointment chat."
      );
    } finally {
      setOpeningChat(false);
    }
  };

  if (loading) {
    return (
      <Protected>
        <ScreenWrapper>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>
              Loading appointment...
            </Text>
          </View>
        </ScreenWrapper>
      </Protected>
    );
  }

  return (
    <Protected>
      <ScreenWrapper>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadAppointment(false);
              }}
            />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="#0f172a"
              />
            </TouchableOpacity>

            <View style={styles.headerText}>
              <Text style={styles.title}>Appointment Details</Text>
              <Text style={styles.subtitle}>
                Viewing request #{appointmentId}
              </Text>
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorCard}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={34}
                color="#b91c1c"
              />
              <Text style={styles.errorTitle}>
                Appointment unavailable
              </Text>
              <Text style={styles.errorText}>{errorMessage}</Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => void loadAppointment()}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  router.replace("/appointment" as never)
                }
              >
                <Text style={styles.secondaryButtonText}>
                  View All Appointments
                </Text>
              </TouchableOpacity>
            </View>
          ) : appointment ? (
            <>
              <View style={styles.statusCard}>
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={28}
                  color="#047857"
                />
                <View style={styles.flexOne}>
                  <Text style={styles.statusCaption}>Status</Text>
                  <Text style={styles.statusValue}>
                    {statusLabel(appointment)}
                  </Text>
                </View>
              </View>

              <DetailCard title="Viewing Schedule" icon="calendar-clock">
                <DetailRow
                  label="Date"
                  value={formatDate(appointment.appointment_date)}
                />
                <DetailRow
                  label="Time"
                  value={`${formatTime(
                    appointment.start_time
                  )} – ${formatTime(appointment.end_time)}`}
                />
                <DetailRow
                  label="Meeting place"
                  value={
                    appointment.meeting_place ||
                    appointment.property?.meeting_place ||
                    "The lister will provide the meeting point."
                  }
                />
              </DetailCard>

              <DetailCard title="Property" icon="home-outline">
                <DetailRow
                  label="Type"
                  value={
                    appointment.property?.property_type?.name ||
                    "Property viewing"
                  }
                />
                <DetailRow
                  label="Address"
                  value={
                    appointment.property?.address ||
                    "Address unavailable"
                  }
                />
                <DetailRow
                  label="Location"
                  value={
                    [
                      appointment.property?.area?.name,
                      appointment.property?.state?.name,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Location unavailable"
                  }
                />
                <DetailRow
                  label="Lister"
                  value={listerName(appointment)}
                />
              </DetailCard>

              {(appointment.customer_note || appointment.lister_note) && (
                <DetailCard title="Notes" icon="note-text-outline">
                  {appointment.customer_note ? (
                    <DetailRow
                      label="Your note"
                      value={appointment.customer_note}
                    />
                  ) : null}
                  {appointment.lister_note ? (
                    <DetailRow
                      label="Lister note"
                      value={appointment.lister_note}
                    />
                  ) : null}
                </DetailCard>
              )}

              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>
                  Appointment Communication
                </Text>
                <Text style={styles.actionDescription}>
                  Keep messages about this viewing inside OHLAM SecureChat.
                </Text>

                <TouchableOpacity
                  style={styles.chatButton}
                  disabled={openingChat}
                  onPress={() => void openAppointmentChat()}
                >
                  {openingChat ? (
                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="message-text-outline"
                      size={20}
                      color="#ffffff"
                    />
                  )}
                  <Text style={styles.chatButtonText}>
                    {openingChat
                      ? "Opening Chat..."
                      : viewerRole === "lister"
                        ? "Chat Customer"
                        : "Chat Lister"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inspectionNotice}>
                <MaterialCommunityIcons
                  name="map-marker-check-outline"
                  size={25}
                  color="#92400e"
                />
                <View style={styles.flexOne}>
                  <Text style={styles.inspectionNoticeTitle}>
                    Inspection confirmation
                  </Text>
                  <Text style={styles.inspectionNoticeText}>
                    {viewerRole === "lister"
                      ? "At the property, remind the customer to record the inspection outcome in OHLAM. Location verification and both parties’ reviews will be collected on the inspection screen."
                      : "Record the inspection outcome only while you are at the property. OHLAM will request your location and your separate reviews of the property and lister."}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  router.replace("/appointment" as never)
                }
              >
                <Text style={styles.secondaryButtonText}>
                  View All Appointments
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      </ScreenWrapper>
    </Protected>
  );
}

function DetailCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color="#2563eb"
        />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 18,
    backgroundColor: "#f8fafc",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerText: { flex: 1 },
  title: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 3,
    color: "#64748b",
    fontWeight: "600",
  },
  flexOne: { flex: 1 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  statusCaption: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusValue: {
    marginTop: 2,
    color: "#065f46",
    fontSize: 17,
    fontWeight: "900",
  },
  card: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
  },
  detailRow: {
    paddingVertical: 10,
  },
  detailLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailValue: {
    marginTop: 4,
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  errorCard: {
    alignItems: "center",
    padding: 22,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorTitle: {
    marginTop: 10,
    color: "#991b1b",
    fontSize: 18,
    fontWeight: "900",
  },
  errorText: {
    marginTop: 7,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 46,
    marginTop: 18,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 46,
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  secondaryButtonText: {
    color: "#334155",
    fontWeight: "800",
  },
  actionCard: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  actionTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "900",
  },
  actionDescription: {
    marginTop: 5,
    color: "#64748b",
    lineHeight: 20,
    fontWeight: "600",
  },
  chatButton: {
    minHeight: 48,
    marginTop: 14,
    borderRadius: 13,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  chatButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  inspectionNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  inspectionNoticeTitle: {
    color: "#92400e",
    fontSize: 15,
    fontWeight: "900",
  },
  inspectionNoticeText: {
    marginTop: 5,
    color: "#78350f",
    lineHeight: 20,
    fontWeight: "600",
  },
});
