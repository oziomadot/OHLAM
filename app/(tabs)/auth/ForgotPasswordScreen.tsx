import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import * as Yup from 'yup';
import { useAuth } from 'context/AuthContext';
import { Link, useRouter } from 'expo-router';
import Navbar from 'components/Navbar';


import API from '@/src/services/api';
import { Alert } from 'react-native';
import ScreenWrapper from 'components/ScreenWrapper';
import { getItemSafe, setItemSafe } from '@/utils/storage';

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPasswordScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { forgotPassword } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(''); // Store email from first step
  const [token, setToken] = useState('');
const [password, setPassword] = useState('');

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const handleSubmit = async (values: { email: string }) => {
    try {
      setIsLoading(true);

      await forgotPassword(values.email);
      const response = await API.forgetpassword(values.email);
      if (response.success) {
        setEmailSent(true);
        setEmail(response.user_email);

        setItemSafe('forgot_password_email', response.user_email);

        showAlert("Success", "Password reset token sent successfully! Check your mail");
      }
    } catch (error) {
      console.error('Forgot password error:', error);
        showAlert("Error", error ||"Failed to send password reset token");
    } finally {
      setIsLoading(false);
    }
  };

 const handleResetPassword = async () => {
  setError('');
  if (password !== passwordConfirmation) {
    setError('Passwords do not match');
    return;
  }
  if (password.length < 8) {
    setError('Password must be at least 8 characters');
    return;
  }
  setLoading(true);
  try {
console.log("Resetting password with:", { email, token, password, passwordConfirmation });
    
    const response = await API.resetpassword(email, token, password, passwordConfirmation);

    console.log(response);
    if (response.success) {
      // Success - navigate to login or auto-login
      router.push('/(tabs)/auth/LoginScreen');
    } else {
      setError(response.message || 'Failed to reset password');
    }
  } catch (err) {
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
    try {
    const response = await fetch('YOUR_API_URL/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      // Success - navigate to login or auto-login
      router.push('/(tabs)/auth/LoginScreen');
    } else {
      setError(data.message || 'Failed to reset password');
    }
  } catch (err) {
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};




 if (emailSent) {
  return (
    <ScreenWrapper>
    {/* <View style={styles.container}> */}
      {/* <View style={styles.content}> */}
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a password reset code to your email address. Enter the code below along with your new password.
        </Text>

        <TextInput
          mode="outlined"
          label="Reset Code"
          value={token}
          onChangeText={setToken}
          style={styles.input}
          autoCapitalize="none"
        />

        <TextInput
          mode="outlined"
          label="New Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="Confirm Password"
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          secureTextEntry
          style={styles.input}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleResetPassword}
          style={styles.button}
          labelStyle={styles.buttonLabel}
          loading={loading}
          disabled={loading}
        >
          Reset Password
        </Button>

        <Link href="/(tabs)/auth/LoginScreen">
          <Text style={styles.linkText}>Back to Login</Text>
        </Link>
      {/* </View> */}
    {/* </View> */}
    </ScreenWrapper>
  );
}

  return (
    <ScreenWrapper>
      <Navbar />
     
        <View style={styles.logoContainer}>
          
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        <Formik
          initialValues={{ email: '' }}
          validationSchema={ForgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <TextInput
                label="Email Address"
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

              <Button
                mode="contained"
                onPress={() => handleSubmit()}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                Send Reset Token
              </Button>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/auth/LoginScreen')}
                >
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      
    </ScreenWrapper>
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
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  emailImage: {
    width: 200,
    height: 150,
    marginBottom: 24,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 8,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a73e8',
  },
  buttonLabel: {
    fontSize: 16,
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  linkText: {
    marginTop: 16,
    color: '#6200ee',
    textAlign: 'center',
  },
 
});

export default ForgotPasswordScreen;



