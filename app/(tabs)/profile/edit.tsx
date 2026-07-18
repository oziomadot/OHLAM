import Protected from "components/Protected";
import { View, 
    KeyboardAvoidingView, 
    ScrollView, 
    Text, 
    Platform, 
    StyleSheet, 
    useWindowDimensions,
    TextInput,
    Image,
    TouchableOpacity,
    Alert,
 } from "react-native";
import Navbar from "components/Navbar";
import { useForm, Controller, useWatch} from "react-hook-form";
import { useAuth } from "context/AuthContext";
import API from "@/src/services/api";
import { useState, useEffect, useCallback  } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
// API_BASE_URL is now defined in the API service
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import { getItem, setItem } from "../../utils/storage";


import CustomAlert from "components/CustomAlert";



import mime from "mime"; // Install this: npm i mime

const EditProfileScreen = () => {
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const [form, setForm] = useState({});
  const [alertVisible, setAlertVisible] = useState(false);
   const [alertTitle, setAlertTitle] = useState("");
   const [alertMessage, setAlertMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const BASE_URL = API;

 const [formData, setFormData] = useState<Record<string, any>>({});
 const [selectedImageFile, setSelectedImageFile] = useState<any>(null);
  
  const { control, handleSubmit, formState: { dirtyFields }, getValues, reset, watch } = useForm({
  defaultValues: {
    userId: user?.id ?? "",
    surname: user?.surname ?? "",
    firstname: user?.firstname ?? "",
    othernames: user?.othernames ?? "",
    email: user?.email ?? "",
    phonenumber: user?.phonenumber ?? "",
    whatsapp: user?.whatsapp ?? "",
    profile_picture: "",
    registration_status_id: user?.registration_status?.id?.toString() ?? "",
   
    dob: user?.dob ?? "",
    referral_id: user?.referral_id ?? "",
    workPhoneNumber: user?.workPhoneNumber ?? "",
    instagram: user?.instagram ?? "",
    linkedln: user?.linkedln ?? "",
    linkedlntwitter: user?.linkedlntwitter ?? "",
    philosophy: user?.philosophy ?? ""
  },
});


const [profileData, setProfileData] = useState(null); // used to re-render

const router = useRouter();
const [originalData, setOriginalData] = useState<Record<string, any>>({});

   const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };




  useEffect(() => {
    if (user) {
     const init = {
        userId: user.id,
        surname: user.surname || "",
        firstname: user.firstname || "",
        othernames: user.othernames || "",
        email: user.email || "",
        phonenumber: user.phonenumber || "",
        whatsapp: user.whatsapp || "",
        profile_picture: user.profile_picture || "",
        registration_status_id: user.registration_status?.id?.toString() || "",
        linkedlntwitter: user.linkedlntwitter || "",
        philosophy: user.philosophy || ""
      }

      setFormData(init);
    setOriginalData(init);
    }
  }, [user]);

 
  // ✅ Image Picker (works for both web and mobile)
  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;

        // 👇 For Web, use fetch+blob; for native, direct file reference
        let imageToUpload: any;

        if (Platform.OS === "web") {
          const response = await fetch(uri);
          const blob = await response.blob();
          imageToUpload = new File([blob], "profile_picture.jpg", {
            type: blob.type || "image/jpeg",
          });
        } else {
          imageToUpload = {
            uri,
            name: uri.split("/").pop() || "profile_picture.jpg",
            type: mime.getType(uri) || "image/jpeg",
          };
        }

        setSelectedImage(uri);
setSelectedImageFile(imageToUpload);

      //   setFormData((prev) => ({
      //     ...prev,
      //     profile_picture: imageToUpload,
      //   }));
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // ✅ Submit profile update
  // const onSubmit = async () => {
  //   if (!user) return;
  //   setLoading(true);

  //   try {
  //     const formDataToSend = new FormData();

  //     // ---- 1. Only changed text fields ----
  //   Object.entries(formData).forEach(([key, value]) => {
  //     if (key === "profile_picture") return; // handled separately

  //     const original = originalData[key];
  //     // send only if value changed OR if it is a required field you *must* send
  //     if (value !== original && value !== null && value !== undefined) {
  //       formDataToSend.append(key, value as any);
  //     }
  //   });

  //   // ---- 2. Profile picture (always send if a new file is selected) ----
  //   if (selectedImage && formData.profile_picture) {
  //     formDataToSend.append("profile_picture", formData.profile_picture);
  //   }

  //   // ---- 3. Always send userId (required by backend) ----
  //   formDataToSend.append("userId", user.id.toString());
    

  //     const response = await API.post("/profile/update", formDataToSend, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //         Authorization: `Bearer ${user.token}`,
  //       },
  //     });

  //     if (response.data.status === 200) {
  //       showAlert("Success", "Profile updated successfully!");
  //       router.push("/home");
  //     }
  //   } catch (error) {
  //     console.error("Profile update failed:", error);
  //     showAlert("Error", "Failed to update profile");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const onSubmit = async (data: any) => {
  setLoading(true);
  const payload = new FormData();

  // Always send userId
  payload.append("userId", user.id.toString());

  // Send only changed fields
  Object.keys(dirtyFields).forEach((key) => {
    if (key !== "profile_picture") {
      payload.append(key, data[key]);
    }
  });

  // Send new image if selected
  if (selectedImage && formData.profile_picture) {
    payload.append("profile_picture", formData.profile_picture);
  }

  if (selectedImageFile) {
  payload.append("profile_picture", selectedImageFile);
}

  try {
    const res = await API.updateProfile(payload);

    showAlert("Success", "Profile updated!");
    router.push("/home");
  } catch (err: any) {
    showAlert("Error", err.response?.data?.message || "Update failed");
  } finally {
    setLoading(false);
  }
};



