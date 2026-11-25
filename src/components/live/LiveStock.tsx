import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { call, useLive, type Row } from "@/lib/live/api";
import { LiveBlock, Pill } from "./LiveBlock";
import { FormDialog } from "./FormDialog";

const zmw = (n: unknown) => `K${Number(n ?? 0).toLocaleString()}`;

export function LiveInventory() {
  const { data, error, loading, reload } = useLive<Row[]>(() => call("list_inventory", { p_search: null, p_low_stock_only: false, p_limit: 300, p_offset: 0 }));
  const [moving, setMoving] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const rows = data ?? [];
  return (
    <LiveBlock title="Live stock" hint="Stock changes only through recorded movements." loading={loading} error={error} empty={!rows.length} onReload={reload}
      actions={<Button size="sm" onClick={() => setAdding(true)}>Add product</Button>}>
      <ul className="divide-y">
        {rows.map((p) => (
          <li key={p["id"]} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="text-xs font-bold">{p["name"]} <span className="font-normal text-muted-foreground">{p["sku"]}</span> {p["is_low_stock"] && <Pill tone="bad">Low</Pill>} <Pill tone={p["is_published"] ? "ok" : "muted"}>{p["is_published"] ? "In store" : "Hidden"}</Pill></p>
              <p className="text-[11px] text-muted-foreground">Available {p["quantity_available"]} · reserved {p["quantity_reserved"]} · sells {zmw(p["selling_price"])}{p["cost_price"] != null && ` · cost ${zmw(p["cost_price"])}`}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setMoving(p)}>Move stock</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={async () => {
                try { await call("save_product", productArgs(p, { p_is_published: !p["is_published"] })); toast.success("Product updated"); void reload(); } catch (e) { toast.error((e as Error).message); }
              }}>{p["is_published"] ? "Unpublish" : "Publish"}</Button>
            </div>
          </li>
        ))}
      </ul>
      <FormDialog open={!!moving} title={`Stock movement · ${moving?.["name"] ?? ""}`} onClose={() => setMoving(null)}
        fields={[{ name: "type", label: "Type", type: "select", required: true, options: [{ value: "receipt", label: "Received" }, { value: "dispatch", label: "Issued / dispatched" }, { value: "adjustment", label: "Adjustment (+/-)" }] },
          { name: "qty", label: "Quantity", type: "number", required: true }, { name: "reason", label: "Reason" }, { name: "ref", label: "Reference" }]}
        onSubmit={async (v) => {
          try { await call("record_stock_movement", { p_product_id: moving!["id"], p_movement_type: v["type"], p_quantity: Number(v["qty"]), p_reason: v["reason"] || null, p_reference: v["ref"] || null });
            toast.success("Stock recorded"); void reload(); } catch (e) { toast.error((e as Error).message); throw e; }
        }} />
      <FormDialog open={adding} title="New product" onClose={() => setAdding(false)}
        fields={[{ name: "sku", label: "SKU", required: true }, { name: "name", label: "Name", required: true }, { name: "price", label: "Selling price (ZMW)", type: "number", required: true },
          { name: "cost", label: "Cost price (staff only)", type: "number" }, { name: "low", label: "Low-stock level", type: "number", initial: "5" }]}
        onSubmit={async (v) => {
          try { await call("save_product", { p_product_id: null, p_sku: v["sku"], p_name: v["name"], p_category_id: null, p_selling_price: Number(v["price"]), p_currency: "ZMW", p_unit: "each",
              p_description: null, p_cost_price: v["cost"] ? Number(v["cost"]) : null, p_low_stock_threshold: Number(v["low"] || 0), p_is_active: true, p_is_published: false, p_image_urls: [], p_supplier_reference: null, p_internal_notes: null });
            toast.success("Product added"); void reload(); } catch (e) { toast.error((e as Error).message); throw e; }
        }} />
    </LiveBlock>
  );
}

function productArgs(p: Row, over: Row) {
  return { p_product_id: p["id"], p_sku: p["sku"], p_name: p["name"], p_category_id: p["category_id"], p_selling_price: p["selling_price"], p_currency: p["currency"], p_unit: p["unit"],
    p_description: p["description"], p_cost_price: p["cost_price"], p_low_stock_threshold: p["low_stock_threshold"], p_is_active: p["is_active"], p_is_published: p["is_published"],
    p_image_urls: p["image_urls"] ?? [], p_supplier_reference: p["supplier_reference"], p_internal_notes: p["internal_notes"], ...over };
}

const ORDER_NEXT: Record<string, string[]> = { pending: ["confirm", "reject", "cancel"], confirmed: ["process", "dispatch", "cancel"], processing: ["dispatch", "cancel"], dispatched: ["deliver"], delivered: ["complete"] };

export function LiveOrders() {
  const { data, error, loading, reload } = useLive<Row[]>(() => call("list_store_orders", { p_organization_id: null, p_status: null, p_limit: 200, p_offset: 0 }));
  const rows = data ?? [];
  return (
    <LiveBlock title="Live client orders" hint="Confirming reserves stock; cancelling releases it. Prices are set by the server." loading={loading} error={error} empty={!rows.length} onReload={reload}>
      <ul className="divide-y">
        {rows.map((o) => (
          <li key={o["id"]} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="text-xs font-bold">{o["order_number"] ?? o["reference"] ?? String(o["id"]).slice(0, 8)} · {o["client_name"]} <Pill tone="ok">{o["status"]}</Pill></p>
              <p className="truncate text-[11px] text-muted-foreground">{(o["lines"] as Row[]).map((l) => `${l["quantity"]}× ${l["product_name"]}`).join(", ")} · {zmw(o["subtotal"])}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(ORDER_NEXT[o["status"]] ?? []).map((a) => (
                <Button key={a} size="sm" variant={a === "cancel" || a === "reject" ? "outline" : "default"} className="h-7 text-[11px] capitalize" onClick={async () => {
                  const reason = a === "cancel" || a === "reject" ? window.prompt("Reason")?.trim() : null;
                  if ((a === "cancel" || a === "reject") && !reason) return;
                  try { await call("update_store_order", { p_order_id: o["id"], p_action: a, p_reason: reason }); toast.success("Order updated"); void reload(); } catch (e) { toast.error((e as Error).message); }
                }}>{a}</Button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </LiveBlock>
  );
}
