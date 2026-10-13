import type { ImageSourcePropType } from "react-native";
import { ENV } from "@/src/config/env";

export function profilePictureUrl(user: any): string | null {
  const picture = user?.profile_picture_url || user?.profile_picture;
  if (typeof picture !== "string" || !picture.trim()) return null;
  const value = picture.trim();
  if (/^https?:\/\//i.test(value)) return value;
  const base = ENV.API_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");
  const path = value.replace(/^\/?(?:storage\/)?/, "");
  return `${base}/storage/${path}`;
}

export function profilePictureSource(user: any): ImageSourcePropType {
  const uri = profilePictureUrl(user);
  return uri ? { uri } : require("@/assets/default-avatar.png");
}
