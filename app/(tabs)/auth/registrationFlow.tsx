import { useEffect } from "react";
import { router } from "expo-router";
import { getItemSafe } from "@/utils/storage";

export default function RegistrationFlow() {
  useEffect(() => {
    let mounted = true;

    const checkProgress = async () => {
      try {
        const [
          authToken,
          preAuthToken,
          storedStep,
          userId,
        ] = await Promise.all([
          getItemSafe("authToken"),
          getItemSafe("pre_auth_token"),
          getItemSafe("registration_step"),
          getItemSafe("user_id"),
        ]);

        if (!mounted) {
          return;
        }

        /*
         * Normalize old values so existing testers
         * are not broken by previous naming.
         */
        const step = storedStep
          ?.trim()
          .toLowerCase()
          .replace(/-/g, "_");

        console.log("[REGISTRATION FLOW]", {
          hasAuthToken: Boolean(authToken),
          hasPreAuthToken: Boolean(preAuthToken),
          hasUserId: Boolean(userId),
          registrationStep: step,
        });

        /*
         * IMPORTANT:
         *
         * An unfinished registration takes priority
         * over authToken recovery.
         *
         * This protects users returning from Gmail,
         * SMS, camera, etc.
         */
        if (step && step !== "completed") {
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

            case "identity_number":
              router.replace(
                "/(tabs)/auth/identityNumber"
              );
              return;

            case "id_card_upload":
              router.replace(
                "/(tabs)/auth/idCardUpload"
              );
              return;

            case "face_record":
              router.replace(
                "/(tabs)/auth/faceRecord"
              );
              return;

            default:
              console.warn(
                "[REGISTRATION FLOW] Unknown registration step:",
                step
              );

              /*
               * If a pre-auth registration session
               * exists, do NOT dump the user on Home.
               */
              if (preAuthToken && userId) {
                router.replace(
                  "/(tabs)/auth/email-verification"
                );
                return;
              }
          }
        }

        /*
         * Only a completed registration should
         * use the normal authenticated application.
         */
        if (
          step === "completed" &&
          authToken
        ) {
          router.replace("/(tabs)/home");
          return;
        }

        /*
         * Backwards compatibility for users created
         * before registration_step was introduced.
         *
         * If they have a real auth token and no
         * pre-auth registration session, allow Home.
         */
        if (
          authToken &&
          !preAuthToken &&
          !step
        ) {
          router.replace("/(tabs)/home");
          return;
        }

        /*
         * Recover an unfinished registration session.
         */
        if (
          preAuthToken &&
          userId
        ) {
          router.replace(
            "/(tabs)/auth/email-verification"
          );
          return;
        }

        /*
         * No valid session at all.
         */
        router.replace(
          "/(tabs)/auth/RegisterScreen"
        );
      } catch (error) {
        console.error(
          "[REGISTRATION FLOW] Failed to restore registration:",
          error
        );

        router.replace(
          "/(tabs)/auth/RegisterScreen"
        );
      }
    };

    void checkProgress();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}