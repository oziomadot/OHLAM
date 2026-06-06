import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { setItemSafe, getItemSafe } from "@/utils/storage";
import API from "@/src/services/api";
import Navbar from "components/Navbar";
import ScreenWrapper from "components/ScreenWrapper";
  

const IdentityNumber = () => {
  const router = useRouter();
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertOnCloseCallback, setAlertOnCloseCallback] = useState<(() => void) | null>(null);


  function showAlert(title: string, message: string, onClose?: () => void) {
  setAlertTitle(title);
  setAlertMessage(message);
  setAlertVisible(true);

  // Store the callback to be called when alert is closed
  if (onClose) {
    setAlertOnCloseCallback(() => onClose);
  } else {
    setAlertOnCloseCallback(null);
  }
}


  // Load user info on mount
  React.useEffect(() => {
    const loadUserInfo = async () => {
       const user = await getItemSafe("user");
       
            const UserId = JSON.parse(user).id;
            
            if (UserId) {
              setUserId(UserId.toString());
            }
            if (user) {
              setUser(user);
            }
            setLoadingUserInfo(false);
          };
          loadUserInfo()
  }, []);

 



  const validateBVN = (value: string) => {
    // BVN should be 11 digits
    return /^\d{11}$/.test(value);
  };

  const validateNIN = (value: string) => {
    // NIN should be 11 digits
    return /^\d{11}$/.test(value);
  };

  const handleSubmit = async () => {
  if (!bvn && !nin) {
    Alert.alert("Error", "Please provide either BVN or NIN");
    return;
  }

  if (!userId) {
    Alert.alert("Error", "User information not available. Please try again.");
    return;
  }

  if (bvn && !validateBVN(bvn)) {
    Alert.alert("Error", "BVN must be exactly 11 digits");
    return;
  }

  if (nin && !validateNIN(nin)) {
    Alert.alert("Error", "NIN must be exactly 11 digits");
    return;
  }

  setLoading(true);
  try {
    // Choose which type of verification to run
    const type = bvn ? "bvn" : "nin";
    const value = bvn || nin;
    

    // ⬇️ Call your backend route that connects to Dojah/VerifyMe/etc.
    const res = await API.verifyIdentity({
      type,     // "bvn" or "nin"
      value,    // the actual number
      user_id: userId,
    });

    // check response structure
    if (res.status === 200 && res.data.status === 200) {
      if (bvn) await setItemSafe("user_bvn", bvn);
      if (nin) await setItemSafe("user_nin", nin);
      await setItemSafe("registration_step", "id-card-upload");

      Alert.alert("Success", "Identity verification completed successfully", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/auth/idCardUpload"),
        },
      ]);
    } else {
      const message =
        res.data.message || "Verification failed. Please check your details.";
      Alert.alert("Error", message);
    }
  } catch (err: any) {
  console.log("Verification error full:", err);
  console.log("Verification response:", err?.response?.data);

  let message = "Verification failed. Please try again.";
  
  // Safely extract error message
  if (err?.response?.data) {
    const responseData = err.response.data;
    message = responseData.message || responseData.error || message;
  } else if (err?.message) {
    message = err.message;
  }

  showAlert("Verification Error", message);
} finally {
  setLoading(false);
}
};

  return (
    <ScreenWrapper>
      <Navbar />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Identity Verification</Text>
          <Text style={styles.subtitle}>
            Provide your BVN and/or NIN for identity verification
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Why we need this:</Text>
            <Text style={styles.infoText}>
              • To verify your identity and prevent fraud{"\n"}
              • To comply with regulatory requirements{"\n"}
              • To ensure secure transactions on the platform
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Verification Number (BVN)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 11-digit BVN"
                value={bvn}
                onChangeText={setBvn}
                keyboardType="number-pad"
                maxLength={11}
              />
              <Text style={styles.helperText}>Optional: Leave blank if you don't have BVN</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>National Identification Number (NIN)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 11-digit NIN"
                value={nin}
                onChangeText={setNin}
                keyboardType="number-pad"
                maxLength={11}
              />
              <Text style={styles.helperText}>Optional: Leave blank if you don't have NIN</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, (loading || loadingUserInfo) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || loadingUserInfo}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>

 <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace("/(tabs)/auth/idCardUpload")}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
         
          <View style={styles.securityNote}>
            <Text style={styles.securityTitle}>🔒 Your data is secure</Text>
            <Text style={styles.securityText}>
              Your BVN/NIN information is only used for verification purposes. We do not store or keep it permanently and will never share it with third parties.
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
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
});

export default IdentityNumber;
