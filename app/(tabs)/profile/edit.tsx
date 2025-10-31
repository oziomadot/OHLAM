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
 } from "react-native";
import Navbar from "components/Navbar";
import { useForm, Controller, useWatch} from "react-hook-form";
import { useAuth } from "context/AuthContext";
import API from "@/config";
import { useState, useEffect, useCallback  } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import Dashboard from "components/Dashboard";
import { API_BASE_URL } from "@/config";
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';


const EditProfileScreen = () => {

    const [ loading, setLoading] = useState(false);
    const [ error, setError] = useState("");
    const [image, setImage] = useState(null);
    const BASE_URL = API_BASE_URL.replace("/api", "");
    const router = useRouter();

    const { reset } = useForm();

    const { user, logout } = useAuth();
    const [form, setForm] = useState({});

    const { control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      surname: user?.surname || "",
      firstname: user?.firstname || "",
      othernames: user?.othernames || "",
      email: user?.email || "",
      phonenumber: user?.phonenumber || "",
      whatsapp: user?.whatsapp || "",
      profile_picture: user?.profile_picture || "",
      registration_status_id: user?.registration_status_id || "",
      dob: user?.dob || "",
      referral_id: user?.referral_id || "",
      workPhoneNumber: user?.workPhoneNumber || "",
      instagram:user?.instagram || "",
      linkedln: user?.linkedln || "",
      linkedlntwitter: user?.linkedlntwitter || "", 
      philosophy: user?.philosophy || "",
    },
  });


  const [profileData, setProfileData] = useState(null); // used to re-render

  const [registrationStatuses, setRegistrationStatuses] = useState([]);

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" || width > 768;

   // ✅ Fetch registration statuses from Laravel
  useEffect(() => {
    const loadRegistrationStatus = async () => {
      setLoading(true);
      try {
        const response = await API.get("/registrationStatus");
        setRegistrationStatuses(response.data.registrationStatus || []);
      } catch (err) {
        console.error("Error fetching registration statuses", err);
        setError("Failed to load registration statuses");
      } finally {
        setLoading(false);
      }
    };
    loadRegistrationStatus();
  }, []);

    
  const handleImageUpload = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    const imageUri = result.assets[0].uri;
    setValue("profile_picture", imageUri);
  }
};





 // ✅ define it outside
  const fetchProfileData = useCallback(async () => {
    const token = await AsyncStorage.getItem("token");
    try {
      const res = await API.get("/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
     console.log(res.data);
      console.log(res);
      reset(res.data); // resets form with fresh data
      setProfileData(res.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }, [reset]);

  // ✅ then call it here
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );


  const watchedRegistrationStatus = watch("registration_status_id");

  const fields = [
    { label: "Surname", name: "surname" },
    { label: "Firstname", name: "firstname" },
    { label: "Othernames", name: "othernames" },
    { label: "Email", name: "email" },
    { label: "Phone Number", name: "phonenumber" },
    { label: "WhatsApp Number", name: "whatsapp" },
    { label: "Date of birth", name: "dob"},
    { label: "Registration Status", name: "registration_status_id"},
    ...(watchedRegistrationStatus === "2" ? [{ label: "Referral ID", name: "referral_id" }] : []),
    ... (watchedRegistrationStatus === "3" ? [{ label: "Work Phone Number", name: "workPhoneNumber"},
                                            { label: "Instagram Account Name", name: "instagram"},
                                            { label: "Linkedln Account Name", name: "linkedln"},
                                            { label: "Twitter Account Name", name: "twitter"}, 
                                            { label: "Guiding Principle", name: "philosophy"} 
    ] : []),
    { label: "Profile Picture", name: "profile_picture"},
  ];

 const handleUpdate = async (form) => {
  setLoading(true);
  setError(null);
  const token = await AsyncStorage.getItem("token");

  const formData = new FormData();
  for (const key in form) {
    if (form[key]) {
      if (key === "profile_picture") {
        try {
          if (Platform.OS === "web") {
            const response = await fetch(form[key]);
            const blob = await response.blob();
            formData.append("profile_picture", blob, "profile.jpg");
          } else {
            formData.append("profile_picture", {
              uri: form[key],
              name: "profile.jpg",
              type: "image/jpeg",
            });
          }
        } catch (error) {
          console.error("Error converting image to blob:", error);
          setError("Failed to process image for upload");
          setLoading(false);
          return;
        }
      } else {
        formData.append(key, form[key]);
      }
    }
  }

  try {
    const res = await API.post("/profile/update", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data.status === 200) {


      alert("Profile updated successfully!");
      if(res.data.UserAuth === "Staff"){
      // Log out the user
      await AsyncStorage.removeItem("token");  // Clear the token
      if (logout) {
        logout();  // Call logout from AuthContext if available
      }
      router.replace("/(tabs)/home");
      } 

      await fetchProfileData();  // ✅ trigger re-render with fresh data (optional if logging out)
    } else {
      alert("Unexpected response from server.");
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    alert("Update failed.");
  } finally {
    setLoading(false);
  }
};




    return (
        <Protected>
            <View style={styles.pageContainer}>
           
            <KeyboardAvoidingView behavior="padding" style={styles.keyboardContainer}>
       <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.scrollView}>
         <Navbar/>
            <Dashboard/>
      <Text style={styles.title}>Edit Profile</Text>

      <View style={styles.tableContainer}>

      {/* 🖥️ WEB VIEW (3 Columns) */}
      {isWeb ? (
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.header]}>Field</Text>
            <Text style={[styles.cell, styles.header]}>Current Data</Text>
            <Text style={[styles.cell, styles.header]}>New Input</Text>
          </View>
{fields.map((field) => (
  <View key={field.name} style={styles.row}>
    {/* Column 1: Field Label */}
    <Text style={styles.cell}>{field.label}</Text>

    {/* Column 2: Current User Data */}
   
<View style={styles.cell}>
  {(() => {
    switch (field.name) {
      case "registration_status_id":
        return (
          <Text>
            {user?.registration_status?.name || (
              <Text style={{ color: "red" }}>Not Available</Text>
            )}
          </Text>
        );

      case "profile_picture":
        return user?.profile_picture ? (
          <Image
            source={{ uri: `${BASE_URL}/storage/${user.profile_picture}` }}
            style={styles.profileImage}
          />
        ) : (
          <Text style={{ color: "red" }}>Not Available</Text>
        );
        case "referral_id":
            return (
                <Text></Text>
            );

      default:
        return (
          <Text>
            {user?.[field.name] || (
              <Text style={{ color: "red" }}>Not Available</Text>
            )}
          </Text>
        );
    }
  })()}
</View>

    {/* Column 3: Input / Picker / Image */}
    <View style={[styles.cell, { flex: 1 }]}>
      <Controller
        control={control}
        name={field.name as any}
        render={({ field: { onChange, value } }) => {
          // You can safely use switch/if here
          switch (field.name) {
            case "registration_status_id":
              return (
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={styles.input}
                  testID="reg_picker"
                >
                  <Picker.Item
                    label="Select registration status"
                    value=""
                    color="#999"
                  />
                  {registrationStatuses.map((s) => (
                    <Picker.Item key={s.id} label={s.name} value={s.id} />
                  ))}
                </Picker>
              );

            case "profile_picture":
              return (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleImageUpload} // ← define this function
                >
                  {value ? (
                    <Image
                      source={{ uri: value }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <Text>Upload Image</Text>
                  )}
                </TouchableOpacity>
              );

            default:
              return (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder={`Enter new ${field.label.toLowerCase()}`}
                />
              );
          }
        }}
      />
    </View>
  </View>
))}

        </View>
      ) : (
        <>
          {/* 📱 MOBILE VIEW: Current Data Table */}
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.header]}>Field</Text>
              <Text style={[styles.cell, styles.header]}>Current Data</Text>
            </View>

            {fields.map((field) => (
              <View key={field.name} style={styles.row}>
                <Text style={styles.cell}>{field.label}</Text>
                <Text style={styles.cell}>{user?.[field.name] || "—"}</Text>
              </View>
            ))}
          </View>

          {/* 📱 MOBILE VIEW: New Input Table */}
          <View style={[styles.table, { marginTop: 20 }]}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.header]}>Field</Text>
              <Text style={[styles.cell, styles.header]}>New Input</Text>
            </View>

            {fields.map((field) => (
              <View key={field.name} style={styles.row}>
                <Text style={styles.cell}>{field.label}</Text>
                <View style={styles.cell}>
                  <Controller
                    control={control}
                    name={field.name as any}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  />
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.buttonContainer}>
        <Text style={styles.submitButton} onPress={handleSubmit(handleUpdate)}>
          Save Changes
        </Text>
      </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
        </View>
        </Protected>
    )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  pageContainer: {
    flex: 1,
    
    
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
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
  profileImage:{
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 16,

  }

});

export default EditProfileScreen;