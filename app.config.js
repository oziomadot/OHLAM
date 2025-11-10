// app.config.js
module.exports = {
  name: "OHLAM",
  slug: "OHLAM",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    runtimeVersion: { policy: "appVersion" }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.oramexglobals.OHLAM",
    versionCode: 1,
    permissions: ["android.permission.RECORD_AUDIO"],
    runtimeVersion: "1.0.0"
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro"
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/373c6f7b-8b66-40dc-b4ea-0e5c57846ab9"
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-image-picker",
      {
        photosPermission: "The app accesses your photos to let you share them with your friends."
      }
    ],
    "expo-audio",
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          minSdkVersion: 24,
          gradleVersion: "8.10.2"
        }
      }
    ]
  ],
  extra: {
    EXPO_PUBLIC_API_URL: "https://3d509572576c.ngrok-free.app/api",
    eas: {
      projectId: "373c6f7b-8b66-40dc-b4ea-0e5c57846ab9"
    }
  }
};