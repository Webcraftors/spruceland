import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { call, useLive, type Row } from "@/lib/live/api";
import { LiveBlock, Pill, ask } from "./LiveBlock";
import { FormDialog } from "./FormDialog";

const NEXT: Record<string, { action: string; label: string; reason?: boolean }[]> = {
  open: [{ action: "pickup", label: "Pick up" }],
  assigned: [{ action: "accept", label: "Accept" }, { action: "decline", label: "Decline", reason: true }],
  accepted: [{ action: "en_route", label: "En route" }, { action: "start", label: "On site" }, { action: "return", label: "Return", reason: true }],
  en_route: [{ action: "start", label: "On site" }, { action: "hold", label: "Hold", reason: true }],
  in_progress: [{ action: "complete", label: "Complete" }, { action: "hold", label: "Hold", reason: true }],
  on_hold: [{ action: "resume", label: "Resume" }],
};

export function LiveJobs() {
  const [view, setView] = useState<"all" | "available" | "mine">("all");
  const { data, error, loading, reload } = useLive<Row[]>(() => call("list_jobs", { p_view: view, p_limit: 200, p_offset: 0 }), [view]);
  const [completing, setCompleting] = useState<Row | null>(null);
  const rows = data ?? [];

  async function act(job: Row, a: { action: string; reason?: boolean }) {
    if (a.action === "complete") return setCompleting(job);
    try {
      if (a.action === "pickup") await call("pickup_job", { p_job_id: job["id"] });
      else {
        const reason = a.reason ? ask("Reason (required)") : null;
        if (a.reason && !reason) return;
        await call("transition_job", { p_job_id: job["id"], p_action: a.action, p_reason: reason });
      }
      toast.success(`Job ${job["reference"]} updated`); void reload();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <LiveBlock title="Live jobs" hint="Real jobs from breakdown reports and planned services." loading={loading} error={error} empty={!rows.length} onReload={reload}
      actions={<select className="h-8 rounded-md border bg-background px-2 text-xs" value={view} onChange={(e) => setView(e.target.value as any)}>
        <option value="all">All jobs</option><option value="available">Available</option><option value="mine">Mine</option></select>}>
      <ul className="divide-y">
        {rows.map((j) => (
          <li key={j["id"]} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <p className="text-xs font-bold">{j["reference"]} · {j["client_name"] ?? "—"} <Pill tone={j["is_overdue"] ? "bad" : "ok"}>{String(j["status"]).replace("_", " ")}</Pill> {j["priority"] && <Pill>{j["priority"]}</Pill>}</p>
              <p className="truncate text-[11px] text-muted-foreground">{j["location_name"] ?? ""} {j["equipment_name"] ? `· ${j["equipment_name"]}` : ""} · {j["technician_name"] ?? "Unassigned"} · {j["description"]}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(NEXT[j["status"]] ?? []).map((a) => <Button key={a.action} size="sm" variant={a.reason ? "outline" : "default"} className="h-7 text-[11px]" onClick={() => act(j, a)}>{a.label}</Button>)}
              {j["status"] === "closed" && <a className="text-[11px] text-primary underline" href={`/jobcard/${j["id"]}`}>Job card</a>}
            </div>
          </li>
        ))}
      </ul>
      <FormDialog open={!!completing} title={`Complete ${completing?.["reference"] ?? ""}`} onClose={() => setCompleting(null)}
        fields={[
          { name: "fault", label: "Fault identified", required: true },
          { name: "work", label: "Work carried out", required: true },
          { name: "outcome", label: "Outcome", type: "select", required: true, options: [
            { value: "fully_resolved", label: "Fully repaired" }, { value: "partially_resolved", label: "Partly repaired (follow-up job)" }, { value: "not_resolved", label: "Not repaired" }] },
          { name: "method", label: "Client sign-off", type: "select", required: true, options: [
            { value: "physical", label: "Paper job card" }, { value: "none", label: "No signature" }] },
          { name: "rep", label: "Client representative name" },
          { name: "ref", label: "Paper card number / reason for no signature" },
          { name: "rec", label: "Recommendations" },
        ]}
        onSubmit={async (v) => {
          try {
            await call("complete_job", { p_job_id: completing!["id"], p_fault_identified: v["fault"], p_work_carried_out: v["work"], p_repair_outcome: v["outcome"],
              p_signature_method: v["method"], p_client_representative_name: v["rep"] || null, p_recommendations: v["rec"] || null,
              p_physical_card_reference: v["method"] === "physical" ? v["ref"] : null, p_no_signature_reason: v["method"] === "none" ? v["ref"] : null });
            toast.success("Job card saved"); void reload();
          } catch (e) { toast.error((e as Error).message); throw e; }
        }} />
    </LiveBlock>
  );
}
