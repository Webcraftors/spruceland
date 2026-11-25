import type { CapacitorConfig } from "@capacitor/cli";

// One codebase, two Android apps. Select with CAP_FLAVOR=technician|yalelo (see docs/mobile-apps.md).
// The apps load the published Spruceland IQ site, so every publish updates both apps without a new APK.
const flavor = (process.env["CAP_FLAVOR"] ?? "technician") as "technician" | "yalelo";
const SITE = process.env["CAP_SITE_URL"] ?? "https://spruceland.lovable.app";
const apps = {
  technician: { appId: "com.sprucelandiq.technician", appName: "STGL Technician", start: "/login?app=technician" },
  yalelo: { appId: "com.sprucelandiq.yalelo", appName: "Yalelo Store Manager", start: "/client?app=yalelo" },
} as const;

const config: CapacitorConfig = {
  appId: apps[flavor].appId,
  appName: apps[flavor].appName,
  webDir: "native/www",
  server: { url: SITE + apps[flavor].start, androidScheme: "https", errorPath: "index.html" },
  android: { allowMixedContent: false },
  // Native splash covers start-up; the web splash then runs its 5-second progress bar.
  plugins: { SplashScreen: { launchShowDuration: 3000, launchAutoHide: true, backgroundColor: "#eaf3ff", showSpinner: false } },
};
export default config;
