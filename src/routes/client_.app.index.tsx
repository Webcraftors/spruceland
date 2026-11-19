import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Plus, Wrench, ShieldCheck, AlertTriangle, ChevronRight, PenLine, Phone } from "lucide-react";
import { useTickets } from "@/repositories/portal-repo";
import { usePortalSession, StatusBadge, DueBadge, fmtDate, fmtDateTime, Card } from "@/components/portal/shared";
import { assetsForSite } from "@/data/portal";
import { techById } from "@/data/technicians";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/client_/app/")({
  head: () => pageMeta("Home — Spruceland Client Portal", "Your store's open breakdowns, upcoming Spruceland service and ZMA verification dates."),
  component: ClientHome,
});

function ClientHome() {
  const { session: s } = usePortalSession();
  const all = useTickets();
  const tickets = all.filter(t => t.clientId === s.clientId && t.site.name === s.site.name);
  const assets = useMemo(() => assetsForSite(s.clientId, s.site), [s.clientId, s.site]);
  const open = tickets.filter(t => t.status !== "Closed");
  const awaiting = tickets.filter(t => t.status === "Awaiting Sign-off");
  const nextService = [...assets].sort((a, b) => a.nextServiceDue.localeCompare(b.nextServiceDue))[0];
  const nextZma = [...assets].sort((a, b) => a.zmaDue.localeCompare(b.zmaDue))[0];
  const recent = tickets.flatMap(t => t.activity.map(a => ({ ...a, ticket: t.id }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
  const tech = open.find(t => t.technicianId);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-primary text-primary-foreground p-5">
        <div className="text-xs opacity-80">Welcome back</div>
        <h1 className="text-xl font-extrabold">{s.employeeName}</h1>
        <div className="text-xs opacity-85 mt-0.5">{s.department} · {s.site.name}, {s.site.province}</div>
        <Link to="/client/app/tickets/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-foreground text-primary px-4 h-10 text-sm font-bold"><Plus className="h-4 w-4" />Report a breakdown</Link>
      </section>

      {awaiting.length > 0 && (
        <Link to="/client/app/tickets/$id" params={{ id: awaiting[0].id }} className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/8 p-3">
          <PenLine className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{awaiting.length} repair{awaiting.length > 1 ? "s" : ""} waiting for your sign-off</div><div className="text-xs text-muted-foreground truncate">{awaiting[0].id} · {awaiting[0].fault}</div></div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <Kpi icon={AlertTriangle} label="Open tickets" value={open.length} to="/client/app/tickets" />
        <Kpi icon={Wrench} label="Next service" value={nextService ? fmtDate(nextService.nextServiceDue).slice(0, 6) : "—"} to="/client/app/schedule" />
        <Kpi icon={ShieldCheck} label="Next ZMA" value={nextZma ? fmtDate(nextZma.zmaDue).slice(0, 6) : "—"} to="/client/app/schedule" />
      </div>

      <Card title="Open tickets" action={<Link to="/client/app/tickets" className="text-xs text-primary font-semibold">View all</Link>}>
        {open.length === 0 ? <p className="text-sm text-muted-foreground py-3">No open breakdowns. All scales running.</p> : (
          <ul className="divide-y divide-border">{open.slice(0, 4).map(t => (
            <li key={t.id}><Link to="/client/app/tickets/$id" params={{ id: t.id }} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{t.fault}</div><div className="text-[11px] text-muted-foreground truncate">{t.id} · {t.asset.make} {t.asset.model} · {t.department}</div></div>
              <StatusBadge status={t.status} />
            </Link></li>))}</ul>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Upcoming service">
          {[nextService, nextZma].filter(Boolean).length === 0 ? null : (
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="font-medium truncate">Spruceland service</div><div className="text-[11px] text-muted-foreground truncate">{nextService.make} {nextService.model} · {fmtDate(nextService.nextServiceDue)}</div></div><DueBadge iso={nextService.nextServiceDue} /></li>
              <li className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="font-medium truncate">ZMA verification</div><div className="text-[11px] text-muted-foreground truncate">{nextZma.make} {nextZma.model} · {fmtDate(nextZma.zmaDue)}</div></div><DueBadge iso={nextZma.zmaDue} /></li>
            </ul>
          )}
        </Card>
        <Card title="Your technician">
          {tech?.technicianId ? (() => { const t = techById(tech.technicianId)!; return (
            <div className="flex items-center gap-3">
              <div className="grid place-items-center h-11 w-11 rounded-full bg-info/15 text-info font-bold text-sm">{t.avatarInitials}</div>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{t.name}</div><div className="text-[11px] text-muted-foreground">{t.role} · visiting {fmtDate(tech.scheduledFor)}</div></div>
              <a href={`tel:${t.phone.replace(/\s/g, "")}`} aria-label="Call technician" className="grid place-items-center h-9 w-9 rounded-full bg-primary/10 text-primary"><Phone className="h-4 w-4" /></a>
            </div>); })() : <p className="text-sm text-muted-foreground">Spruceland Help Desk · +260 211 000 000</p>}
        </Card>
      </div>

      <Card title="Recent activity">
        <ul className="space-y-2.5">{recent.map((a, i) => (
          <li key={i} className="text-sm"><span className="font-medium">{a.text}</span><div className="text-[11px] text-muted-foreground">{a.ticket} · {a.actor} · {fmtDateTime(a.at)}</div></li>
        ))}</ul>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, to }: { icon: any; label: string; value: string | number; to: string }) {
  return (
    <Link to={to} className="rounded-xl border border-border bg-card p-3">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 text-lg font-extrabold leading-none">{value}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{label}</div>
    </Link>
  );
}
