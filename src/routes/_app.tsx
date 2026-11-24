import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { readAccount } from "@/lib/account-access";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/lib/session";
import { StoreProvider } from "@/lib/store";
import { LiveNotifications } from "@/lib/live-notifications";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async () => {
    const account = await readAccount();
    if (!account || !account.role) throw redirect({ to: "/login" });
  },
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
