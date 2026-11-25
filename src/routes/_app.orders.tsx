import { LiveOrders } from "@/components/live/LiveStock";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatZMW } from "@/lib/session";
import { format, parseISO } from "date-fns";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { OrderFormDialog } from "@/components/CrudDialogs";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/orders")({
  head: () => ({ meta: [{ title: "Orders — Spruceland Ops" }] }),
  component: OrdersPage,
});

function statusCls(s: string) {
  return s === "Received" ? "bg-success/15 text-success border-success/40"
    : s === "Delayed" ? "bg-destructive/15 text-destructive border-destructive/40"
    : s === "In Transit" ? "bg-info/15 text-info border-info/40"
    : "bg-warning/15 text-warning border-warning/40";
}

function OrdersPage() {
  const store = useStore();
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Pending orders</h1>
          <p className="text-[11px] text-muted-foreground">Purchase orders and inbound shipments.</p>
        </div>
        <Button size="sm" className="h-8" onClick={() => { setEditing(null); setDlgOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1" />New order</Button>
      </header>
      <LiveOrders />

      {/* Desktop table */}
      <Card className="bg-card border-border hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-accent/50 text-left">
              <tr><th className="p-2">PO</th><th className="p-2">Supplier</th><th className="p-2">Item</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Total</th><th className="p-2">Status</th><th className="p-2">ETA</th><th className="p-2 w-8"></th></tr>
            </thead>
            <tbody>
              {store.orders.map(o => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-2 font-mono">{o.id}</td>
                  <td className="p-2">{o.supplier}</td>
                  <td className="p-2">{o.item}</td>
                  <td className="p-2 text-right">{o.qty}</td>
                  <td className="p-2 text-right font-semibold">{formatZMW(o.totalZMW)}</td>
                  <td className="p-2"><Badge variant="outline" className={`text-[10px] ${statusCls(o.status)}`}>{o.status}</Badge></td>
                  <td className="p-2 text-muted-foreground">{format(parseISO(o.eta), "d MMM")}</td>
                  <td className="p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><button className="p-0.5 rounded hover:bg-accent"><MoreVertical className="h-3 w-3" /></button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(o); setDlgOpen(true); }}><Pencil className="h-3 w-3 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { store.updateOrder(o.id, { status: "Received" }); toast.success("Marked received"); }}>Mark received</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDel(o.id)}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-1.5">
        {store.orders.map(o => (
          <Card key={o.id} className="bg-card border-border">
            <CardContent className="p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground">{o.id}</span>
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${statusCls(o.status)}`}>{o.status}</Badge>
                  </div>
                  <div className="text-xs font-semibold mt-0.5 truncate">{o.item}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{o.supplier} · Qty {o.qty}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold">{formatZMW(o.totalZMW)}</div>
                  <div className="text-[10px] text-muted-foreground">ETA {format(parseISO(o.eta), "d MMM")}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><button className="p-0.5 rounded hover:bg-accent"><MoreVertical className="h-3 w-3" /></button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditing(o); setDlgOpen(true); }}><Pencil className="h-3 w-3 mr-2" />Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { store.updateOrder(o.id, { status: "Received" }); toast.success("Marked received"); }}>Mark received</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDel(o.id)}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <OrderFormDialog open={dlgOpen} onOpenChange={setDlgOpen} editing={editing} />
      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this order?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDel) { store.deleteOrder(confirmDel); toast.success("Order deleted"); setConfirmDel(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
