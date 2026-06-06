import React, { useState, useEffect , useMemo} from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, 
  ActivityIndicator, KeyboardAvoidingView,
StyleSheet} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "@/src/services/api";
import CustomAlert from "components/CustomAlert";
import Protected from "components/Protected";
import { useAuth } from "context/AuthContext";
import { useForm } from "react-hook-form";
import { Picker } from "@react-native-picker/picker";
import Navbar from "components/Navbar";




const InterestFormScreen = () => {
  const { propertyId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);



  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);

  // Group slots by day name for easier lookup
  const groupedSlots = slots.reduce((acc, slot) => {
    const dayName = slot.day.name;
    if (!acc[dayName]) acc[dayName] = [];
    acc[dayName].push(slot.time_slot);
    return acc;
  }, {});

  const handleDayChange = (dayId) => {
  const selectedSlotGroup = slots.filter(s => s.day.id === dayId);
  setSelectedDay(dayId);
  setAvailableTimes(selectedSlotGroup.map(s => s.time_slot));
  setSelectedTime("");
};



  const [loading, setLoading] = useState(false);
 const { reset,  formState: { errors },
  handleSubmit: formHandleSubmit,
  register } = useForm({
  defaultValues: {
    surname: "",
    firstname: "",
    othernames: "",
    dob: "",
    phoneNumber: "",
    whatsappNumber: "",
    user_id: ""
  }
});
    const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  
  function showAlert(title: string, message: string) {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  }

  useEffect(() => {
    if (user?.id) {
      reset({ user_id: user.id }); // ✅ updates the form value when user arrives
    }
  }, [user, reset]);

  useEffect(() => {
    const fetchSlots = async () => {
        if (!propertyId || !user?.id) return;

        try {
            const response = await API.get(`/public/property/${propertyId}/slots/${user.id}`);
            const slotsData = response?.data?.available_slots;
            const message = response?.data?.message;
            console.log("slots data", slotsData);
            showAlert('message', message);
            setSlots(Array.isArray(slotsData) ? slotsData : []);
        } catch (error) {
            console.error('Error fetching slots:', error);
            setSlots([]);
        }
    };

    fetchSlots();
}, [propertyId, user]);

 // Build unique days once when slots change
  const uniqueDays = useMemo(() => {
  const map = new Map();
  slots.forEach(slot => {
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
    .filter(s => s.day && s.day.id === selectedDay)
    .map(s => s.time_slot)
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i); // dedupe

  setAvailableTimes(times);
}, [selectedDay, slots]);



 const onSubmit = async (formData) => {
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
      const res = await API.post(`/public/submit-appointment`, payload);
      if(res.status === 200){
      showAlert("success", res.data.message);
      router.push("/home");
    } else {
      showAlert("error", "Error submitting interest");
    }
    } catch (err) {
      console.log(err);
      showAlert("error", "Error submitting interest");
    } finally {
      setLoading(false);
    }
  };

  const [selectedSlot, setSelectedSlot] = useState(null);

 return (
  <Protected>
    <KeyboardAvoidingView>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <Text
          style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}
        >
          Property Interest Form
        </Text>

        <View>
          <Text style={styles.title}>Available Appointment Slots</Text>

          {slots.length === 0 ? (
            <Text>No slots available</Text>
          ) : (
            <>
              {/* Day Picker */}
              <Text style={{ marginBottom: 6 }}>Select Day:</Text>
              <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8 }}>
                <Picker
                  selectedValue={selectedDay}
                  onValueChange={(value) =>
                    setSelectedDay(value ? Number(value) : null)
                  }
                >
                  <Picker.Item label="-- Select Day --" value="" />
                  {uniqueDays.map((d) => (
                    <Picker.Item key={d.id} label={d.name} value={d.id} />
                  ))}
                </Picker>
              </View>

              {/* Time Picker */}
              {selectedDay && (
                <>
                  <Text style={{ marginTop: 12, marginBottom: 6 }}>
                    Select Time:
                  </Text>
                  <View
                    style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8 }}
                  >
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

              {/* Confirmation */}
              {selectedDay && selectedTime && (
                <Text style={{ marginTop: 10, color: "green" }}>
                  You selected{" "}
                  {uniqueDays.find((d) => d.id === selectedDay)?.name} at{" "}
                  {availableTimes.find((t) => t.id === selectedTime)?.name}
                </Text>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={formHandleSubmit(onSubmit)}
                disabled={loading}
                style={{
                  backgroundColor: "#16a34a",
                  padding: 14,
                  borderRadius: 8,
                  marginTop: 20,
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Custom Alert */}
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
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
});
export default InterestFormScreen;
