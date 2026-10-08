import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import API from "@/src/services/api";


// Controls notifications received while the app is open.
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function setupNotificationChannels() {
  if (Platform.OS !== "android") {
    return;
  }

  const channelIds = ["ohlam-default", "default", "messages"];
  await Promise.all(channelIds.map((channelId) =>
    Notifications.setNotificationChannelAsync(channelId, {
      name: channelId === "messages" ? "Messages" : "OHLAM Notifications",
      description: channelId === "messages"
        ? "New OHLAM messages"
        : "Appointments, property and account updates",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      sound: "default",
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    })
  ));
}

export async function getOhlamExpoPushToken(): Promise<string | null> {
  try {

    /*
     * 1. Check physical device
     */
    if (!Device.isDevice) {
      return null;
    }

    /*
     * 2. Android notification channel
     */
    await setupNotificationChannels();

    /*
     * 3. Check current notification permission
     */
    const existingPermissions =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingPermissions.status;

    /*
     * 4. Ask permission when needed
     */
    if (finalStatus !== "granted") {
      const requestedPermissions =
        await Notifications.requestPermissionsAsync();

      finalStatus = requestedPermissions.status;

    }

    if (finalStatus !== "granted") {
      return null;
    }

    /*
     * 5. Find EAS project ID
     */
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      return null;
    }

    /*
     * 6. Ask Android/Expo for push token
     */
    const tokenResponse =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const token = tokenResponse.data;

    if (!token) {
      return null;
    }

    return token;
  } catch (error: any) {
    console.error("Push registration failed:", error?.message ?? "unknown error");

    return null;
  }
}

export async function registerPushTokenWithBackend() {
  try {
    const token =
      await getOhlamExpoPushToken();

    if (!token) {
      return null;
    }

    const response = await API.post(
      "/push-tokens",
      {
        token,
        platform: Platform.OS,

        device_name: Device.deviceName ?? null,
        device_model: Device.modelName ?? null,
      }
    );

    return {
      token,
      response: response.data,
    };
  } catch (error: any) {
    console.error("Push token registration with API failed:", error?.message ?? "unknown error");

    return null;
  }
}
