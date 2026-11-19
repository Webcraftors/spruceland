import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTickets } from "@/repositories/portal-repo";
import { StatusBadge, fmtDateTime } from "@/components/portal/shared";
import { techById } from "@/data/technicians";
import type { TicketStatus } from "@/domain/types";
import { pageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/client-tickets/")({
  head: () => pageMeta("Client tickets — Spruceland Ops", "Breakdown tickets raised by client stores, ready to assign and resolve."),
  component: AdminTickets,
});

const FILTERS: ("Active" | TicketStatus)[] = ["Active", "Open", "Assigned", "In Progress", "Awaiting Sign-off", "Closed"];

function AdminTickets() {
  const all = useTickets();
  const [f, setF] = useState<(typeof FILTERS)[number]>("Active");
  const list = all.filter(t => f === "Active" ? t.status !== "Closed" : t.status === f).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold">Client tickets</h1><p className="text-sm text-muted-foreground">Breakdowns reported from client stores through the Client Portal.</p></div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(x => <button key={x} onClick={() => setF(x)} className={cn("shrink-0 rounded-full border px-3 h-8 text-xs font-medium", f === x ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}>{x} <span className="opacity-70">{x === "Active" ? all.filter(t => t.status !== "Closed").length : all.filter(t => t.status === x).length}</span></button>)}
      </div>
      {list.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No tickets yet. Tickets appear here when a client store signs in and reports a breakdown.</div> : (
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">{list.map(t => (
          <Link key={t.id} to="/client-tickets/$id" params={{ id: t.id }} className="rounded-xl border border-border bg-card p-3.5 hover:border-primary/40">
            <div className="flex items-center gap-2"><span className="font-mono text-[11px] text-muted-foreground">{t.id}</span><StatusBadge status={t.status} /><span className={cn("ml-auto text-[10px] font-bold", t.priority === "Critical" || t.priority === "High" ? "text-destructive" : "text-muted-foreground")}>{t.priority}</span></div>
            <div className="mt-1 font-semibold text-sm truncate">{t.fault}</div>
            <div className="text-xs text-muted-foreground truncate">{t.clientName} · {t.site.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{t.asset.make} {t.asset.model} · {t.department} · {fmtDateTime(t.createdAt)}</div>
            <div className="mt-1.5 text-[11px]">{t.technicianId ? `Tech: ${techById(t.technicianId)?.name}` : <span className="text-destructive font-semibold">Unassigned</span>}</div>
          </Link>))}</div>
      )}
    </div>
  );
}
