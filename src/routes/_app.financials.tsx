import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatZMW } from "@/lib/session";
import { useStore } from "@/lib/store";
import { MONTHLY_REVENUE, OFFICE_QUARTER, PROFIT_MARGIN_PCT, REVENUE_BY_CLIENT, EXPENSE_CATEGORIES } from "@/data/financials";
import { downloadCSV, printPDF } from "@/lib/export";
import { toast } from "sonner";
import { Download, FileText, Table } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/financials")({
  head: () => ({ meta: [{ title: "Financials — Spruceland Ops" }] }),
  component: FinancialsPage,
});

function FinancialsPage() {
  const { clients } = useStore();
  const totalQuarter = OFFICE_QUARTER.Lusaka + OFFICE_QUARTER.Ndola;
  const totalExpenses = EXPENSE_CATEGORIES.reduce((a, e) => a + e.zmw, 0);
  const receivables = clients.reduce((a, c) => a + c.outstandingZMW, 0);
  const overdue = clients.filter(c => c.paymentStatus === "Overdue");
  const paid = clients.filter(c => c.paymentStatus === "Paid");

  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ["Section", "Label", "Value (ZMW)"],
      ["Quarter", "Lusaka", OFFICE_QUARTER.Lusaka],
      ["Quarter", "Ndola", OFFICE_QUARTER.Ndola],
      ["Quarter", "Total", totalQuarter],
      ["Quarter", "Profit margin %", PROFIT_MARGIN_PCT],
      [],
      ["Monthly revenue", "Month", "Lusaka", "Ndola"] as any,
      ...MONTHLY_REVENUE.map(m => ["Monthly", m.month, m.lusaka, m.ndola]),
      [],
      ["Revenue by client", "Client", "Revenue"] as any,
      ...REVENUE_BY_CLIENT.map(r => ["Revenue", r.client, r.revenueZMW]),
      [],
      ["Expenses", "Category", "Amount"] as any,
      ...EXPENSE_CATEGORIES.map(e => ["Expense", e.name, e.zmw]),
    ];
    downloadCSV(`spruceland-financials-${new Date().toISOString().slice(0,10)}.csv`, rows);
    toast.success("CSV exported");
  };

  const exportPDF = () => {
    printPDF("Spruceland — Quarterly Financials", [
      { heading: "Quarter summary", rows: [
        ["Metric", "Value"],
        ["Lusaka office", formatZMW(OFFICE_QUARTER.Lusaka)],
        ["Ndola office", formatZMW(OFFICE_QUARTER.Ndola)],
        ["Total quarter revenue", formatZMW(totalQuarter)],
        ["Profit margin", `${PROFIT_MARGIN_PCT}%`],
        ["Receivables outstanding", formatZMW(receivables)],
      ]},
      { heading: "Revenue by office (monthly, ZMW)", rows: [
        ["Month", "Lusaka", "Ndola", "Total"],
        ...MONTHLY_REVENUE.map(m => [m.month, formatZMW(m.lusaka), formatZMW(m.ndola), formatZMW(m.lusaka + m.ndola)]),
      ]},
      { heading: "Revenue by client (rolling 90d)", rows: [
        ["Client", "Revenue"],
        ...REVENUE_BY_CLIENT.map(r => [r.client, formatZMW(r.revenueZMW)]),
      ]},
      { heading: "Expenses", rows: [
        ["Category", "Amount"],
        ...EXPENSE_CATEGORIES.map(e => [e.name, formatZMW(e.zmw)]),
      ]},
      { heading: "Overdue receivables", rows: [
        ["Client", "Office", "Amount"],
        ...overdue.map(c => [c.name, c.office, formatZMW(c.outstandingZMW)]),
      ]},
    ]);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Financials</h1>
          <p className="text-[11px] text-muted-foreground">Revenue, margin and receivables. Owner view.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8"><Download className="h-3.5 w-3.5 mr-1" />Export</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportCSV}><Table className="h-3.5 w-3.5 mr-2" />CSV (all data)</DropdownMenuItem>
            <DropdownMenuItem onClick={exportPDF}><FileText className="h-3.5 w-3.5 mr-2" />PDF report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Kpi label="Quarter revenue" value={formatZMW(totalQuarter)} tone="primary" />
        <Kpi label="Lusaka" value={formatZMW(OFFICE_QUARTER.Lusaka)} />
        <Kpi label="Ndola" value={formatZMW(OFFICE_QUARTER.Ndola)} />
        <Kpi label="Margin" value={`${PROFIT_MARGIN_PCT}%`} tone="success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Card className="xl:col-span-2 bg-card border-border">
          <CardHeader className="p-3"><CardTitle className="text-sm">Revenue by office — monthly</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 h-[240px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v: any) => `${(Number(v)/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => formatZMW(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="lusaka" name="Lusaka" fill="var(--chart-1)" radius={[3,3,0,0]} />
                <Bar dataKey="ndola" name="Ndola" fill="var(--chart-2)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="p-3"><CardTitle className="text-sm">Revenue mix</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 h-[240px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={REVENUE_BY_CLIENT} dataKey="revenueZMW" nameKey="client" innerRadius={40} outerRadius={80} paddingAngle={2}>
                  {REVENUE_BY_CLIENT.map((_, i) => (<Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => formatZMW(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Card className="xl:col-span-2 bg-card border-border">
          <CardHeader className="p-3"><CardTitle className="text-sm">Revenue trend</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_REVENUE.map(m => ({ month: m.month, total: m.lusaka + m.ndola }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v: any) => `${(Number(v)/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => formatZMW(Number(v))} />
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="p-3"><CardTitle className="text-sm">Expenses</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            {EXPENSE_CATEGORIES.map(e => {
              const pct = Math.round((e.zmw / totalExpenses) * 100);
              return (
                <div key={e.name}>
                  <div className="flex justify-between text-[11px]"><span>{e.name}</span><span className="font-semibold">{formatZMW(e.zmw)}</span></div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-0.5"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-card border-border">
          <CardHeader className="p-3"><CardTitle className="text-sm">Top paying clients</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            {REVENUE_BY_CLIENT.slice(0, 6).map((r, i) => (
              <div key={r.client} className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/20 text-primary grid place-items-center text-[10px] font-bold">{i + 1}</div>
                <div className="flex-1 text-xs truncate">{r.client}</div>
                <div className="text-xs font-semibold">{formatZMW(r.revenueZMW)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="p-3"><CardTitle className="text-sm">Receivables — {formatZMW(receivables)}</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            {overdue.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 p-1.5">
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">{c.office}</div>
                </div>
                <Badge variant="outline" className="text-[10px] bg-destructive/15 text-destructive border-destructive/40">{formatZMW(c.outstandingZMW)}</Badge>
              </div>
            ))}
            <div className="text-[10px] text-muted-foreground pt-1">{paid.length} paid · {clients.length - paid.length - overdue.length} pending.</div>
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
      <CardContent className="p-2.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-sm md:text-lg tv:text-2xl font-extrabold mt-0.5 truncate ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
