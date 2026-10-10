export type AppEnvironment = "development" | "preview" | "production";

const environment =
  (process.env.EXPO_PUBLIC_APP_ENV as AppEnvironment | undefined) ??
  "development";

// const apiUrls: Record<AppEnvironment, string> = {
//   development: "http://192.168.2.4:8000/api",
//   preview: "https://ohlam-staging-api.onrender.com/api",
//   production: "https://api.oramexhouseandland.com/api",
// };

// export const env = {
//   name: environment,
//   apiUrl: apiUrls[environment],
//   isDevelopment: environment === "development",
//   isPreview: environment === "preview",
//   isProduction: environment === "production",
// };


// src/config/env.ts

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is missing. Add it to the appropriate Expo environment file.'
  );
}

export const ENV = {
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  API_URL: apiUrl.replace(/\/+$/, ''),
} as const;