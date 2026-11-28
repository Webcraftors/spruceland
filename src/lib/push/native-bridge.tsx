import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clientAuth } from "@/lib/client-auth";
import { appFlavor, registerPushForUser, unregisterPush } from "./native";

/** Phone-only glue: Android back button and push registration on sign-in/out. Renders nothing. */
export function NativeBridge() {
  useEffect(() => {
    if (appFlavor() === "web") return;
    let cleanup: (() => void) | undefined;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import("@capacitor/app");
      const h = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back(); else void App.exitApp();
      });
      const client = appFlavor() === "yalelo" ? clientAuth : supabase;
      const { data: sub } = client.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) void registerPushForUser(session.user.id);
        if (event === "SIGNED_OUT") unregisterPush();
      });
      const { data } = await client.auth.getUser();
      if (data.user) void registerPushForUser(data.user.id);
      cleanup = () => { void h.remove(); sub.subscription.unsubscribe(); };
    })();
    return () => cleanup?.();
  }, []);
  return null;
}
