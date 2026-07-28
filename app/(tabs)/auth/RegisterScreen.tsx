import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter, Link } from "expo-router";
import API from "@/src/services/api";
import Navbar from "components/Navbar";
import DOBPicker from "components/dateOfBirth";
import CustomAlert from "components/CustomAlert";
import ScreenWrapper from "components/ScreenWrapper";
import TermsModal from "components/TermsModal";
import { setItemSafe, getItemSafe } from "@/utils/storage";
import { getFriendlyApiError } from "@/src/utils/apiError";

import { useLocalSearchParams } from "expo-router";


const RegistrationScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
 
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const password = watch("password", "");
  const [strength, setStrength] = useState("Weak");

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");

  function showAlert(title: string, message: string) {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  }

  const { ref } = useLocalSearchParams();


  
    
  // ✅ On form submit
  const onSubmit = async (data: any) => {


 console.log(
    "[REGISTER] onSubmit reached"
  );




    if (!agreeTerms) {
      showAlert("Terms Required", "You must agree to the Terms and Conditions to register.");
      return;
    }




    setLoading(true);
    try {
      const payload = { ...data, agree_terms: true };

      let storedRef: string | null = null;
      if (Platform.OS === "web") {
        storedRef = window?.localStorage?.getItem("referral_id");
      } else {
        storedRef = await getItemSafe("referral_id");
      }
      if (storedRef) payload.ref = storedRef;

      if (payload.dob instanceof Date) {
        payload.dob = payload.dob.toISOString().split("T")[0];
      }

      const res = await API.register(payload);

      const {verification_required, pre_auth_token, user, next_step} = res;


      if (!user?.id || !user?.email) {
        throw new Error(
          "Registration succeeded, but the user information is incomplete."
        );
      }

      /*
 * API.register() should already store this,
 * but storing it here as a defensive check
 * is acceptable.
 */
    if (pre_auth_token) {
        await setItemSafe("pre_auth_token", pre_auth_token);
      }

    if (verification_required && pre_auth_token) {
      await setItemSafe("user_id", String(user.id));

      await setItemSafe("user", JSON.stringify(user));

      await setItemSafe("user_email", user.email);

      await setItemSafe("registration_step", next_step ?? "email_verification");

      router.replace("/auth/email-verification");

      return;
    }

    throw new Error(
      "Registration was completed, but the verification session was not created."
    );
    }

      
        catch (error: unknown) {
  if (__DEV__) {
    console.log(
      "[REGISTER] Error:",
      error
    );
  }

  const friendlyError = getFriendlyApiError(
    error,
    "We could not complete your registration. Please try again."
  );

  showAlert(
    friendlyError.title,
    friendlyError.message
  );
} finally {
  setLoading(false);
}
  };

  // ✅ Password strength logic
  const evaluateStrength = (value: string) => {
    if (!value) return setStrength("Weak");
    const length = value.length >= 8;
    const upper = /[A-Z]/.test(value);
    const lower = /[a-z]/.test(value);
    const number = /\d/.test(value);
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const score = [length, upper, lower, number, special].filter(Boolean).length;
    if (score <= 2) setStrength("Weak");
    else if (score <= 4) setStrength("Medium");
    else setStrength("Strong");
  };

  const getStrengthColor = () => {
    switch (strength) {
      case "Weak":
        return "red";
      case "Medium":
        return "orange";
      case "Strong":
        return "green";
      default:
        return "gray";
    }
  };




  return (
    <ScreenWrapper>
      <Navbar />
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>📝 Register Your Account</Text>

        {/* Surname */}
        <FormField label="Surname" required error={errors.surname}>
          <Controller
            control={control}
            name="surname"
            rules={{ required: "Surname is required" }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Enter surname"
                style={styles.input}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </FormField>

        {/* Firstname */}
        <FormField label="Firstname" required error={errors.firstname}>
          <Controller
            control={control}
            name="firstname"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Enter firstname"
                style={styles.input}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </FormField>

         {/* Firstname */}
        <FormField label="Other names (optional)">
          <Controller
            control={control}
            name="othernames"
            rules={{ required: false }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Enter other names"
                style={styles.input}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </FormField>

        {/* Email */}
        <FormField label="Email">
        <Controller
  control={control}
  name="email"
  rules={{
    required: "Email address is required.",
    pattern: {
      value:
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message:
        "Enter a valid email address.",
    },
  }}
  render={({
    field: {
      onChange,
      onBlur,
      value,
    },
  }) => (
    <TextInput
      placeholder="Enter email"
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      style={styles.input}
      value={value ?? ""}
      onBlur={onBlur}
      onChangeText={onChange}
    />
  )}
/>
</FormField>

        {/* Password */}
        <FormField label="Password" required error={errors.password}>
          <Controller
            control={control}
            name="password"
            rules={{
              required: "Password is required",
              minLength: { value: 8, message: "Password must be at least 8 characters long" },
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Enter password"
                secureTextEntry
                style={styles.input}
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  evaluateStrength(text);
                }}
              />
            )}
          />
        </FormField>

        {/* Password Strength Indicator */}
        <View style={[styles.strengthBar, { backgroundColor: getStrengthColor() }]} />
        <Text style={{ color: getStrengthColor(), fontWeight: "600", marginBottom: 6 }}>
          {strength} Password
        </Text>

        {/* Confirm Password */}
        <FormField label="Confirm Password" required error={errors.password_confirmation}>
          <Controller
            control={control}
            name="password_confirmation"
            rules={{
              required: "Please, confirm your password",
              validate: (value) => value === password || "Passwords do not match",
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Re-enter password"
                secureTextEntry
                style={styles.input}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </FormField>

        {/* DOB */}
        <DOBPicker control={control} setValue={setValue} />

        {/* Phone */}
        <FormField
  label="Phone Number"
  required
  error={errors.phonenumber}
>
  <Controller
    control={control}
    name="phonenumber"
    rules={{
      required:
        "Phone number is required.",

      pattern: {
        value: /^\+[1-9]\d{7,14}$/,
        message:
          "Enter the number with its country code, for example +2348012345678.",
      },
    }}
    render={({
      field: {
        onChange,
        onBlur,
        value,
      },
    }) => (
      <TextInput
        placeholder="+2348012345678"
        keyboardType="phone-pad"
        autoComplete="tel"
        style={styles.input}
        value={value ?? ""}
        onBlur={onBlur}
        onChangeText={(text) => {
          /*
           * Allow + and digits only.
           */
          const cleaned = text.replace(
            /[^\d+]/g,
            ""
          );

          /*
           * Ensure + can only appear at the start.
           */
          const normalized =
            cleaned.startsWith("+")
              ? "+"
                + cleaned
                    .slice(1)
                    .replace(/\+/g, "")
              : cleaned.replace(
                  /\+/g,
                  ""
                );

          onChange(normalized);
        }}
      />
    )}
  />
</FormField>
       

        {/* Referrer ID (always visible but optional) */}
        <FormField label="Referrer ID">
        <Controller
  control={control}
  name="referral_id"
  render={({
    field: {
      onChange,
      value,
    },
  }) => (
    <TextInput
      placeholder="Enter Oramex ID of referrer"
      style={styles.input}
      value={value}
      onChangeText={
        onChange
      }
    />
  )}
/></FormField>

        {/* Terms */}
        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 12 }}>
          <Controller
            control={control}
            name="agree_terms"
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  onPress={() => { setAgreeTerms(!agreeTerms); onChange(!agreeTerms); }}
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 1,
                    borderColor: "#333",
                    backgroundColor: agreeTerms ? "#007AFF" : "#fff",
                    marginRight: 8,
                  }}
                />
                <Text style={{ flex: 1 }}>
                  I have read and agree to the{" "}
                  <Text
                    style={{ color: "#007AFF", textDecorationLine: "underline" }}
                    onPress={() => setTermsModalVisible(true)}
                  >
                    Terms and Conditions
                  </Text>.
                </Text>
              </>
            )}
          />
        </View>
            

        {/* Submit */}
        {/* <TouchableOpacity
          onPress={agreeTerms ? handleSubmit(onSubmit) : null}
          disabled={loading || !agreeTerms}
          style={[styles.button, (loading || !agreeTerms) && { opacity: 0.6 }]}
        >
          <Text style={styles.buttonText}>
            {loading ? "Registering..." : "Register"}
          </Text>
          
        </TouchableOpacity> */}


