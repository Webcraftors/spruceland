import { createFileRoute } from "@tanstack/react-router";
import { INVENTORY } from "@/data/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatZMW } from "@/lib/session";
import { Package, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Spruceland Ops" }, { name: "description", content: "Parts and equipment stock across Lusaka and Ndola warehouses." }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const totalValue = INVENTORY.reduce((a, i) => a + i.onHand * i.unitCostZMW, 0);
  const low = INVENTORY.filter(i => i.onHand <= i.reorder);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Parts, indicators and test weights across warehouses.</p>
        </div>
        <div className="flex gap-3">
          <Kpi icon={Package} label="SKUs" value={INVENTORY.length.toString()} />
          <Kpi icon={AlertTriangle} label="Low stock" value={low.length.toString()} tone="warn" />
          <Kpi icon={Package} label="Stock value" value={formatZMW(totalValue)} tone="primary" />
        </div>
      </header>

      {low.length > 0 && (
        <Card className="bg-warning/10 border-warning/40">
          <CardHeader><CardTitle className="text-warning flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Reorder alerts</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {low.map(i => <Badge key={i.id} variant="outline" className="bg-warning/15 text-warning border-warning/40">{i.name} — {i.onHand} left (reorder at {i.reorder})</Badge>)}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 text-left">
              <tr>
                <th className="p-3">SKU</th><th className="p-3">Item</th><th className="p-3">Category</th>
                <th className="p-3">Location</th><th className="p-3 text-right">On hand</th>
                <th className="p-3 text-right">Reorder at</th><th className="p-3 text-right">Unit</th><th className="p-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {INVENTORY.map(i => {
                const isLow = i.onHand <= i.reorder;
                return (
                  <tr key={i.id} className={`border-t border-border ${isLow ? "bg-warning/5" : ""}`}>
                    <td className="p-3 font-mono text-xs">{i.sku}</td>
                    <td className="p-3 font-medium">{i.name}</td>
                    <td className="p-3"><Badge variant="outline">{i.category}</Badge></td>
                    <td className="p-3">{i.location}</td>
                    <td className={`p-3 text-right font-semibold ${isLow ? "text-warning" : ""}`}>{i.onHand}</td>
                    <td className="p-3 text-right text-muted-foreground">{i.reorder}</td>
                    <td className="p-3 text-right">{formatZMW(i.unitCostZMW)}</td>
                    <td className="p-3 text-right">{formatZMW(i.onHand * i.unitCostZMW)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "warn" | "primary" }) {
  const cls = tone === "warn" ? "text-warning" : tone === "primary" ? "text-primary" : "";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <Icon className={`h-5 w-5 ${cls}`} />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-lg font-bold ${cls}`}>{value}</div>
      </div>
    </div>
  );
}
