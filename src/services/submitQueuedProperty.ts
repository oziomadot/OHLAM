import API from "@/src/services/api";
import * as FileSystem from "expo-file-system/legacy";
import {
  PendingPropertyUpload,
  pendingPropertyToFormData,
} from "@/src/services/propertyUploadQueue";

type PrepareResponse = {
  data: { upload_url: string; headers: Record<string,string>; object_id: string };
};

export async function submitQueuedProperty(item: PendingPropertyUpload): Promise<any> {
  // The property may have been created even if the previous success response was lost.
  // Check first to avoid uploading duplicate media to staging.
  try {
    const existing = await API.get(`/property-uploads/submissions/${item.id}`);
    if (existing.data?.success && existing.data?.property_id) return existing.data;
  } catch (error:any) {
    if (error?.response?.status !== 404) {
      throw error;
    }
  }
  const files = Object.entries(item.files);
  if (!files.length) throw new Error("This draft has no saved media.");

  const stagedIds: number[] = [];
  let useStaging = true;

  for (const [field,file] of files) {
    const info = await FileSystem.getInfoAsync(file.uri);
    if (!info.exists || !("size" in info) || !info.size) {
      throw new Error(`Saved file for ${field} is unavailable.`);
    }
    let prepared: PrepareResponse;
    try {
      const response = await API.post("/property-uploads/staging/prepare", {
        client_submission_id: item.id,
        field,
        mime_type: file.type,
        size_bytes: info.size,
      });
      prepared = response.data;
    } catch (error:any) {
      if (error?.response?.status === 503 && stagedIds.length===0) {
        useStaging = false;
        break;
      }
      throw error;
    }
    const result = await FileSystem.uploadAsync(prepared.data.upload_url, file.uri, {
      httpMethod: "PUT",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: prepared.data.headers,
    });
    if (result.status !== 200 && result.status !== 201 && result.status !== 204) {
      throw new Error(`Cloud storage rejected ${field} (HTTP ${result.status}).`);
    }
    const confirmation = await API.post("/property-uploads/staging/confirm", {
      client_submission_id: item.id,
      object_id: prepared.data.object_id,
    });
    const mediaId = Number(confirmation.data?.data?.staged_media_id);
    if (!Number.isInteger(mediaId) || mediaId <= 0) {
      throw new Error("Server could not confirm staged media.");
    }
    stagedIds.push(mediaId);
  }

  if (!useStaging) return API.createProperty(pendingPropertyToFormData(item));

  const form = pendingPropertyToFormData({ ...item, files: {} });
  stagedIds.forEach((id,index) => form.append(`staged_media_ids[${index}]`,String(id)));
  return API.createProperty(form);
}
