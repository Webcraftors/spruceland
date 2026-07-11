import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/lib/session";

export const Route = createFileRoute("/_app")({
  component: () => (
    <SessionProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </SessionProvider>
  ),
});
