import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { SessionProvider, useSession } from "@/lib/session";
import { StoreProvider } from "@/lib/store";
import { LiveNotifications } from "@/lib/live-notifications";
import { supabase } from "@/integrations/supabase/client";
import { resolveStaffSession } from "@/lib/staff-auth";

export const Route = createFileRoute("/_app")({
  component: () => (
    <SessionProvider>
      <StaffGuard>
        <StoreProvider>
          <LiveNotifications />
          <AppShell><Outlet /></AppShell>
        </StoreProvider>
      </StaffGuard>
    </SessionProvider>
  ),
});

/** Staff pages need a real signed-in account with an active STGL staff role (re-checked on every load). */
function StaffGuard({ children }: { children: ReactNode }) {
  const { setSession } = useSession();
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let live = true;
    void resolveStaffSession().then(s => {
      if (!live) return;
      if (!s) { setSession(null); void supabase.auth.signOut(); navigate({ to: "/login", replace: true }); return; }
      setSession(s); setOk(true);
    });
    const { data } = supabase.auth.onAuthStateChange(ev => {
      if (ev === "SIGNED_OUT") { setSession(null); navigate({ to: "/login", replace: true }); }
    });
    return () => { live = false; data.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!ok) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Checking your access…</div>;
  return <>{children}</>;
}
