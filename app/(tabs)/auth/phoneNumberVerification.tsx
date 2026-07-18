import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { setItemSafe, getItemSafe } from "@/utils/storage";
import API  from "@/src/services/api";
import Navbar from "components/Navbar";
import ScreenWrapper from "components/ScreenWrapper";
import ApiService from "@/src/services/api";
import CustomAlert from "components/CustomAlert";

const PhoneNumberVerification = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [updatingPhoneNumber, setUpdatingPhoneNumber] = useState(false);
  const [showUpdatePhoneNumber, setShowUpdatePhoneNumber] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnCloseCallback, setAlertOnCloseCallback] = useState<(() => void) | null>(null);
  
  const { control, handleSubmit, formState: { errors } } = useForm();

  const showAlert = (title: string, message: string, callback?: () => void) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnCloseCallback(callback || null);
    setAlertVisible(true);
  };

  // Load user info on mount
  React.useEffect(() => {
    const loadUserInfo = async () => {
      const user = await getItemSafe("user");
      const UserId = await getItemSafe("user_id");
      if (UserId) {
        setUserId(UserId);
      }
      if (user) {
        setUser(user);
      }
    };
    loadUserInfo();
  }, []);

 

  

  const resendPhoneCode = async () => {
     setLoading(true);
        console.log("Resending code to phone number");
        try {
          // Always fetch the latest userId from storage
          const currentUserId = await getItemSafe("user_id");
          console.log("Sending request with userId:", currentUserId);
    
          if (!currentUserId) {
            showAlert("Error", "User ID missing. Please log in again.");
            return;
          }
    
          const res = await API.post(`/send-phone-Code`, {
            user_id: currentUserId,
            method: "phone_number"
          });
    
        
    
          if (res.status === 200 && res.data.status === 200) {
             await setItemSafe("user_id", res.data.user_id);
            showAlert("Sent", res.data.successMessage || "A new code has been sent to your phone number.");
          
          } 
    
        } catch (error) {
          
    
           console.log(error.response?.data || error.message);
    
      // 👇 handle 422 (or any backend error message)
      const errorMessage =
        error.response?.data?.errorMessage || "Unable to resend code. Please try again.";
    
      showAlert("Error", errorMessage);
        } finally {
          setLoading(false);
        }
  };

  const verifyOtp = async ({ code }) => {
  const otp = code?.trim();
  const userId = await getItemSafe("user_id");
  const userData = await getItemSafe("user");

  if (!otp || otp.length !== 6) {
    Alert.alert("Error", "Please enter a valid 6-digit OTP");
    return;
  }

  setLoading(true);
  try {
    const res = await API.post("/verify-phone", {
      user_id: userId,
      code: otp,
      user: userData,
    });

    if (res.status === 200 && res.data.status === 200) {
      await setItemSafe("user_phone", phoneNumber);
      await setItemSafe("registration_step", "face-record");
      await setUser(userData ? JSON.parse(userData) : null);

      router.replace("/auth/faceRecord");
      Alert.alert("Phone Number Verified!", res.data.successMessage);
    } else {
      Alert.alert("Error", res.data.message || "Invalid OTP. Please try again.");
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    Alert.alert("Error", "Failed to verify OTP. Please try again.");
  } finally {
    setLoading(false);
  }
};



  return (
    <ScreenWrapper>
      <Navbar />
      <View style={styles.container}>
        <Text style={styles.title}>Phone Number Verification</Text>
        <Text style={styles.subtitle}>
          Verify your phone number to secure your account
        </Text>
        <Text>{user?.phonenumber}</Text>

        
          <FormField label="Verification Code" required error={errors.code}>
            <Controller
              control={control}
              name="code"
              rules={{ required: true, minLength: 6, maxLength: 6 }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter verification code"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                  testID="verification_code_input"
                />
              )}
            />
          </FormField>

          <TouchableOpacity
            onPress={handleSubmit(verifyOtp)}
            style={[styles.button, loading && { opacity: 0.6 }]}
            disabled={loading}
            testID="verify_button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>
          </View>


          <View style={styles.altVerify}>
<Text style={styles.altText}>I did not receive the code</Text>
          <TouchableOpacity onPress={resendPhoneCode} disabled={loading}>
            
            <Text style={styles.linkText}>Resend Code</Text>
          </TouchableOpacity>
</View>


{/* Update PhoneNumber Address  */}

<View style={styles.altVerify}>
  <Text style={styles.altText}>Want to update your PhoneNumber address?</Text>
  <TouchableOpacity onPress={() => setShowUpdatePhoneNumber(!showUpdatePhoneNumber)}>
    <Text style={styles.linkText}>Update PhoneNumber Address</Text>
  </TouchableOpacity>

  {showUpdatePhoneNumber && (
    <View style={styles.updatePhoneNumberBox}>
      <TextInput
        placeholder="Enter new PhoneNumber address"
        value={newPhoneNumber}
        onChangeText={setNewPhoneNumber}
        keyboardType="phone-pad"
        autoCapitalize="none"
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.updateBtn}
        disabled={updatingPhoneNumber}
        onPress={async () => {
          if (!newPhoneNumber.trim()) {
            showAlert("Error", "Please enter your new PhoneNumber address.");
            return;
          }

          setUpdatingPhoneNumber(true);

          try {
            const userId = await getItemSafe("user_id");

            const res = await API.updatePhoneNumber('payload');

            showAlert("Success", res.message || "PhoneNumber updated. Verification code sent.");

            await setItemSafe("user_PhoneNumber", newPhoneNumber.trim());

            setShowUpdatePhoneNumber(false);
            setNewPhoneNumber("");
          } catch (err: any) {
            console.log("Update PhoneNumber error:", err);
            showAlert("Error", err.message || "Could not update PhoneNumber.");
          } finally {
            setUpdatingPhoneNumber(false);
          }
        }}
      >
        <Text style={styles.updateBtnText}>
          {updatingPhoneNumber ? "Updating..." : "Update PhoneNumber"}
        </Text>
      </TouchableOpacity>
    </View>
  )}
</View>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => {
          setAlertVisible(false);
          if (alertOnCloseCallback) {
            alertOnCloseCallback();
            setAlertOnCloseCallback(null); // Clear the callback after use
          }
        }}
      />
    </ScreenWrapper>
  );
};

/* ✅ Reusable Form Field Component */
type FormFieldProps = {
  label?: React.ReactNode;
  required?: boolean;
  children?: React.ReactNode;
  error?: { message?: string } | string | undefined;
};

const FormField: React.FC<FormFieldProps> = ({ label, required = false, children, error = undefined }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.label}>
      {label} {required && <Text style={{ color: "red" }}>*</Text>}
    </Text>
    {children}
    {error && <Text style={styles.errorText}>{(error as any).message || "Required"}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
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
    marginBottom: 30,
  },
  form: {
    marginBottom: 30,
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
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  
  updatePhoneNumberBox: {
    marginTop: 12,
    width: "100%",
  },
  otpHint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    marginTop: 15,
    alignItems: "center",
  },
  resendText: {
    color: "#007AFF",
    fontSize: 14,
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
  altVerify: {
    marginTop: 25,
    alignItems: "center",
  },
  altText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  errorText: { 
    color: "red", 
    fontSize: 13, 
    marginTop: 4 },
    updateBtn: {
  backgroundColor: "#111827",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
},
 linkText: {
    color: "#007bff",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
    borderColor: "#007bff",
    borderWidth: 1,
    borderRadius: 10, 
    padding: 10, 
    marginTop: 10,
  },
updateBtnText: {
  color: "#fff",
  fontWeight: "600",
},
});

export default PhoneNumberVerification;
