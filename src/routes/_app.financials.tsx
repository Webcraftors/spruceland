import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatZMW } from "@/lib/session";
import { MONTHLY_REVENUE, OFFICE_QUARTER, PROFIT_MARGIN_PCT, REVENUE_BY_CLIENT, EXPENSE_CATEGORIES } from "@/data/financials";
import { CLIENTS } from "@/data/clients";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/financials")({
  head: () => ({ meta: [{ title: "Financials — Spruceland Ops" }, { name: "description", content: "Revenue, margin and receivables across Spruceland offices." }] }),
  component: FinancialsPage,
});

function FinancialsPage() {
  const totalQuarter = OFFICE_QUARTER.Lusaka + OFFICE_QUARTER.Ndola;
  const totalExpenses = EXPENSE_CATEGORIES.reduce((a, e) => a + e.zmw, 0);
  const receivables = CLIENTS.reduce((a, c) => a + c.outstandingZMW, 0);
  const overdue = CLIENTS.filter(c => c.paymentStatus === "Overdue");
  const paid = CLIENTS.filter(c => c.paymentStatus === "Paid");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl tv:text-4xl font-extrabold tracking-tight">Financials</h1>
        <p className="text-sm text-muted-foreground">Revenue, margin and receivables. Owner view.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Quarter revenue" value={formatZMW(totalQuarter)} tone="primary" />
        <Kpi label="Lusaka office" value={formatZMW(OFFICE_QUARTER.Lusaka)} />
        <Kpi label="Ndola office" value={formatZMW(OFFICE_QUARTER.Ndola)} />
        <Kpi label="Profit margin" value={`${PROFIT_MARGIN_PCT}%`} tone="success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 bg-card border-border">
          <CardHeader><CardTitle>Revenue by office — monthly</CardTitle></CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v: any) => `${(Number(v)/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: any) => formatZMW(Number(v))} />
                <Legend />
                <Bar dataKey="lusaka" name="Lusaka" fill="var(--chart-1)" radius={[4,4,0,0]} />
                <Bar dataKey="ndola" name="Ndola" fill="var(--chart-2)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Revenue mix by client</CardTitle></CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={REVENUE_BY_CLIENT} dataKey="revenueZMW" nameKey="client" innerRadius={60} outerRadius={110} paddingAngle={2}>
                  {REVENUE_BY_CLIENT.map((_, i) => (<Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: any) => formatZMW(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 bg-card border-border">
          <CardHeader><CardTitle>Revenue trend</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_REVENUE.map(m => ({ month: m.month, total: m.lusaka + m.ndola }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v: any) => `${(Number(v)/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: any) => formatZMW(Number(v))} />
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Expense breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {EXPENSE_CATEGORIES.map(e => {
              const pct = Math.round((e.zmw / totalExpenses) * 100);
              return (
                <div key={e.name}>
                  <div className="flex justify-between text-sm"><span>{e.name}</span><span className="font-semibold">{formatZMW(e.zmw)}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden mt-1"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Top paying clients (rolling 90d)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {REVENUE_BY_CLIENT.slice(0, 6).map((r, i) => (
              <div key={r.client} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-bold">{i + 1}</div>
                <div className="flex-1">{r.client}</div>
                <div className="font-semibold">{formatZMW(r.revenueZMW)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Receivables — {formatZMW(receivables)} outstanding</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdue.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 p-2">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.office}</div>
                </div>
                <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/40">{formatZMW(c.outstandingZMW)}</Badge>
              </div>
            ))}
            <div className="text-xs text-muted-foreground pt-2">{paid.length} clients fully paid, {CLIENTS.length - paid.length - overdue.length} pending.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "primary" | "success" }) {
  const cls = tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : "";
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-2xl tv:text-4xl font-extrabold mt-1 ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
