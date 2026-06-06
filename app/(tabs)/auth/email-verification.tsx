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
import { setItemSafe, getItemSafe, removeItemSafe } from "@/utils/storage";
import  API  from "@/src/services/api";
import ApiService from "@/src/services/api";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import CustomAlert from "components/CustomAlert";
import { useAuth } from "@/context/AuthContext";
import { useRouteHandler }  from "@/hooks/seRouteHandler";
import ScreenWrapper from "components/ScreenWrapper";

interface User {
  id: string;
  email: string;
  [key: string]: any;
}



const EmailVerificationScreen = () => {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const [isVerifyWithPhoneNumber, setIsVerifyWithPhoneNumber] = useState(false);
  const { login } = useAuth();
  const { handleResponse } = useRouteHandler();
  const [ user, setUser] = useState<User | null>(null);

  const [showUpdateEmail, setShowUpdateEmail] = useState(false);
const [newEmail, setNewEmail] = useState("");
const [updatingEmail, setUpdatingEmail] = useState(false);
 console.log("user", userId);

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

  

   
  

  useEffect(() => {
   const loadUserData = async () => {
    const storedUserId = await getItemSafe("userId");
    const storedUser = await getItemSafe("user");

    if (storedUserId) {
      setUserId(storedUserId);
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  loadUserData();
  }, []);




  const verifyUser = async (data) => {
    const { code } = data; 
    const userId = await getItemSafe("user_id");
    const user = await getItemSafe("user");

    setUserId(userId);
    setUser(user ? JSON.parse(user) : null);

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
  const res = await API.verifyEmail({
    user_id: userId,  
    code: code.trim(),
  });

  console.log(res);
 
  if (res.status === 200) {
    const {user_id, user} = res;

  router.push("/auth/phoneNumberVerification");

    showAlert("Email Verified!", res.message, () => {
      handleResponse(res, {
        successRoute: res.successRoute,
        successMessage: res.successMessage,
      });
    });
  }
} catch (error) {
  console.log(error.response || error.message);

  // 👇 handle 422 (or any backend error message)
  const errorMessage =
    error.response?.errorMessage || "Verification failed. Please try again.";

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
      const currentUserId = await getItemSafe("user_id") || user?.id;
    

      if (!currentUserId) {
        showAlert("Error", "User ID missing. Please log in again.");
        return;
      }

      const res = await API.resendEmailCode({
        user_id: currentUserId,
        method: "email"
      });

   
     

      if (res.status === 200) {
         await setItemSafe("user", res.user);
        showAlert("Sent", res.message || "A new code has been sent to your email.");
        handleResponse(res, {
          successRoute: res.successRoute,
          successMessage: res.successMessage,
        });
      } 

    } catch (error) {
      

       console.log(error.response || error.message);

  // 👇 handle 422 (or any backend error message)
  const errorMessage =
    error.response?.errorMessage || "Unable to resend code. Please try again.";

  showAlert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  


  

  return (
   <ScreenWrapper>
        <View style={styles.card}>
          
         

          {/* if user is verifying with email */}
          <View>
          <Text style={styles.title}>Email Verification</Text>
          <Text style={styles.subtitle}>
            Enter the verification code we sent to your registered email address.
          </Text>

         <Text style={styles.emailText}>
  {user?.email || "Loading email..."}
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


          <View style={styles.altVerify}>
<Text style={styles.altText}>I did not receive the code</Text>
          <TouchableOpacity onPress={resendEmailCode} disabled={loading}>
            
            <Text style={styles.linkText}>Resend Code</Text>
          </TouchableOpacity>
</View>


{/* Update Email Address  */}

<View style={styles.altVerify}>
  <Text style={styles.altText}>Want to update your email address?</Text>
  <TouchableOpacity onPress={() => setShowUpdateEmail(!showUpdateEmail)}>
    <Text style={styles.linkText}>Update Email Address</Text>
  </TouchableOpacity>

  {showUpdateEmail && (
    <View style={styles.updateEmailBox}>
      <TextInput
        placeholder="Enter new email address"
        value={newEmail}
        onChangeText={setNewEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.updateBtn}
        disabled={updatingEmail}
        onPress={async () => {
          if (!newEmail.trim()) {
            showAlert("Error", "Please enter your new email address.");
            return;
          }

          setUpdatingEmail(true);

          try {
            const userId = await getItemSafe("user_id");

            const res = await ApiService.updateEmail({
              user_id: userId,
              email: newEmail.trim(),
            });

            showAlert("Success", res.message || "Email updated. Verification code sent.");

            await setItemSafe("user_email", newEmail.trim());

            setShowUpdateEmail(false);
            setNewEmail("");
          } catch (err: any) {
            console.log("Update email error:", err);
            showAlert("Error", err.message || "Could not update email.");
          } finally {
            setUpdatingEmail(false);
          }
        }}
      >
        <Text style={styles.updateBtnText}>
          {updatingEmail ? "Updating..." : "Update Email"}
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
    </View>
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
  emailText: {
    fontSize: 16,
    textAlign: "center",
    color: "#007bff",
    fontWeight: "600",
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

      updateEmailBox: {
  marginTop: 12,
  width: "100%",
},


updateBtn: {
  backgroundColor: "#111827",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
},

updateBtnText: {
  color: "#fff",
  fontWeight: "600",
},
});

export default EmailVerificationScreen;
