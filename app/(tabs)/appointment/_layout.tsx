import { Stack } from "expo-router";

export default function AppointmentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[appointmentId]" />
      <Stack.Screen name="customer/create" />
      <Stack.Screen name="customer/index" />
      <Stack.Screen name="lister/create" />
      <Stack.Screen name="lister/request" />
      <Stack.Screen name="lister/view" />     
    </Stack>
  );
}