<TouchableOpacity
  onPress={handleSubmit(
    onSubmit,
    validationErrors => {
      console.log(
        "[REGISTER] Form validation errors:",
        validationErrors
      );

      showAlert(
        "Form incomplete",
        "Please complete all required fields correctly."
      );
    }
  )}
  disabled={loading}
  style={[
    styles.button,
    loading && { opacity: 0.6 },
  ]}
>
  {loading ? (
    <ActivityIndicator color="#ffffff" />
  ) : (
    <Text style={styles.buttonText}>
      Register
    </Text>
  )}
</TouchableOpacity>




        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={{ fontSize: 16 }}>
            Already a member?{" "}
            <Link
              style={{
                color: "#107eeb",
                fontWeight: "bold",
                textDecorationLine: "underline",
                textDecorationColor: "#107eeb",
              }}
              href="/(tabs)/auth/LoginScreen"
            >
              Login here
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

      <TermsModal visible={termsModalVisible} onClose={() => setTermsModalVisible(false)} />
    </ScreenWrapper>
  );
};

/* ✅ Simple FormField wrapper */
const FormField = ({ label, required = false, children, error }: any) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.label}>
      {label} {required && <Text style={{ color: "red" }}>*</Text>}
    </Text>
    {children}
    {error && (
      <Text style={styles.errorText}>{(error as any).message || "Required"}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  formContainer: {
    width: Platform.OS === "web" ? "50%" : "95%",
    alignSelf: "center",
    backgroundColor: "#EFFFFC",
    marginTop: 20,
    padding: 25,
    borderRadius: 12,
    borderColor: "#007AFF33",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 20,
  },
  label: { fontWeight: "500", color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#333",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  strengthBar: { height: 6, borderRadius: 5, marginVertical: 5, width: "100%" },
  checklist: { marginVertical: 8 },
  rule: { color: "#888", fontSize: 14 },
  rulePassed: { color: "green", textDecorationLine: "line-through" },
  errorText: { color: "red", fontSize: 13, marginTop: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default RegistrationScreen;
