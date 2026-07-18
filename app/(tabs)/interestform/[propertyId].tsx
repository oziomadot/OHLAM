import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import API from "@/src/services/api";
import CustomAlert from "components/CustomAlert";
import Protected from "components/Protected";
import { useAuth } from "context/AuthContext";
import { useForm } from "react-hook-form";
import property from "../properties/create";

const InterestFormScreen = () => {
  const { propertyId } = useLocalSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [checkingEscrow, setCheckingEscrow] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [availableTimes, setAvailableTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { handleSubmit: formHandleSubmit } = useForm();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");

  function showAlert(title: string, message: string) {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  }

  useEffect(() => {
    checkAccessBeforeLoadingAppointment();
  }, [propertyId, user?.id, isAuthenticated]);

  const checkAccessBeforeLoadingAppointment = async () => {
    try {
      if (!propertyId) return;

      if (!isAuthenticated || !user?.id) {
        router.replace({
          pathname: "/login",
          params: {
            redirectTo: `/interestform/${propertyId}`,
          },
        });
        return;
      }

      setCheckingEscrow(true);

      const res = await API.get(`/property/${propertyId}/appointment-eligibility`);

      const allowed = res.data?.allowed;
      const requiredEscrow = res.data?.required_escrow;
      const currentBalance = res.data?.current_balance;
      const amountNeeded = res.data?.amount_needed;
      const message = res.data?.message;

      if (!allowed) {
        router.replace({
          pathname: "/dashboard/escrow",
          params: {
            propertyId: String(propertyId),
            requiredEscrow: String(requiredEscrow ?? 0),
            currentBalance: String(currentBalance ?? 0),
            amountNeeded: String(amountNeeded ?? 0),
            message:
              message ||
              "Your escrow balance is too low to book an appointment for this property.",
          },
        });
        return;
      }

      await fetchSlots();
    } catch (error: any) {
      console.log("Eligibility error:", error?.response?.data || error);

      showAlert(
        "Error",
        error?.response?.data?.message ||
          "Unable to check appointment eligibility."
      );
    } finally {
      setCheckingEscrow(false);
    }
  };

  const fetchSlots = async () => {
    try {
      if (!propertyId || !user?.id) return;

      const response = await API.getPropertySlots(propertyId, user.id);
      const slotsData = response?.data?.available_slots;

      router.push({
        pathname: '/appointments/customer/create',
        params: {
          property_id: propertyId,
          slotsData: JSON.stringify(slotsData),
        },
      });

      setSlots(Array.isArray(slotsData) ? slotsData : []);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
    }
  };

  const uniqueDays = useMemo(() => {
    const map = new Map();

    slots.forEach((slot) => {
      const d = slot.day;
      if (d && !map.has(d.id)) {
        map.set(d.id, { id: d.id, name: d.name });
      }
    });

    return Array.from(map.values());
  }, [slots]);

  useEffect(() => {
    if (!selectedDay) {
      setAvailableTimes([]);
      setSelectedTime(null);
      return;
    }

    const times = slots
      .filter((s) => s.day && s.day.id === selectedDay)
      .map((s) => s.time_slot)
      .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

    setAvailableTimes(times);
  }, [selectedDay, slots]);

  const onSubmit = async () => {
    try {
      if (!selectedDay || !selectedTime) {
        showAlert("Error", "Please select both a day and time.");
        return;
      }

      setLoading(true);

      const payload = {
        user_id: user?.id,
        property_id: propertyId,
        day_of_week_id: selectedDay,
        time_slot_id: selectedTime,
      };

      const res = await API.submitAppointment(payload);

      if (res.status === 200) {
        showAlert("Success", res.data.message || "Appointment booked successfully.");
        router.push("/dashboard/view-appointments");
      } else {
        showAlert("Error", "Error submitting appointment.");
      }
    } catch (err: any) {
      console.log(err?.response?.data || err);

      showAlert(
        "Error",
        err?.response?.data?.message || "Error submitting appointment."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingEscrow) {
    return (
      <Protected>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.checkingText}>
            Checking escrow eligibility...
          </Text>
        </View>
      </Protected>
    );
  }

  return (
    <Protected>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.heading}>Book Property Appointment</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Escrow Protected Appointment</Text>
            <Text style={styles.infoText}>
              Your escrow balance qualifies you to book an appointment. Do not share
              private contact details outside the app.
            </Text>
          </View>

          <Text style={styles.title}>Available Appointment Slots</Text>

          {slots.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No slots available for this property.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Select Day</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDay}
                  onValueChange={(value) =>
                    setSelectedDay(value ? Number(value) : null)
                  }
                >
                  <Picker.Item label="-- Select Day --" value="" />
                  {uniqueDays.map((d: any) => (
                    <Picker.Item key={d.id} label={d.name} value={d.id} />
                  ))}
                </Picker>
              </View>

              {selectedDay && (
                <>
                  <Text style={styles.label}>Select Time</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedTime}
                      onValueChange={(value) =>
                        setSelectedTime(value ? Number(value) : null)
                      }
                    >
                      <Picker.Item label="-- Select Time --" value="" />
                      {availableTimes.map((t) => (
                        <Picker.Item key={t.id} label={t.name} value={t.id} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}

              {selectedDay && selectedTime && (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>
                    You selected{" "}
                    {uniqueDays.find((d: any) => d.id === selectedDay)?.name} at{" "}
                    {availableTimes.find((t) => t.id === selectedTime)?.name}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={formHandleSubmit(onSubmit)}
                disabled={loading}
                style={[styles.submitButton, loading && styles.disabledButton]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Book Appointment</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <CustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Protected>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: "#f8fafc",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  checkingText: {
    marginTop: 12,
    color: "#64748b",
    fontWeight: "700",
  },
  heading: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoTitle: {
    color: "#1e40af",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 6,
  },
  infoText: {
    color: "#1e3a8a",
    lineHeight: 20,
    fontWeight: "600",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
    color: "#0f172a",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyText: {
    color: "#64748b",
    fontWeight: "700",
  },
  confirmBox: {
    backgroundColor: "#dcfce7",
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  confirmText: {
    color: "#166534",
    fontWeight: "800",
  },
  submitButton: {
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 14,
    marginTop: 22,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },
});

export default InterestFormScreen;