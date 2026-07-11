import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CLIENTS } from "@/data/clients";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatZMW } from "@/lib/session";
import { differenceInDays, format, parseISO } from "date-fns";
import { Search, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/clients")({
  head: () => ({ meta: [{ title: "Clients — Spruceland Ops" }, { name: "description", content: "All Spruceland clients across Zambia — scales, weighbridges, branches and service schedule." }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const [q, setQ] = useState("");
  const list = CLIENTS.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl tv:text-4xl font-extrabold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">{CLIENTS.length} active clients across Lusaka & Ndola operations.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients…" className="pl-9" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 tv:grid-cols-4 gap-4">
        {list.map(c => {
          const daysToService = differenceInDays(parseISO(c.nextServiceDue), new Date());
          const totalScales = c.scales.reduce((a: number, s: any) => a + s.count, 0);
          return (
            <Link key={c.id} to="/clients/$id" params={{ id: c.id }}>
              <Card className="bg-card border-border h-full hover:border-primary/60 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg leading-tight truncate">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.industry}</p>
                    </div>
                    <Badge variant="outline" className={c.paymentStatus === "Paid" ? "bg-success/15 text-success border-success/40" : c.paymentStatus === "Pending" ? "bg-warning/15 text-warning border-warning/40" : "bg-destructive/15 text-destructive border-destructive/40"}>{c.paymentStatus}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{c.branches.length} branches · {c.office} office</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat n={totalScales} label="Scales" />
                    <Stat n={c.scales.find(s => s.type === "Weighbridge")?.count ?? 0} label="Weighbridge" />
                    <Stat n={c.cadence} label="Cadence" small />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Next service</span>
                    <Badge variant="outline" className={daysToService <= 7 ? "bg-destructive/15 text-destructive border-destructive/40" : daysToService <= 30 ? "bg-warning/15 text-warning border-warning/40" : "bg-info/15 text-info border-info/40"}>{daysToService <= 0 ? "Overdue" : `${daysToService}d`}</Badge>
                  </div>
                  {c.outstandingZMW > 0 && (
                    <div className="text-xs text-destructive">Outstanding: {formatZMW(c.outstandingZMW)}</div>
                  )}
                  {c.activeProject && (
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-2 text-xs">
                      <div className="font-semibold text-primary">Active project</div>
                      <div className="text-muted-foreground">{c.activeProject.title} — {c.activeProject.stage} (wk {c.activeProject.weeksInStage})</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ n, label, small }: { n: any; label: string; small?: boolean }) {
  return (
    <div className="rounded-md bg-background/50 border border-border py-2">
      <div className={small ? "text-xs font-bold" : "text-base font-bold"}>{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
