import { Platform } from "react-native";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";

export type DeviceDetails = {
  installation_id: string;
  platform_device_id?: string;
  device_name?: string;
  brand?: string;
  model_name?: string;
  os_name?: string;
  os_version?: string;
  platform: "android" | "ios";
};

const INSTALLATION_ID_KEY =
  "ohlam_installation_id";

export async function getInstallationId():
  Promise<string> {
  let installationId =
    await SecureStore.getItemAsync(
      INSTALLATION_ID_KEY
    );

  if (!installationId) {
    installationId = Crypto.randomUUID();

    await SecureStore.setItemAsync(
      INSTALLATION_ID_KEY,
      installationId
    );
  }

  return installationId;
}

export async function getDeviceDetails():
  Promise<DeviceDetails> {
  const installationId =
    await getInstallationId();

  let platformDeviceId:
    | string
    | undefined;

  try {
    if (Platform.OS === "ios") {
      platformDeviceId =
        (await Application
          .getIosIdForVendorAsync()) ??
        undefined;
    } else {
      platformDeviceId =
        Application.getAndroidId();
    }
  } catch (error) {
    console.warn(
      "Could not read platform device ID",
      error
    );
  }

  return {
    installation_id: installationId,
    platform_device_id:
      platformDeviceId,
    device_name:
      Device.deviceName ?? undefined,
    brand: Device.brand ?? undefined,
    model_name:
      Device.modelName ?? undefined,
    os_name: Device.osName ?? undefined,
    os_version:
      Device.osVersion ?? undefined,
    platform:
      Platform.OS === "ios"
        ? "ios"
        : "android",
  };
}

export function appendDeviceDetails(
  formData: FormData,
  details: DeviceDetails
): void {
  Object.entries(details).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        formData.append(
          key,
          String(value)
        );
      }
    }
  );
}