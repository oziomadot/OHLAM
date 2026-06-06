import { useEffect } from "react";
import { router } from "expo-router";
import { getItemSafe } from "@/utils/storage";

export default function RegistrationFlow() {
  useEffect(() => {
    const checkProgress = async () => {
      const token = await getItemSafe("authToken");
      const step = await getItemSafe("registration_step");

      if (token) {
        router.replace("/(tabs)/home");
        return;
      }

      // Check registration progress and redirect to appropriate step
      switch (step) {
        case "phone-verification":
          router.replace("/(tabs)/auth/phoneNumberVerification");
          break;
        case "identity-number":
          router.replace("/(tabs)/auth/identityNumber");
          break;
        case "id-card-upload":
          router.replace("/(tabs)/auth/idCardUpload");
          break;
        case "face-record":
          router.replace("/(tabs)/auth/faceRecord");
          break;
        case "completed":
          router.replace("/(tabs)/home");
          break;
        case "email-verification":
        default:
          router.replace("/(tabs)/auth/email-verification");
          break;
      }
    };

    checkProgress();
  }, []);

  return null;
}
