import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LoginScreen" />

      <Stack.Screen name="RegisterScreen" />

      <Stack.Screen name="email-verification" />

      <Stack.Screen name="phoneNumberVerification" />

      <Stack.Screen name="identityNumber" />

      <Stack.Screen name="idCardUpload" />

      <Stack.Screen name="faceRecord" />
    </Stack>
  );
}