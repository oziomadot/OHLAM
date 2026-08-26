import { Stack } from "expo-router";

export default function UpdateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}