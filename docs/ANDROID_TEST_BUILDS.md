# OHLAM Android test builds

The production app uses `com.oramexglobals.ohlam`. Both the `development` and `preview` EAS profiles now use `com.oramexglobals.ohlam.test`, with app name **OHLAM Test**. This allows testing alongside the Play Store installation. Test and preview will replace each other because they share a package ID.

## Firebase prerequisite (required before building)

1. In the existing Firebase project, register a **new Android application** whose package name is exactly `com.oramexglobals.ohlam.test`. Do **not** change or delete the existing production Firebase app.
2. Download the test Android app's `google-services.json`.
3. Save it locally at repository root as `google-services.test.json`. Do not commit it. Alternatively, configure a file-type EAS environment variable `GOOGLE_SERVICES_FILE_TEST` in the development and preview environments with the file's contents, so the build receives a valid file path.
4. Configure any test-package-dependent Google auth, deep links or push credentials as required. Expo push notifications may not work until Firebase credentials for the test app are configured.
5. Make sure `google-services.test.json` is ignored in `.gitignore` and `.easignore` where appropriate. EAS remote builds need the file explicitly included in the upload or supplied via an EAS file variable. Don't accidentally exclude it when using a local file.

## Before building

```powershell
git fetch origin
git switch feature/verification-services-welcome-20261020
git pull --ff-only
npx expo config --type public
npx eas-cli@latest build --platform android --profile development
```

Confirm `android.package` resolves to `com.oramexglobals.ohlam.test`. This requires `EXPO_PUBLIC_APP_ENV=development` from the EAS profile. For a local command check:

```powershell
$env:EXPO_PUBLIC_APP_ENV="development"
npx expo config --type public
Remove-Item Env:EXPO_PUBLIC_APP_ENV
```

For EAS preview use `--profile preview`. The published app remains `com.oramexglobals.ohlam`; do not uninstall it.

Run `npx expo start --dev-client --tunnel` for a development client, then open the **OHLAM Test** icon and scan the connection QR code.

Note: welcome backgrounds still depend on remote images until offline assets are committed. Avoid merging this branch into production before image integration, route verification and device testing.
