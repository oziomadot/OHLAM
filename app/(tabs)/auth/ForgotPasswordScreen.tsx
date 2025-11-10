import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import * as Yup from 'yup';
import { useAuth } from 'context/AuthContext';
import { RootStackParamList } from '@/types';
import Navbar from 'components/Navbar';
import API from '@/config';
import { Alert } from 'react-native';

type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { forgotPassword } = useAuth();

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const handleSubmit = async (values: { email: string }) => {
    try {
      setIsLoading(true);

      await forgotPassword(values.email);
      const response = await API.post('forgot-password', values);
      if (response.data.success) {
        setEmailSent(true);

        showAlert("Success", "Password reset link sent successfully!");
      }
    } catch (error) {
      console.error('Forgot password error:', error);
        showAlert("Error", error ||"Failed to send password reset link");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
         
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            Back to Login
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Navbar />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                Send Reset Link
              </Button>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
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
});

export default ForgotPasswordScreen;
