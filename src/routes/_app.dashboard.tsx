import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSession, formatZMW, can } from "@/lib/session";
import { CLIENTS } from "@/data/clients";
import { JOBS, statusColorClasses, priorityColorClasses, typeColorClasses } from "@/data/jobs";
import { TECHNICIANS } from "@/data/technicians";
import { INVENTORY } from "@/data/inventory";
import { MONTHLY_REVENUE, OFFICE_QUARTER, PROFIT_MARGIN_PCT, REVENUE_BY_CLIENT } from "@/data/financials";
import { NOTIFICATIONS } from "@/data/notifications";
import { differenceInDays, format, parseISO } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { AlertTriangle, TrendingUp, Wrench, Building2, Users, Package, Clock, CircleDollarSign } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Spruceland Ops" }, { name: "description", content: "Operations dashboard: jobs, service due, revenue and technicians." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = useSession();
  if (!session) return null;

  const isOwnerLike = session.role === "owner" || session.role === "administrator";
  const showFinance = can(session.role, "financials");

  const dueSoon = CLIENTS
    .map(c => ({ c, days: differenceInDays(parseISO(c.nextServiceDue), new Date()) }))
    .filter(x => x.days <= 30)
    .sort((a, b) => a.days - b.days);

  const breakdowns = JOBS.filter(j => j.type === "Breakdown" && j.status !== "Closed" && j.status !== "Completed");
  const escalated = JOBS.filter(j => j.priority === "Escalated");
  const activeJobs = JOBS.filter(j => j.status === "In Progress" || j.status === "Scheduled" || j.status === "Awaiting Parts");
  const overdueClients = CLIENTS.filter(c => c.paymentStatus === "Overdue");
  const lowStock = INVENTORY.filter(i => i.onHand <= i.reorder);

  return (
    <div className="space-y-6 tv:space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMM yyyy")}</p>
          <h1 className="text-3xl tv:text-5xl font-extrabold tracking-tight">Welcome back, {session.name.split(" ")[0]}.</h1>
          <p className="text-sm text-muted-foreground mt-1">Here is what is happening across Spruceland Ops today.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/jobs" search={{ view: "tv" }} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Open TV board</Link>
          <Link to="/jobs" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent">Manage jobs</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 tv:grid-cols-4 gap-4">
        <Kpi icon={Wrench} label="Active jobs" value={activeJobs.length.toString()} tone="info" />
        <Kpi icon={AlertTriangle} label="Escalated / breakdowns" value={(escalated.length + breakdowns.length).toString()} tone="danger" />
        <Kpi icon={Clock} label="Service due ≤30d" value={dueSoon.length.toString()} tone="warning" />
        {showFinance ? (
          <Kpi icon={CircleDollarSign} label="Quarter revenue" value={formatZMW(OFFICE_QUARTER.Lusaka + OFFICE_QUARTER.Ndola)} tone="primary" />
        ) : (
          <Kpi icon={Package} label="Low stock items" value={lowStock.length.toString()} tone="warning" />
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 bg-card border-border">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Live jobs board</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Colour-coded by status. Open Jobs for the full kanban & TV view.</p>
            </div>
            <Link to="/jobs" className="text-xs text-primary hover:underline">See all →</Link>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 tv:grid-cols-3 gap-3">
            {activeJobs.slice(0, 6).map(j => {
              const client = CLIENTS.find(c => c.id === j.clientId);
              return (
                <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="rounded-lg border border-border bg-background/60 p-4 hover:border-primary/60 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={statusColorClasses(j.status)}>{j.status}</Badge>
                    <Badge variant="outline" className={priorityColorClasses(j.priority)}>{j.priority}</Badge>
                  </div>
                  <div className="mt-3 font-semibold leading-tight">{j.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{client?.name} · {j.branch}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge className={typeColorClasses(j.type)} variant="outline">{j.type}</Badge>
                    <span className="text-xs text-muted-foreground">Due {format(parseISO(j.dueAt), "d MMM")}</span>
                  </div>
                  <Progress value={j.progress} className="mt-3 h-1.5" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Service due soon</CardTitle>
            <p className="text-xs text-muted-foreground">Next 30 days across all clients.</p>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[520px] overflow-auto">
            {dueSoon.map(({ c, days }) => (
              <Link key={c.id} to="/clients/$id" params={{ id: c.id }} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/50 p-3 hover:border-primary/60">
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.cadence} · {c.office}</div>
                </div>
                <Badge variant="outline" className={days <= 7 ? "bg-destructive/20 text-destructive border-destructive/40" : days <= 14 ? "bg-warning/20 text-warning border-warning/40" : "bg-info/20 text-info border-info/40"}>
                  {days <= 0 ? "Overdue" : `in ${days}d`}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {showFinance && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 bg-card border-border">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue by office</CardTitle>
                <p className="text-xs text-muted-foreground">Lusaka vs Ndola — monthly (ZMW).</p>
              </div>
              <Badge variant="outline" className="bg-success/15 text-success border-success/40">
                <TrendingUp className="h-3 w-3 mr-1" />Margin {PROFIT_MARGIN_PCT}%
              </Badge>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_REVENUE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: any) => formatZMW(Number(v))} />
                  <Legend />
                  <Bar dataKey="lusaka" name="Lusaka" fill="var(--chart-1)" radius={[4,4,0,0]} />
                  <Bar dataKey="ndola" name="Ndola" fill="var(--chart-2)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Top revenue clients</CardTitle>
              <p className="text-xs text-muted-foreground">Rolling 90 days.</p>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={REVENUE_BY_CLIENT} dataKey="revenueZMW" nameKey="client" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {REVENUE_BY_CLIENT.map((_, i) => (<Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: any) => formatZMW(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Reported breakdowns</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {breakdowns.length === 0 && <p className="text-sm text-muted-foreground">No open breakdowns. Nice.</p>}
            {breakdowns.map(j => {
              const c = CLIENTS.find(x => x.id === j.clientId);
              return (
                <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="block rounded-md border border-destructive/40 bg-destructive/10 p-3 hover:bg-destructive/15">
                  <div className="text-sm font-semibold">{c?.name}</div>
                  <div className="text-xs text-muted-foreground">{j.branch}</div>
                  <div className="text-xs mt-1">{j.notes}</div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Team on the road</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {TECHNICIANS.slice(0, 6).map(t => (
              <div key={t.id} className="flex items-center gap-3 rounded-md border border-border p-2.5">
                <div className="h-9 w-9 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold">{t.avatarInitials}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role} · {t.location}{t.subcontractor && " · Sub"}</div>
                </div>
                <Badge variant="outline">{t.activeJobs} jobs</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" />Payments watchlist</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdueClients.map(c => (
              <Link key={c.id} to="/clients/$id" params={{ id: c.id }} className="flex items-center justify-between rounded-md border border-border p-2.5 hover:border-primary/60">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.office}</div>
                </div>
                <Badge className="bg-destructive/20 text-destructive border-destructive/40" variant="outline">{formatZMW(c.outstandingZMW)}</Badge>
              </Link>
            ))}
            {overdueClients.length === 0 && <p className="text-sm text-muted-foreground">All caught up.</p>}
          </CardContent>
        </Card>
      </div>

      {isOwnerLike && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Revenue trend (Lusaka + Ndola)</CardTitle>
            <p className="text-xs text-muted-foreground">Rolling 7 months.</p>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_REVENUE.map(m => ({ month: m.month, total: m.lusaka + m.ndola }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: any) => formatZMW(Number(v))} />
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
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
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-lg grid place-items-center ${toneCls}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-xl tv:text-3xl font-extrabold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
