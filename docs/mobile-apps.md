# Mobile apps (Capacitor)

| App | Android package | OneSignal | Firebase file |
|---|---|---|---|
| STGL Technician | `com.sprucelandiq.technician` | `ONESIGNAL_STGL_*` | `native/technician/google-services.json` |
| Yalelo Store Manager | `com.sprucelandiq.yalelo` | `ONESIGNAL_YALELO_*` | `native/yalelo/google-services.json` |

## How it works
- `capacitor.config.ts` picks the app with `CAP_FLAVOR`. Each app opens the published site at its own start page, so publishing in Lovable updates both apps; a new APK is only needed for native changes (name, icon, plugins).
- `native/www/index.html` is the offline fallback screen.
- Push: after sign-in the phone calls `OneSignal.login(<user id>)` (`src/lib/push/native.ts`); the server sends to that id; queued alerts go out every 5 minutes.

## Build the APKs on GitHub
1. Connect the project to GitHub (Lovable → Project settings → Git).
2. GitHub → Actions → **Android APKs** runs on every push to `main` (or click **Run workflow**).
3. Download `spruceland-technician-apk` / `spruceland-yalelo-apk` from the run's Artifacts.

Signing (required — the build fails with a clear message if any are missing). Add these eight GitHub repo secrets (Settings → Secrets → Actions):
- STGL Technician: `STGL_KEYSTORE_BASE64`, `STGL_KEYSTORE_PASSWORD`, `STGL_KEY_ALIAS`, `STGL_KEY_PASSWORD`
- Yalelo Store Manager: `YALELO_KEYSTORE_BASE64`, `YALELO_KEYSTORE_PASSWORD`, `YALELO_KEY_ALIAS`, `YALELO_KEY_PASSWORD`

Toolchain: Node 22, Java 21, Android SDK platform 36 + build-tools 36.0.0 (no legacy `tools` package). Each run builds a debug APK, a signed release APK and a signed AAB per app, checks the signature and package ID, and uploads `spruceland-<app>-debug-apk`, `-release-apk` and `-release-aab` artifacts. The keystore is written to the runner temp folder and deleted after the build.

The Android folder is generated fresh in each run (Capacitor's template applies the Google Services plugin automatically when `google-services.json` is present), so nothing native needs to be committed.

## Icons and splash screens
- Sources: `native/<flavor>/assets/icon.png` and `splash.png` (Technician: STGL logo; Yalelo: Yalelo + STGL co-brand over a weighing-scales background). CI turns them into Android sizes with `@capacitor/assets`.
- On launch and after every sign-in the app shows a branded loading screen for at least 5 seconds with a 0–100% progress bar, then a welcome pop-up (`src/components/brand/SplashHost.tsx`).
