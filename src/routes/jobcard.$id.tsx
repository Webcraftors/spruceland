import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTickets } from "@/repositories/portal-repo";
import { fmtDateTime } from "@/components/portal/shared";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/jobcard/$id")({
  head: ({ params }) => pageMeta(`Job card ${params.id} — Spruceland`, "Digital job card and service voucher for a completed Spruceland repair."),
  component: JobCard,
});

function JobCard() {
  const { id } = Route.useParams();
  const t = useTickets().find(x => x.id === id);
  if (!t) return <div className="p-10 text-center text-sm text-muted-foreground">Job card not found.</div>;
  const rows: [string, string][] = [
    ["Client", t.clientName], ["Site", `${t.site.name}, ${t.site.city}, ${t.site.province}`], ["Department", t.department],
    ["Equipment", `${t.asset.make} ${t.asset.model} (${t.asset.type})`], ["Serial no.", t.asset.serial],
    ["Fault", `${t.fault} · ${t.priority}`], ["Reported", `${t.reportedBy.name} · ${fmtDateTime(t.createdAt)}`],
    ["Description", t.description],
    ["Technician", t.resolution?.technicianName ?? "—"], ["Diagnosis", t.resolution?.diagnosis ?? "—"],
    ["Work done", t.resolution?.workDone ?? "—"], ["Parts used", t.resolution?.partsUsed ?? "—"],
    ["Test readings", t.resolution?.readings ?? "—"], ["Completed", fmtDateTime(t.resolution?.resolvedAt)],
    ["Client sign-off", t.signOff ? `${t.signOff.name} · ID ${t.signOff.employeeRef} · ${fmtDateTime(t.signOff.signedAt)}` : "Not signed"],
  ];
  return (
    <div className="min-h-dvh bg-muted/30 py-6 px-4 print:bg-background print:p-0">
      <div className="max-w-2xl mx-auto mb-4 flex justify-between print:hidden">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground" onClick={e => { e.preventDefault(); history.back(); }}><ArrowLeft className="h-4 w-4" />Back</Link>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print / Save as PDF</Button>
      </div>
      <article className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6 print:border-0">
        <header className="flex items-start justify-between border-b border-border pb-4">
          <img src="/spruceland-logo.png" alt="Spruceland" className="h-10 w-auto" />
          <div className="text-right"><div className="text-xs uppercase tracking-widest text-muted-foreground">Job card</div><div className="font-mono font-bold">{t.id}</div><div className="text-xs">{t.status}</div></div>
        </header>
        <dl className="mt-4 divide-y divide-border text-sm">
          {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[130px_1fr] gap-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <h2 className="mt-5 text-sm font-bold">Audit trail</h2>
        <ul className="mt-2 text-xs space-y-1">{t.activity.map((a, i) => <li key={i}>{fmtDateTime(a.at)} — {a.actor}: {a.text}</li>)}</ul>
        <p className="mt-6 text-[10px] text-muted-foreground">Spruceland Technologies Group Ltd · Lusaka &amp; Ndola</p>
      </article>
    </div>
  );
}
