import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { BASE_URL } from "@/src/services/api";
import { getItemSafe } from "@/utils/storage";

/**
 * Download only from our authenticated API and open the OS share sheet.
 * The recipient explicitly decides whether to export a confidential contract.
 */
export async function shareRecruitmentContractPdf(contractId: number): Promise<void> {
  if (!Number.isSafeInteger(contractId) || contractId <= 0) throw new Error("Invalid contract ID.");
  const token = await getItemSafe("auth_token");
  if (!token?.trim()) throw new Error("Please sign in again to access your contract.");
  if (!(await Sharing.isAvailableAsync())) throw new Error("Document sharing is unavailable on this device.");
  const temporaryDirectory = FileSystem.cacheDirectory;
  if (!temporaryDirectory) throw new Error("Temporary document storage is unavailable.");
  const target = temporaryDirectory + "ohlam-contract-" + contractId + "-" + Date.now() + ".pdf";
  try {
    const result = await FileSystem.downloadAsync(
      BASE_URL.replace(/\/$/, "") + "/recruitment/contracts/" + contractId + "/pdf",
      target,
      { headers: { Authorization: "Bearer " + token, Accept: "application/pdf" } }
    );
    if (result.status !== 200) throw new Error("Document download was rejected (HTTP " + result.status + ").");
    const info = await FileSystem.getInfoAsync(target);
    if (!info.exists || !("size" in info) || !info.size) throw new Error("The contract PDF is empty.");
    await Sharing.shareAsync(target, { mimeType: "application/pdf", dialogTitle: "OHLAM confidential contract", UTI: "com.adobe.pdf" });
  } finally {
    await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => {});
  }
}
