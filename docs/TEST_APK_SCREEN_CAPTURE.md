# OHLAM screenshot and screen-recording policy

The shared `src/hooks/usePreventScreenCapture.ts` permits screenshots and screen recording **only** when the compile-time `EXPO_PUBLIC_APP_ENV` value is `preview` or `development`. All other values, including missing/undefined and `production`, retain the existing restriction.

EAS profiles in `eas.json` already set:
- `preview` -> `EXPO_PUBLIC_APP_ENV=preview`, internal Android APK, test package `com.oramexglobals.ohlam.test`
- `development` -> `EXPO_PUBLIC_APP_ENV=development`, internal Android APK
- `production` -> `EXPO_PUBLIC_APP_ENV=production`, production Android app bundle, package `com.oramexglobals.ohlam`

Build preview using:

```sh
npx eas-cli@latest build --platform android --profile preview
```

Download and install the preview APK on a test phone, then confirm Android screenshot and screen recording work on views protected by the shared hook. Build with `--profile production` and verify protection still holds.

The hook changes are JavaScript-only, but do not assume an existing APK automatically contains them: rebuild/install or explicitly verify an eligible Expo update reaches the test APK. The preview and production apps have different Android package IDs and can be installed separately.

This change affects only callers of the shared hook. If another native screen capture guard or a direct `expo-screen-capture` call exists elsewhere, that protection remains in effect; investigate it separately rather than removing sensitive-data safeguards blindly.

**Security:** testing screenshots can capture PII, KYC documents, wallet information, and private property data. Use test accounts/test documents for screen-recorded tutorials; do not share real customer private data. The build environment flag is not an authorization control or a guarantee of privacy.
