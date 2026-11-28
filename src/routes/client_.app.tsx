import { createFileRoute, Link, Outlet, useNavigate, useRouterState, redirect } from "@tanstack/react-router";
import { Home, Ticket, CalendarClock, User, Plus, UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { clientSessionRepo } from "@/repositories/portal-repo";
import { resolveClientSession } from "@/lib/client-session";
import { clientAuth } from "@/lib/client-auth";
import { pageMeta } from "@/lib/meta";
import { ClientSessionCtx } from "@/components/portal/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client_/app")({
  ssr: false,
  head: () => pageMeta("Client workspace — Spruceland IQ", "Your authorized company and store workspace."),
  beforeLoad: async () => {
    const selection = clientSessionRepo.get();
    const clientSession = await resolveClientSession(selection ? { clientId: selection.clientId, ...(selection.locationId ? { locationId: selection.locationId } : {}) } : undefined);
    if (!clientSession) throw redirect({ to: "/client", replace: true });
    clientSessionRepo.set(clientSession);
    return { clientSession };
  },
  errorComponent: ({ error }) => <div className="min-h-dvh grid place-items-center p-6"><div className="space-y-4 max-w-sm"><p role="alert" className="text-sm text-destructive">{error.message}</p><Link to="/client" className="text-primary font-semibold">Return to client sign in</Link></div></div>,
  component: ClientLayout,
});

const NAV = [
  { to: "/client/app", label: "Home", icon: Home, exact: true },
  { to: "/client/app/tickets", label: "Tickets", icon: Ticket },
  { to: "/client/app/schedule", label: "Schedule", icon: CalendarClock },
  { to: "/client/app/profile", label: "Profile", icon: User },
] as const;

function ClientLayout() {
  const { clientSession: s } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: r => r.location.pathname });
  const signOut = async () => { await queryClient.cancelQueries(); queryClient.clear(); clientSessionRepo.set(null); await clientAuth.auth.signOut(); await navigate({ to: "/client", replace: true }); };
  const active = (to: string, exact?: boolean) => exact ? path === to || path === to + "/" : path.startsWith(to);

  return (
    <ClientSessionCtx.Provider value={{ session: s, signOut }}>
      <div className="min-h-dvh bg-muted/30 md:flex">
        <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r border-border bg-card p-4 sticky top-0 h-dvh">
          <img src="/spruceland-logo.png" alt="Spruceland" className="h-9 w-auto self-start" />
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Client Portal</div>
          <Link to="/client/app/tickets/new" className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground h-10 text-sm font-semibold"><Plus className="h-4 w-4" />Raise ticket</Link>
          <nav className="mt-4 space-y-1">
            {s.canInvite && <Link to="/client/app/people" className={cn("flex items-center gap-3 rounded-lg px-3 h-10 text-sm", active("/client/app/people") ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted")}><UserPlus className="h-4 w-4" />People & invitations</Link>}
            {NAV.map(n => (
              <Link key={n.to} to={n.to} className={cn("flex items-center gap-3 rounded-lg px-3 h-10 text-sm", active(n.to, "exact" in n) ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted")}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-lg bg-muted/60 p-3 text-xs">
            <div className="font-semibold truncate">{s.employeeName}</div>
            <div className="text-muted-foreground truncate">{s.clientName}</div>
            <div className="text-muted-foreground truncate">{s.site.name}</div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="md:hidden sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-4 h-14 flex items-center gap-3" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <img src="/spruceland-logo.png" alt="Spruceland" className="h-7 w-auto" />
            <div className="ml-auto text-right min-w-0">
              <div className="text-xs font-semibold truncate max-w-[50vw]">{s.site.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{s.clientName}</div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-3xl px-4 py-5 pb-28 md:pb-10">
            <Outlet />
          </main>
        </div>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur grid grid-cols-5" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {NAV.slice(0, 2).map(n => <BottomItem key={n.to} {...n} on={active(n.to, "exact" in n)} />)}
          <Link to="/client/app/tickets/new" aria-label="Raise ticket" className="flex items-center justify-center">
            <span className="-mt-6 grid place-items-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background"><Plus className="h-6 w-6" /></span>
          </Link>
          {NAV.slice(2).map(n => <BottomItem key={n.to} {...n} on={active(n.to)} />)}
        </nav>
      </div>
    </ClientSessionCtx.Provider>
  );
}

function BottomItem({ to, label, icon: Icon, on }: { to: string; label: string; icon: any; on: boolean }) {
  return (
    <Link to={to} className={cn("flex flex-col items-center justify-center gap-0.5 h-16 text-[10px] font-medium", on ? "text-primary" : "text-muted-foreground")}>
      <Icon className="h-5 w-5" />{label}
    </Link>
  );
}
