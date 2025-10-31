import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  
} from "react-native";
import * as SecureStore from "expo-secure-store";
import API from "@/config/index";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import CustomAlert from "components/CustomAlert";
import { useAuth } from "@/context/AuthContext";
import { useRouteHandler }  from "@/hooks/seRouteHandler";



const EmailVerificationScreen = () => {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const [isVerifyWithPhoneNumber, setIsVerifyWithPhoneNumber] = useState(false);
  const { login } = useAuth();
  const { handleResponse } = useRouteHandler();
  const [ user, setUser] = useState("");
 

 const {watch, control,
  formState: { errors },
  handleSubmit,
  setValue,

 } = useForm();
//  const isVerifyWithPhoneNumber = watch("isVerifyWithPhoneNumber");


  const [alertVisible, setAlertVisible] = useState(false);
const [alertMessage, setAlertMessage] = useState("");
const [alertTitle, setAlertTitle] = useState("");
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

  // Cross-platform storage helpers to avoid SecureStore on web
  const getItemSafe = async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === "web") {
        return window?.localStorage?.getItem(key) ?? null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn("Failed to read value", key, e);
      return null;
    }
  };


   // Cross-platform storage helper (avoid expo-secure-store on web)
    const setItemSafe = async (key: string, value: string) => {
      try {
        if (Platform.OS === "web") {
          window?.localStorage?.setItem(key, value);
          return;
        }
        await SecureStore.setItemAsync(key, value);
      } catch (e) {
        console.warn("Failed to persist value", key, e);
      }
    };

  

  useEffect(() => {
    (async () => {
      const storedUserId = await getItemSafe("user_id");
      if (storedUserId) setUserId(storedUserId);
    })();
  }, []);




  const verifyUser = async (data) => {
    const { code } = data; 
    const userId = await getItemSafe("user_id");
    const user = await getItemSafe("user");

    setUserId(userId);
    setUser(user);

  console.log(["code", code,  "user id", userId]);
    if (!code.trim()) {
      showAlert("Error", "Please enter your verification code");
      return;
    }

    if (!userId) {
      showAlert("Error", "User ID missing. Please log in again.");
      return;
    }

    setLoading(true);
    try {
  const res = await API.post(`/verify-User-Otp`, {
    user_id: userId,
    code: code.trim(),
    user: user,
  });

  if (res.status === 200 && res.data.status === 200) {
    const { token, user_id, user } = res.data;

    await login(token, user);
    await setItemSafe("token", token);
    await setItemSafe("authToken", token);
    await setItemSafe("user_id", user_id);

    showAlert("Verified!", res.data.successMessage, () => {
      handleResponse(res, {
        successRoute: res.data.successRoute,
        successMessage: res.data.successMessage,
      });
    });
  }
} catch (error) {
  console.log(error.response?.data || error.message);

  // 👇 handle 422 (or any backend error message)
  const errorMessage =
    error.response?.data?.errorMessage || "Verification failed. Please try again.";

  showAlert("Failed", errorMessage);
} finally {
  setLoading(false);
}

  };

  const resendEmailCode = async () => {
    setLoading(true);
    console.log("Resending code to email");
    try {
      // Always fetch the latest userId from storage
      const currentUserId = await getItemSafe("user_id");
      console.log("Sending request with userId:", currentUserId);

      if (!currentUserId) {
        showAlert("Error", "User ID missing. Please log in again.");
        return;
      }

      const res = await API.post(`/send-Verification-Code`, {
        user_id: currentUserId,
        method: "email"
      });

      console.log("Response received:", res.data);
      console.log("Response status:", res.status);
      console.log("Response data status:", res.data.status);

      if (res.status === 200 && res.data.status === 200) {
        showAlert("Sent", res.data.successMessage || "A new code has been sent to your email.");
        handleResponse(res, {
          successRoute: res.data.successRoute,
          successMessage: res.data.successMessage,
        });
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


  const sendCodeToPhoneNumber = async () =>{
    setLoading(true);
    try {
      const res = await API.post(`/send-Verification-Code`, { 
        user_id: userId,
        method: "phone"

      });

       handleResponse(res, {
              successRoute: res.data.successRoute,
              errorMessage: res.data.errorMessage,
              successMessage: res.data.successMessage,
            });
      showAlert("Sent", res.data.successMessage || "A new code has been sent to your phone number.");
    } catch (error){
      console.log(error);
      showAlert("Error", "Unable to send codd. Please try again.");
    }
    finally {
      setLoading(false);
    }
    
  };
 

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f9f9f9" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          
          {isVerifyWithPhoneNumber ? (

          <View>
            <Text style={styles.title}>Phone Number Verification</Text>
            <Text style={styles.subtitle}>
            Enter the verification code we sent to your registered phone number.
            </Text>
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
          onPress={handleSubmit(verifyUser)}
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
          
         ) : (

          /* if user is verifying with email */
          <View>
          <Text style={styles.title}>Email Verification</Text>
          <Text style={styles.subtitle}>
            Enter the verification code we sent to your registered email address.
          </Text>

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
            onPress={handleSubmit(verifyUser)}
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

)}
          <View style={styles.altVerify}>
<Text style={styles.altText}>I did not receive the code</Text>
          <TouchableOpacity onPress={resendEmailCode} disabled={loading}>
            
            <Text style={styles.linkText}>Resend Code</Text>
          </TouchableOpacity>
</View>
<View style={styles.altVerify}>
  <Text style={styles.altText}>
    {isVerifyWithPhoneNumber
      ? "Can't verify with phone?"
      : "Can't verify with email?"}
  </Text>

  <TouchableOpacity
    onPress={async () => {
      if (isVerifyWithPhoneNumber) {
        // switch to email verification
        setIsVerifyWithPhoneNumber(false);
        await resendEmailCode(); // 👈 call your resend email function
      } else {
        // switch to phone verification
        setIsVerifyWithPhoneNumber(true);
        await sendCodeToPhoneNumber(); // 👈 call your send phone code function
      }
    }}
    disabled={loading}
  >
    <Text style={styles.linkText}>
      {isVerifyWithPhoneNumber
        ? "Send code to email instead"
        : "Send code to phone number"}
    </Text>
  </TouchableOpacity>
</View>


        </View>
      </ScrollView>

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
    </KeyboardAvoidingView>
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

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    width: Platform.OS === "web" ? "40%" : "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#222",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#666",
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 2,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
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

  label: { 
      fontWeight: "500", 
      color: "#333", 
      marginBottom: 6 },
});

export default EmailVerificationScreen;
