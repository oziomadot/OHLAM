import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export async function setItemSafe(key: string, value: any) {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  if (Platform.OS === "web") {
    localStorage.setItem(key, stringValue);
  } else {
    await SecureStore.setItemAsync(key, stringValue);
  }
}

export async function getItemSafe(key: string) {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

export async function removeItemSafe(key: string) {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// Standard aliases
export const setItem = setItemSafe;
export const getItem = getItemSafe;
export const deleteItem = removeItemSafe;
export const removeItem = removeItemSafe;
