import { Stack } from "expo-router";
import React, { useEffect,} from "react";
import * as Notifications from "expo-notifications";
import API from "@/src/services/api";
import {registerForPushNotifications, setOhlamBadge,} from "@/src/services/pushNotifications";
import { getItemSafe } from "@/utils/storage";

export default function HomeLayout() {


   useEffect(
    () => {


const hasFullSession = async (): Promise<boolean> => {
  const [authToken, preAuthToken, storedStep] =
    await Promise.all([
      getItemSafe("auth_token"),
      getItemSafe("pre_auth_token"),
      getItemSafe("registration_step"),
    ]);

  const step = storedStep?.trim().toLowerCase();

  return Boolean(
    authToken?.trim() &&
      !preAuthToken?.trim() &&
      (!step || step === "completed")
  );
};



      /*
       * Register this phone and send its Expo push token
       * to the Laravel backend.
       */
      let active = true;

const initializeNotifications = async () => {
  try {
    if (!(await hasFullSession()) || !active) {
      return;
    }

    await registerForPushNotifications();

    if (!active || !(await hasFullSession())) {
      return;
    }

    const response =
      await API.getUnreadNotificationCount();

    if (active) {
      await setOhlamBadge(
        Number(response?.unread_count ?? 0)
      );
    }
  } catch (error) {
    console.log("Notification setup failed:", error);
  }
};

void initializeNotifications();

      /*
       * Called when a push notification arrives while
       * OHLAM is open.
       */
      const receivedSubscription =
        Notifications
          .addNotificationReceivedListener(
            async (
              notification
            ) => {
              const incomingBadge =
                Number(
                  notification
                    .request
                    .content
                    .badge ||
                    0
                );


                if (!active || !(await hasFullSession())) {return;}

              if (
                incomingBadge > 0
              ) {
                await setOhlamBadge(
                  incomingBadge
                );

                return;
              }

              /*
               * If the push did not include a badge,
               * ask Laravel for the current unread count.
               */
              try {
                const response =
                  await API
                    .getUnreadNotificationCount();

                await setOhlamBadge(
                  Number(
                    response
                      ?.unread_count ||
                      0
                  )
                );
              } catch (
                error
              ) {
                console.log(
                  "Unable to refresh notification badge:",
                  error
                );
              }
            }
          );

      const tokenSubscription = Notifications.addPushTokenListener((devicePushToken) => {
        if (active) {
          void registerForPushNotifications(devicePushToken).catch(() => null);
        }
      });

      return () => {
        active = false;
        receivedSubscription.remove();
        tokenSubscription.remove();
      };
    },
    []
  );


  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />

   
  );
}
