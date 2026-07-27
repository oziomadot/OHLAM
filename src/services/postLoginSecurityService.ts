import API from "@/src/services/api";
import {
  getDeviceInformation,
  saveDeviceSecret,
  saveQuickLoginIdentifier,
} from "@/src/services/deviceCredentialService";

export async function registerCurrentTrustedDevice(
  loginIdentifier: string
): Promise<void> {
  const device = await getDeviceInformation();

  const response =
    await API.registerTrustedLoginDevice(device);

  if (!response?.data?.device_secret) {
    throw new Error(
      "The API did not return a trusted-device secret."
    );
  }

  await Promise.all([
    saveDeviceSecret(
      response.data.device_secret
    ),
    saveQuickLoginIdentifier(loginIdentifier),
  ]);
}