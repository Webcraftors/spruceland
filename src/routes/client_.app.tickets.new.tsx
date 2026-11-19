import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Camera, X, Video, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ticketsRepo } from "@/repositories/portal-repo";
import { usePortalSession, Card } from "@/components/portal/shared";
import { assetsForSite, departmentsFor } from "@/data/portal";
import { FAULT_CATEGORIES, PRIORITIES, type Attachment, type FaultCategory, type TicketPriority } from "@/domain/types";
import { pageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client_/app/tickets/new")({
  head: () => pageMeta("Report a breakdown — Spruceland Client Portal", "Raise a breakdown ticket for a scale at your store."),
  component: NewTicket,
});

function NewTicket() {
  const { session: s } = usePortalSession();
  const navigate = useNavigate();
  const assets = useMemo(() => assetsForSite(s.clientId, s.site), [s.clientId, s.site]);
  const [assetId, setAssetId] = useState("");
  const [department, setDepartment] = useState(s.department);
  const [fault, setFault] = useState<FaultCategory | "">("");
  const [priority, setPriority] = useState<TicketPriority>("Normal");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const asset = assets.find(a => a.id === assetId);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).slice(0, 6 - files.length).forEach(file => {
      const kind = file.type.startsWith("video") ? "video" : "image";
      const base: Attachment = { id: `${file.name}-${file.size}`, name: file.name, kind, size: file.size };
      if (kind === "image" && file.size < 400_000) {
        const r = new FileReader();
        r.onload = () => setFiles(p => [...p, { ...base, preview: String(r.result) }]);
        r.readAsDataURL(file);
      } else setFiles(p => [...p, { ...base, preview: kind === "image" ? URL.createObjectURL(file) : undefined }]);
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !fault || description.trim().length < 5) { toast.error("Choose the scale, the fault and describe the problem."); return; }
    setBusy(true);
    const t = await ticketsRepo.create({
      clientId: s.clientId, clientName: s.clientName, site: s.site, department,
      asset: { id: asset.id, make: asset.make, model: asset.model, serial: asset.serial, type: asset.type },
      fault, priority, description: description.trim(),
      attachments: files.map(f => (f.preview?.startsWith("blob:") ? { ...f, preview: undefined } : f)),
      reportedBy: { name: s.employeeName, employeeRef: s.employeeRef },
    });
    toast.success(`Ticket ${t.id} raised. Spruceland has been notified.`);
    navigate({ to: "/client/app/tickets/$id", params: { id: t.id } });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-extrabold">Report a breakdown</h1>
      <Card>
        <div className="flex items-start gap-3 text-sm">
          <Store className="h-4 w-4 text-primary mt-0.5" />
          <div className="min-w-0"><div className="font-semibold">{s.site.name}</div><div className="text-xs text-muted-foreground">{s.clientName} · {s.site.city}, {s.site.province} Province</div></div>
        </div>
      </Card>

      <div className="space-y-2">
        <Label>Which scale?</Label>
        <Select value={assetId} onValueChange={v => { setAssetId(v); const a = assets.find(x => x.id === v); if (a) setDepartment(a.department); }}>
          <SelectTrigger className="h-12"><SelectValue placeholder="Select equipment" /></SelectTrigger>
          <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.make} {a.model} · {a.department} · {a.serial}</SelectItem>)}</SelectContent>
        </Select>
        {asset && (
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
            <Field k="Make" v={asset.make} /><Field k="Model" v={asset.model} /><Field k="Serial no." v={asset.serial} /><Field k="Type" v={`${asset.type} · ${asset.capacity}`} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Department</Label>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
          <SelectContent>{departmentsFor(s.clientId).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>What's wrong?</Label>
        <div className="flex flex-wrap gap-2">
          {FAULT_CATEGORIES.map(f => <button type="button" key={f} onClick={() => setFault(f)} className={cn("rounded-full border px-3 h-8 text-xs", fault === f ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>{f}</button>)}
        </div>
      </div>

      <div className="space-y-2">
        <Label>How badly is it affecting work?</Label>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITIES.map(p => <button type="button" key={p} onClick={() => setPriority(p)} className={cn("rounded-lg border h-10 text-xs font-semibold", priority === p ? (p === "Critical" ? "bg-destructive text-destructive-foreground border-destructive" : "bg-primary text-primary-foreground border-primary") : "bg-card border-border")}>{p}</button>)}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="d">Describe the problem</Label>
        <Textarea id="d" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="What happened, when it started, any error shown on the display…" />
      </div>

      <div className="space-y-2">
        <Label>Photos or video</Label>
        <div className="grid grid-cols-3 gap-2">
          {files.map(f => (
            <div key={f.id} className="relative aspect-square rounded-lg border border-border bg-muted overflow-hidden grid place-items-center">
              {f.preview ? <img src={f.preview} alt={f.name} className="h-full w-full object-cover" /> : <div className="text-center p-1"><Video className="h-5 w-5 mx-auto text-muted-foreground" /><div className="text-[9px] truncate">{f.name}</div></div>}
              <button type="button" aria-label="Remove" onClick={() => setFiles(p => p.filter(x => x.id !== f.id))} className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-full bg-background/90"><X className="h-3 w-3" /></button>
            </div>
          ))}
          {files.length < 6 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-border grid place-items-center text-muted-foreground cursor-pointer hover:border-primary/50">
              <div className="text-center"><Camera className="h-5 w-5 mx-auto" /><div className="text-[10px] mt-1">Add</div></div>
              <input type="file" accept="image/*,video/*" capture="environment" multiple className="sr-only" onChange={e => addFiles(e.target.files)} />
            </label>
          )}
        </div>
      </div>

      <Button type="submit" disabled={busy} className="w-full h-12 text-base font-semibold">Raise ticket</Button>
    </form>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return <div className="min-w-0"><div className="text-muted-foreground">{k}</div><div className="font-semibold truncate">{v}</div></div>;
}
