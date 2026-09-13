export default {
  expo: {
    name: "OHLAM",
    slug: "OHLAM",
    scheme: "ohlam",
    version: "1.0.11",

    runtimeVersion: {
      policy: "appVersion",
    },

    updates: {
      url:
        "https://u.expo.dev/373c6f7b-8b66-40dc-b4ea-0e5c57846ab9",

      fallbackToCacheTimeout: 0,
    },

    android: {
      package:
        "com.oramexglobals.ohlam",

      googleServicesFile:
        "./google-services.json",

      versionCode: 3,

      permissions: [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "POST_NOTIFICATIONS",
      ],

      blockedPermissions: [
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ],
    },

    ios: {
      bundleIdentifier:
        "com.oramexglobal.ohlam",

      buildNumber: "1.0.0",

      supportsTablet: true,

      infoPlist: {
        NSCameraUsageDescription:
          "OHLAM uses the camera for profile, property and identity verification.",

        NSPhotoLibraryUsageDescription:
          "OHLAM allows you to select property and verification images from your photo library.",

        NSLocationWhenInUseUsageDescription:
          "OHLAM uses your location at the property to verify an inspection report.",
      },
    },

    plugins: [
      "expo-router",

      [
        "expo-local-authentication",
        {
          faceIDPermission:
            "Allow OHLAM to use Face ID for secure login.",
        },
      ],

      [
        "expo-secure-store",
        {
          configureAndroidBackup:
            true,

          faceIDPermission:
            "Allow OHLAM to securely access your login credentials.",
        },
      ],

      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "OHLAM uses your location at the property to verify an inspection report.",
        },
      ],

      [
        "expo-notifications",
        {
          defaultChannel:
            "ohlam-default",
        },
      ],

      [
        "expo-image-picker",
        {
          photosPermission:
            "OHLAM allows you to select photos and videos for property listings, profile information and identity verification.",

          cameraPermission:
            "OHLAM uses the camera when you choose to capture property, profile or verification media.",

          microphonePermission: false,
        },
      ],

      "expo-video",
    ],

    extra: {
      eas: {
        projectId:
          "373c6f7b-8b66-40dc-b4ea-0e5c57846ab9",
      },
    },
  },
};