const fields = [
  { label: "Surname", name: "surname" },
  { label: "Firstname", name: "firstname" },
  { label: "Othernames", name: "othernames" },
  { label: "Email", name: "email" },
  { label: "Phone Number", name: "phonenumber" },
  { label: "WhatsApp Number", name: "whatsapp" },
  { label: "Date of Birth", name: "dob" },
  { label: "Registration Status", name: "registration_status_id" },
 
  { label: "Profile Picture", name: "profile_picture" },
];

  // ✅ In your render section for web:
  return (
    <Protected>
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={styles.keyboardContainer}
  >
    <Navbar />
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.pageContainer}>
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.header]}>Field</Text>
            <Text style={[styles.cell, styles.header]}>Current Data</Text>
            <Text style={[styles.cell, styles.header]}>New Input</Text>
          </View>

          {/* Dynamic Form Fields */}
          {fields.map((field) => (
            <View key={field.name} style={styles.row}>
              {/* Column 1: Field Label */}
              <Text style={styles.cell}>{field.label}</Text>

              {/* Column 2: Current User Data */}
              <View style={styles.cell}>
                {field.name === "profile_picture" ? (
                  user?.profile_picture ? (
                    <Image
                      source={{ uri: `${BASE_URL}/storage/${user.profile_picture}` }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <Text>—</Text>
                  )
                ) : (
                  <Text>{user?.[field.name] || "—"}</Text>
                )}
              </View>

              {/* Column 3: Input / Picker / Image */}
              <View style={[styles.cell, { flex: 1 }]}>
                {field.name === "email" ? (
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={formData.email}
                    editable={false}
                    selectTextOnFocus={false}
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Controller
                    control={control}
                    name={field.name as any}
                    render={({ field: { onChange, value } }) => {
                      if (field.name === "profile_picture") {
                        return (
                          <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={handleImagePick}
                          >
                            {selectedImage ? (
                              <Image source={{ uri: selectedImage }} style={styles.profileImage} />
                            ) : (
                              <Text>Upload Image</Text>
                            )}
                          </TouchableOpacity>
                        );
                      }
                      return (
                        <TextInput
                          style={styles.input}
                          value={value}
                          onChangeText={onChange}
                          placeholder={`Enter new ${field.label.toLowerCase()}`}
                        />
                      );
                    }}
                  />
                )}
              </View>
            </View>
          ))}

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading ? "Updating..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
      {/* Alert Modal */}
            <CustomAlert visible={alertVisible} title={alertTitle} message={alertMessage} onClose={() => setAlertVisible(false)} />
  </KeyboardAvoidingView>
  </Protected>
);

};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  avatarContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#007bff',
  },

  pageContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: -1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    zIndex: -1,
  },
  table: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    width: Platform.OS === "web" ? "40%" : "100%",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cell: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff", 
  },
  headerRow: {
    backgroundColor: "#f2f2c3",
  },
  header: {
    fontWeight: "bold",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#57AAEF",
    color: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
  tableContainer: {
   
    zIndex: -1,
    alignItems: "center",
  },
  uploadButton:{
    backgroundColor: "#57AAEF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    textAlign: "center",
    fontWeight: "bold",

  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 16,
  },
  imagePicker: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  }

});

export default EditProfileScreen;