import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/lib/session";
import { StoreProvider } from "@/lib/store";
import { LiveNotifications } from "@/lib/live-notifications";
import { resolveStaffSession } from "@/lib/staff-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async () => {
    const staffSession = await resolveStaffSession();
    if (!staffSession) throw redirect({ to: "/login", replace: true });
    return { staffSession };
  },
  errorComponent: ({ error }) => <div className="min-h-screen grid place-items-center p-6"><div className="space-y-4 max-w-sm"><p role="alert" className="text-sm text-destructive">{error.message}</p><Button asChild><Link to="/login">Return to sign in</Link></Button></div></div>,
  component: StaffLayout,
});

function StaffLayout() {
  const { staffSession } = Route.useRouteContext();
  return (
    <SessionProvider key={JSON.stringify(staffSession)} initialSession={staffSession}>
        <StoreProvider>
          <LiveNotifications />
          <AppShell><Outlet /></AppShell>
        </StoreProvider>
    </SessionProvider>
  );
}
