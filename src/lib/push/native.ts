// Registers this phone with OneSignal under the signed-in user's id (external_id),
// so server-side alerts reach the right person. No-op in the web browser.
export async function registerPushForUser(userId: string) {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
  if (!appId || typeof window === "undefined") return;
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;
  const OneSignal = (window as unknown as { plugins?: { OneSignal?: any } }).plugins?.OneSignal;
  if (!OneSignal) return;
  OneSignal.initialize(appId);
  OneSignal.Notifications.requestPermission(true);
  OneSignal.login(userId);
  OneSignal.Notifications.addEventListener("click", (e: any) => {
    const link = e?.notification?.additionalData?.link;
    if (typeof link === "string" && link.startsWith("/")) window.location.assign(link);
  });
}

export async function unregisterPush() {
  const OneSignal = (window as unknown as { plugins?: { OneSignal?: any } }).plugins?.OneSignal;
  OneSignal?.logout?.();
}

export const appFlavor = (import.meta.env.VITE_APP_FLAVOR as "technician" | "yalelo" | undefined) ?? "web";
