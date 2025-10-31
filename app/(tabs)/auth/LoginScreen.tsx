import React, { useState, useRef } from 'react';
import { KeyboardAvoidingView, ScrollView, View, Image, Text, Platform,
   StyleSheet, TouchableOpacity, Linking  } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FontAwesome } from "@expo/vector-icons";
import API from '@/config/index';
import { useAuth } from '@/context/AuthContext';
import { useRouter} from "expo-router";
import Navbar from 'components/Navbar';
import CustomAlert from 'components/CustomAlert';
import * as SecureStore from "expo-secure-store"; 
import { useRouteHandler } from '@/hooks/seRouteHandler';

 



const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const LoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  // TODO: Replace with your real auth hook, e.g. useAuth()
  const { login } = useAuth();
  const isWeb = Platform.OS === "web";
  const router = useRouter();

  const [alertVisible, setAlertVisible] = useState(false);
const [alertMessage, setAlertMessage] = useState("");
const [alertTitle, setAlertTitle] = useState("");
const [error, setError] = useState("");
const { handleResponse } = useRouteHandler();
const showAlertCallback = useRef<(() => void) | null>(null);


function showAlert(title: string, message: string, onClose?: () => void) {
  setAlertTitle(title);
  setAlertMessage(message);
  setAlertVisible(true);
  // Store the callback to run when alert is closed
  showAlertCallback.current = onClose;
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
  
 

    const handleLogin = async (values: { email: string; password: string }) => {
      try {
        setIsLoading(true);
        setError(""); // clear old errors
    
        const response = await API.post(`/login`, {
          email: values.email,
          password: values.password,
        });
          

        if (response.status === 200 && response.data.status === 200)
          {
          const user_id = response.data.user_id;
          const user = response.data.user
          
          const { token } = response.data;

          console.log(response.data);

          await login(token, user); // save in AsyncStorage
          await setItemSafe("token", token);
          await setItemSafe("user_id", user_id);
          showAlert("Success", response.data.successMessage, () => {
            handleResponse(response, {
              successRoute: response.data.successRoute,
              errorMessage: response.data.errorMessage,
              successMessage: response.data.successMessage,
            });
          });
        } else {
          // Handle non-200 responses (like 422 validation errors)
          const data = response.data;
          const msg =
            Object.values(data?.errors || {})[0]?.[0] ||  // Try to extract Laravel validation message first
            data?.errorMessage ||                              // fallback to generic message
            "Login failed. Please check your credentials.";  // fallback to generic message

          showAlert("Error", data.errorMessage || msg, () => {
            handleResponse(response, {
              successRoute: data.successRoute,
              errorRoute: data.errorRoute || "/auth/LoginScreen",
              errorMessage: data.errorMessage,
              successMessage: data.successMessage,
            });
          });
        }
      } catch (error) {
        const data = error.response?.data;
        const msg =
          Object.values(data?.errors || {})[0]?.[0] ||  // Try to extract Laravel validation message first
          data?.errorMessage ||                              // fallback to generic message
          "Login failed. Please try again.";            // final fallback

        showAlert("Error", msg);
      } finally {
        setIsLoading(false);
      }
    };
    
  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Navbar/>
        <View style={{flex: 1, alignItems: "center", justifyContent: "center", 
          padding: 20}}>
        <View style={{ width: isWeb ? "40%" : "100%"}}>
        <View style={styles.logoContainer}>
         
          <Text style={styles.title}>We are OPAM family</Text> 
          <Text style={styles.title}>we are here to deliver</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        


        {/* Facebook */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#4c6ef5" }]}
        onPress={() => Linking.openURL("https://your-domain.com/redirect")}
      >
        <FontAwesome name="facebook-square" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.text}>Login with Facebook</Text>
      </TouchableOpacity>

      {/* Twitter / X */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#182025" }]}
        onPress={() => Linking.openURL("https://your-domain.com/auth/twitter")}
      >
        <Text style={styles.text}>Login with Twitter (X)</Text>
      </TouchableOpacity>

      {/* Google */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#075f0f" }]}
        onPress={() => Linking.openURL("https://your-domain.com/googlelogin")}
      >
        <FontAwesome name="google" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.text}>Login with Google</Text>
      </TouchableOpacity>

      <Formik
  initialValues={{ email: '', password: '' }}
  validationSchema={LoginSchema}
  onSubmit={handleLogin}  // ✅ values go here
>
  {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
    <View style={styles.formContainer}>
      <TextInput
        label="Email"
        mode="outlined"
        left={<TextInput.Icon icon="email" />}
        style={styles.input}
        value={values.email}
        onChangeText={handleChange('email')}
        onBlur={handleBlur('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        error={touched.email && !!errors.email}
        testID="login_email_input"
      />
      {touched.email && errors.email && (
        <Text style={styles.errorText}>{errors.email}</Text>
      )}

      <TextInput
        label="Password"
        mode="outlined"
        left={<TextInput.Icon icon="lock" />}
        style={styles.input}
        value={values.password}
        onChangeText={handleChange('password')}
        onBlur={handleBlur('password')}
        secureTextEntry
        error={touched.password && !!errors.password}
        testID="login_password_input"
      />
      {touched.password && errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={() => router.push('/auth/ForgotPasswordScreen')}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <Button
        mode="contained"
        onPress={handleSubmit}   // ✅ no need for arrow function
        loading={isLoading}
        disabled={isLoading}
        style={styles.button1}
        labelStyle={styles.buttonLabel}
        testID="login_submit_button"
      >
        Sign In
      </Button>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/RegisterScreen')}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
</Formik>

        </View>
        </View>
        </View>
      </ScrollView>

       {/* 🔔 Global Alert (always available) */}
    <CustomAlert
      visible={alertVisible}
      title={alertTitle}
      message={alertMessage}
      onClose={() => {
        setAlertVisible(false);
        // Run the callback if provided
        if (showAlertCallback.current) {
          showAlertCallback.current();
          showAlertCallback.current = null;
        }
      }}
    />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#E8E8E8',
    padding: 30,
    borderRadius: 10, 
    shadowColor: '#147799',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
     // Web shadow
     ...Platform.select({
      web: {
        boxShadow: '0 25px 50px -12px rgba(14, 77, 9, 0.11)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      },
    }),
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  text: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  icon: {
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  button1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 7,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#1a73e8',
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a73e8',
    width: "50%",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    paddingVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
  },
  footerLink: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
