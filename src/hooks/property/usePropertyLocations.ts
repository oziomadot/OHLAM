import * as Location from "expo-location";

export function usePropertyLocation(setValue: any, showAlert: any) {
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      showAlert("Permission Required", "Location permission is required.");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});

    setValue("latitude", String(location.coords.latitude));
    setValue("longitude", String(location.coords.longitude));

    showAlert("Location Added", "Property GPS location captured.");
  };

  return { getCurrentLocation };
}