import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { setItemSafe, getItemSafe } from "@/utils/storage";
import API from "@/src/services/api";
import Navbar from "components/Navbar";
import ScreenWrapper from "components/ScreenWrapper";
import { Picker } from "@react-native-picker/picker";
import CustomAlert from "components/CustomAlert";
import { Controller, useForm } from "react-hook-form";
import { getDeviceDetails } from "@/src/utils/device";

type User = {
  id: number | string;
  name?: string;
  email?: string;
};


const IdCardUpload = () => {
  const router = useRouter();
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [requiresBack, setRequiresBack] = useState(false);
  const [idCardTypes, setIdCardTypes] = useState<any[]>([]);
   const [error, setError] = useState("");
   const [loadingTypes, setLoadingTypes] = useState(true);
const [uploading, setUploading] = useState(false);
const [idType, setIdType] = useState<number | "">("");


     const [alertVisible, setAlertVisible] = useState(false);
     const [alertMessage, setAlertMessage] = useState("");
     const [alertTitle, setAlertTitle] = useState("");
   
     function showAlert(title: string, message: string) {
       setAlertTitle(title);
       setAlertMessage(message);
       setAlertVisible(true);
     }

     const{
      control
     } = useForm();

  // Load user info on mount
  React.useEffect(() => {
      const fetchData = async () => {
       
        const userData = await getItemSafe("user");
        setUser(JSON.parse(userData));

        
      };
      fetchData();
    }, []);

  useEffect(() => {
  // NIN_Card & Passport need only front; Driver’s License & PVC need front + back
  if (idType === 4 || idType === 5) {
    setRequiresBack(true);
  } else {
    setRequiresBack(false);
  }
}, [idType]);

useEffect(() => {
    const loadIdCardTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await API.getIdCardTypes();
        console.log("ID Card Types: ", response);
        
        setIdCardTypes(response);
      } catch (err) {
        console.error("Error fetching id card types ", err);
        setError("Failed to load id card types");
      } finally {
        setLoadingTypes(false);
      }
    };
    loadIdCardTypes();
  }, []);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
      return false;
    }
    return true;
  };

  const pickImage = async (side: 'front' | 'back') => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 2],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (side === 'front') {
          setFrontImage(result.assets[0].uri);
        } else {
          setBackImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async (side: 'front' | 'back') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 2],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (side === 'front') {
          setFrontImage(result.assets[0].uri);
        } else {
          setBackImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSubmit = async () => {
    console.log('Started ID card upload submission');
  const userId = user?.id;
    console.log('Submitting ID card upload');

    const device = await getDeviceDetails();

    console.log("SUBMIT VALUES:", {
  userId,
  idType,
  frontImage,
  backImage,
  requiresBack,
});

  if (!idType) {
    Alert.alert("Error", "Please select the type of ID card you are uploading");
    return;
  }

  if (!frontImage) {
    Alert.alert("Error", "Please upload the front of your ID card");
    return;
  }

  if (requiresBack && !backImage) {
    Alert.alert("Error", "Please upload the back of your ID card");
    return;
  }

  if (!userId) {
    Alert.alert("Error", "User ID not found. Please login again.");
    return;
  }

  setUploading(true);
  try {
    const formData = new FormData();
    formData.append("user_id", userId.toString());
    formData.append("id_type_id", String(idType));
    formData.append("device_id", device.device_id || "");
    formData.append("device_name", device.device_name || "");
    formData.append("brand", device.brand || "");
    formData.append("model_name", device.model_name || "");
    formData.append("os_name", device.os_name || "");
    formData.append("os_version", device.os_version || "");
    formData.append("platform", device.platform || "");
    formData.append("front_image", {
      uri: frontImage,
      name: `front_${Date.now()}.jpg`,
      type: "image/jpeg",
    } as any);

    if (backImage && requiresBack) {
      formData.append("back_image", {
        uri: backImage,
        name: `back_${Date.now()}.jpg`,
        type: "image/jpeg",
      } as any);
    }

   const res = await API.verifyIdCard(formData);

if (res?.success === true && res?.token) {
  await API.setToken(res.token);
  await setItemSafe("auth_token", res.token);
  await setItemSafe("user", JSON.stringify(res.user));
  await setItemSafe("registrationCompleted", "true");

  Alert.alert("Success", res?.message || "ID card verified successfully", [
    {
      text: "OK",
      onPress: () => router.replace("/(tabs)/dashboard"),
    },
  ]);
} else {
  Alert.alert(
    "Verification failed",
    res?.message || "Details did not match."
  );
}
  }  catch (error: any) {
  console.log("UPLOAD ERROR FULL:", error);
  console.log("UPLOAD ERROR RESPONSE:", error?.response?.data);
  console.log("UPLOAD ERROR MESSAGE:", error?.message);

  Alert.alert(
    "Error",
    error?.response?.data?.message ||
      error?.message ||
      "Failed to upload ID card. Please try again."
  );
} finally {
    setUploading(false);
  }
  };
  


    // ✅ Loading / error state
    if (loading && idCardTypes.length === 0) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <CustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
          />
        </View>
      );
    }
  
      if (error) {
        return (
          <View style={styles.center}>
            <Text style={{ color: "red" }}>{error}</Text>
          </View>
        );
      }


  const ImagePickerButton = ({ side, title }: { side: 'front' | 'back'; title: string }) => (
    <View style={styles.imagePicker}>
      <Text style={styles.imageLabel}>{title}</Text>



      
      {((side === 'front' && frontImage) || (side === 'back' && backImage)) ? (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: side === 'front' ? frontImage : backImage }} 
            style={styles.previewImage} 
          />
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => pickImage(side)}
          >
            <Text style={styles.changeButtonText}>Change Image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.pickButton}
            onPress={() => pickImage(side)}
          >
            <Text style={styles.pickButtonText}>📷 Choose from Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.pickButton}
            onPress={() => takePhoto(side)}
          >
            <Text style={styles.pickButtonText}>📸 Take Photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  console.log("loading =", loading);
