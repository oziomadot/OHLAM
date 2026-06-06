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
import { Picker } from "@react-native-picker/picker";
import { useRouter, Link } from "expo-router";
import API from "@/src/services/api";
import Navbar from "components/Navbar";
import DOBPicker from "components/dateOfBirth";
import CustomAlert from "components/CustomAlert";
import ScreenWrapper from "components/ScreenWrapper";
import TermsModal from "components/TermsModal";
import { setItemSafe, getItemSafe } from "@/utils/storage";

const RegistrationScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [error, setError] = useState("");
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

  
    
  // ✅ On form submit
  const onSubmit = async (data: any) => {
    if (!agreeTerms) {
      showAlert("Terms Required", "You must agree to the Terms and Conditions to register.");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...data };

      let storedRef: string | null = null;
      if (Platform.OS === "web") {
        storedRef = window?.localStorage?.getItem("referral_code");
      } else {
        storedRef = await getItemSafe("referral_code");
      }
      if (storedRef) payload.ref = storedRef;

      if (payload.dob instanceof Date) {
        payload.dob = payload.dob.toISOString().split("T")[0];
      }

      const res = await API.register(payload);
      const { verification_required, token, user } = res;
      console.log("🚀 Registration response:", res);

      if (verification_required) {
        await setItemSafe("user_id", user.id);
        await setItemSafe("user", JSON.stringify(user));
        await setItemSafe("user_email", user.email);
        await setItemSafe("registration_step", "email-verification");
        router.push("/auth/email-verification");
        return;
      }

      if (token) {
        await setItemSafe("authToken", token);
        showAlert("Success", "Registered! Token saved securely.");
      }
    } catch (err: any) {
  console.log("🔥 REGISTER ERROR FULL:", err);
  console.log("🔥 REGISTER ERROR RESPONSE:", err?.response);
  console.log("🔥 REGISTER ERROR DATA:", err?.response?.data);
  console.log("🔥 REGISTER ERROR MESSAGE:", err?.message);

  const data = err?.response?.data || err?.data || err;

  let message = "Something went wrong. Please try again.";

  if (data?.errors) {
    message = Object.values(data.errors).flat().join("\n");
    showAlert("Validation Error", message);
    return;
  }

  if (data?.message) {
    showAlert("Error", data.message);
    return;
  }

  if (err?.message) {
    showAlert("Error", err.message);
    return;
  }

  showAlert("Error", message);
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



  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

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
        <FormField label="Email" required error={errors.email}>
          <Controller
            control={control}
            name="email"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                value={value}
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
              required: true,
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
              required: "Confirm Password is required",
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
        <FormField label="Phone Number">
          <Controller
            control={control}
            name="phonenumber"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                style={styles.input}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </FormField>

       

        {/* Referrer ID (always visible but optional) */}
        <FormField label="Referrer ID (optional)">
          <Controller
            control={control}
            name="referrer_id"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Enter Oramex ID of referrer"
                style={styles.input}
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </FormField>

        {/* Terms */}
        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 12 }}>
          <TouchableOpacity
            onPress={() => setAgreeTerms(!agreeTerms)}
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
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={agreeTerms ? handleSubmit(onSubmit) : null}
          disabled={loading || !agreeTerms}
          style={[styles.button, (loading || !agreeTerms) && { opacity: 0.6 }]}
        >
          <Text style={styles.buttonText}>
            {loading ? "Registering..." : "Register"}
          </Text>
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
