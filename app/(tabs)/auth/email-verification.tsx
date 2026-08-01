import React, { useEffect, useState } from "react";
import {

  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
 
  ActivityIndicator,
  
} from "react-native";
import { setItemSafe, getItemSafe} from "@/utils/storage";
import  API  from "@/src/services/api";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import CustomAlert from "components/CustomAlert";


import ScreenWrapper from "components/ScreenWrapper";
import axios from 'axios';

interface User {
  id: string | number;
  email: string;
  phonenumber?: string;
  [key: string]: unknown;
}


function getApiErrorMessage(
  error: unknown
): string {
  /*
   * Errors normalized by ApiService.request().
   */
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const normalizedError =
      error as {
        message?: unknown;
        errors?: Record<
          string,
          string[] | string
        >;
        status?: number;
      };

    if (
      typeof normalizedError.message ===
        "string" &&
      normalizedError.message.trim()
    ) {
      return normalizedError.message;
    }

    if (
      normalizedError.errors &&
      typeof normalizedError.errors ===
        "object"
    ) {
      const firstError =
        Object.values(
          normalizedError.errors
        )
          .flat()
          .find(
            (
              item
            ): item is string =>
              typeof item ===
              "string"
          );

      if (firstError) {
        return firstError;
      }
    }
  }

  /*
   * Raw Axios errors.
   */
  if (axios.isAxiosError(error)) {
    const data =
      error.response?.data;

    if (
      typeof data?.message ===
        "string" &&
      data.message.trim()
    ) {
      return data.message;
    }

    if (
      data?.errors &&
      typeof data.errors ===
        "object"
    ) {
      const firstError =
        Object.values(
          data.errors
        )
          .flat()
          .find(
            (
              item
            ): item is string =>
              typeof item ===
              "string"
          );

      if (firstError) {
        return firstError;
      }
    }

    if (!error.response) {
      return "Network error. Check your internet connection and try again.";
    }
  }

  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

const EmailVerificationScreen = () => {
  const [loading, setLoading] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
 const [loadingSession, setLoadingSession] = useState(true);
 
 
  const [ user, setUser] = useState<User | null>(null);

  const [showUpdateEmail, setShowUpdateEmail] = useState(false);
const [newEmail, setNewEmail] = useState("");
const [updatingEmail, setUpdatingEmail] = useState(false);
 console.log("user", userId);



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
  const loadUserData =
    async (): Promise<void> => {
      try {
        const [storedUserId, storedUser, preAuthToken] = await Promise.all([
          getItemSafe("user_id"),
          getItemSafe("user"),
          getItemSafe("pre_auth_token"),
        ]);

        let parsedUser: User | null = null;

        if (storedUser) {
          try {
            parsedUser = JSON.parse(storedUser) as User;
            setUser(parsedUser);
          } catch (parseError) {
            console.error("[EMAIL VERIFY] Invalid stored user:", parseError);
            setUser(null);
          }
        }

        /*
         * Prefer the dedicated user_id but recover
         * it from the stored user when necessary.
         */
        const resolvedUserId =
          storedUserId ??
          (parsedUser?.id !== undefined ? String(parsedUser.id) : null);

        if (resolvedUserId) {
          setUserId(String(resolvedUserId));

          /*
           * Repair missing user_id storage.
           */
          if (!storedUserId) {
            await setItemSafe(
              "user_id",
              String(
                resolvedUserId
              )
            );
          }
        } else {
          setUserId(null);
        }

        console.log(
          "[EMAIL VERIFY] Session loaded:",
          {
            userId:
              resolvedUserId,
            hasStoredUser:
              Boolean(
                parsedUser
              ),
            hasPreAuthToken:
              Boolean(
                preAuthToken
              ),
          }
        );
      } catch (loadError) {
        console.error(
          "[EMAIL VERIFY] Failed to load session:",
          loadError
        );

        setUserId(null);
        setUser(null);
      } finally {
        setLoadingSession(
          false
        );}
    };

  void loadUserData();
}, []);


  type EmailVerificationForm = {
  code: string;
};

const { control,
  formState: { errors },
  handleSubmit,
} = useForm<EmailVerificationForm>({
  defaultValues: {
    code: "",
  },
});




type ApiError = {
  message?: string;
  status?: number;
  errors?: Record<string, string[]>;
};

