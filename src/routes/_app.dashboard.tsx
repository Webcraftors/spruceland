import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useSession, formatZMW, can } from "@/lib/session";
import { useStore } from "@/lib/store";
import { statusColorClasses, priorityColorClasses, typeColorClasses } from "@/data/jobs";
import { TECHNICIANS } from "@/data/technicians";
import { MONTHLY_REVENUE, OFFICE_QUARTER, PROFIT_MARGIN_PCT, ARR, MRR } from "@/data/financials";
import { scopedJobs, scopedClients, scopedInventory } from "@/lib/scope";
import { differenceInDays, format, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { AlertTriangle, Wrench, Package, Clock, CircleDollarSign, Building2, Users, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Spruceland Ops" }, { name: "description", content: "Operations dashboard." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = useSession();
  const store = useStore();
  const [showAllBreakdowns, setShowAllBreakdowns] = useState(false);
  const [showAllDue, setShowAllDue] = useState(false);
  const [showAllPay, setShowAllPay] = useState(false);
  if (!session) return null;

  const showFinance = can(session.role, "financials");
  const jobs = scopedJobs(store.jobs, session.role, session.location);
  const clients = scopedClients(store.clients, session.role, session.location);
  const inventory = scopedInventory(store.inventory, session.role, session.location);

  const dueSoon = clients
    .map(c => ({ c, days: differenceInDays(parseISO(c.nextServiceDue), new Date()) }))
    .filter(x => x.days <= 30).sort((a, b) => a.days - b.days);
  const breakdowns = jobs.filter(j => j.type === "Breakdown" && j.status !== "Closed" && j.status !== "Completed");
  const escalated = jobs.filter(j => j.priority === "Escalated");
  const activeJobs = jobs.filter(j => ["In Progress","Scheduled","Awaiting Parts"].includes(j.status));
  const overdueClients = clients.filter(c => c.paymentStatus === "Overdue");
  const lowStock = inventory.filter(i => i.onHand <= i.reorder);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">{format(new Date(), "EEEE, d MMM yyyy")}</p>
          <h1 className="text-xl md:text-2xl tv:text-4xl font-extrabold tracking-tight truncate">Welcome back, {session.name.split(" ")[0]}.</h1>
        </div>
        <div className="flex gap-1.5">
          <Link to="/jobs" search={{ view: "tv" }} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">TV board</Link>
          <Link to="/jobs" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">Manage jobs</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <Kpi icon={Wrench} label="Active jobs" value={activeJobs.length.toString()} tone="info" />
        <Kpi icon={AlertTriangle} label="Escalations" value={(escalated.length + breakdowns.length).toString()} tone="danger" />
        <Kpi icon={Clock} label="Due ≤30d" value={dueSoon.length.toString()} tone="warning" />
        {showFinance ? (
          <Kpi icon={CircleDollarSign} label="Q revenue" value={formatZMW(OFFICE_QUARTER.Lusaka + OFFICE_QUARTER.Ndola)} tone="primary" />
        ) : (
          <Kpi icon={Package} label="Low stock" value={lowStock.length.toString()} tone="warning" />
        )}
      </section>

      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList className="w-full h-auto overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="breakdowns" className="text-xs">Breakdowns <Badge className="ml-1.5 h-4 px-1 text-[10px]" variant="secondary">{breakdowns.length}</Badge></TabsTrigger>
          <TabsTrigger value="service" className="text-xs">Service due <Badge className="ml-1.5 h-4 px-1 text-[10px]" variant="secondary">{dueSoon.length}</Badge></TabsTrigger>
          {showFinance && <TabsTrigger value="revenue" className="text-xs">Revenue</TabsTrigger>}
          <TabsTrigger value="team" className="text-xs">Team</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Payments <Badge className="ml-1.5 h-4 px-1 text-[10px]" variant="secondary">{overdueClients.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Live jobs</h3>
                <Link to="/jobs" className="text-[11px] text-primary hover:underline">See all →</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {activeJobs.slice(0, 6).map(j => {
                  const client = clients.find(c => c.id === j.clientId);
                  return (
                    <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="rounded-md border border-border bg-background/60 p-2.5 hover:border-primary/60">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`${statusColorClasses(j.status)} text-[10px] px-1.5 py-0`}>{j.status}</Badge>
                        <Badge variant="outline" className={`${priorityColorClasses(j.priority)} text-[10px] px-1.5 py-0`}>{j.priority}</Badge>
                      </div>
                      <div className="mt-1.5 font-semibold text-xs leading-tight line-clamp-2">{j.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{client?.name} · {j.branch}</div>
                      <Progress value={j.progress} className="mt-1.5 h-1" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdowns">
          <SectionList title="Reported breakdowns" icon={AlertTriangle} empty="No open breakdowns.">
            {(showAllBreakdowns ? breakdowns : breakdowns.slice(0, 5)).map(j => {
              const c = clients.find(x => x.id === j.clientId);
              return (
                <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="block rounded-md border border-destructive/40 bg-destructive/10 p-2.5 hover:bg-destructive/15">
                  <div className="text-xs font-semibold">{c?.name}</div>
                  <div className="text-[11px] text-muted-foreground">{j.branch}</div>
                  <div className="text-[11px] mt-1 line-clamp-2">{j.notes}</div>
                </Link>
              );
            })}
            {breakdowns.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAllBreakdowns(v => !v)}>
                {showAllBreakdowns ? "Show less" : `View ${breakdowns.length - 5} more`} <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            )}
          </SectionList>
        </TabsContent>

        <TabsContent value="service">
          <SectionList title="Service due soon" icon={Clock} empty="Nothing due in the next 30 days.">
            {(showAllDue ? dueSoon : dueSoon.slice(0, 6)).map(({ c, days }) => (
              <Link key={c.id} to="/clients/$id" params={{ id: c.id }} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/50 p-2 hover:border-primary/60">
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">{c.cadence} · {c.office}</div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${days <= 7 ? "bg-destructive/20 text-destructive border-destructive/40" : days <= 14 ? "bg-warning/20 text-warning border-warning/40" : "bg-info/20 text-info border-info/40"}`}>
                  {days <= 0 ? "Overdue" : `${days}d`}
                </Badge>
              </Link>
            ))}
            {dueSoon.length > 6 && (
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAllDue(v => !v)}>
                {showAllDue ? "Show less" : `View ${dueSoon.length - 6} more`}
              </Button>
            )}
          </SectionList>
        </TabsContent>

        {showFinance && (
          <TabsContent value="revenue">
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Revenue by office — monthly</h3>
                  <Badge variant="outline" className="text-[10px] bg-success/15 text-success border-success/40">Margin {PROFIT_MARGIN_PCT}%</Badge>
                </div>
                <div className="h-[240px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MONTHLY_REVENUE}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => formatZMW(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="lusaka" name="Lusaka" fill="var(--chart-1)" radius={[3,3,0,0]} />
                      <Bar dataKey="ndola" name="Ndola" fill="var(--chart-2)" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-right mt-1"><Link to="/financials" className="text-[11px] text-primary hover:underline">Full financials →</Link></div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="team">
          <SectionList title="Team on the road" icon={Users} empty="No technicians on active jobs.">
            {TECHNICIANS.filter(t => session.location === "Both" || t.location === session.location).map(t => (
              <div key={t.id} className="flex items-center gap-2 rounded-md border border-border p-2">
                <div className="h-7 w-7 rounded-full bg-primary/20 text-primary grid place-items-center text-[10px] font-bold">{t.avatarInitials}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">{t.role} · {t.location}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{t.activeJobs} jobs</Badge>
              </div>
            ))}
          </SectionList>
        </TabsContent>

        <TabsContent value="payments">
          <SectionList title="Payments watchlist" icon={Building2} empty="All accounts current.">
            {(showAllPay ? overdueClients : overdueClients.slice(0, 6)).map(c => (
              <Link key={c.id} to="/clients/$id" params={{ id: c.id }} className="flex items-center justify-between rounded-md border border-border p-2 hover:border-primary/60">
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">{c.office}</div>
                </div>
                <Badge className="bg-destructive/20 text-destructive border-destructive/40 text-[10px]" variant="outline">{formatZMW(c.outstandingZMW)}</Badge>
              </Link>
            ))}
            {overdueClients.length > 6 && (
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAllPay(v => !v)}>
                {showAllPay ? "Show less" : `View ${overdueClients.length - 6} more`}
              </Button>
            )}
          </SectionList>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionList({ title, icon: Icon, empty, children }: { title: string; icon: any; empty: string; children: React.ReactNode }) {
  const isEmpty = Array.isArray(children) && children.filter(Boolean).length === 0;
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 text-primary" />{title}</h3>
        {isEmpty ? <p className="text-xs text-muted-foreground">{empty}</p> : children}
      </CardContent>
    </Card>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "primary" | "info" | "warning" | "danger" }) {
  const toneCls =
    tone === "primary" ? "text-primary bg-primary/15" :
    tone === "info"    ? "text-info bg-info/15" :
    tone === "warning" ? "text-warning bg-warning/15" :
                         "text-destructive bg-destructive/15";
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-2.5 flex items-center gap-2">
        <div className={`h-8 w-8 rounded-md grid place-items-center ${toneCls}`}><Icon className="h-3.5 w-3.5" /></div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
          <div className="text-sm md:text-base tv:text-xl font-extrabold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
