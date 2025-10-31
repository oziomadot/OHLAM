import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, 
  ActivityIndicator, KeyboardAvoidingView} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "@/config";
import CustomAlert from "components/CustomAlert";
import Protected from "components/Protected";
import { useAuth } from "context/AuthContext";
import { useForm } from "react-hook-form";


const InterestFormScreen = () => {
  const { propertyId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);


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
      try {
        const response = await API.get(`/property/${propertyId}/slots`);
        const slotsData = response?.data?.slots;
        setSlots(Array.isArray(slotsData) ? slotsData : []);
      } catch (error) {
        console.error('Error fetching slots:', error);
        setSlots([]);
      }
    };
    
    if (propertyId) {
      fetchSlots();
    }
  }, [propertyId]);

 const onSubmit = async (formData) => {
    try {
      setLoading(true);
      const payload = user 
        ? { userId: user.id, propertyId, slots: selectedSlot }
        : { ...formData, propertyId };

      const res = await API.post(`/submit-interest`, payload);
      showAlert("success","Interest submitted successfully!");
      router.push("/home");
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
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Property Interest Form</Text>


     
        <>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>
            Available Appointment Slots
          </Text>
          {slots.length === 0 ? (
            <Text>No slots available</Text>
          ) : (
            slots.map((slot, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedSlot(slot)}
                style={{
                  borderWidth: 1,
                  borderColor: selectedSlot === slot ? "#2563eb" : "#ccc",
                  padding: 10,
                  borderRadius: 8,
                  marginVertical: 6,
                }}
              >
                <Text>{`${slot.date} — ${slot.time}`}</Text>
              </TouchableOpacity>
            ))
          )}
        </>
    

      {/* Submit */}
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
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Submit</Text>
      </TouchableOpacity>
       {/* Alert Modal */}
              <CustomAlert visible={alertVisible} title={alertTitle} message={alertMessage} onClose={() => setAlertVisible(false)} />
    </ScrollView>
    </KeyboardAvoidingView>
    </Protected>
  );
};

export default InterestFormScreen;
