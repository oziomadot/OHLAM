import { useEffect, useId, useRef } from "react";
import { Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

// Preview/development APKs need screen recording for QA and support demos.
// Expo replaces EXPO_PUBLIC_APP_ENV with a build-time value from eas.json.
// Unknown/missing values must remain protected (fail closed for production).
const ALLOW_TEST_CAPTURE =
  process.env.EXPO_PUBLIC_APP_ENV === "preview" ||
  process.env.EXPO_PUBLIC_APP_ENV === "development";

export default function usePreventScreenCapture(enabled = true) {
  const instanceId = useId();
  const activation = useRef(0);

  useEffect(() => {
    if (!enabled || Platform.OS === "web" || ALLOW_TEST_CAPTURE) return;

    const key = `ohlam-screen-${instanceId}-${++activation.current}`;
    let disposed = false;
    let attempted = false;

    const protection = (async () => {
      try {
        const available = await ScreenCapture.isAvailableAsync();

        if (!available || disposed) return;

        attempted = true;
        await ScreenCapture.preventScreenCaptureAsync(key);
      } catch (error) {
        console.warn("Unable to prevent screen capture:", error);
      }
    })();

    return () => {
      disposed = true;

      // Release this instance after activation has finished.
      void protection.then(async () => {
        if (!attempted) return;

        try {
          await ScreenCapture.allowScreenCaptureAsync(key);
        } catch (error) {
          console.warn(
            "Unable to release screen capture protection:",
            error
          );
        }
      });
    };
  }, [enabled, instanceId]);
}