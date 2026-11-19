import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { useTickets } from "@/repositories/portal-repo";
import { usePortalSession, StatusBadge, fmtDate } from "@/components/portal/shared";
import type { TicketStatus } from "@/domain/types";
import { pageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client_/app/tickets/")({
  head: () => pageMeta("Tickets — Spruceland Client Portal", "All breakdown tickets raised for your store, with live repair status."),
  component: TicketsPage,
});

const FILTERS: ("All" | TicketStatus)[] = ["All", "Open", "Assigned", "In Progress", "Awaiting Sign-off", "Closed"];

function TicketsPage() {
  const { session: s } = usePortalSession();
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const mine = useTickets().filter(t => t.clientId === s.clientId && t.site.name === s.site.name);
  const list = f === "All" ? mine : mine.filter(t => t.status === f);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Tickets</h1>
        <Link to="/client/app/tickets/new" className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 h-9 text-sm font-semibold"><Plus className="h-4 w-4" />New</Link>
      </div>
      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map(x => {
          const n = x === "All" ? mine.length : mine.filter(t => t.status === x).length;
          return <button key={x} onClick={() => setF(x)} className={cn("shrink-0 rounded-full border px-3 h-8 text-xs font-medium", f === x ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}>{x} <span className="opacity-70">{n}</span></button>;
        })}
      </div>
      {list.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No tickets here.</div> : (
        <ul className="space-y-2.5">{list.map(t => (
          <li key={t.id}><Link to="/client/app/tickets/$id" params={{ id: t.id }} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary/40">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><span className="text-[11px] font-mono text-muted-foreground">{t.id}</span><StatusBadge status={t.status} /></div>
              <div className="mt-1 text-sm font-semibold truncate">{t.fault}</div>
              <div className="text-[11px] text-muted-foreground truncate">{t.asset.make} {t.asset.model} · {t.department} · {fmtDate(t.createdAt)}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link></li>))}</ul>
      )}
    </div>
  );
}
