import {
  removeItem,
} from "@/utils/storage";

export async function lockApp(): Promise<void> {
  /*
   * Remove the active application session but retain:
   * - biometric secure token;
   * - trusted-device secret;
   * - quick-login identifier.
   */
  await Promise.all([
    removeItem("auth_token"),
    removeItem("user"),
  ]);
}