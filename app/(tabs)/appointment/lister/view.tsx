import API from "@/src/services/api";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const dayNames: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

type AvailabilitySlot = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type BlockedDate = {
  id: number;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
};

export default function ListerAvailabilityView() {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  const [deletingAvailabilityId, setDeletingAvailabilityId] =
    useState<number | null>(null);

  const [deletingBlockedDateId, setDeletingBlockedDateId] =
    useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const extractArray = <T,>(responseData: any): T[] => {
    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    return [];
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [availabilityRes, blockedRes] = await Promise.all([
        API.get("/lister/availability"),
        API.get("/lister/unavailable-dates"),
      ]);

      const availabilityData =
        extractArray<AvailabilitySlot>(availabilityRes.data);

      const blockedData =
        extractArray<BlockedDate>(blockedRes.data);

      console.log(
        "LISTER AVAILABILITY RESPONSE:",
        availabilityRes.data
      );

      console.log(
        "LISTER BLOCKED DATES RESPONSE:",
        blockedRes.data
      );

      setAvailability(availabilityData);
      setBlockedDates(blockedData);
    } catch (error: any) {
      console.error(
        "Failed to load lister availability:",
        error?.response?.data || error
      );

      setAvailability([]);
      setBlockedDates([]);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not load availability."
      );
    } finally {
      setLoading(false);
    }
  };

  const blockDate = async () => {
    if (!date.trim()) {
      Alert.alert(
        "Required",
        "Enter a date, for example 2026-09-14."
      );
      return;
    }

    if (
      (startTime && !endTime) ||
      (!startTime && endTime)
    ) {
      Alert.alert(
        "Invalid Time",
        "Enter both start and end time, or leave both empty to block the whole day."
      );
      return;
    }

    try {
      await API.post("/lister/unavailable-dates", {
        date: date.trim(),
        start_time: startTime.trim() || null,
        end_time: endTime.trim() || null,
        reason: reason.trim() || null,
      });

      setDate("");
      setStartTime("");
      setEndTime("");
      setReason("");

      Alert.alert(
        "Success",
        "The unavailable date has been added."
      );

      await loadData();
    } catch (error: any) {
      console.error(
        "Block date error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not block date."
      );
    }
  };

  const confirmRemoveAvailability = (
    item: AvailabilitySlot
  ) => {
    const day =
      dayNames[item.day_of_week] ?? "this day";

    Alert.alert(
      "Remove Availability",
      `Remove your ${day} availability from ${item.start_time} to ${item.end_time}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            removeAvailability(item.id),
        },
      ]
    );
  };

  const removeAvailability = async (
    id: number
  ) => {
    if (deletingAvailabilityId !== null) {
      return;
    }

    try {
      setDeletingAvailabilityId(id);

      await API.delete(
        `/lister/availability/${id}`
      );

      setAvailability((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );

      Alert.alert(
        "Success",
        "Availability removed."
      );
    } catch (error: any) {
      console.error(
        "Remove availability error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not remove availability."
      );
    } finally {
      setDeletingAvailabilityId(null);
    }
  };

  const confirmRemoveBlockedDate = (
    item: BlockedDate
  ) => {
    Alert.alert(
      "Remove Blocked Date",
      `Remove the block for ${item.date}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            removeBlockedDate(item.id),
        },
      ]
    );
  };

  const removeBlockedDate = async (
    id: number
  ) => {
    if (deletingBlockedDateId !== null) {
      return;
    }

    try {
      setDeletingBlockedDateId(id);

      await API.delete(
        `/lister/unavailable-dates/${id}`
      );

      setBlockedDates((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );

      Alert.alert(
        "Success",
        "Blocked date removed."
      );
    } catch (error: any) {
      console.error(
        "Remove blocked date error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Could not remove blocked date."
      );
    } finally {
      setDeletingBlockedDateId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading availability...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        My Availability
      </Text>

      <Text style={styles.sectionTitle}>
        Weekly Availability
      </Text>

      {availability.length === 0 ? (
        <Text style={styles.empty}>
          No weekly availability created yet.
        </Text>
      ) : (
        availability.map((item) => (
          <View
            key={`availability-${item.id}`}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>
                  {dayNames[item.day_of_week] ??
                    "Unknown day"}
                </Text>

                <Text style={styles.timeText}>
                  {item.start_time} -{" "}
                  {item.end_time}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  deletingAvailabilityId ===
                    item.id &&
                    styles.disabledButton,
                ]}
                disabled={
                  deletingAvailabilityId !== null
                }
                onPress={() =>
                  confirmRemoveAvailability(item)
                }
              >
                <Text style={styles.deleteText}>
                  {deletingAvailabilityId ===
                  item.id
                    ? "Removing..."
                    : "Remove"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>
        Block Specific Date
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>
          Date
        </Text>

        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="2026-09-14"
          style={styles.input}
          autoCapitalize="none"
        />

        <Text style={styles.helper}>
          Leave the times empty if you want to
          block the entire day.
        </Text>

        <Text style={styles.label}>
          Start Time
        </Text>

        <TextInput
          value={startTime}
          onChangeText={setStartTime}
          placeholder="10:00"
          style={styles.input}
          autoCapitalize="none"
        />

        <Text style={styles.label}>
          End Time
        </Text>

        <TextInput
          value={endTime}
          onChangeText={setEndTime}
          placeholder="12:00"
          style={styles.input}
          autoCapitalize="none"
        />

        <Text style={styles.label}>
          Reason
        </Text>

        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Optional reason"
          style={styles.input}
          multiline
        />

        <TouchableOpacity
          style={styles.button}
          onPress={blockDate}
        >
          <Text style={styles.buttonText}>
            Block Date
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        Blocked Dates
      </Text>

      {blockedDates.length === 0 ? (
        <Text style={styles.empty}>
          No blocked dates.
        </Text>
      ) : (
        blockedDates.map((item) => (
          <View
            key={`blocked-${item.id}`}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>
              {item.date}
            </Text>

            <Text style={styles.timeText}>
              {item.start_time &&
              item.end_time
                ? `${item.start_time} - ${item.end_time}`
                : "Whole day blocked"}
            </Text>

            {item.reason ? (
              <Text style={styles.reasonText}>
                {item.reason}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.deleteButtonBottom,
                deletingBlockedDateId ===
                  item.id &&
                  styles.disabledButton,
              ]}
              disabled={
                deletingBlockedDateId !== null
              }
              onPress={() =>
                confirmRemoveBlockedDate(item)
              }
            >
              <Text style={styles.deleteText}>
                {deletingBlockedDateId ===
                item.id
                  ? "Removing..."
                  : "Remove"}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  contentContainer: {
    padding: 16,
    paddingBottom: 60,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748b",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 10,
    color: "#111827",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },

  helper: {
    color: "#64748b",
    fontSize: 13,
    marginTop: -3,
    marginBottom: 12,
  },

  empty: {
    color: "#64748b",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  cardInfo: {
    flex: 1,
  },

  formCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  cardTitle: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
    color: "#111827",
  },

  timeText: {
    color: "#475569",
  },

  reasonText: {
    color: "#475569",
    marginTop: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
    color: "#111827",
  },

  button: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 10,
    marginTop: 4,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },

  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },

  deleteButtonBottom: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },

  deleteText: {
    color: "#dc2626",
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.5,
  },
});