import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Image,
  Button,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/context/AuthContext";
import API from "@/src/services/api";
import Navbar from "components/Navbar";
import Protected from "components/Protected";
import { useRouter } from "expo-router";

const AppointmentViewScreen = () => {
  const { user } = useAuth();
const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewAppointmentId, setReviewAppointmentId] = useState(null);

  // ----------------------
  // Fetch Appointments
  // ----------------------
  const loadAppointments = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await API.get(`/appointment/view/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      console.log(res.data);
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 60000); // refresh every 30s
    return () => clearInterval(interval);
  }, [loadAppointments]);

  // ----------------------
  // Review Modal
  // ----------------------
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setReviewImage(result.assets[0]);
  };

  const handleSubmitReview = async () => {
    if (reviewStars === 0) return Alert.alert("Error", "Please select stars");
    try {
      const formData = new FormData();
      formData.append("review", reviewText);
      formData.append("stars", reviewStars.toString());
      if (reviewImage) {
        formData.append("image", {
          uri: reviewImage.uri,
          name: "review.jpg",
          type: "image/jpeg",
        });
      }
      await API.post(`/appointment/review/${reviewAppointmentId}`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      Alert.alert("Success", "Review submitted!");
      setReviewModalVisible(false);
      loadAppointments(); // refresh
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to submit review");
    }
  };

  const handleOpenReviewModal = (id) => {
    setReviewAppointmentId(id);
    setReviewStars(0);
    setReviewText("");
    setReviewImage(null);
    setReviewModalVisible(true);
  };

  // ----------------------
  // Agent Actions
  // ----------------------
  const handleConfirm = async (appointmentId) => {
    try {
      await API.post(`/appointment/confirm/${appointmentId}`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      Alert.alert("Success", "Appointment confirmed");
      loadAppointments();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to confirm");
    }
  };

  const handleInspectionCompleted = async (appointmentId, status) => {
    try {
      await API.post(`/appointment/inspection/${appointmentId}`, { status }, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      Alert.alert("Success", "Status updated");
      loadAppointments();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update status");
    }
  };

  // ----------------------
  // Customer Actions
  // ----------------------
  const handleRemoveInterest = async (appointmentId) => {
    try {
      await API.post(`/appointment/remove-interest/${appointmentId}`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      Alert.alert("Removed", "Interest removed");
      loadAppointments();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to remove interest");
    }
  };

  const handlePayForProperty = (appointmentId) => {
    Alert.alert("Info", "Redirect to payment gateway...");
  };

  const renderStars = () => (
    <View style={{ flexDirection: "row", marginBottom: 10 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => setReviewStars(i)}>
          <Text style={{ fontSize: 24, color: i <= reviewStars ? "#FFD700" : "#ccc" }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRow = ({ item, index }) => {
    const isAgent = user?.id === item.agent?.id;
    const isCustomer = user?.id === item.user_id;
    const rowStyle = index % 2 === 0 ? styles.evenRow : styles.oddRow;
    console.log("these are itmes :", item.appointments);

    return (
       
      <View style={[styles.row, rowStyle]}>
        <Text style={styles.cell}>{item.day?.name}</Text>
        <Text style={styles.cell}>{item.time_slot?.name}</Text>
        <Text style={styles.cell}>{item.interest.property.meeting_place}</Text>
         <Text style={styles.cell}>{item.interest.property.address}</Text>
        <Text style={styles.cell}>{item.interest.property.rental_detail ? "For Rent" : "For Sale"}</Text>
        
        <TouchableOpacity style={styles.smallButton} 
         onPress={() => router.push(`/home/property/${item.interest.property.id}`)}>
        <Text style={styles.smallButton}>View Property</Text>
       </TouchableOpacity>

        <View style={[styles.cell, styles.buttonCell]}>
          {isAgent && (
            <>
              {item.confirm !== 1 && (
                <TouchableOpacity style={styles.smallButton} onPress={() => handleConfirm(item.id)}>
                  <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.smallButton} onPress={() => handleInspectionCompleted(item.id, "completed")}>
                <Text style={styles.buttonText}>Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={() => handleInspectionCompleted(item.id, "aborted")}>
                <Text style={styles.buttonText}>Aborted</Text>
              </TouchableOpacity>
            </>
          )}
          {isCustomer && (
            <>
              <Text>{item.confirm === 1 ? "Confirmed" : "Not confirmed"}</Text>
              <Text>Agent: {item.agent?.firstname}</Text>
              <Text>Phone: {item.agent?.phonenumber}</Text>
              <TouchableOpacity style={styles.smallButton} onPress={() => handleOpenReviewModal(item.id)}>
                <Text style={styles.buttonText}>Review</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={() => handleRemoveInterest(item.id)}>
                <Text style={styles.buttonText}>Not Interested</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={() => handlePayForProperty(item.id)}>
                <Text style={styles.buttonText}>Pay</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };


  return (
     <Protected>
            <KeyboardAvoidingView>
           
                <Navbar/>            
           
    <ScrollView horizontal>
      <View style={styles.container}>
        <Text style={styles.header}>Appointments</Text>

        <Button title="Refresh" onPress={loadAppointments} />

        <View style={[styles.row, styles.headerRow]}>
          <Text style={styles.headerCell}>Day</Text>
          <Text style={styles.headerCell}>Time</Text>
          <Text style={styles.headerCell}>Meeting Place</Text>          
          <Text style={styles.headerCell}>Address</Text>
          <Text style={styles.headerCell}>Purpose</Text>
          <Text style={styles.headerCell}>Property</Text>
          <Text style={styles.headerCell}>Actions / Info</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 50 }} />
        ) : (

            console.log("appointments", appointments),
          <FlatList
            data={appointments}
            renderItem={renderRow}
            keyExtractor={(item) => item.id.toString()}
          />
        )}

        {/* Review Modal */}
        <Modal
          visible={reviewModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Write Review</Text>
              <Text>Stars:</Text>
              {renderStars()}
              <TextInput
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Type your feedback here..."
                style={styles.textInput}
                multiline
              />
              <Button title="Pick Image (Optional)" onPress={pickImage} />
              {reviewImage && <Image source={{ uri: reviewImage.uri }} style={{ width: 100, height: 100, marginVertical: 10 }} />}
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                <Button title="Cancel" onPress={() => setReviewModalVisible(false)} />
                <Button title="Submit" onPress={handleSubmitReview} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
     </KeyboardAvoidingView>
        </Protected>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, minWidth: 1000 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ccc", paddingVertical: 8, flexWrap: "wrap" },
  evenRow: { backgroundColor: "#f9fafb" },
  oddRow: { backgroundColor: "#fff" },
  cell: { flex: 1, minWidth: 120, paddingHorizontal: 4 },
  headerRow: { backgroundColor: "#2563eb" },
  headerCell: { flex: 1, minWidth: 120, fontWeight: "bold", color: "#fff", paddingHorizontal: 4 },
  buttonCell: { flexDirection: "column" },
  smallButton: { backgroundColor: "#3b82f6", marginVertical: 2, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 4 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 8, width: "80%" },
  textInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, minHeight: 80, textAlignVertical: "top" },
});

export default AppointmentViewScreen;
