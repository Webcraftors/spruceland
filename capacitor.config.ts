import type { CapacitorConfig } from "@capacitor/cli";

// One codebase, two Android apps. Select with CAP_FLAVOR=technician|yalelo (see docs/mobile-apps.md).
const flavor = (process.env["CAP_FLAVOR"] ?? "technician") as "technician" | "yalelo";
const apps = {
  technician: { appId: "com.sprucelandiq.technician", appName: "STGL Technician", androidPath: "android-technician" },
  yalelo: { appId: "com.sprucelandiq.yalelo", appName: "Yalelo Store Manager", androidPath: "android-yalelo" },
} as const;

const config: CapacitorConfig = {
  appId: apps[flavor].appId,
  appName: apps[flavor].appName,
  webDir: "dist/client",
  android: { path: apps[flavor].androidPath },
  server: { androidScheme: "https" },
};
export default config;
