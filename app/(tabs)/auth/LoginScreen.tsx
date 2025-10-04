import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View, Image, Text, Platform,
   StyleSheet, TouchableOpacity, Linking  } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FontAwesome } from "@expo/vector-icons";
import API from '@/config/index';
import { useAuth } from '@/context/AuthContext';

type LoginScreenProps = { navigation: any };


const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  // TODO: Replace with your real auth hook, e.g. useAuth()
  const { login } = useAuth();
  const isWeb = Platform.OS === "web";

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setIsLoading(true);
  
      console.log("Logging in...");
      const response = await API.post(`/login`, {
        email: values.email,
        password: values.password,
      });
  
      const { token } = response.data;
      await login(token); // saves in AsyncStorage
  
      console.log("Logged in!");
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
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
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>We are OPAM family, we are here to deliver</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>
<View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
<View style={{ width: isWeb ? "30%" : "100%"}}>
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
      />
      {touched.password && errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}

      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={() => navigation.navigate('ForgotPassword')}
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
      >
        Sign In
      </Button>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
</Formik>

        </View>
        </View>
      </ScrollView>
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
