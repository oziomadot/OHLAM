import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function getDeviceDetails() {
  const deviceId =
    Platform.OS === "android"
      ? await Application.getAndroidId()
      : await Application.getIosIdForVendorAsync();

  return {
    device_id: deviceId,
    device_name: Device.deviceName,
    brand: Device.brand,
    model_name: Device.modelName,
    os_name: Device.osName,
    os_version: Device.osVersion,
    platform: Platform.OS,
  };
}