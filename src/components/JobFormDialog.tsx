import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, newJobTemplate, type Job } from "@/lib/store";
import { TECHNICIANS } from "@/data/technicians";
import { JOB_STATUSES } from "@/data/jobs";
import { toast } from "sonner";
import { addDays } from "date-fns";

export function JobFormDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: Job | null }) {
  const { addJob, updateJob, clients } = useStore();
  const [form, setForm] = useState<any>(newJobTemplate());

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title, clientId: editing.clientId, branch: editing.branch,
        location: editing.location, type: editing.type, status: editing.status,
        priority: editing.priority, progress: editing.progress,
        technicianIds: editing.technicianIds, dueAt: editing.dueAt, notes: editing.notes,
      });
    } else {
      setForm({ ...newJobTemplate(), dueAt: addDays(new Date(), 7).toISOString() });
    }
  }, [editing, open]);

  const save = () => {
    if (!form.title.trim() || !form.clientId) { toast.error("Title and client are required"); return; }
    if (editing) { updateJob(editing.id, form); toast.success("Job updated"); }
    else { addJob(form); toast.success("Job created"); }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit job" : "New job"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client">
              <Select value={form.clientId} onValueChange={(v) => { const c = clients.find(x => x.id === v); setForm({ ...form, clientId: v, location: c?.office ?? form.location, branch: c?.branches[0]?.name ?? "" }); }}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Branch"><Input value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Type">
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Delivery","Installation","Service","Calibration","Breakdown","Assembly","Inspection"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Low","Normal","High","Escalated"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Lusaka">Lusaka</SelectItem><SelectItem value="Ndola">Ndola</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="Due date"><Input type="date" value={form.dueAt.slice(0, 10)} onChange={e => setForm({ ...form, dueAt: new Date(e.target.value).toISOString() })} /></Field>
          </div>
          <Field label="Technicians">
            <div className="flex flex-wrap gap-1.5">
              {TECHNICIANS.map(t => {
                const on = form.technicianIds.includes(t.id);
                return (
                  <button key={t.id} type="button" onClick={() => setForm({ ...form, technicianIds: on ? form.technicianIds.filter((x: string) => x !== t.id) : [...form.technicianIds, t.id] })}
                    className={`text-[11px] rounded-full border px-2 py-0.5 ${on ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>{t.avatarInitials} {t.name.split(" ")[0]}</button>
                );
              })}
            </div>
          </Field>
          <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save changes" : "Create job"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
