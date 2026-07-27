import API from "@/src/services/api";
import {
  removeQuickLoginDeviceCredentials,
} from "@/src/services/deviceCredentialService";
import {
  disableBiometricLogin,
} from "@/src/services/quickLoginService";
import {
  removeItem,
} from "@/utils/storage";

export async function performFullLogout(): Promise<void> {
  try {
    /*
     * Prefer your existing API.logout method if it already
     * revokes both the token and trusted device.
     */
    await API.logout();
  } catch (error) {
    /*
     * Local logout must still finish if the network is offline.
     */
    console.warn(
      "Server logout failed:",
      error
    );
  } finally {
    await Promise.all([
      removeItem("auth_token"),
      removeItem("pre_auth_token"),
      removeItem("user"),
      disableBiometricLogin(),
      removeQuickLoginDeviceCredentials(),
    ]);
  }
}