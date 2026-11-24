import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/lib/session";
import { StoreProvider } from "@/lib/store";
import { LiveNotifications } from "@/lib/live-notifications";

export const Route = createFileRoute("/_app")({
  component: () => (
    <SessionProvider>
      <StoreProvider>
        <LiveNotifications />
        <AppShell>
          <Outlet />
        </AppShell>
      </StoreProvider>
    </SessionProvider>
  ),
});
