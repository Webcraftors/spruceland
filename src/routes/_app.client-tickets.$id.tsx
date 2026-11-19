import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ticketsRepo, useTickets } from "@/repositories/portal-repo";
import { StatusBadge, TicketTimeline, Card, fmtDateTime } from "@/components/portal/shared";
import { TECHNICIANS, techById } from "@/data/technicians";
import { useSession } from "@/lib/session";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_app/client-tickets/$id")({
  head: ({ params }) => pageMeta(`Ticket ${params.id} — Spruceland Ops`, "Assign, work and resolve a client breakdown ticket."),
  component: AdminTicket,
});

function AdminTicket() {
  const { id } = Route.useParams();
  const { session } = useSession();
  const actor = session?.name ?? "Spruceland";
  const t = useTickets().find(x => x.id === id);
  const [tech, setTech] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [r, setR] = useState({ diagnosis: "", workDone: "", partsUsed: "", readings: "" });
  if (!t) return <div className="p-10 text-center text-sm text-muted-foreground">Ticket not found. <Link to="/client-tickets" className="text-primary">Back</Link></div>;
  const run = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast.success(msg); } catch (e: any) { toast.error(e.message); } };
  const techId = t.technicianId ?? tech;

  return (
    <div className="space-y-4 max-w-4xl">
      <Link to="/client-tickets" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Client tickets</Link>
      <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold">{t.id} · {t.fault}</h1><StatusBadge status={t.status} /></div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card title="Report">
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {[["Client", t.clientName], ["Site", `${t.site.name}, ${t.site.province}`], ["Department", t.department], ["Priority", t.priority], ["Equipment", `${t.asset.make} ${t.asset.model} · ${t.asset.type}`], ["Serial", t.asset.serial], ["Reported by", `${t.reportedBy.name} (${t.reportedBy.employeeRef})`], ["Raised", fmtDateTime(t.createdAt)]].map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
            </dl>
            <p className="mt-3 text-sm">{t.description}</p>
            {t.attachments.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{t.attachments.length} attachment(s): {t.attachments.map(a => a.name).join(", ")}</p>}
          </Card>

          {t.status === "In Progress" && (
            <Card title="Resolve — technician report">
              <div className="space-y-3">
                {([["diagnosis", "Diagnosis"], ["workDone", "Work completed"], ["partsUsed", "Parts used"], ["readings", "Test readings / calibration results"]] as const).map(([k, l]) => (
                  <div key={k} className="space-y-1.5"><Label>{l}</Label><Textarea rows={2} value={r[k]} onChange={e => setR({ ...r, [k]: e.target.value })} /></div>
                ))}
                <Button className="w-full" disabled={!r.diagnosis || !r.workDone} onClick={() => run(() => ticketsRepo.resolve(t.id, {
                  ...r, partsUsed: r.partsUsed || "None", readings: r.readings || "—",
                  technicianId: techId, technicianName: techById(techId)?.name ?? actor, arrivedAt: new Date().toISOString(),
                }), "Sent to the client for sign-off")}>Resolve issue — request client sign-off</Button>
              </div>
            </Card>
          )}

          {t.resolution && (
            <Card title="Work done">
              <dl className="space-y-2 text-sm">{[["Diagnosis", t.resolution.diagnosis], ["Work completed", t.resolution.workDone], ["Parts used", t.resolution.partsUsed], ["Readings", t.resolution.readings]].map(([k, v]) => <div key={k}><dt className="text-[11px] text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}</dl>
              <p className="mt-2 text-[11px] text-muted-foreground">{t.resolution.technicianName} · {fmtDateTime(t.resolution.resolvedAt)}</p>
              {t.signOff && <p className="mt-2 text-xs font-semibold text-success">Signed off by {t.signOff.name} ({t.signOff.employeeRef}) · {fmtDateTime(t.signOff.signedAt)}</p>}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {(t.status === "Open" || t.status === "Assigned") && (
            <Card title={t.status === "Open" ? "Assign technician" : "Dispatch"}>
              <div className="space-y-3">
                <Select value={tech || t.technicianId || ""} onValueChange={setTech}>
                  <SelectTrigger><SelectValue placeholder="Choose technician" /></SelectTrigger>
                  <SelectContent>{TECHNICIANS.filter(x => !x.subcontractor).map(x => <SelectItem key={x.id} value={x.id}>{x.name} · {x.location}</SelectItem>)}</SelectContent>
                </Select>
                <div className="space-y-1.5"><Label>Visit date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                <Button variant="outline" className="w-full" disabled={!tech} onClick={() => run(() => ticketsRepo.assign(t.id, tech, new Date(date).toISOString(), actor), "Technician assigned")}>{t.status === "Open" ? "Assign" : "Re-assign"}</Button>
                {t.status === "Assigned" && <Button className="w-full" onClick={() => run(() => ticketsRepo.startWork(t.id, techById(t.technicianId!)?.name ?? actor), "Work started")}>On site — start work</Button>}
              </div>
            </Card>
          )}
          {t.status === "Awaiting Sign-off" && <Card><p className="text-sm">Waiting for <b>{t.reportedBy.name}</b> to approve the work in the Client Portal.</p></Card>}
          {t.status === "Closed" && <Link to="/jobcard/$id" params={{ id: t.id }} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card h-10 text-sm font-semibold"><FileText className="h-4 w-4" />Job card / PDF</Link>}
          <Card title="History"><TicketTimeline ticket={t} /></Card>
        </div>
      </div>
    </div>
  );
}
