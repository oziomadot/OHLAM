import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";

const INDEX_KEY = "ohlam:property-upload-queue:v1";
const ROOT = FileSystem.documentDirectory + "property-upload-queue/";
export type QueueFile = { uri: string; name: string; type: string };
export type PendingPropertyUpload = {
  id: string;
  ownerId: string;
  createdAt: string;
  state: "pending" | "needs_review";
  form: Record<string, unknown>;
  files: Record<string, QueueFile>;
};
const readIndex = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (!Array.isArray(data) || !data.every(x => typeof x === "string")) {
    throw new Error("The local upload index is invalid.");
  }
  return data;
};
const pathFor = (id: string) => ROOT + id + "/";
export async function listPendingPropertyUploads(ownerId: string): Promise<PendingPropertyUpload[]> {
  const ids = await readIndex();
  const output: PendingPropertyUpload[] = [];
  for (const id of ids) {
    const file = pathFor(id) + "draft.json";
    const info = await FileSystem.getInfoAsync(file);
    if (!info.exists) continue;
    const item = JSON.parse(await FileSystem.readAsStringAsync(file)) as PendingPropertyUpload;
    if (item.ownerId === ownerId) output.push(item);
  }
  return output.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export async function savePendingPropertyUpload(
 ownerId: string, form: Record<string, unknown>, suppliedFiles: Record<string, any>,
 state: "pending" | "needs_review" = "pending"
): Promise<string> {
  if (!ownerId) throw new Error("Sign in before saving a pending upload.");
  const id = Crypto.randomUUID();
  const destination = pathFor(id);
  await FileSystem.makeDirectoryAsync(destination, { intermediates: true });
  const files: Record<string, QueueFile> = {};
  try {
    for (const [key, value] of Object.entries(suppliedFiles)) {
      if (!value?.uri) continue;
      const info = await FileSystem.getInfoAsync(value.uri);
      if (!info.exists) throw new Error("A selected media file is no longer available.");
      const cleanName = String(value.name || key).replace(/[^a-zA-Z0-9._-]/g, "_");
      const target = destination + key.replace(/[^a-zA-Z0-9_-]/g, "_") + "-" + cleanName;
      await FileSystem.copyAsync({ from: value.uri, to: target });
      files[key] = {uri:target,name:cleanName,type:String(value.type||"application/octet-stream")};
    }
    const item: PendingPropertyUpload = {
      id, ownerId, createdAt:new Date().toISOString(), state, form, files,
    };
    await FileSystem.writeAsStringAsync(destination+"draft.json",JSON.stringify(item));
    const ids = await readIndex();
    await AsyncStorage.setItem(INDEX_KEY,JSON.stringify([...ids,id]));
    return id;
  } catch (error) {
    await FileSystem.deleteAsync(destination,{idempotent:true});
    throw error;
  }
}
export async function deletePendingPropertyUpload(id: string, ownerId: string): Promise<void> {
  const entries=await listPendingPropertyUploads(ownerId);
  if (!entries.some(entry=>entry.id===id)) throw new Error("Upload not found for this account.");
  await AsyncStorage.setItem(INDEX_KEY,JSON.stringify((await readIndex()).filter(x=>x!==id)));
  await FileSystem.deleteAsync(pathFor(id),{idempotent:true});
}
