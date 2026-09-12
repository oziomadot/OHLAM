import { Stack } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import {
  AppState,
  ActivityIndicator,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";

import { OramexBanner } from "../components/OramexBanner";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { captureInstallReferral } from "@/src/services/referralService";
import { setupNotificationChannels } from "@/src/services/notifications";
import API from "@/src/services/api";

/*
 * Controls notifications received while OHLAM is open.
 * This must be outside RootLayout so it is registered immediately.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/*
 * Fetch the authoritative unread count from Laravel
 * and apply it to the OHLAM launcher icon.
 */
async function syncAppIconBadge(): Promise<void> {
  try {
    const response = await API.getNotifications();

    const unreadCount = Math.max(
      0,
      Number(response?.unread_count || 0)
    );

    const supported =
      await Notifications.setBadgeCountAsync(
        unreadCount
      );

    console.log("OHLAM notification badge synchronized:", {
      unreadCount,
      supported,
    });
  } catch (error: any) {
    /*
     * A 401 can happen before the user logs in.
     * It should not prevent the application from starting.
     */
    if (error?.response?.status !== 401) {
      console.error(
        "Unable to synchronize notification badge:",
        error?.response?.data?.message ||
          error?.message ||
          error
      );
    }
  }
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  /*
   * Allow the root layout to mount before navigation begins.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  /*
   * Capture the Google Play installation referral.
   */
  useEffect(() => {
    const initialiseReferral = async () => {
      try {
        const referralCode =
          await captureInstallReferral();

        if (referralCode) {
          console.log(
            "Referral captured:",
            referralCode
          );
        }
      } catch (error) {
        console.error(
          "Referral initialization failed:",
          error
        );
      }
    };

    void initialiseReferral();
  }, []);

  /*
   * Configure Android notification channels.
   */
  useEffect(() => {
    setupNotificationChannels().catch((error) => {
      console.error(
        "Failed to set up notification channels:",
        error
      );
    });
  }, []);

  /*
   * Keep the launcher badge synchronized globally.
   */
  useEffect(() => {
    /*
     * Synchronize when OHLAM starts.
     */
    void syncAppIconBadge();

    /*
     * Synchronize when a notification arrives while
     * the application is running.
     */
    const receivedSubscription =
      Notifications.addNotificationReceivedListener(
        () => {
          void syncAppIconBadge();
        }
      );

    /*
     * Synchronize after the user taps a notification.
     */
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        () => {
          void syncAppIconBadge();
        }
      );

    /*
     * Synchronize whenever OHLAM returns to the foreground.
     */
    const appStateSubscription =
      AppState.addEventListener(
        "change",
        (nextAppState) => {
          if (nextAppState === "active") {
            void syncAppIconBadge();
          }
        }
      );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <OramexBanner />

          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                padding: 20,
              },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="auth"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}