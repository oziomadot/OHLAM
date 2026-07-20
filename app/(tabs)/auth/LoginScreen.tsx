import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Button, TextInput } from "react-native-paper";

import * as LocalAuthentication from "expo-local-authentication";
import { Formik } from "formik";
import * as Yup from "yup";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import API from "@/src/services/api";
import Navbar from "components/Navbar";
import ScreenWrapper from "components/ScreenWrapper";
import * as WebBrowser from "expo-web-browser"; // ✅ opens OAuth URLs
import { FontAwesome } from "@expo/vector-icons";
import { getItemSafe, setItemSafe } from "@/utils/storage";
import CustomAlert from "components/CustomAlert";
import { getDeviceDetails } from "@/utils/device";



// ✅ Validation
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [isLoginFormVisible, setIsLoginFormVisible] = useState(true);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [device, setDevice] = useState<any>(null);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertTitle, setAlertTitle] = useState("");
  
    function showAlert(title: string, message: string) {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertVisible(true);
    }

  // ✅ On mount – check PIN & biometric compatibility
  useEffect(() => {
    (async () => {
      const existingPin = await getItemSafe("user_pin");
      setStoredPin(existingPin);

      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(compatible && enrolled);

      // Get device details
      const deviceDetails = await getDeviceDetails();
      setDevice(deviceDetails);

      if (existingPin) {
        setIsLoginFormVisible(false);
      }
    })();
  }, []);

  // ✅ Social-login handlers
  const handleGoogleLogin = async () => {
    await WebBrowser.openBrowserAsync(`${API.baseURL}/auth/google/redirect`);
  };

  const handleTwitterLogin = async () => {
    await WebBrowser.openBrowserAsync(`${API.baseURL}/auth/twitter/redirect`);
  };

  const handleFacebookLogin = async () => {
    await WebBrowser.openBrowserAsync(`${API.baseURL}/auth/facebook/redirect`);
  };

  // ✅ Biometric login
  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock your account",
        fallbackLabel: "Use PIN",
      });

      if (result.success) {
        const token = await getItemSafe("authToken");
        const userData = await getItemSafe("user");
        if (token && userData) {
          await login(token, JSON.parse(userData));
          router.push("/home");
        } else {
          Alert.alert("Session expired", "Please sign in again.");
          setIsLoginFormVisible(true);
        }
      }
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Unable to authenticate with biometrics.");
    }
  };

  // ✅ PIN-based login
  const handlePinLogin = async () => {
    const savedPin = await getItemSafe("user_pin");
    const token = await getItemSafe("authToken");
    const userData = await getItemSafe("user");

    if (pin === savedPin && token && userData) {
      await login(token, JSON.parse(userData));
      router.push("/home");
    } else {
      Alert.alert("Invalid PIN", "Please try again.");
    }
  };

  // ✅ Email/password login
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await API.login(values.email, values.password);

      if (response.status === 202) {
      const setUser = await setItemSafe("user", JSON.stringify(response.user));
      const setUser_id = await setItemSafe("user_id", response.user_id);
  switch (response.next_step) {
    case "email_verification":
      router.push("/auth/email-verification");
      break;
    case "phone_verification":
      router.push("/auth/phoneNumberVerification");
      break;
    case "face_verification":
      router.push("/auth/faceRecord");
      break;
    case "bvn_nin":
      router.push("/auth/identityNumber");
      break;
    case "gov_id":
      router.push("/auth/idCardUpload");
      break;
   
  }
  return;
}


if (
  response.requires_device_verification
) {
  await setItemSafe(
    "pre_auth_token",
    response.pre_auth_token
  );

  router.replace({
    pathname: "/auth/faceLiveness",
    params: {
      mode: "device-verification",
    },
  });

  return;
}

await setItemSafe(
  "auth_token",
  response.token
);

await setItemSafe(
  "user",
  JSON.stringify(response.user)
);

