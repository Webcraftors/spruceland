import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText, ShieldCheck, Phone, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ticketsRepo, useTickets } from "@/repositories/portal-repo";
import { usePortalSession, StatusBadge, TicketTimeline, Card, fmtDate, fmtDateTime } from "@/components/portal/shared";
import { validateSignOff } from "@/domain/ticket-workflow";
import { techById } from "@/data/technicians";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/client_/app/tickets/")({
  head: ({ params }) => pageMeta(`Ticket ${params.id} — Spruceland Client Portal`, "Breakdown ticket status, technician report and sign-off."),
  component: TicketDetail,
});

function TicketDetail() {
  const { id } = Route.useParams();
  const { session: s } = usePortalSession();
  const t = useTickets().find(x => x.id === id);
  if (!t) return <div className="text-center py-16 text-sm text-muted-foreground">Ticket not found. <Link to="/client/app/tickets" className="text-primary font-semibold">Back to tickets</Link></div>;
  const tech = t.technicianId ? techById(t.technicianId) : undefined;

  return (
    <div className="space-y-4">
      <Link to="/client/app/tickets" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Tickets</Link>
      <div>
        <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{t.id}</span><StatusBadge status={t.status} /><span className="text-[10px] font-semibold text-muted-foreground">{t.priority} priority</span></div>
        <h1 className="mt-1 text-xl font-extrabold">{t.fault}</h1>
        <p className="text-xs text-muted-foreground">Raised {fmtDateTime(t.createdAt)} by {t.reportedBy.name}</p>
      </div>

      {t.status === "Awaiting Sign-off" && <SignOffPanel ticketId={t.id} employee={{ name: s.employeeName, employeeRef: s.employeeRef }} />}

      <Card title="Equipment">
        <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
          <D k="Make / model" v={`${t.asset.make} ${t.asset.model}`} /><D k="Serial no." v={t.asset.serial} />
          <D k="Type" v={t.asset.type} /><D k="Department" v={t.department} />
          <D k="Store" v={t.site.name} /><D k="Province" v={t.site.province} />
        </dl>
        <p className="mt-3 text-sm whitespace-pre-wrap">{t.description}</p>
        {t.attachments.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">{t.attachments.map(a => (
            <div key={a.id} className="aspect-square rounded-lg bg-muted overflow-hidden grid place-items-center">
              {a.preview ? <img src={a.preview} alt={a.name} className="h-full w-full object-cover" /> : <div className="text-center p-1"><Video className="h-4 w-4 mx-auto text-muted-foreground" /><div className="text-[9px] truncate">{a.name}</div></div>}
            </div>))}</div>
        )}
      </Card>

      {tech && (
        <Card title="Technician">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center h-10 w-10 rounded-full bg-info/15 text-info font-bold text-sm">{tech.avatarInitials}</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{tech.name}</div><div className="text-[11px] text-muted-foreground">{tech.role}{t.scheduledFor ? ` · visit ${fmtDate(t.scheduledFor)}` : ""}</div></div>
            <a href={`tel:${tech.phone.replace(/\s/g, "")}`} aria-label="Call" className="grid place-items-center h-9 w-9 rounded-full bg-primary/10 text-primary"><Phone className="h-4 w-4" /></a>
          </div>
        </Card>
      )}

      {t.resolution && (
        <Card title="Work done">
          <dl className="space-y-2 text-sm">
            <R k="Diagnosis" v={t.resolution.diagnosis} /><R k="Work completed" v={t.resolution.workDone} />
            <R k="Parts used" v={t.resolution.partsUsed} /><R k="Test readings" v={t.resolution.readings} />
          </dl>
          <p className="mt-2 text-[11px] text-muted-foreground">Completed by {t.resolution.technicianName} · {fmtDateTime(t.resolution.resolvedAt)}</p>
        </Card>
      )}

      {t.signOff && (
        <Card className="border-success/40 bg-success/5">
          <div className="flex items-center gap-2 text-sm font-semibold text-success"><ShieldCheck className="h-4 w-4" />Signed off by {t.signOff.name}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">ID {t.signOff.employeeRef} · {fmtDateTime(t.signOff.signedAt)}</p>
        </Card>
      )}

      {t.status === "Closed" && (
        <Link to="/jobcard/$id" params={{ id: t.id }} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card h-11 text-sm font-semibold"><FileText className="h-4 w-4" />View job card / PDF</Link>
      )}

      <Card title="History"><TicketTimeline ticket={t} /></Card>
    </div>
  );
}

function SignOffPanel({ ticketId, employee }: { ticketId: string; employee: { name: string; employeeRef: string } }) {
  const [consent, setConsent] = useState(false);
  const [confirmComplete, setConfirm] = useState(false);
  const [typedName, setName] = useState("");
  const [typedRef, setRef] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState("");
  const input = { consent, confirmComplete, typedName, typedRef };
  const errors = validateSignOff(input, employee);

  const approve = async () => {
    try { await ticketsRepo.signOff(ticketId, input, employee); toast.success("Thank you. The ticket is now closed."); }
    catch (e: any) { toast.error(e.message); }
  };
  const dispute = async () => {
    if (reason.trim().length < 5) { toast.error("Tell us what is still wrong."); return; }
    await ticketsRepo.dispute(ticketId, reason.trim(), employee.name);
    toast.success("Sent back to Spruceland. The technician will follow up.");
  };

  return (
    <Card className="border-primary/40 ring-1 ring-primary/20">
      <h2 className="text-sm font-bold">Approve the repair</h2>
      <p className="text-xs text-muted-foreground mt-0.5">Only sign if the scale is working properly. Your signature closes this job card.</p>
      {!disputing ? (
        <div className="mt-3 space-y-3">
          <label className="flex items-start gap-2.5 text-sm"><Checkbox checked={consent} onCheckedChange={v => setConsent(!!v)} className="mt-0.5" />I have checked the scale and the work described below.</label>
          <label className="flex items-start gap-2.5 text-sm"><Checkbox checked={confirmComplete} onCheckedChange={v => setConfirm(!!v)} className="mt-0.5" />I confirm the issue has been resolved and the work is complete.</label>
          <div className="space-y-1.5"><Label htmlFor="sn">Type your full name</Label><Input id="sn" className="h-11" value={typedName} onChange={e => setName(e.target.value)} placeholder={employee.name} /></div>
          <div className="space-y-1.5"><Label htmlFor="sr">NRC or Employee ID</Label><Input id="sr" className="h-11" value={typedRef} onChange={e => setRef(e.target.value)} placeholder="Same as you signed in with" /></div>
          {typedRef.length > 2 && errors.includes("NRC / Employee ID does not match.") && <p className="text-xs text-destructive">NRC / Employee ID does not match your sign-in.</p>}
          <Button className="w-full h-11 font-semibold" disabled={errors.length > 0} onClick={approve}>Agree — work completed</Button>
          <button type="button" onClick={() => setDisputing(true)} className="w-full text-xs text-muted-foreground underline">Not fixed? Send it back</button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="What is still not working?" />
          <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setDisputing(false)}>Cancel</Button><Button variant="destructive" onClick={dispute}>Send back</Button></div>
        </div>
      )}
    </Card>
  );
}

const D = ({ k, v }: { k: string; v: string }) => <div className="min-w-0"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold truncate">{v}</dd></div>;
const R = ({ k, v }: { k: string; v: string }) => <div><dt className="text-[11px] text-muted-foreground">{k}</dt><dd>{v}</dd></div>;
