# Mobile apps (Capacitor)

| App | Android package | OneSignal app | Firebase file |
|---|---|---|---|
| STGL Technician | `com.sprucelandiq.technician` | `ONESIGNAL_STGL_*` | `native/technician/google-services.json` (verified package) |
| Yalelo Store Manager | `com.sprucelandiq.yalelo` | `ONESIGNAL_YALELO_*` | `native/yalelo/google-services.json` (contains both apps of the Firebase project; Gradle picks the matching package) |

`capacitor.config.ts` chooses the app with `CAP_FLAVOR`. Build modes `technician`/`yalelo` load `.env.technician`/`.env.yalelo` (public OneSignal app id + flavor).

First time on a computer with Android Studio:
```
bun install
CAP_FLAVOR=technician npx cap add android
CAP_FLAVOR=yalelo npx cap add android
```
Then each release: `bun run cap:technician` / `bun run cap:yalelo`, open the `android-*` folder in Android Studio and build. In each `android-*/app/build.gradle` keep `applicationId` equal to the package above and apply `com.google.gms.google-services`.

Push: the phone calls `OneSignal.login(<user id>)` after sign-in (`src/lib/push/native.ts`); the server sends to that user id. The queued alerts are sent every 5 minutes by `/api/public/cron/dispatch-notifications`.
