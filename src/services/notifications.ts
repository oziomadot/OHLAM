import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import API from "@/src/services/api";

/**
 * Configure how notifications behave when
 * OHLAM is currently open.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Configure Android notification channels.
 */
export async function setupNotificationChannels() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "OHLAM Notifications",
    description: "General notifications from OHLAM",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  });
}

/**
 * Ask the user for permission and obtain
 * this device's Expo Push Token.
 */
export async function getOhlamExpoPushToken(): Promise<
  string | null
> {
  try {
    /*
     * Push notifications are intended for actual
     * app installations/devices.
     */
    if (!Device.isDevice) {
      console.log(
        "Push notification registration skipped: not a physical device."
      );

      return null;
    }

    /*
     * Android channel should exist BEFORE asking
     * Android for notification permission/token.
     */
    await setupNotificationChannels();

    /*
     * Check existing permission.
     */
    const existingPermissions =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingPermissions.status;

    /*
     * Only ask if permission hasn't already
     * been granted.
     */
    if (finalStatus !== "granted") {
      const requestedPermissions =
        await Notifications.requestPermissionsAsync();

      finalStatus = requestedPermissions.status;
    }

    if (finalStatus !== "granted") {
      console.log(
        "Notification permission was not granted."
      );

      return null;
    }

    /*
     * Get OHLAM's EAS project ID.
     */
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error(
        "EAS projectId could not be found."
      );

      return null;
    }

    /*
     * Obtain Expo Push Token.
     */
    const tokenResponse =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const token = tokenResponse.data;

    console.log(
      "Expo push token obtained successfully."
    );

    return token;
  } catch (error) {
    console.error(
      "Failed to obtain Expo push token:",
      error
    );

    return null;
  }
}

export async function registerPushTokenWithBackend() {
  try {
    const token = await getOhlamExpoPushToken();

    if (!token) {
      return null;
    }

    const response = await API.post(
      "/push-tokens",
      {
        token,
        platform: Platform.OS,
        device_name:
          Device.deviceName ?? null,
        device_model:
          Device.modelName ?? null,
      }
    );

    console.log(
      "Push notification device registered with OHLAM."
    );

    return {
      token,
      response: response.data,
    };
  } catch (error: any) {
    console.error(
      "Failed to register push token with OHLAM:",
      error?.response?.data ??
        error?.message ??
        error
    );

    return null;
  }
}