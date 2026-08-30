import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import API from "@/src/services/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function setupNotificationChannels() {
  if (Platform.OS !== "android") {
    return;
  }

  console.log("🔔 PUSH: Creating Android notification channel...");

  await Notifications.setNotificationChannelAsync("default", {
    name: "OHLAM Notifications",
    description: "General notifications from OHLAM",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  });

  console.log("✅ PUSH: Android notification channel ready.");
}

export async function getOhlamExpoPushToken(): Promise<string | null> {
  try {
    console.log("====================================");
    console.log("🔔 PUSH: Starting push registration");
    console.log("====================================");

    /*
     * 1. Check physical device
     */
    console.log("📱 PUSH: Physical device:", Device.isDevice);
    console.log("📱 PUSH: Device name:", Device.deviceName);
    console.log("📱 PUSH: Model:", Device.modelName);
    console.log("📱 PUSH: Platform:", Platform.OS);

    if (!Device.isDevice) {
      console.warn(
        "❌ PUSH: This is not a physical device. Push registration stopped."
      );

      return null;
    }

    /*
     * 2. Android notification channel
     */
    await setupNotificationChannels();

    /*
     * 3. Check current notification permission
     */
    console.log("🔐 PUSH: Checking notification permission...");

    const existingPermissions =
      await Notifications.getPermissionsAsync();

    console.log(
      "🔐 PUSH: Existing permission:",
      existingPermissions.status
    );

    let finalStatus = existingPermissions.status;

    /*
     * 4. Ask permission when needed
     */
    if (finalStatus !== "granted") {
      console.log("🔐 PUSH: Requesting permission...");

      const requestedPermissions =
        await Notifications.requestPermissionsAsync();

      finalStatus = requestedPermissions.status;

      console.log(
        "🔐 PUSH: Permission after request:",
        finalStatus
      );
    }

    if (finalStatus !== "granted") {
      console.warn(
        "❌ PUSH: Notification permission was denied."
      );

      return null;
    }

    /*
     * 5. Find EAS project ID
     */
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    console.log(
      "🆔 PUSH: EAS project ID:",
      projectId ?? "NOT FOUND"
    );

    if (!projectId) {
      console.error(
        "❌ PUSH: EAS projectId could not be found."
      );

      return null;
    }

    /*
     * 6. Ask Android/Expo for push token
     */
    console.log(
      "🌐 PUSH: Requesting Expo push token..."
    );

    const tokenResponse =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const token = tokenResponse.data;

    if (!token) {
      console.error(
        "❌ PUSH: Expo returned an empty token."
      );

      return null;
    }

    /*
     * Display while testing only.
     *
     * Remove this console log later.
     */
    console.log(
      "✅ PUSH: Expo push token:",
      token
    );

    return token;
  } catch (error: any) {
    console.error(
      "❌ PUSH: Failed obtaining Expo push token"
    );

    console.error(
      "❌ PUSH ERROR:",
      error?.message ?? error
    );

    console.error(
      "❌ PUSH FULL ERROR:",
      error
    );

    return null;
  }
}

export async function registerPushTokenWithBackend() {
  try {
    console.log(
      "🚀 PUSH: Registering device with OHLAM backend..."
    );

    const token =
      await getOhlamExpoPushToken();

    if (!token) {
      console.warn(
        "⚠️ PUSH: No Expo token obtained. Backend registration skipped."
      );

      return null;
    }

    console.log(
      "🌐 PUSH: Sending push token to Laravel..."
    );

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
      "✅ PUSH: Device registered with Laravel."
    );

    console.log(
      "✅ PUSH: Laravel response:",
      response.data
    );

    return {
      token,
      response: response.data,
    };
  } catch (error: any) {
    console.error(
      "❌ PUSH: Laravel registration failed."
    );

    console.error(
      "❌ Status:",
      error?.response?.status
    );

    console.error(
      "❌ Laravel response:",
      error?.response?.data
    );

    console.error(
      "❌ Error:",
      error?.message
    );

    return null;
  }
}