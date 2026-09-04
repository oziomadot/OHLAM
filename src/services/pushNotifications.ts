import {
  Platform,
} from "react-native";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import API from "@/src/services/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner:
      true,

    shouldShowList:
      true,

    shouldPlaySound:
      true,

    shouldSetBadge:
      true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log(
      "Push notifications require a physical device."
    );

    return null;
  }

  if (
    Platform.OS ===
    "android"
  ) {
    await Notifications
      .setNotificationChannelAsync(
        "ohlam-default",
        {
          name:
            "OHLAM Notifications",

          description:
            "Appointments, property and account updates",

          importance:
            Notifications
              .AndroidImportance
              .MAX,

          sound:
            "default",

          enableVibrate:
            true,

          vibrationPattern: [
            0,
            300,
            200,
            300,
          ],

          showBadge:
            true,

          lockscreenVisibility:
            Notifications
              .AndroidNotificationVisibility
              .PUBLIC,
        }
      );
  }

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
        })
    ).data;

  await API.savePushToken({
    token,
    platform:
      Platform.OS,
  });

  return token;
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