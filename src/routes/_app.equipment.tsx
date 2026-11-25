import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { call, myOrganizationId, useLive, type Row } from "@/lib/live/api";
import { LiveBlock, Pill } from "@/components/live/LiveBlock";
import { FormDialog } from "@/components/live/FormDialog";

export const Route = createFileRoute("/_app/equipment")({
  head: () => ({ meta: [
    { title: "Equipment & ZMA — Spruceland IQ" },
    { name: "description", content: "Scale register, service schedule and ZMA verification status." },
    { property: "og:title", content: "Equipment & ZMA — Spruceland IQ" },
    { property: "og:description", content: "Scale register, service schedule and ZMA verification status." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: EquipmentPage,
});

const tone = (s: string) => (s === "valid" || s === "compliant" ? "ok" : s === "expired" || s === "overdue" || s === "failed" ? "bad" : "warn");

function EquipmentPage() {
  const [q, setQ] = useState("");
  const eq = useLive<{ list: Row[]; compliance: Row[] }>(async (org) => {
    if (!org) throw new Error("Your account isn't linked to a company yet.");
    const [list, compliance] = await Promise.all([
      call<Row[]>("list_equipment", { p_actor_organization_id: org, p_owner_organization_id: null, p_limit: 500, p_offset: 0 }),
      call<Row[]>("list_equipment_compliance_status", { p_actor_organization_id: org, p_owner_organization_id: null, p_due_within_days: 60 }),
    ]);
    return { list: list ?? [], compliance: compliance ?? [] };
  });
  const sched = useLive<Row[]>(async (org) => org ? call("list_equipment_maintenance_schedule", { p_actor_organization_id: org, p_owner_organization_id: null, p_limit: 200, p_offset: 0 }) : []);
  const [verifying, setVerifying] = useState<Row | null>(null);
  const comp = new Map((eq.data?.compliance ?? []).map((c) => [c["equipment_id"], c]));
  const list = (eq.data?.list ?? []).filter((e) => `${e["equipment_name"]} ${e["serial_number"]} ${e["asset_tag"] ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const count = (s: string) => (eq.data?.compliance ?? []).filter((c) => c["compliance_status"] === s).length;

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Equipment & ZMA</h1>
        <p className="text-[11px] text-muted-foreground">Every scale you service, its next service and its ZMA verification.</p>
      </header>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["Scales", eq.data?.list.length ?? 0], ["ZMA valid", count("valid")], ["Due in 60 days", count("due_soon")], ["Expired / none", count("expired") + count("missing")]].map(([l, v]) => (
          <div key={l} className="rounded-xl border bg-card p-2.5"><p className="text-[10px] text-muted-foreground">{l}</p><p className="text-lg font-extrabold text-primary">{v}</p></div>
        ))}
      </div>
      <LiveBlock title="Scale register" loading={eq.loading} error={eq.error} empty={!eq.data?.list.length} onReload={eq.reload}
        actions={<Input className="h-8 w-40 text-xs" placeholder="Search serial or name" value={q} onChange={(e) => setQ(e.target.value)} />}>
        <ul className="divide-y">
          {list.map((e) => { const c = comp.get(e["id"]); return (
            <li key={e["id"]} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="text-xs font-bold">{e["equipment_name"]} <span className="font-normal text-muted-foreground">S/N {e["serial_number"]}</span> <Pill>{e["lifecycle_status"]}</Pill></p>
                <p className="text-[11px] text-muted-foreground">ZMA: {c ? <><Pill tone={tone(c["compliance_status"]) as any}>{String(c["compliance_status"]).replace("_", " ")}</Pill> {c["valid_until"] && `until ${c["valid_until"]}`}</> : "no record"}</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setVerifying(e)}>Record ZMA verification</Button>
            </li>); })}
        </ul>
      </LiveBlock>
      <LiveBlock title="Service schedule" hint="Planned maintenance, due and overdue." loading={sched.loading} error={sched.error} empty={!sched.data?.length} onReload={sched.reload}>
        <ul className="divide-y">
          {(sched.data ?? []).map((s, i) => (
            <li key={s["occurrence_id"] ?? s["id"] ?? i} className="flex items-center justify-between gap-2 py-2 text-xs">
              <span className="font-semibold">{s["equipment_name"] ?? s["plan_name"] ?? "Service"}</span>
              <span className="text-muted-foreground">{s["due_date"] ?? s["scheduled_for"]} <Pill tone={tone(s["due_status"] ?? s["status"]) as any}>{String(s["due_status"] ?? s["status"] ?? "").replace("_", " ")}</Pill></span>
            </li>
          ))}
        </ul>
      </LiveBlock>
      <FormDialog open={!!verifying} title={`ZMA verification · ${verifying?.["serial_number"] ?? ""}`} onClose={() => setVerifying(null)}
        fields={[{ name: "on", label: "Verified on", type: "date", required: true }, { name: "until", label: "Valid until", type: "date", required: true },
          { name: "outcome", label: "Outcome", type: "select", required: true, options: [{ value: "passed", label: "Passed" }, { value: "conditional", label: "Conditional" }, { value: "failed", label: "Failed" }] },
          { name: "cert", label: "Certificate number" }, { name: "seal", label: "Seal number" }, { name: "notes", label: "Notes" }]}
        onSubmit={async (v) => {
          try {
            const org = myOrganizationId;
            await call("record_equipment_verification", { p_actor_organization_id: await org(), p_equipment_id: verifying!["id"], p_verified_on: v["on"], p_valid_until: v["until"],
              p_outcome: v["outcome"], p_certificate_number: v["cert"] || null, p_seal_number: v["seal"] || null, p_notes: v["notes"] || null, p_authority: "ZMA" });
            toast.success("Verification recorded"); void eq.reload();
          } catch (e) { toast.error((e as Error).message); throw e; }
        }} />
    </div>
  );
}
