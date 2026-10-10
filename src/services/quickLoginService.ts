import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY =
  "ohlam_biometric_enabled";

const BIOMETRIC_TOKEN_KEY =
  "ohlam_biometric_auth_token";

const BIOMETRIC_USER_KEY =
  "ohlam_biometric_user";

export type StoredBiometricUser = {
  id: string | number;
  email?: string;
  phonenumber?: string;
  firstname?: string;
  surname?: string;
};

export type BiometricAvailability = {
  available: boolean;
  enrolled: boolean;
  supportedTypes:
    LocalAuthentication.AuthenticationType[];
};

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const [available, enrolled, supportedTypes] =
    await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

  return {
    available,
    enrolled,
    supportedTypes,
  };
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  const enabled = await SecureStore.getItemAsync(
    BIOMETRIC_ENABLED_KEY
  );

  if (enabled !== "true") {
    return false;
  }

  const token = await SecureStore.getItemAsync(
    BIOMETRIC_TOKEN_KEY
  );

  return Boolean(token);
}

export async function enableBiometricLogin(params: {
  token: string;
  user: StoredBiometricUser;
}): Promise<void> {
  if (!params.token) {
    throw new Error(
      "A valid login session is required."
    );
  }

  const availability =
    await getBiometricAvailability();

  if (!availability.available) {
    throw new Error(
      "This device does not support biometric authentication."
    );
  }

  if (!availability.enrolled) {
    throw new Error(
      "Set up fingerprint or face recognition in your phone settings first."
    );
  }

  const result =
    await LocalAuthentication.authenticateAsync({
      promptMessage: "Enable biometric login",
      cancelLabel: "Cancel",
      fallbackLabel: "Use phone passcode",
      disableDeviceFallback: false,
      biometricsSecurityLevel: "strong",
    });

  if (!result.success) {
    throw new Error(
      "Biometric verification was not completed."
    );
  }

  await SecureStore.setItemAsync(
    BIOMETRIC_TOKEN_KEY,
    params.token,
    {
      keychainAccessible:
        SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
  );

  await SecureStore.setItemAsync(
    BIOMETRIC_USER_KEY,
    JSON.stringify(params.user),
    {
      keychainAccessible:
        SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
  );

  await SecureStore.setItemAsync(
    BIOMETRIC_ENABLED_KEY,
    "true",
    {
      keychainAccessible:
        SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
  );
}

export async function authenticateWithBiometrics(): Promise<{
  token: string;
  user: StoredBiometricUser | null;
}> {
  const enabled =
    await isBiometricLoginEnabled();

  if (!enabled) {
    throw new Error(
      "Biometric login is not enabled."
    );
  }

  const availability =
    await getBiometricAvailability();

  if (
    !availability.available ||
    !availability.enrolled
  ) {
    throw new Error(
      "Biometric authentication is unavailable."
    );
  }

  const result =
    await LocalAuthentication.authenticateAsync({
      promptMessage: "Login to OHLAM",
      cancelLabel: "Use another method",
      fallbackLabel: "Use phone passcode",
      disableDeviceFallback: false,
      biometricsSecurityLevel: "strong",
    });

  if (!result.success) {
    if (
      "error" in result &&
      result.error === "user_cancel"
    ) {
      throw new Error(
        "Biometric authentication was cancelled."
      );
    }

    throw new Error(
      "Biometric authentication failed."
    );
  }

  const [token, storedUser] = await Promise.all([
    SecureStore.getItemAsync(
      BIOMETRIC_TOKEN_KEY
    ),
    SecureStore.getItemAsync(
      BIOMETRIC_USER_KEY
    ),
  ]);

  if (!token) {
    throw new Error(
      "Your biometric session has expired. Login with your password."
    );
  }

  let user: StoredBiometricUser | null = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      user = null;
    }
  }

  return {
    token,
    user,
  };
}

export async function updateBiometricToken(
  token: string
): Promise<void> {
  const enabled =
    await isBiometricLoginEnabled();

  if (!enabled) {
    return;
  }

  await SecureStore.setItemAsync(
    BIOMETRIC_TOKEN_KEY,
    token,
    {
      keychainAccessible:
        SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }
  );
}

export async function disableBiometricLogin(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(
      BIOMETRIC_ENABLED_KEY
    ),
    SecureStore.deleteItemAsync(
      BIOMETRIC_TOKEN_KEY
    ),
    SecureStore.deleteItemAsync(
      BIOMETRIC_USER_KEY
    ),
  ]);
}