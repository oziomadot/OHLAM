import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const REFERRAL_STORAGE_KEY = "pending_referral_code";
const REFERRAL_CHECKED_KEY = "install_referrer_checked";

export async function saveReferralCode(
  referralCode: string | null | undefined
) {
  if (!referralCode) return;

  const cleanCode = referralCode.trim();

  if (!cleanCode) return;

  await SecureStore.setItemAsync(
    REFERRAL_STORAGE_KEY,
    cleanCode
  );
}

export async function getReferralCode(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(
      REFERRAL_STORAGE_KEY
    );
  } catch (error) {
    console.error("Failed reading referral code:", error);
    return null;
  }
}

export async function clearReferralCode() {
  try {
    await SecureStore.deleteItemAsync(
      REFERRAL_STORAGE_KEY
    );
  } catch (error) {
    console.error("Failed clearing referral code:", error);
  }
}

export async function captureInstallReferral() {
  if (Platform.OS !== "android") {
    return null;
  }

  try {
    /*
     * Don't keep asking Google Play on every launch.
     */
    const alreadyChecked =
      await SecureStore.getItemAsync(
        REFERRAL_CHECKED_KEY
      );

    if (alreadyChecked === "true") {
      return await getReferralCode();
    }

    const {
      PlayInstallReferrer,
    } = require(
      "react-native-play-install-referrer"
    );

    return await new Promise<string | null>(
      (resolve) => {
        PlayInstallReferrer.getInstallReferrerInfo(
          async (
            installReferrerInfo: any,
            error: any
          ) => {
            try {
              await SecureStore.setItemAsync(
                REFERRAL_CHECKED_KEY,
                "true"
              );

              if (error) {
                console.warn(
                  "Install referrer unavailable:",
                  error
                );

                resolve(null);
                return;
              }

              const rawReferrer =
                installReferrerInfo?.installReferrer;

              if (!rawReferrer) {
                resolve(null);
                return;
              }

              /*
               * Example:
               * referral_code=OHLAM-ABC123
               */
              const params = new URLSearchParams(
                rawReferrer
              );

              const referralCode =
                params.get("referral_code");

              if (!referralCode) {
                resolve(null);
                return;
              }

              await saveReferralCode(
                referralCode
              );

              resolve(referralCode);
            } catch (processingError) {
              console.error(
                "Install referral processing failed:",
                processingError
              );

              resolve(null);
            }
          }
        );
      }
    );
  } catch (error) {
    console.error(
      "Could not initialize install referral:",
      error
    );

    return null;
  }
}