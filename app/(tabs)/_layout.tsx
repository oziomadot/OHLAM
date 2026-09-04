// import { Tabs, usePathname } from "expo-router";
// import { useEffect } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { MaterialIcons } from "@expo/vector-icons";

// import {
//   registerPushTokenWithBackend,
// } from "@/src/services/notifications";

// const LAST_VISITED_ROUTE_KEY =
//   "@opaam_last_visited_route";

// export default function TabLayout() {
//   const pathname = usePathname();

//   useEffect(() => {
//     AsyncStorage.setItem(
//       LAST_VISITED_ROUTE_KEY,
//       pathname
//     ).catch(console.error);
//   }, [pathname]);

//   useEffect(() => {
//     console.log(
//       "🚀 TAB LAYOUT: Starting push registration"
//     );

//     registerPushTokenWithBackend()
//       .then((result) => {
//         console.log(
//           "🚀 TAB LAYOUT: Push registration result:",
//           result
//         );
//       })
//       .catch((error) => {
//         console.error(
//           "🚀 TAB LAYOUT: Push registration failed:",
//           error
//         );
//       });
//   }, []);

//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: "#3b82f6",
//         tabBarInactiveTintColor: "#6b7280",
//         tabBarStyle: {
//           display: "none",
//         },
//         tabBarShowLabel: false,
//         headerShown: false,
//       }}
//     >
//       <Tabs.Screen
//         name="home/index"
//         options={{
//           title: "Home",
//           tabBarIcon: ({
//             color,
//             size,
//           }) => (
//             <MaterialIcons
//               name="home"
//               size={size}
//               color={color}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="games/index"
//         options={{
//           title: "Games",
//           tabBarIcon: ({
//             color,
//             size,
//           }) => (
//             <MaterialIcons
//               name="games"
//               size={size}
//               color={color}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="appointment"
//         options={{
//           title: "Customer Appointment",
//           tabBarIcon: ({
//             color,
//             size,
//           }) => (
//             <MaterialIcons
//               name="person"
//               size={size}
//               color={color}
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="about"
//         options={{
//           title: "About",
//           tabBarIcon: ({
//             color,
//             size,
//           }) => (
//             <MaterialIcons
//               name="info"
//               size={size}
//               color={color}
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }


import React, {
  useEffect,
} from "react";

import * as Notifications from "expo-notifications";

import API from "@/src/services/api";

import {
  registerForPushNotifications,
  setOhlamBadge,
} from "@/src/services/pushNotifications";
import { Stack } from "expo-router";

export default function RootLayout() {


   useEffect(
    () => {
      /*
       * Register this phone and send its Expo push token
       * to the Laravel backend.
       */
      registerForPushNotifications()
        .then(
          async () => {
            /*
             * Synchronize the launcher badge with Laravel
             * when the authenticated tabs first load.
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
                "Unable to synchronize notification badge:",
                error
              );
            }
          }
        )
        .catch(
          (
            error
          ) => {
            console.log(
              "Push registration failed:",
              error
            );
          }
        );

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

      return () => {
        receivedSubscription
          .remove();
      };
    },
    []
  );

  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}