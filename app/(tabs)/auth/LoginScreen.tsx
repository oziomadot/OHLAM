import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";

import {
  Button,
  TextInput,
} from "react-native-paper";

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";

import { Formik } from "formik";
import * as Yup from "yup";

import {Link, useFocusEffect, useRouter, useLocalSearchParams,} from "expo-router";

import { FontAwesome } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";
import API, { PinLoginPayload } from "@/src/services/api";

import Navbar from "components/Navbar";
import ScreenWrapper from "components/ScreenWrapper";
import CustomAlert from "components/CustomAlert";

import {
  getItemSafe,
  setItemSafe,
} from "@/utils/storage";

import {
  getDeviceDetails,
} from "@/utils/device";

const DEVICE_ID_KEY =
  "ohlam_device_id";

const DEVICE_SECRET_KEY =
  "ohlam_device_secret";

const QUICK_LOGIN_IDENTIFIER_KEY =
  "ohlam_quick_login_identifier";

const BIOMETRIC_ENABLED_KEY =
  "ohlam_biometric_enabled";

const BIOMETRIC_TOKEN_KEY =
  "ohlam_biometric_token";

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),

  password: Yup.string()
    .min(
      6,
      "Password must be at least 6 characters"
    )
    .required("Password is required"),
});

type LoginFormValues = {
  email: string;
  password: string;
};

type LoginMode =
  | "password"
  | "pin";

function getResponseToken(
  response: any
): string | null {
  return (
    response?.token ??
    response?.auth_token ??
    response?.access_token ??
    response?.data?.token ??
    response?.data?.auth_token ??
    null
  );
}

function getResponseUser(
  response: any
): any | null {
  return (
    response?.user ??
    response?.data?.user ??
    null
  );
}

