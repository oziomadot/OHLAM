import { useEffect } from "react";
import { router } from "expo-router";
import { getItemSafe } from "@/utils/storage";

export default function RegistrationFlow() {
  useEffect(() => {
    let mounted = true;

    const checkProgress = async (): Promise<void> => {
      try {
        const [
          storedAuthToken,
          storedPreAuthToken,
          storedStep,
          storedUserId,
        ] = await Promise.all([
          getItemSafe("auth_token"),
          getItemSafe("pre_auth_token"),
          getItemSafe("registration_step"),
          getItemSafe("user_id"),
        ]);

        if (!mounted) {
          return;
        }

        const authToken = storedAuthToken?.trim();
        const preAuthToken = storedPreAuthToken?.trim();
        const userId = storedUserId?.trim();

        const step = storedStep
          ?.trim()
          .toLowerCase()
          .replace(/-/g, "_");

        /*
         * Resume an unfinished verification journey.
         * A saved step requires a temporary session.
         */
        if (step && step !== "completed") {
          if (!preAuthToken || !userId) {
            router.replace("/(tabs)/auth/LoginScreen");
            return;
          }

          switch (step) {
            case "email_verification":
              router.replace(
                "/(tabs)/auth/email-verification"
              );
              return;

            case "phone_verification":
              router.replace(
                "/(tabs)/auth/phoneNumberVerification"
              );
              return;           

            case "face_verification":
            case "face_record":
              router.replace(
                "/(tabs)/auth/faceRecord"
              );
              return;

            case "gov_id":
            case "id_card_upload":
              router.replace(
                "/(tabs)/auth/idCardUpload"
              );
              return;

            /*
             * Unknown steps, including new-device
             * verification, must be resolved by login.
             * Do not restart email verification.
             */
            default:
              console.warn(
                "[REGISTRATION FLOW] Unhandled step:",
                step
              );

              router.replace(
                "/(tabs)/auth/LoginScreen"
              );
              return;
          }
        }

        /*
         * Completed registration or an older account
         * without a saved registration step.
         */
        if (
          authToken &&
          !preAuthToken &&
          (step === "completed" || !step)
        ) {
          router.replace("/(tabs)/home");
          return;
        }

        /*
         * A partial or inconsistent session needs
         * login to recover progress from the backend.
         */
        if (
          authToken ||
          preAuthToken ||
          userId ||
          step
        ) {
          router.replace(
            "/(tabs)/auth/LoginScreen"
          );
          return;
        }

        // No locally saved account session.
        router.replace(
          "/(tabs)/auth/RegisterScreen"
        );
      } catch (error) {
        console.error(
          "[REGISTRATION FLOW] Could not restore session:",
          error
        );

        if (mounted) {
          router.replace(
            "/(tabs)/auth/LoginScreen"
          );
        }
      }
    };

    void checkProgress();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}