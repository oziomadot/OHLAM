import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "ohlam_device_id";
const DEVICE_SECRET_KEY = "ohlam_device_secret";
const QUICK_LOGIN_IDENTIFIER_KEY =
  "ohlam_quick_login_identifier";

export type DeviceInformation = {
  device_id: string;
  device_name: string;
  platform: string;
  app_version: string;
};

export async function getOrCreateDeviceId(): Promise<string> {
  const existingDeviceId =
    await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const deviceId = Crypto.randomUUID();

  await SecureStore.setItemAsync(
    DEVICE_ID_KEY,
    deviceId,
    {
      keychainAccessible:
        SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
  );

  return deviceId;
}

export async function getDeviceInformation(): Promise<DeviceInformation> {
  const deviceId = await getOrCreateDeviceId();

  return {
    device_id: deviceId,
    device_name:
      Device.deviceName ||
      Device.modelName ||
      `${Platform.OS} device`,
    platform: Platform.OS,
    app_version:
      Application.nativeApplicationVersion || "unknown",
  };
}

export async function saveDeviceSecret(
  deviceSecret: string
): Promise<void> {
  await SecureStore.setItemAsync(
    DEVICE_SECRET_KEY,
    deviceSecret,
    {
      keychainAccessible:
        SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
  );
}

export async function getDeviceSecret(): Promise<string | null> {
  return SecureStore.getItemAsync(DEVICE_SECRET_KEY);
}

export async function saveQuickLoginIdentifier(
  login: string
): Promise<void> {
  await SecureStore.setItemAsync(
    QUICK_LOGIN_IDENTIFIER_KEY,
    login.trim().toLowerCase(),
    {
      keychainAccessible:
        SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
  );
}

export async function getQuickLoginIdentifier(): Promise<string | null> {
  return SecureStore.getItemAsync(
    QUICK_LOGIN_IDENTIFIER_KEY
  );
}

export async function removeQuickLoginDeviceCredentials(): Promise<void> {
  /*
   * Keep DEVICE_ID_KEY. It identifies the installation but
   * cannot authenticate without the secret.
   */
  await Promise.all([
    SecureStore.deleteItemAsync(DEVICE_SECRET_KEY),
    SecureStore.deleteItemAsync(
      QUICK_LOGIN_IDENTIFIER_KEY
    ),
  ]);
}