const verifyUser = async (
  data: EmailVerificationForm
): Promise<void> => {
  if (loading) {
    return;
  }

  const verificationCode =
    data.code.trim();

  if (
    !/^\d{6}$/.test(
      verificationCode
    )
  ) {
    showAlert(
      "Invalid Code",
      "Please enter the complete 6-digit verification code."
    );

    return;
  }

  const storedUserId =
    await getItemSafe(
      "user_id"
    );

  const currentUserId =
    storedUserId ??
    userId ??
    (
      user?.id !== undefined
        ? String(user.id)
        : null
    );

  if (!currentUserId) {
    showAlert(
      "Session Error",
      "Your registration session is incomplete. Please restart registration."
    );

    return;
  }

  setLoading(true);

  try {
    console.log(
      "[EMAIL VERIFY] Sending request:",
      {
        endpoint:
          "/verify-email",
        userId:
          currentUserId,
        codeLength:
          verificationCode.length,
      }
    );

    const response =
      await API.verifyEmail({
        user_id:
          currentUserId,
        code:
          verificationCode,
      });

    if (
      response.user_id !==
      undefined
    ) {
      await setItemSafe(
        "user_id",
        String(
          response.user_id
        )
      );

      setUserId(
        String(
          response.user_id
        )
      );
    }

    if (response.user) {
      await setItemSafe(
        "user",
        JSON.stringify(
          response.user
        )
      );

      setUser(
        response.user
      );
    }

    showAlert(
      "Email Verified",
      response.message ??
        "Your email was verified successfully.",
      () => {
        router.replace(
          "/auth/phoneNumberVerification"
        );
      }
    );
  } catch (error) {
    console.error(
      "[EMAIL VERIFY] Screen error:",
      error
    );

    showAlert(
      "Verification Failed",
      getApiErrorMessage(
        error
      )
    );
  } finally {
    setLoading(false);
  }
};
  const resendEmailCode =
  async (): Promise<void> => {
    if (loading) {
      return;
    }

    const storedUserId =
      await getItemSafe(
        "user_id"
      );

    const currentUserId =
      storedUserId ??
      userId ??
      (
        user?.id !== undefined
          ? String(user.id)
          : null
      );

    if (!currentUserId) {
      showAlert(
        "Session Error",
        "Your registration session is incomplete. Please restart registration."
      );

      return;
    }

    setLoading(true);

    try {
      console.log(
        "[EMAIL VERIFY] Resending code:",
        {
          endpoint:
            "/resend-email-code",
          userId:
            currentUserId,
        }
      );

      const response =
        await API.resendEmailCode({
          user_id:
            currentUserId,
          method: "email",
        });

      if (response.user) {
        await setItemSafe(
          "user",
          JSON.stringify(
            response.user
          )
        );

        setUser(
          response.user
        );
      }

      showAlert(
        "Code Sent",
        response.message ??
          "A new verification code has been sent to your email."
      );
    } catch (error) {
      console.error(
        "[EMAIL VERIFY] Resend error:",
        error
      );

      showAlert(
        "Unable to Send Code",
        getApiErrorMessage(
          error
        )
      );
    } finally {
      setLoading(false);
    }
  };


const updateEmailAddress =
  async (): Promise<void> => {
    if (updatingEmail) {
      return;
    }

    const normalizedEmail =
      newEmail
        .trim()
        .toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      showAlert(
        "Invalid Email",
        "Please enter a valid email address."
      );

      return;
    }

    const storedUserId =
      await getItemSafe(
        "user_id"
      );

    const currentUserId =
      storedUserId ??
      userId ??
      (
        user?.id !== undefined
          ? String(user.id)
          : null
      );

    if (!currentUserId) {
      showAlert(
        "Session Error",
        "Your registration session is incomplete. Please restart registration."
      );

      return;
    }

    setUpdatingEmail(true);

    try {
      console.log(
        "[EMAIL VERIFY] Updating email:",
        {
          endpoint:
            "/update-email",
          userId:
            currentUserId,

          /*
           * Avoid logging the complete email
           * in production.
           */
        }
      );

      const response =
        await API.updateEmail({
          user_id:
            currentUserId,
          email:
            normalizedEmail,
        });

      await setItemSafe(
        "user_email",
        normalizedEmail
      );

      if (response.user) {
        await setItemSafe(
          "user",
          JSON.stringify(
            response.user
          )
        );

        setUser(
          response.user
        );
      } else {
        setUser(
          (
            currentUser
          ) =>
            currentUser
              ? {
                  ...currentUser,
                  email:
                    normalizedEmail,
                }
              : currentUser
        );
      }

      setShowUpdateEmail(
        false
      );

      setNewEmail("");

      showAlert(
        "Email Updated",
        response.message ??
          "Email updated. A new verification code was sent."
      );
    } catch (error) {
      console.error(
        "[EMAIL VERIFY] Update email error:",
        error
      );

      showAlert(
        "Update Failed",
        getApiErrorMessage(
          error
        )
      );
    } finally {
      setUpdatingEmail(
        false
      );
    }
  };

if (loadingSession) {
  return (
    <ScreenWrapper>
      <View style={styles.card}>
        <ActivityIndicator
          size="large"
        />

        <Text
          style={{
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Loading verification session...
        </Text>
      </View>
    </ScreenWrapper>
  );
}
  

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
  onPress={updateEmailAddress}
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
