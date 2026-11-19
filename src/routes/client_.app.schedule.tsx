import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Wrench, ShieldCheck } from "lucide-react";
import { usePortalSession, DueBadge, fmtDate, Card } from "@/components/portal/shared";
import { assetsForSite } from "@/data/portal";
import { CLIENTS } from "@/data/clients";
import { pageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client_/app/schedule")({
  head: () => pageMeta("Schedule — Spruceland Client Portal", "Upcoming Spruceland service visits and Zambia Metrology Agency verification dates for your scales."),
  component: Schedule,
});

function Schedule() {
  const { session: s } = usePortalSession();
  const [tab, setTab] = useState<"service" | "zma">("service");
  const assets = useMemo(() => assetsForSite(s.clientId, s.site), [s.clientId, s.site]);
  const cadence = CLIENTS.find(c => c.id === s.clientId)?.cadence ?? "Quarterly";
  const key = tab === "service" ? "nextServiceDue" : "zmaDue";
  const sorted = [...assets].sort((a, b) => a[key].localeCompare(b[key]));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Schedule</h1>
      <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
        {([["service", "Spruceland service", Wrench], ["zma", "ZMA verification", ShieldCheck]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("flex items-center justify-center gap-1.5 rounded-lg h-10 text-xs font-semibold", tab === k ? "bg-card shadow-sm text-primary" : "text-muted-foreground")}><I className="h-4 w-4" />{l}</button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {tab === "service" ? `Your contract: ${cadence} preventive maintenance by Spruceland.` : "Legal trade-use verification by the Zambia Metrology Agency, every 12 months."}
      </p>
      <ul className="space-y-2.5">{sorted.map(a => (
        <li key={a.id}><Card>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><div className="text-sm font-semibold truncate">{a.make} {a.model}</div><div className="text-[11px] text-muted-foreground truncate">{a.type} · {a.capacity} · {a.department} · {a.serial}</div></div>
            <DueBadge iso={a[key]} />
          </div>
          <div className="mt-2 grid grid-cols-2 text-xs gap-2">
            {tab === "service" ? <><Kv k="Last service" v={fmtDate(a.lastServiced)} /><Kv k="Next service" v={fmtDate(a.nextServiceDue)} /></>
              : <><Kv k="Certificate" v={a.zmaCertificate} /><Kv k="Due" v={fmtDate(a.zmaDue)} /></>}
          </div>
        </Card></li>))}</ul>
    </div>
  );
}
const Kv = ({ k, v }: { k: string; v: string }) => <div><div className="text-muted-foreground">{k}</div><div className="font-semibold">{v}</div></div>;
