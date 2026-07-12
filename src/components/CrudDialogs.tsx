import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type InventoryItem, type Order } from "@/lib/store";
import { toast } from "sonner";
import { addDays } from "date-fns";

export function InventoryFormDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: InventoryItem | null }) {
  const { addInventory, updateInventory } = useStore();
  const [f, setF] = useState<any>({ name: "", sku: "", category: "Load Cell", location: "Lusaka", onHand: 0, reorder: 5, unitCostZMW: 0 });
  useEffect(() => { if (editing) setF(editing); else setF({ name: "", sku: "", category: "Load Cell", location: "Lusaka", onHand: 0, reorder: 5, unitCostZMW: 0 }); }, [editing, open]);
  const save = () => {
    if (!f.name.trim() || !f.sku.trim()) { toast.error("Name & SKU required"); return; }
    if (editing) { updateInventory(editing.id, f); toast.success("Item updated"); }
    else { addInventory(f); toast.success("Item added"); }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Edit item" : "New inventory item"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Name"><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU"><Input value={f.sku} onChange={e => setF({ ...f, sku: e.target.value })} /></Field>
            <Field label="Category">
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Load Cell","Indicator","Junction Box","Cabling","Test Weight","Printer","Spares"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="On hand"><Input type="number" value={f.onHand} onChange={e => setF({ ...f, onHand: Number(e.target.value) })} /></Field>
            <Field label="Reorder"><Input type="number" value={f.reorder} onChange={e => setF({ ...f, reorder: Number(e.target.value) })} /></Field>
            <Field label="Unit ZMW"><Input type="number" value={f.unitCostZMW} onChange={e => setF({ ...f, unitCostZMW: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Location">
            <Select value={f.location} onValueChange={(v) => setF({ ...f, location: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Lusaka">Lusaka</SelectItem><SelectItem value="Ndola">Ndola</SelectItem></SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save" : "Add item"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OrderFormDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: Order | null }) {
  const { addOrder, updateOrder } = useStore();
  const [f, setF] = useState<any>({ supplier: "", item: "", qty: 1, totalZMW: 0, status: "Placed", eta: addDays(new Date(), 7).toISOString() });
  useEffect(() => { if (editing) setF(editing); else setF({ supplier: "", item: "", qty: 1, totalZMW: 0, status: "Placed", eta: addDays(new Date(), 7).toISOString() }); }, [editing, open]);
  const save = () => {
    if (!f.supplier.trim() || !f.item.trim()) { toast.error("Supplier & item required"); return; }
    if (editing) { updateOrder(editing.id, f); toast.success("Order updated"); }
    else { addOrder(f); toast.success("Order placed"); }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Edit order" : "New purchase order"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Supplier"><Input value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })} /></Field>
          <Field label="Item"><Input value={f.item} onChange={e => setF({ ...f, item: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qty"><Input type="number" value={f.qty} onChange={e => setF({ ...f, qty: Number(e.target.value) })} /></Field>
            <Field label="Total ZMW"><Input type="number" value={f.totalZMW} onChange={e => setF({ ...f, totalZMW: Number(e.target.value) })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Placed","In Transit","Received","Delayed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="ETA"><Input type="date" value={f.eta.slice(0, 10)} onChange={e => setF({ ...f, eta: new Date(e.target.value).toISOString() })} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save" : "Place order"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClientFormDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: any }) {
  const { addClient, updateClient } = useStore();
  const [f, setF] = useState<any>({ name: "", industry: "", cadence: "Quarterly", office: "Lusaka", paymentStatus: "Paid" });
  useEffect(() => {
    if (editing) setF({ name: editing.name, industry: editing.industry, cadence: editing.cadence, office: editing.office, paymentStatus: editing.paymentStatus });
    else setF({ name: "", industry: "", cadence: "Quarterly", office: "Lusaka", paymentStatus: "Paid" });
  }, [editing, open]);
  const save = () => {
    if (!f.name.trim()) { toast.error("Name required"); return; }
    if (editing) { updateClient(editing.id, f); toast.success("Client updated"); }
    else {
      addClient({
        ...f,
        primaryContact: { name: "TBD", phone: "", email: "" },
        lastServiced: new Date().toISOString(),
        nextServiceDue: addDays(new Date(), 30).toISOString(),
        scales: [], branches: [{ name: `${f.name} HQ`, city: f.office, province: f.office === "Lusaka" ? "Lusaka" : "Copperbelt" }],
        outstandingZMW: 0, monthlyRevenueZMW: 0,
      });
      toast.success("Client added");
    }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Edit client" : "New client"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Company name"><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Industry"><Input value={f.industry} onChange={e => setF({ ...f, industry: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cadence">
              <Select value={f.cadence} onValueChange={(v) => setF({ ...f, cadence: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Monthly","Quarterly","Bi-Annual","Annual","Ad-hoc"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Office">
              <Select value={f.office} onValueChange={(v) => setF({ ...f, office: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Lusaka">Lusaka</SelectItem><SelectItem value="Ndola">Ndola</SelectItem></SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Payment status">
            <Select value={f.paymentStatus} onValueChange={(v) => setF({ ...f, paymentStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Paid","Pending","Overdue"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save" : "Add client"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