function getApiErrorMessage(
  error: any,
  fallback: string
): string {
  const errors =
    error?.response?.data?.errors ??
    error?.data?.errors;

  if (errors) {
    const messages = Object.values(
      errors
    )
      .flat()
      .map(String);

    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  return (
    error?.response?.data?.message ??
    error?.data?.message ??
    error?.message ??
    fallback
  );
}

async function getOrCreateDeviceId(): Promise<string> {
  const existingDeviceId =
    await SecureStore.getItemAsync(
      DEVICE_ID_KEY
    );

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const newDeviceId =
    Crypto.randomUUID();

  await SecureStore.setItemAsync(
    DEVICE_ID_KEY,
    newDeviceId
  );

  return newDeviceId;
}

async function getDeviceSecret(): Promise<string | null> {
  return SecureStore.getItemAsync(
    DEVICE_SECRET_KEY
  );
}

async function getQuickLoginIdentifier(): Promise<string | null> {
  return SecureStore.getItemAsync(
    QUICK_LOGIN_IDENTIFIER_KEY
  );
}

async function saveQuickLoginIdentifier(
  email: string
): Promise<void> {
  await SecureStore.setItemAsync(
    QUICK_LOGIN_IDENTIFIER_KEY,
    email.trim().toLowerCase()
  );
}

async function isBiometricEnabled(): Promise<boolean> {
  const [
    hardwareAvailable,
    biometricEnrolled,
    biometricEnabled,
    storedToken,
  ] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    SecureStore.getItemAsync(
      BIOMETRIC_ENABLED_KEY
    ),
    SecureStore.getItemAsync(
      BIOMETRIC_TOKEN_KEY
    ),
  ]);

  return (
    hardwareAvailable &&
    biometricEnrolled &&
    biometricEnabled === "true" &&
    Boolean(storedToken)
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [loginMode, setLoginMode] = useState<LoginMode>(
    "password"
  );

  const [pin, setPin] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [enableBiometricOnLogin, setEnableBiometricOnLogin] = useState(false);
  const [biometricEnrollmentAvailable, setBiometricEnrollmentAvailable] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [device, setDevice] = useState<any>(null);

  const [pinLoginAvailable, setPinLoginAvailable] =
    useState(false);

  const [
    biometricLoginAvailable,
    setBiometricLoginAvailable,
  ] = useState(false);

  const [quickLoginEmail, setQuickLoginEmail, ] = useState<string | null>(null);

const {redirectTo, action, property_id,} = useLocalSearchParams<{ redirectTo?: string;  action?: string;
  property_id?: string;
}>();

  const [
    alertVisible,
    setAlertVisible,
  ] = useState(false);

  const [
    alertMessage,
    setAlertMessage,
  ] = useState("");

  const [
    alertTitle,
    setAlertTitle,
  ] = useState("");

  function showAlert(
    title: string,
    message: string
  ) {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  }

  const loadLoginOptions =
    useCallback(async () => {
      try {
        const [
          savedEmail,
          deviceSecret,
          biometricAvailable,
          deviceDetails,
        ] = await Promise.all([
          getQuickLoginIdentifier(),
          getDeviceSecret(),
          isBiometricEnabled(),
          getDeviceDetails(),
        ]);

        setQuickLoginEmail(
          savedEmail
        );

        setPinLoginAvailable(
          Boolean(
            savedEmail &&
            deviceSecret
          )
        );

        setBiometricLoginAvailable(biometricAvailable);
        const canEnroll = Platform.OS !== "web" &&
          await LocalAuthentication.hasHardwareAsync() &&
          await LocalAuthentication.isEnrolledAsync();
        setBiometricEnrollmentAvailable(canEnroll);

        setDevice(
          deviceDetails
        );
      } catch (error) {
        console.warn(
          "Could not load login options:",
          error
        );

        setPinLoginAvailable(
          false
        );

        setBiometricLoginAvailable(false);
        setBiometricEnrollmentAvailable(false);
      }
    }, []);

  useEffect(() => {
    loadLoginOptions();
  }, [loadLoginOptions]);

  useFocusEffect(
    useCallback(() => {
      loadLoginOptions();
    }, [loadLoginOptions])
  );

  const saveAuthenticatedSession =
    async (
      token: string,
      user: any,
      email?: string
    ) => {
      await setItemSafe(
        "auth_token",
        token
      );

      /*
       * Keep authToken for compatibility with your
       * existing application.
       */
      await setItemSafe(
        "authToken",
        token
      );

      await setItemSafe(
        "user",
        JSON.stringify(user)
      );

      if (user?.id) {
        await setItemSafe(
          "user_id",
          String(user.id)
        );
      }

      if (email) {
        await saveQuickLoginIdentifier(
          email
        );
      }

      await login(
        token,
        user
      );
if (redirectTo) {
  router.replace(
    redirectTo as any
  );

  return;
}

      router.replace("/home");
    };

  const handleVerificationResponse =
  async (
    response: any
  ): Promise<boolean> => {
    const responseStatus =
      response?.status ??
      response?.data?.status;

    const responseData =
      response?.data &&
      typeof response.data === "object"
        ? response.data
        : response;

    /*
     * New or untrusted device verification must be
     * handled before the normal KYC next-step switch.
     */
    if (
      responseData?.requires_device_verification === true ||
      responseData?.requires_face_verification === true ||
      responseData?.next_step === "device_verification" ||
      responseData?.next_step === "new_device_verification"
    ) {
      if (responseData?.user) {
        await setItemSafe(
          "user",
          JSON.stringify(
            responseData.user
          )
        );
      }

      if (responseData?.user_id) {
        await setItemSafe(
          "pending_user_id",
          String(
            responseData.user_id
          )
        );
      }

      if (responseData?.pre_auth_token) {
        await setItemSafe(
          "pre_auth_token",
          String(
            responseData.pre_auth_token
          )
        );
      }

      const currentDevice =
        device ??
        (await getDeviceDetails());

      await setItemSafe("pending_device", JSON.stringify(currentDevice));

      router.replace({
        pathname: "/auth/faceRecord",
        params: {
          mode: "device-verification",
        },
      });

      return true;
    }

    /*
     * This function only handles verification responses.
     */
    if (responseStatus !== 202) {
      return false;
    }

    if (responseData?.user) {
      await setItemSafe("user",
        JSON.stringify(
          responseData.user
        )
      );
    }

    if (responseData?.user_id) {
      await setItemSafe("user_id",
        String(
          responseData.user_id
        )
      );
    }

    if (responseData?.pre_auth_token) {
      await setItemSafe("pre_auth_token",
        String(
          responseData.pre_auth_token
        )
      );
    }

    switch (responseData?.next_step) {
      case "email_verification":
        router.replace("/auth/email-verification");
        return true;

      case "phone_verification":
        router.replace("/auth/phoneNumberVerification");
        return true;

      case "face_verification":
        router.replace({
          pathname: "/auth/faceRecord",
          params: {
            mode: "kyc",
          },
        });
        return true;

      case "bvn_nin":
        router.replace("/auth/identityNumber");
        return true;

      case "gov_id":
        router.replace("/auth/idCardUpload");
        return true;

      default:
        showAlert(
          "Verification Required",
          responseData?.message ??
            "Complete your account verification."
        );

        return true;
    }
  };

  const enrollBiometrics = async (token: string): Promise<void> => {
    if (Platform.OS === "web") return;
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hardware || !enrolled) return;
    // Delete any legacy unprotected quick-login token before storing the
    // biometric-gated token. This protects access on subsequent reads.
    await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
    await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token, {
      requireAuthentication: true,
      authenticationPrompt: "Enable fingerprint or Face ID login for OHLAM",
    });
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
    setBiometricLoginAvailable(true);
  };

  const handlePasswordLogin =
    async (values: LoginFormValues) => {
      try {
        setIsLoading(true);

        const email = values.email.trim().toLowerCase();

        const response = await API.login(email, values.password);

        const verificationHandled =
          await handleVerificationResponse(response);

        if (verificationHandled) {
          return;
        }

        if (response?.requires_device_verification === true ) {
          if (response?.pre_auth_token) {
            await setItemSafe(
              "pre_auth_token",
              response.pre_auth_token
            );
          }

          await setItemSafe("pending_device", JSON.stringify(device));

          router.replace({
            pathname: "/auth/faceRecord",
            params: {
              mode: "device-verification",
            },
          });

          return;
        }

        const token =
          getResponseToken(
            response
          );

        const user =
          getResponseUser(
            response
          );

        if (
          response?.status === 200 &&
          token &&
          user
        ) {
          if (enableBiometricOnLogin) {
            try {
              await enrollBiometrics(token);
              setEnableBiometricOnLogin(false);
            } catch {
              showAlert("Biometric setup unavailable",
                "Your password login is still successful. Check device fingerprint or Face ID enrollment and enable it on your next login.");
            }
          }
          await saveAuthenticatedSession(
            token,
            user,
            email
          );

          return;
        }

        showAlert(
          "Login Failed",
          response?.message ??
            response?.errorMessage ??
            "Login failed. Check your credentials."
        );
      } catch (error: any) {
        console.log(
          "LOGIN ERROR:",
          error
        );

        console.log(
          "LOGIN ERROR DATA:",
          error?.response?.data
        );

        const data =
          error?.response?.data ??
          error?.data ??
          error;

        if (
          data
            ?.requires_face_verification ===
            true ||
          data
            ?.requires_device_verification ===
            true ||
          data?.status === 428
        ) {
          if (data?.user_id) {
            await setItemSafe(
              "pending_user_id",
              String(
                data.user_id
              )
            );
          }

          if (
            data?.pre_auth_token
          ) {
            await setItemSafe(
              "pre_auth_token",
              data.pre_auth_token
            );
          }

          await setItemSafe(
            "pending_device",
            JSON.stringify(device)
          );

          router.replace({
  pathname: "/auth/faceRecord",
  params: {
    mode: "device-verification",
  },
});

          return;
        }

        showAlert(
          "Login Failed",
          getApiErrorMessage(
            error,
            "Login failed. Please try again."
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

  const handlePinLogin =
    async () => {
      if (
        !/^\d{6}$/.test(pin)
      ) {
        showAlert(
          "Invalid PIN",
          "Enter your six-digit PIN."
        );

        return;
      }

      try {
        setIsLoading(true);

        const [
          email,
          deviceId,
          deviceSecret,
        ] = await Promise.all([
          getQuickLoginIdentifier(),
          getOrCreateDeviceId(),
          getDeviceSecret(),
        ]);

        if (
          !email ||
          !deviceSecret
        ) {
          setLoginMode(
            "password"
          );

          setPinLoginAvailable(
            false
          );

          showAlert(
            "Password Required",
            "Login with your password first to configure PIN login."
          );

          return;
        }

        const payload: PinLoginPayload =
          {
            login: email,
            pin,
            device_id:
              deviceId,
            device_secret:
              deviceSecret,
          };

        const response =
          await API.loginWithPin(payload);
        const verificationHandled =
          await handleVerificationResponse(
            response
          );

        if (
          verificationHandled
        ) {
          return;
        }

        const token =
          getResponseToken(
            response
          );

        const user =
          getResponseUser(
            response
          );

        if (!token || !user) {
          throw new Error(
            "The server did not return a complete login response."
          );
        }

        setPin("");

        await saveAuthenticatedSession(
          token,
          user,
          email
        );
      } catch (error: any) {
        const status =
          error?.response?.status ??
          error?.response?.data
            ?.status;

        const code =
          error?.response?.data
            ?.code;

        if (
          status === 403 &&
          code ===
            "DEVICE_NOT_TRUSTED"
        ) {
          await Promise.all([
            SecureStore.deleteItemAsync(
              DEVICE_SECRET_KEY
            ),
            SecureStore.deleteItemAsync(
              QUICK_LOGIN_IDENTIFIER_KEY
            ),
          ]);

          setPinLoginAvailable(
            false
          );

          setLoginMode(
            "password"
          );

          setPin("");
        }

        showAlert(
          status === 423
            ? "PIN Locked"
            : "PIN Login Failed",
          getApiErrorMessage(
            error,
            "Unable to login with PIN."
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

  const handleBiometricLogin = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      // requireAuthentication asks the operating system to authenticate the
      // user before SecureStore releases the protected credential.
      const token = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY, {
        requireAuthentication: true,
        authenticationPrompt: "Login to OHLAM with fingerprint or Face ID",
      });
      if (!token) {
        setBiometricLoginAvailable(false);
        showAlert("Password login required",
          "Biometric login is not enabled on this device or its protected credential was invalidated. Sign in with your password.");
        return;
      }
      // Biometric approval alone is not server authentication. Revalidate the
      // token with Laravel; never restore privileges from a locally saved user.
      const response = await API.get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data?.user;
      if (!user?.id) throw new Error("OHLAM could not verify your account.");
      const savedUser = await getItemSafe("user");
      if (savedUser) {
        try {
          const previous = JSON.parse(savedUser);
          if (previous?.id && String(previous.id) !== String(user.id)) {
            throw new Error("A different account was previously used on this device. Sign in with your password.");
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes("different account")) throw error;
        }
      }
      await saveAuthenticatedSession(token, user, quickLoginEmail ?? undefined);
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        // Token revoked/expired or trust revoked. Never bypass backend checks.
        await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY).catch(() => {});
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "false").catch(() => {});
        setBiometricLoginAvailable(false);
        showAlert("Password login required",
          "Your saved biometric session is no longer valid. Sign in with your password.");
      } else if (error?.message?.includes("different account")) {
        showAlert("Password login required", error.message);
      } else {
        showAlert("Biometric login unavailable",
          "Authentication was cancelled, your device changed its biometric settings, or the server could not be reached. Use your password instead.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin =
    async () => {
      await WebBrowser.openBrowserAsync(
        `${API.baseURL}/auth/google/redirect`
      );
    };

  const handleTwitterLogin =
    async () => {
      await WebBrowser.openBrowserAsync(
        `${API.baseURL}/auth/twitter/redirect`
      );
    };

  const handleFacebookLogin =
    async () => {
      await WebBrowser.openBrowserAsync(
        `${API.baseURL}/auth/facebook/redirect`
      );
    };

  return (
    <ScreenWrapper>
      <Navbar />

      <View style={styles.inner}>
        <Text style={styles.title}>
          {loginMode === "pin"
            ? "PIN Login"
            : "Sign In"}
        </Text>

        <Text style={styles.subtitle}>
          {loginMode === "pin"
            ? quickLoginEmail
              ? `Login as ${quickLoginEmail}`
              : "Enter your six-digit PIN."
            : "Login securely to continue."}
        </Text>

        {loginMode ===
        "password" ? (
          <Formik<LoginFormValues>
            initialValues={{
              email: "",
              password: "",
            }}
            validationSchema={
              LoginSchema
            }
            onSubmit={handlePasswordLogin}
          >
            {({handleChange, handleBlur, handleSubmit, values, errors, touched, }) => (
              <View>
                <TextInput
                  label="Email"
                  mode="outlined"
                  style={
                    styles.input
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={
                    values.email
                  }
                  onChangeText={handleChange(
                    "email"
                  )}
                  onBlur={handleBlur(
                    "email"
                  )}
                  error={
                    touched.email &&
                    Boolean(
                      errors.email
                    )
                  }
                  disabled={
                    isLoading
                  }
                />

                {touched.email &&
                  errors.email && (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {
                        errors.email
                      }
                    </Text>
                  )}

                <TextInput
                  label="Password"
                  mode="outlined"
                  style={
                    styles.input
                  }
                  secureTextEntry={!passwordVisible}
                  right={<TextInput.Icon
                    icon={passwordVisible ? "eye-off" : "eye"}
                    onPress={() => setPasswordVisible(v => !v)}
                    accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  />}
                  value={
                    values.password
                  }
                  onChangeText={handleChange(
                    "password"
                  )}
                  onBlur={handleBlur(
                    "password"
                  )}
                  error={
                    touched.password &&
                    Boolean(
                      errors.password
                    )
                  }
                  disabled={
                    isLoading
                  }
                />

                {touched.password &&
                  errors.password && (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {
                        errors.password
                      }
                    </Text>
                  )}

                {biometricEnrollmentAvailable && !biometricLoginAvailable && (
                  <TouchableOpacity
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: enableBiometricOnLogin }}
                    onPress={() => setEnableBiometricOnLogin(current => !current)}
                    disabled={isLoading}
                    style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}
                  >
                    <Text style={{ fontSize: 19, marginRight: 10 }}>
                      {enableBiometricOnLogin ? "☑" : "☐"}
                    </Text>
                    <Text style={{ flex: 1, color: "#334155" }}>
                      Enable fingerprint / Face ID login on this device after signing in
                    </Text>
                  </TouchableOpacity>
                )}

                <Button
                  mode="contained"
                  loading={
                    isLoading
                  }
                  disabled={
                    isLoading
                  }
                  onPress={() =>
                    handleSubmit()
                  }
                  style={
                    styles.button
                  }
                  contentStyle={
                    styles.buttonContent
                  }
                >
                  Sign In
                </Button>

                <View
                  style={
                    styles.forgotContainer
                  }
                >
                  <Link
                    style={
                      styles.forgotPassword
                    }
                    href="/(tabs)/auth/ForgotPasswordScreen"
                  >
                    Forgot Password?
                  </Link>
                </View>

                {(pinLoginAvailable ||
                  biometricLoginAvailable) && (
                  <>
                    <View
                      style={
                        styles.dividerContainer
                      }
                    >
                      <View
                        style={
                          styles.dividerLine
                        }
                      />

                      <Text
                        style={
                          styles.dividerText
                        }
                      >
                        OR
                      </Text>

                      <View
                        style={
                          styles.dividerLine
                        }
                      />
                    </View>

                    {pinLoginAvailable && (
                      <Button
                        icon="dialpad"
                        mode="outlined"
                        disabled={
                          isLoading
                        }
                        onPress={() => {
                          setPin("");
                          setLoginMode(
                            "pin"
                          );
                        }}
                        style={
                          styles.quickButton
                        }
                        contentStyle={
                          styles.buttonContent
                        }
                      >
                        Login with PIN
                      </Button>
                    )}

                    {biometricLoginAvailable && (
                      <Button
                        icon="fingerprint"
                        mode="outlined"
                        disabled={
                          isLoading
                        }
                        onPress={
                          handleBiometricLogin
                        }
                        style={
                          styles.biometricButton
                        }
                        contentStyle={
                          styles.buttonContent
                        }
                      >
                        Fingerprint / Face ID
                      </Button>
                    )}
                  </>
                )}

                <View
                  style={
                    styles.dividerContainer
                  }
                >
                  <View
                    style={
                      styles.dividerLine
                    }
                  />

                  <Text
                    style={
                      styles.dividerText
                    }
                  >
                    SOCIAL
                  </Text>

                  <View
                    style={
                      styles.dividerLine
                    }
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor:
                        "#DB4437",
                    },
                  ]}
                  onPress={
                    handleGoogleLogin
                  }
                  disabled={
                    isLoading
                  }
                >
                  <FontAwesome
                    name="google"
                    size={20}
                    color="#fff"
                  />

                  <Text
                    style={
                      styles.socialText
                    }
                  >
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor:
                        "#1DA1F2",
                    },
                  ]}
                  onPress={
                    handleTwitterLogin
                  }
                  disabled={
                    isLoading
                  }
                >
                  <FontAwesome
                    name="twitter"
                    size={20}
                    color="#fff"
                  />

                  <Text
                    style={
                      styles.socialText
                    }
                  >
                    Continue with Twitter
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    {
                      backgroundColor:
                        "#3b5998",
                    },
                  ]}
                  onPress={
                    handleFacebookLogin
                  }
                  disabled={
                    isLoading
                  }
                >
                  <FontAwesome
                    name="facebook"
                    size={20}
                    color="#fff"
                  />

                  <Text
                    style={
                      styles.socialText
                    }
                  >
                    Continue with Facebook
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        ) : (
          <View>
            <TextInput
              label="Six-digit PIN"
              value={pin}
              onChangeText={(
                value
              ) => {
                const numericValue =
                  value.replace(
                    /\D/g,
                    ""
                  );

                setPin(
                  numericValue.slice(
                    0,
                    6
                  )
                );
              }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              mode="outlined"
              style={[
                styles.input,
                styles.pinInput,
              ]}
              disabled={
                isLoading
              }
            />

            <Button
              icon="dialpad"
              mode="contained"
              loading={
                isLoading
              }
              disabled={
                isLoading ||
                pin.length !== 6
              }
              onPress={
                handlePinLogin
              }
              style={
                styles.button
              }
              contentStyle={
                styles.buttonContent
              }
            >
              Login with PIN
            </Button>

            {biometricLoginAvailable && (
              <Button
                icon="fingerprint"
                mode="outlined"
                disabled={
                  isLoading
                }
                onPress={
                  handleBiometricLogin
                }
                style={
                  styles.biometricButton
                }
                contentStyle={
                  styles.buttonContent
                }
              >
                Fingerprint / Face ID
              </Button>
            )}

            <Button
              mode="text"
              disabled={
                isLoading
              }
              onPress={() => {
                setPin("");
                setLoginMode(
                  "password"
                );
              }}
              style={
                styles.switchButton
              }
            >
              Use Email and Password
            </Button>
          </View>
        )}

        <View
          style={
            styles.registerContainer
          }
        >
          <Text
            style={
              styles.registerText
            }
          >
            New member?{" "}
            <Link
              style={
                styles.registerLink
              }
              href="/(tabs)/auth/RegisterScreen"
            >
              Register here
            </Link>
          </Text>
        </View>
      </View>

      <CustomAlert
        visible={
          alertVisible
        }
        title={
          alertTitle
        }
        message={
          alertMessage
        }
        onClose={() =>
          setAlertVisible(
            false
          )
        }
      />
    </ScreenWrapper>
  );
}

