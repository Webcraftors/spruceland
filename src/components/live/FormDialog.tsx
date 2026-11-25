import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Field = { name: string; label: string; type?: "text" | "date" | "number" | "select"; options?: { value: string; label: string }[]; required?: boolean; initial?: string };

export function FormDialog({ open, title, fields, onClose, onSubmit }: {
  open: boolean; title: string; fields: Field[]; onClose: () => void; onSubmit: (v: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const get = (f: Field) => values[f.name] ?? f.initial ?? "";
  const missing = fields.some((f) => f.required && !get(f).trim());
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setValues({}); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-2.5">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1">
              <Label className="text-xs">{f.label}{f.required && " *"}</Label>
              {f.type === "select" ? (
                <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={get(f)} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
                  <option value="">Select…</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <Input type={f.type ?? "text"} value={get(f)} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={busy || missing} onClick={async () => {
            setBusy(true);
            try { await onSubmit(Object.fromEntries(fields.map((f) => [f.name, get(f)]))); setValues({}); onClose(); }
            finally { setBusy(false); }
          }}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
