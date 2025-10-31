import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import API from "@/config";
import Navbar from "components/Navbar";
import DOBPicker from "components/dateOfBirth";
import CustomAlert from "components/CustomAlert";

const RegistrationScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [registrationStatuses, setRegistrationStatuses] = useState([]);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const regStatus = watch("registration_status_id");
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

  // ✅ Fetch registration statuses from Laravel
  useEffect(() => {
    const loadRegistrationStatus = async () => {
      setLoading(true);
      try {
        const response = await API.get("/registrationStatus");
        setRegistrationStatuses(response.data.registrationStatus || []);
      } catch (err) {
        console.error("Error fetching registration statuses", err);
        setError("Failed to load registration statuses");
      } finally {
        setLoading(false);
      }
    };
    loadRegistrationStatus();
  }, []);

  // ✅ On form submit
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data };

      if (payload.dob instanceof Date) {
        payload.dob = payload.dob.toISOString().split("T")[0];
      }

      const res = await API.post("/register", payload);
      const { verification_required, token, user } = res.data;

      if (verification_required) {
        await setItemSafe("pending_user_id", user.id);
        router.push("/auth/email-verification");
        return;
      }

      if (token) {
        await setItemSafe("api_token", token);
        showAlert("Success", "Registered! Token saved securely.");
      }
    } catch (err: any) {
      console.log("🔥 ERROR CAUGHT IN REGISTER:", err.response?.data || err);
    
      let message = "Something went wrong. Please try again.";
    
      if (err.response?.status === 422 && err.response.data?.errors) {
        const errors = err.response.data.errors;
        console.log("Validation errors:", errors);
    
        message = Object.values(errors).flat().join("\n");
        showAlert("Validation Error", message);
        return;
      }
    
      if (err.response?.data?.message) {
        message = err.response.data.message;
        showAlert("Error", message);
        return;
      }
    
      if (err.message) message = err.message;
    
      showAlert("Error", message);
    }
    
    
     finally {
      setLoading(false);
    }
  };

  if (loading && registrationStatuses.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    );
  }


   // Password strength logic
   const evaluateStrength = (value) => {
    if (!value) return setStrength("Weak");

    const length = value.length >= 8;
    const upper = /[A-Z]/.test(value);
    const lower = /[a-z]/.test(value);
    const number = /\d/.test(value);
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const score = [length, upper, lower, number, special].filter(Boolean).length;

    if (score <= 2) setStrength("Weak");
    else if (score === 3 || score === 4) setStrength("Medium");
    else setStrength("Strong");
  };

  // Dynamic color for strength bar
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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

          {/* Othernames */}
          <FormField label="Othernames">
            <Controller
              control={control}
              name="othernames"
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
              rules={{ required: true, 
                minLength: {value:8, 
                  message:"Password must be at least 8 characters long"},
                  validate: (value) => {
                    const checks = [
                      /[A-Z]/.test(value) || "Must include uppercase",
                      /[a-z]/.test(value) || "Must include lowercase",
                      /\d/.test(value) || "Must include a number",
                      /[!@#$%^&*(),.?":{}|<>]/.test(value) || "Must include a special character",
                    ];
                    const failed = checks.find((check) => check !== true);
                    return failed === undefined || failed;
                  },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter password"
                  secureTextEntry
                  style={styles.input}
                  testID="password_input"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    evaluateStrength(text);
                  }}
                />
              )}
            />
            
          </FormField>

          {/* Password Strength Bar */}
      <View style={[styles.strengthBar, { backgroundColor: getStrengthColor() }]} />
      <Text style={{ color: getStrengthColor(), fontWeight: "600", marginBottom: 6 }}>
        {strength} Password
      </Text>

      {/* Checklist */}
      <View style={styles.checklist}>
        <Text style={[styles.rule, password.length >= 8 && styles.rulePassed]}>
          • At least 8 characters
        </Text>
        <Text style={[/[A-Z]/.test(password) && styles.rulePassed, styles.rule]}>
          • Contains uppercase letter
        </Text>
        <Text style={[/[a-z]/.test(password) && styles.rulePassed, styles.rule]}>
          • Contains lowercase letter
        </Text>
        <Text style={[/\d/.test(password) && styles.rulePassed, styles.rule]}>
          • Contains a number
        </Text>
        <Text style={[/[!@#$%^&*(),.?":{}|<>]/.test(password) && styles.rulePassed, styles.rule]}>
          • Contains special character
        </Text>
      </View>

          {/* Confirm Password */}
          <FormField
            label="Confirm Password"
            required
            error={errors.password_confirmation}
          >
            <Controller
              control={control}
              name="password_confirmation"
              rules={{ required: "Confirm Password is required",
                validate: (value) => value === password || "Passwords do not match",
               }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Re-enter password"
                  secureTextEntry
                  style={styles.input}
                  testID="password_confirm_input"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </FormField>

          {/* Date of Birth */}
          <DOBPicker control={control} setValue={setValue} />

          {/* Phone Number */}
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

          {/* WhatsApp */}
          <FormField label="WhatsApp Number">
            <Controller
              control={control}
              name="whatsapp"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Enter WhatsApp number"
                  keyboardType="phone-pad"
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </FormField>

          {/* Registration Status */}
          <Text style={styles.label}>Registration Status</Text>
          <Controller
            control={control}
            name="registration_status_id"
            render={({ field: { onChange, value } }) => (
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={styles.input}
                  testID="reg_picker"
                >
                  <Picker.Item
                    label="Select registration status"
                    value=""
                    color="#999"
                  />
                  {registrationStatuses.map((s) => (
                    <Picker.Item key={s.id} label={s.name} value={s.id} />
                  ))}
                </Picker>
              </View>
            )}
          />

          {/* Referral ID (only for Agents) */}
          {regStatus == "2" && (
            <FormField label="Referral ID (if referred by someone)">
              <Controller
                control={control}
                name="referral_id"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Enter referral ID"
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </FormField>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            style={[styles.button, loading && { opacity: 0.6 }]}
            testID="submit_register"
          >
            <Text style={styles.buttonText}>
              {loading ? "Registering..." : "Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
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

/* ✅ Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { flexGrow: 1, padding: 20 },
  formContainer: {
    width: Platform.OS === "web" ? "40%" : "100%",
    alignSelf: "center",
  backgroundColor:"#B3F4EE",
  marginTop: 20,
  padding: 30,  
  borderRadius: 10,
  shadowColor: "#000", 
  shadowOffset: { width: 2, height: 2},
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
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
  errorText: { color: "red", fontSize: 13, marginTop: 4 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  strengthBar: {
    height: 6,
    borderRadius: 5,
    marginVertical: 5,
    width: "100%",
  },
  checklist: { marginVertical: 8 },
  rule: { color: "#888", fontSize: 14 },
  rulePassed: { color: "green", textDecorationLine: "line-through" },
  error: { color: "red", marginBottom: 8, fontStyle: "italic" },
});

export default RegistrationScreen;
