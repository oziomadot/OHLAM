

// type ResetPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

// const ResetPasswordSchema = Yup.object().shape({
//   password: Yup.string()
//     .min(8, 'Password must be at least 8 characters')
//     .matches(
//       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
//       'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
//     )
//     .required('Password is required'),
//   confirmPassword: Yup.string()
//     .oneOf([Yup.ref('password')], 'Passwords must match')
//     .required('Please confirm your password'),
// });

// const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [passwordReset, setPasswordReset] = useState(false);
//   const { resetPassword } = useAuth();
//   const { token, email } = route.params;

//   const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
//     try {
//       setIsLoading(true);
//       if (route.params?.token && route.params?.email) {
//         await resetPassword({
//           token: route.params.token,
//           email: route.params.email,
//           password: values.password,
//           password_confirmation: values.confirmPassword
//         });
//         navigation.navigate('Login');
//       }
//     } catch (error) {
//       console.error('Reset password error:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (passwordReset) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.content}>
//           <Image
//             source={{ uri: 'https://reactnative.dev/img/header_logo.svg' }}
//             style={styles.successImage}
//             resizeMode="contain"
//           />
//           <Text style={styles.title}>Password Reset Successful</Text>
//           <Text style={styles.subtitle}>
//             Your password has been successfully reset. You can now sign in with your new password.
//           </Text>
//           <Button
//             mode="contained"
//             onPress={() => navigation.navigate('Login')}
//             style={styles.button}
//             labelStyle={styles.buttonLabel}
//           >
//             Back to Login
//           </Button>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.container}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.logoContainer}>
//           <Image
//             source={{ uri: 'https://reactnative.dev/img/header_logo.svg' }}
//             style={styles.logo}
//             resizeMode="contain"
//           />
//           <Text style={styles.title}>Reset Password</Text>
//           <Text style={styles.subtitle}>
//             Create a new password for your account.
//           </Text>
//         </View>

//         <Formik
//           initialValues={{ password: '', confirmPassword: '' }}
//           validationSchema={ResetPasswordSchema}
//           onSubmit={handleSubmit}
//         >
//           {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
//             <View style={styles.formContainer}>
//               <TextInput
//                 label="New Password"
//                 mode="outlined"
//                 left={<TextInput.Icon icon="lock" />}
//                 right={
//                   <TextInput.Icon
//                     icon={showPassword ? 'eye-off' : 'eye'}
//                     onPress={() => setShowPassword(!showPassword)}
//                   />
//                 }
//                 style={styles.input}
//                 value={values.password}
//                 onChangeText={handleChange('password')}
//                 onBlur={handleBlur('password')}
//                 secureTextEntry={!showPassword}
//                 error={touched.password && !!errors.password}
//               />
//               {touched.password && errors.password && (
//                 <Text style={styles.errorText}>{errors.password}</Text>
//               )}

//               <TextInput
//                 label="Confirm New Password"
//                 mode="outlined"
//                 left={<TextInput.Icon icon="lock-check" />}
//                 style={styles.input}
//                 value={values.confirmPassword}
//                 onChangeText={handleChange('confirmPassword')}
//                 onBlur={handleBlur('confirmPassword')}
//                 secureTextEntry={!showPassword}
//                 error={touched.confirmPassword && !!errors.confirmPassword}
//               />
//               {touched.confirmPassword && errors.confirmPassword && (
//                 <Text style={styles.errorText}>{errors.confirmPassword}</Text>
//               )}

//               <Button
//                 mode="contained"
//                 onPress={() => handleSubmit()}
//                 loading={isLoading}
//                 disabled={isLoading}
//                 style={styles.button}
//                 labelStyle={styles.buttonLabel}
//               >
//                 Reset Password
//               </Button>
//             </View>
//           )}
//         </Formik>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     padding: 20,
//     justifyContent: 'center',
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   logo: {
//     width: 100,
//     height: 100,
//     marginBottom: 16,
//   },
//   successImage: {
//     width: 180,
//     height: 150,
//     marginBottom: 24,
//     alignSelf: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 12,
//     color: '#333',
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 24,
//     paddingHorizontal: 20,
//   },
//   formContainer: {
//     width: '100%',
//   },
//   input: {
//     marginBottom: 16,
//     backgroundColor: '#fff',
//   },
//   errorText: {
//     color: '#ff3b30',
//     fontSize: 12,
//     marginBottom: 16,
//     marginLeft: 8,
//   },
//   button: {
//     marginTop: 8,
//     paddingVertical: 8,
//     borderRadius: 8,
//     backgroundColor: '#1a73e8',
//   },
//   buttonLabel: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#fff',
//     paddingVertical: 4,
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
// });

// export default ResetPasswordScreen;
