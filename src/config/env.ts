export type AppEnvironment = "development" | "preview" | "production";

const environment =
  (process.env.EXPO_PUBLIC_APP_ENV as AppEnvironment | undefined) ??
  "development";

const apiUrls: Record<AppEnvironment, string> = {
  development: "http://192.168.2.4:8000/api",
  preview: "https://ohlam-staging-api.onrender.com/api",
  production: "https://api.oramexhouseandland.com/api",
};

export const env = {
  name: environment,
  apiUrl: apiUrls[environment],
  isDevelopment: environment === "development",
  isPreview: environment === "preview",
  isProduction: environment === "production",
};