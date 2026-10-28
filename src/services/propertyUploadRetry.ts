import API from "@/src/services/api";
import { submitQueuedProperty } from "@/src/services/submitQueuedProperty";
import {
  deletePendingPropertyUpload,
  listPendingPropertyUploads,
  updatePendingPropertyUpload,
} from "@/src/services/propertyUploadQueue";

let running = false;
const MAX_ATTEMPTS = 5;

export async function retryPendingPropertiesWhileActive(ownerId: string): Promise<void> {
  if (!ownerId || running) return;
  running = true;
  try {
    const entries = await listPendingPropertyUploads(ownerId);
    const ready = entries.filter(entry =>
      entry.state !== "blocked" &&
      (entry.attempts ?? 0) < MAX_ATTEMPTS &&
      (!entry.nextAttemptAt || Date.parse(entry.nextAttemptAt) <= Date.now())
    );
    if (!ready.length) return;

    // Authenticated reachability check, not just cellular/Wi-Fi connection state.
    try { await API.get("/my-properties"); }
    catch { return; }

    for (const entry of ready) {
      try {
        const result = await submitQueuedProperty(entry);
        if (result?.success === false || !result?.property_id) {
          throw new Error("Server response did not confirm a property ID.");
        }
        await deletePendingPropertyUpload(entry.id, ownerId);
      } catch (error: any) {
        const status = Number(error?.response?.status || 0);
        const terminal = [400, 401, 403, 404, 409, 413, 422].includes(status);
        const attempts = (entry.attempts ?? 0) + 1;
        const delayMs = Math.min(30 * 60 * 1000, 30_000 * Math.pow(2, attempts - 1));
        await updatePendingPropertyUpload(entry.id, ownerId, {
          state: terminal || attempts >= MAX_ATTEMPTS ? "blocked" : "pending",
          attempts,
          nextAttemptAt: new Date(Date.now() + delayMs).toISOString(),
          lastError: terminal
            ? String(error?.response?.data?.message || "Requires manual review")
            : "Connection or service unavailable",
        });
        // If the network disappeared, avoid hammering subsequent queued files.
        if (!status || status >= 500) break;
      }
    }
  } finally {
    running = false;
  }
}