if (response.status === 200) {
        const { token, user, user_id } = response;
        await login(token, user);

        await setItemSafe("authToken", token);
        await setItemSafe("user_id", user_id);
        await setItemSafe("user", JSON.stringify(user));

        Alert.prompt(
          "Create PIN",
          "Set a 4‑digit PIN for quick login next time",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Save",
              onPress: async (value: string) => {
                if (value?.length === 4) {
                  await setItemSafe("user_pin", value);
                  Alert.alert("PIN saved", "You'll be able to use it next time!");
                  router.push("/home");
                } else {
                  Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
                  router.push("/home");
                }
              },
            },
          ],
          "plain-text"
        );
      } else {
        const data = response.data;
        const msg =
          data.errorMessage ||
          data.message ||
          "Login failed. Please check your credentials.";
        Alert.alert("Error", msg);
      }
    } catch (err: any) {
  console.log("🔥 LOGIN ERROR FULL:", err);
  console.log("🔥 LOGIN ERROR RESPONSE:", err?.response);
  console.log("🔥 LOGIN ERROR DATA:", err?.response?.data);

  const data = err?.response?.data || err?.data || err;

  if (data?.errors) {
    const message = Object.values(data.errors).flat().join("\n");
    showAlert("Validation Error", message);
    return;
  }

  // Handle new device detection requiring face verification
  if (data?.requires_face_verification === true || data?.status === 428) {
    await setItemSafe("pending_user_id", String(data.user_id));
    await setItemSafe("pending_device", JSON.stringify(device));

    router.replace("/auth/new-Device-Facerecord");
    return;
  }

  if (data?.message) {
    showAlert("Error", data.message);
    return;
  }

  showAlert("Error", err?.message || "Login failed. Please try again.");
} finally {
  setIsLoading(false);
}
  }
  // ✅ UI
  return (
    <ScreenWrapper>
      <Navbar />
      <View style={styles.inner}>
        <Text style={styles.title}>
          {isLoginFormVisible ? "Sign In" : "Quick Login"}
        </Text>

        {!isLoginFormVisible ? (
          <View>
            {isBiometricAvailable && (
              <Button
                icon="fingerprint"
                mode="contained"
                style={styles.button}
                onPress={handleBiometricAuth}
              >
                Use Fingerprint / Face ID
              </Button>
            )}

            <TextInput
              label="Enter your PIN"
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              style={styles.input}
            />
            <Button mode="contained" onPress={handlePinLogin} style={styles.button}>
              Login with PIN
            </Button>

            <Button
              mode="text"
              onPress={() => setIsLoginFormVisible(true)}
              style={styles.switchButton}
            >
              Use Email & Password
            </Button>
          </View>
        ) : (
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={LoginSchema}
            onSubmit={handleLogin}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View>
                <TextInput
                  label="Email"
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  error={touched.email && !!errors.email}
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}

                <TextInput
                  label="Password"
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  error={touched.password && !!errors.password}
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}

                <Button
                  mode="contained"
                  loading={isLoading}
                  onPress={() => handleSubmit()}
                  style={styles.button}
                >
                  Sign In
                </Button>

                <Text style={styles.forgotPassword}> <Link
              style={{
                color: "#107eeb",
                fontWeight: "bold",
                textDecorationLine: "underline",
                textDecorationColor: "#107eeb",
              }}
              href="/(tabs)/auth/ForgotPasswordScreen"
            >
            Forgot Password?
            </Link></Text>
                

                {/* --- Social Media Login Buttons --- */}
                <View style={styles.dividerContainer}>
                  <Text style={styles.dividerText}>OR</Text>
                </View>

                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: "#DB4437" }]}
                  onPress={handleGoogleLogin}
                >
                  <FontAwesome name="google" size={20} color="#fff" />
                  <Text style={styles.socialText}> Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: "#1DA1F2" }]}
                  onPress={handleTwitterLogin}
                >
                  <FontAwesome name="twitter" size={20} color="#fff" />
                  <Text style={styles.socialText}> Continue with Twitter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: "#3b5998" }]}
                  onPress={handleFacebookLogin}
                >
                  <FontAwesome name="facebook" size={20} color="#fff" />
                  <Text style={styles.socialText}> Continue with Facebook</Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        )}

        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={{ fontSize: 16 }}>
            New member?{" "}
            <Link
              style={{
                color: "#107eeb",
                fontWeight: "bold",
                textDecorationLine: "underline",
                textDecorationColor: "#107eeb",
              }}
              href="/(tabs)/auth/RegisterScreen"
            >
              Register here
            </Link>
          </Text>
        </View>
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, justifyContent: "center", padding: 24 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginBottom: 30,
  },
  input: { marginVertical: 8, backgroundColor: "#fff" },
  button: { borderRadius: 8, marginTop: 12, paddingVertical: 5 },
  switchButton: { marginTop: 10 },
  errorText: { color: "red", fontSize: 12, marginLeft: 8 },
  dividerContainer: { alignItems: "center", marginVertical: 18 },
  dividerText: { color: "#333", fontWeight: "600" },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  socialText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 6,
  },
  forgotPassword: {
    color: "#107eeb",
    fontWeight: "bold",
    textDecorationLine: "underline",
    textDecorationColor: "#107eeb",
    marginTop: 10,
  },
});
