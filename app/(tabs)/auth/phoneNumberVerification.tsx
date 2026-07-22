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

import CustomAlert from "components/CustomAlert";

const PhoneNumberVerification = () => {
  const router = useRouter();  
  const [loading, setLoading] = useState(false); 
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
    try {
      const storedUser = await getItemSafe("user");
    

    

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      showAlert(
        "Storage Error",
        "Stored registration information could not be read."
      );
    }
  };

  loadUserInfo();
}, []);


type PhoneVerificationForm = {
  code: string;
};

type ApiError = {
  message?: string;
  status?: number;
  errors?: Record<string, string[]>;
};
  

  const resendPhoneCode = async (): Promise<void> => {
  setLoading(true);

  try {
    const currentUserId = await getItemSafe("user_id");

    if (!currentUserId) {
      showAlert(
        "Session Error",
        "Your user ID is missing. Please restart registration."
      );
      return;
    }

    const response = await API.resendPhoneCode({
      user_id: currentUserId,
    });

    if (response.user_id !== undefined) {
      await setItemSafe(
        "user_id",
        String(response.user_id)
      );
    }

    showAlert(
      "Code Sent",
      response.message ??
        "A new verification code has been sent to your phone number."
    );
  } catch (error: unknown) {
    const apiError = error as ApiError;

    console.error("Resend phone code failed:", apiError);

    showAlert(
      "Unable to Send Code",
      apiError.message ??
        "Unable to resend the verification code. Please try again."
    );
  } finally {
    setLoading(false);
  }
};


  
  

  const verifyOtp = async (
  formData: PhoneVerificationForm
): Promise<void> => {
  const verificationCode = formData.code.trim();

  if (!/^\d{6}$/.test(verificationCode)) {
    showAlert(
      "Invalid Code",
      "Please enter the complete 6-digit verification code."
    );
    return;
  }

  const currentUserId = await getItemSafe("user_id");

  if (!currentUserId) {
    showAlert(
      "Session Error",
      "Your user ID is missing. Please restart registration."
    );
    return;
  }

  setLoading(true);

  try {
    const response = await API.verifyPhone({
      user_id: currentUserId,
      code: verificationCode,
    });

    if (response.user) {
      const userToStore =
        typeof response.user === "string"
          ? response.user
          : JSON.stringify(response.user);

      await setItemSafe("user", userToStore);

      setUser(
        typeof response.user === "string"
          ? JSON.parse(response.user)
          : response.user
      );
    }

    await setItemSafe(
      "registration_step",
      "face-record"
    );

    showAlert(
      "Phone Number Verified",
      response.message ??
        "Your phone number has been verified successfully.",
      () => {
        router.replace("/auth/faceRecord");
      }
    );
  } catch (error: unknown) {
    const apiError = error as ApiError;

    console.error("Phone verification failed:", apiError);

    showAlert(
      "Verification Failed",
      apiError.message ??
        "The verification code is invalid or expired."
    );
  } finally {
    setLoading(false);
  }
};



const updatePhoneNumber = async (): Promise<void> => {
  const phone = newPhoneNumber.trim();

  if (!phone) {
    showAlert(
      "Missing Phone Number",
      "Please enter your new phone number."
    );
    return;
  }

  if (!/^\+?[0-9]{10,15}$/.test(phone)) {
    showAlert(
      "Invalid Phone Number",
      "Enter a valid phone number, including the country code where necessary."
    );
    return;
  }

  setUpdatingPhoneNumber(true);

  try {
    const currentUserId = await getItemSafe("user_id");

    if (!currentUserId) {
      showAlert(
        "Session Error",
        "Your user ID is missing. Please restart registration."
      );
      return;
    }

    const response = await API.updatePhoneNumber({
      user_id: currentUserId,
      phone,
    });

    await setItemSafe("user_phone", phone);

    setUser((currentUser: any) => ({
      ...currentUser,
      phonenumber: phone,
    }));

    setShowUpdatePhoneNumber(false);
    setNewPhoneNumber("");

    showAlert(
      "Phone Number Updated",
      response.message ??
        "Your phone number was updated and a new code was sent."
    );
  } catch (error: unknown) {
    const apiError = error as ApiError;

    console.error("Update phone number failed:", apiError);

    showAlert(
      "Update Failed",
      apiError.message ??
        "Your phone number could not be updated."
    );
  } finally {
    setUpdatingPhoneNumber(false);
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
  onPress={updatePhoneNumber}
>
  {updatingPhoneNumber ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.updateBtnText}>
      Update Phone Number
    </Text>
  )}
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
