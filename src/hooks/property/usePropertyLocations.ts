import { Platform } from "react-native";
import * as Location from "expo-location";

const DEV_PLACEHOLDER = { latitude: 6.5244, longitude: 3.3792 };

export function usePropertyLocation(setValue: any, showAlert: any) {
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        showAlert("Permission Required", "Location permission is required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setValue("latitude", String(location.coords.latitude));
      setValue("longitude", String(location.coords.longitude));

      showAlert("Location Added", "Property GPS location captured.");
    } catch (error: any) {
      if (__DEV__ && Platform.OS === "android") {
        setValue("latitude", String(DEV_PLACEHOLDER.latitude));
        setValue("longitude", String(DEV_PLACEHOLDER.longitude));
        showAlert("Dev Mode", "Emulator has no GPS. Using Lagos placeholder coordinates.");
        return;
      }
      console.error("Location error:", error);
      showAlert("Location Error", "Could not capture property GPS location. Please try again.");
    }
  };

  return { getCurrentLocation };
}