import { createFileRoute } from "@tanstack/react-router";
import { ORDERS } from "@/data/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatZMW } from "@/lib/session";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_app/orders")({
  head: () => ({ meta: [{ title: "Orders — Spruceland Ops" }] }),
  component: () => (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Pending orders</h1>
        <p className="text-sm text-muted-foreground">Purchase orders and inbound shipments.</p>
      </header>
      <Card className="bg-card border-border">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 text-left">
              <tr><th className="p-3">PO</th><th className="p-3">Supplier</th><th className="p-3">Item</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Total</th><th className="p-3">Status</th><th className="p-3">ETA</th></tr>
            </thead>
            <tbody>
              {ORDERS.map(o => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3 font-mono">{o.id}</td>
                  <td className="p-3">{o.supplier}</td>
                  <td className="p-3">{o.item}</td>
                  <td className="p-3 text-right">{o.qty}</td>
                  <td className="p-3 text-right font-semibold">{formatZMW(o.totalZMW)}</td>
                  <td className="p-3"><Badge variant="outline" className={o.status === "Received" ? "bg-success/15 text-success border-success/40" : o.status === "Delayed" ? "bg-destructive/15 text-destructive border-destructive/40" : o.status === "In Transit" ? "bg-info/15 text-info border-info/40" : "bg-warning/15 text-warning border-warning/40"}>{o.status}</Badge></td>
                  <td className="p-3 text-muted-foreground">{format(parseISO(o.eta), "d MMM")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  ),
});
