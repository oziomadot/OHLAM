import { Stack } from "expo-router";
import React, {
  useEffect,
} from "react";

import * as Notifications from "expo-notifications";

import {
  registerForPushNotifications,
  setOhlamBadge,
} from "@/src/services/pushNotifications";

import API from "@/src/services/api";

export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}