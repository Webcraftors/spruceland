import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useSession, formatZMW } from "@/lib/session";
import { scopedInventory } from "@/lib/scope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Package, AlertTriangle, Plus, MoreVertical, Pencil, Trash2, Minus, Search } from "lucide-react";
import { InventoryFormDialog } from "@/components/CrudDialogs";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Spruceland Ops" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const store = useStore();
  const { session } = useSession();
  const [q, setQ] = useState("");
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  if (!session) return null;

  const scoped = scopedInventory(store.inventory, session.role, session.location);
  const items = scoped.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase()));
  const totalValue = scoped.reduce((a, i) => a + i.onHand * i.unitCostZMW, 0);
  const low = scoped.filter(i => i.onHand <= i.reorder);

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Inventory</h1>
          <p className="text-[11px] text-muted-foreground">Parts across warehouses.</p>
        </div>
        <Button size="sm" className="h-8" onClick={() => { setEditing(null); setDlgOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1" />New item</Button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Kpi icon={Package} label="SKUs" value={scoped.length.toString()} />
        <Kpi icon={AlertTriangle} label="Low" value={low.length.toString()} tone="warn" />
        <Kpi icon={Package} label="Value" value={formatZMW(totalValue)} tone="primary" />
      </div>

      {low.length > 0 && (
        <Card className="bg-warning/10 border-warning/40">
          <CardHeader className="p-2.5 pb-1"><CardTitle className="text-warning flex items-center gap-1.5 text-xs"><AlertTriangle className="h-3.5 w-3.5" />Reorder alerts</CardTitle></CardHeader>
          <CardContent className="p-2.5 pt-0 flex flex-wrap gap-1">
            {low.map(i => <Badge key={i.id} variant="outline" className="text-[10px] bg-warning/15 text-warning border-warning/40">{i.name.slice(0, 24)} — {i.onHand} left</Badge>)}
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search SKU or name…" value={q} onChange={e => setQ(e.target.value)} className="pl-8 h-8 text-xs" />
      </div>

      {/* Desktop table */}
      <Card className="bg-card border-border hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-accent/50 text-left">
              <tr>
                <th className="p-2">SKU</th><th className="p-2">Item</th><th className="p-2">Category</th>
                <th className="p-2">Loc</th><th className="p-2 text-right">On hand</th>
                <th className="p-2 text-right">Reorder</th><th className="p-2 text-right">Unit</th>
                <th className="p-2 text-right">Value</th><th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => {
                const isLow = i.onHand <= i.reorder;
                return (
                  <tr key={i.id} className={`border-t border-border ${isLow ? "bg-warning/5" : ""}`}>
                    <td className="p-2 font-mono text-[10px]">{i.sku}</td>
                    <td className="p-2 font-medium">{i.name}</td>
                    <td className="p-2"><Badge variant="outline" className="text-[10px]">{i.category}</Badge></td>
                    <td className="p-2">{i.location}</td>
                    <td className={`p-2 text-right font-semibold ${isLow ? "text-warning" : ""}`}>
                      <div className="inline-flex items-center gap-1">
                        <button className="p-0.5 rounded hover:bg-accent" onClick={() => store.adjustStock(i.id, -1)}><Minus className="h-3 w-3" /></button>
                        {i.onHand}
                        <button className="p-0.5 rounded hover:bg-accent" onClick={() => store.adjustStock(i.id, +1)}><Plus className="h-3 w-3" /></button>
                      </div>
                    </td>
                    <td className="p-2 text-right text-muted-foreground">{i.reorder}</td>
                    <td className="p-2 text-right">{formatZMW(i.unitCostZMW)}</td>
                    <td className="p-2 text-right">{formatZMW(i.onHand * i.unitCostZMW)}</td>
                    <td className="p-2">
                      <RowMenu onEdit={() => { setEditing(i); setDlgOpen(true); }} onDelete={() => setConfirmDel(i.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Mobile card list */}
      <div className="md:hidden space-y-1.5">
        {items.map(i => {
          const isLow = i.onHand <= i.reorder;
          return (
            <Card key={i.id} className={`bg-card border-border ${isLow ? "border-warning/50" : ""}`}>
              <CardContent className="p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">{i.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{i.sku}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{i.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{i.location}</span>
                    </div>
                  </div>
                  <RowMenu onEdit={() => { setEditing(i); setDlgOpen(true); }} onDelete={() => setConfirmDel(i.id)} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded border border-border" onClick={() => store.adjustStock(i.id, -1)}><Minus className="h-2.5 w-2.5" /></button>
                    <span className={`font-bold ${isLow ? "text-warning" : ""}`}>{i.onHand}</span>
                    <button className="p-1 rounded border border-border" onClick={() => store.adjustStock(i.id, +1)}><Plus className="h-2.5 w-2.5" /></button>
                    <span className="text-muted-foreground ml-1">/ reorder {i.reorder}</span>
                  </div>
                  <span className="font-semibold">{formatZMW(i.onHand * i.unitCostZMW)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <InventoryFormDialog open={dlgOpen} onOpenChange={setDlgOpen} editing={editing} />
      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this item?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDel) { store.deleteInventory(confirmDel); toast.success("Item deleted"); setConfirmDel(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button className="p-0.5 hover:bg-accent rounded"><MoreVertical className="h-3 w-3" /></button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}><Pencil className="h-3 w-3 mr-2" />Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "warn" | "primary" }) {
  const cls = tone === "warn" ? "text-warning" : tone === "primary" ? "text-primary" : "";
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
      <Icon className={`h-4 w-4 ${cls}`} />
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-xs md:text-sm font-bold truncate ${cls}`}>{value}</div>
      </div>
    </div>
  );
}
