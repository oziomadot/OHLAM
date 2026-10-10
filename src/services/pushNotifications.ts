import {
  Platform,
} from "react-native";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import API from "@/src/services/api";
import { setupNotificationChannels } from "@/src/services/notifications";

export async function registerForPushNotifications(
  devicePushToken?: Notifications.DevicePushToken
) {
  if (!Device.isDevice) {
    console.log(
      "Push notifications require a physical device."
    );

    return null;
  }

  await setupNotificationChannels();

  const existingPermission =
    await Notifications
      .getPermissionsAsync();

  let status =
    existingPermission.status;

  if (
    status !==
    "granted"
  ) {
    const requestedPermission =
      await Notifications
        .requestPermissionsAsync();

    status =
      requestedPermission.status;
  }

  if (
    status !==
    "granted"
  ) {
    console.log(
      "Notification permission was not granted."
    );

    return null;
  }

  const projectId =
    Constants
      .expoConfig
      ?.extra
      ?.eas
      ?.projectId ??
    Constants
      .easConfig
      ?.projectId;

  if (!projectId) {
    throw new Error(
      "EAS project ID is missing."
    );
  }

  const token =
    (
      await Notifications
        .getExpoPushTokenAsync({
          projectId,
          // A token-change listener already supplies the native token. Passing
          // it here avoids fetching it again and recursively firing the listener.
          ...(devicePushToken ? { devicePushToken } : {}),
        })
    ).data;

  await API.savePushToken({
    token,
    platform:
      Platform.OS,
  });

  // Keep the chat push-token store in sync as well; chat has its own
  // existing dispatcher and endpoint.
  await API.post("/push-tokens", {
    token,
    platform: Platform.OS,
    device_name: Device.deviceName ?? null,
    device_model: Device.modelName ?? null,
  });

  return token;
}

/** Disable this installation's token before API.logout clears authentication. */
export async function unregisterPushToken(): Promise<void> {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!Device.isDevice || !projectId) return;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (!token) return;

    await Promise.allSettled([
      API.delete("/push-tokens", { data: { token } }),
      API.delete("/notifications/push-token", { data: { token } }),
    ]);
  } catch {
    // Local logout must still complete if token lookup or API cleanup fails.
  }
}

export async function setOhlamBadge(
  unreadCount: number
) {
  const supported =
    await Notifications
      .setBadgeCountAsync(
        Math.max(
          0,
          unreadCount
        )
      );

  if (!supported) {
    console.log(
      "This Android launcher does not support numeric badges."
    );
  }
}