console.log("uploading =", uploading);

  return (
    <ScreenWrapper>
      <Navbar/>

      <ScrollView style={styles.scrollContainer}>
    
        <View style={styles.container}>
          <Text style={styles.title}>ID Card Upload</Text>
          <Text style={styles.subtitle}>
            Upload a clear photo of your government-issued ID card
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Accepted ID Cards:</Text>
            <Text style={styles.infoText}>
              • National ID Card{"\n"}
              • Driver's License{"\n"}
              • Voter's Card{"\n"}
              • International Passport
            </Text>
          </View>


           {/* inside your return block, before ImagePickerButton components */}
<View style={styles.pickerBox}>
  <Text style={styles.label}>Select ID Type</Text>
  
        
        <Controller
          control={control}
          name="id_card_id"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerWrapper}>
              <Picker
  selectedValue={idType}
 onValueChange={(value) => setIdType(Number(value))}
>
  <Picker.Item label="Select ID Type" value="" />

  {idCardTypes.map((item) => (
    <Picker.Item
      key={item.id}
      label={item.name}
      value={item.id}
    />
  ))}
</Picker>
            </View>
          )}
        />
</View>
{/* Adjust what ImagePickerButtons render */}
<View style={styles.form}>
  <ImagePickerButton side="front" title="Front of ID Card" />
  {requiresBack && <ImagePickerButton side="back" title="Back of ID Card" />}
</View>

          <View style={styles.form}>
           

            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>Tips for best results:</Text>
              <Text style={styles.tipsText}>
                • Ensure all text is clearly visible{"\n"}
                • Avoid glare and shadows{"\n"}
                • Place ID on a plain, contrasting background{"\n"}
                • Make sure all corners are visible
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, uploading && styles.buttonDisabled]}
              onPress={()=>{
                  console.log("BUTTON PRESSED");
                handleSubmit()}}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>


          <View style={styles.securityNote}>
            <Text style={styles.securityTitle}>🔒 Your data is secure</Text>
            <Text style={styles.securityText}>
              Your ID card images are encrypted and stored securely. We only use them for identity verification purposes and will never share them with third parties without your consent.
            </Text>
          </View>
        </View>
     </ScrollView>

          </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  form: {
    marginBottom: 20,
  },
  imagePicker: {
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  imageContainer: {
    alignItems: "center",
  },
  previewImage: {
    width: 300,
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  changeButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 6,
  },
  changeButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    gap: 10,
  },
  pickButton: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pickButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  tipsBox: {
    backgroundColor: "#fff3cd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#856404",
  },
  tipsText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    alignItems: "center",
    marginTop: 20,
  },
  skipText: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  securityNote: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  securityText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    textAlign: "center",
  },
  pickerBox: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  picker: {
    
  },
  label: {
    
  },
  errorText: { color: "red", fontSize: 13, marginTop: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
   input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
});

export default IdCardUpload;
