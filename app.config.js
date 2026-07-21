export default {
  expo: {
    name: "OHLAM",
    slug: "OHLAM",
    scheme: "ohlam",
    version: "1.0.0",


     "runtimeVersion": {
      "policy": "appVersion"
    },

    "updates": {
      "fallbackToCacheTimeout": 0
    },

    android: {
      package: "com.oramexglobal.ohlam",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "READ_MEDIA_IMAGES",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "POST_NOTIFICATIONS"
      ]
    },

    ios: {
      bundleIdentifier: "com.oramexglobal.ohlam",
      buildNumber: "1.0.0",
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          "OHLAM uses the camera for profile, property and identity verification.",
        NSPhotoLibraryUsageDescription:
          "OHLAM uses your photo library to upload property and verification images.",
        NSLocationWhenInUseUsageDescription:
          "OHLAM uses location to help identify property locations and nearby listings."
      }
    },

    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-notifications"
    ],

    updates: {
      url: "https://u.expo.dev/373c6f7b-8b66-40dc-b4ea-0e5c57846ab9"
    },

    runtimeVersion: "1.0.0",

    extra: {
      eas: {
        projectId: "373c6f7b-8b66-40dc-b4ea-0e5c57846ab9"
      }
    }
  }
};