const styles =
  StyleSheet.create({
    inner: {
      flex: 1,
      justifyContent:
        "center",
      padding: 24,
    },

    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#003366",
      textAlign: "center",
      marginBottom: 8,
    },

    subtitle: {
      color: "#64748b",
      textAlign: "center",
      fontSize: 15,
      marginBottom: 22,
    },

    input: {
      marginVertical: 8,
      backgroundColor: "#fff",
    },

    pinInput: {
      fontSize: 22,
      letterSpacing: 8,
    },

    button: {
      borderRadius: 8,
      marginTop: 12,
    },

    buttonContent: {
      minHeight: 48,
    },

    switchButton: {
      marginTop: 10,
    },

    quickButton: {
      borderRadius: 8,
      marginTop: 10,
      borderColor: "#107eeb",
    },

    biometricButton: {
      borderRadius: 8,
      marginTop: 10,
      borderColor: "#047857",
    },

    errorText: {
      color: "#dc2626",
      fontSize: 12,
      marginLeft: 8,
    },

    forgotContainer: {
      alignItems:
        "flex-end",
      marginTop: 10,
    },

    forgotPassword: {
      color: "#107eeb",
      fontWeight: "bold",
      textDecorationLine:
        "underline",
    },

    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 18,
    },

    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor:
        "#cbd5e1",
    },

    dividerText: {
      color: "#64748b",
      fontWeight: "600",
      marginHorizontal: 10,
      fontSize: 12,
    },

    socialButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      marginVertical: 6,
      paddingVertical: 10,
      borderRadius: 8,
    },

    socialText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 15,
      marginLeft: 8,
    },

    registerContainer: {
      alignItems: "center",
      marginTop: 20,
    },

    registerText: {
      fontSize: 16,
    },

    registerLink: {
      color: "#107eeb",
      fontWeight: "bold",
      textDecorationLine:
        "underline",
    },
  });