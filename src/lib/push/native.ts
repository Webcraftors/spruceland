// Registers this phone with OneSignal under the signed-in user's id (external_id),
// so server-side alerts reach the right person. No-op in a normal web browser.
const APP_IDS = { technician: "4d963ef1-2b5e-463e-a78d-9521388be2fd", yalelo: "1413a123-90d8-43ff-b271-25cd91212a01" } as const;
type Flavor = keyof typeof APP_IDS;

/** The native app opens with ?app=technician|yalelo; remember it for later pages. */
export function appFlavor(): Flavor | "web" {
  if (typeof window === "undefined") return "web";
  const q = new URLSearchParams(window.location.search).get("app");
  if (q === "technician" || q === "yalelo") localStorage.setItem("spruceland.app", q);
  const v = localStorage.getItem("spruceland.app");
  return v === "technician" || v === "yalelo" ? v : "web";
}

function plugin(): any {
  return (window as unknown as { plugins?: { OneSignal?: any } }).plugins?.OneSignal;
}

export async function registerPushForUser(userId: string) {
  const flavor = appFlavor();
  if (flavor === "web") return;
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;
  const OneSignal = plugin();
  if (!OneSignal) return;
  OneSignal.initialize(APP_IDS[flavor]);
  OneSignal.Notifications.requestPermission(true);
  OneSignal.login(userId);
  OneSignal.Notifications.addEventListener("click", (e: any) => {
    const link = e?.notification?.additionalData?.link;
    if (typeof link === "string" && link.startsWith("/")) window.location.assign(link);
  });
}

export function unregisterPush() {
  plugin()?.logout?.();
}
