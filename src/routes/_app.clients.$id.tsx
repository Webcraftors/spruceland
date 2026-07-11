import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { clientById, CLIENTS } from "@/data/clients";
import { JOBS, statusColorClasses, typeColorClasses } from "@/data/jobs";
import { techById } from "@/data/technicians";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatZMW } from "@/lib/session";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Phone, Mail, MapPin, Building2 } from "lucide-react";

export const Route = createFileRoute("/_app/clients/$id")({
  head: ({ params }) => {
    const c = CLIENTS.find(x => x.id === params.id);
    return { meta: [{ title: `${c?.name ?? "Client"} — Spruceland Ops` }, { name: "description", content: c?.industry ?? "Client detail" }] };
  },
  loader: ({ params }) => {
    const client = clientById(params.id);
    if (!client) throw notFound();
    return { client };
  },
  component: ClientDetail,
  notFoundComponent: () => <div className="p-8">Client not found. <Link to="/clients" className="text-primary">Back</Link></div>,
});

function ClientDetail() {
  const { client } = Route.useLoaderData() as { client: (typeof CLIENTS)[number] };
  const jobs = JOBS.filter(j => j.clientId === client.id);

  return (
    <div className="space-y-6">
      <Link to="/clients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to clients</Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{client.industry}</p>
          <h1 className="text-4xl font-extrabold tracking-tight">{client.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{client.cadence} service</Badge>
            <Badge variant="outline" className={client.paymentStatus === "Paid" ? "bg-success/15 text-success border-success/40" : client.paymentStatus === "Pending" ? "bg-warning/15 text-warning border-warning/40" : "bg-destructive/15 text-destructive border-destructive/40"}>{client.paymentStatus}</Badge>
            <Badge variant="outline">{client.office} office</Badge>
          </div>
        </div>
        <Card className="bg-card border-border w-full md:w-80">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Primary contact</div>
            <div className="font-semibold text-base">{client.primaryContact.name}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{client.primaryContact.phone}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{client.primaryContact.email}</div>
          </CardContent>
        </Card>
      </header>

      {client.activeProject && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader><CardTitle className="text-primary">Active project</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4 text-sm">
            <Detail label="Project">{client.activeProject.title}</Detail>
            <Detail label="Current stage">{client.activeProject.stage} (wk {client.activeProject.weeksInStage})</Detail>
            <Detail label="Lead">{client.activeProject.lead}</Detail>
            <Detail label="Subcontractor">{client.activeProject.subcontractor ?? "—"}</Detail>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <Metric label="Monthly revenue" value={formatZMW(client.monthlyRevenueZMW)} />
        <Metric label="Outstanding" value={formatZMW(client.outstandingZMW)} tone={client.outstandingZMW > 0 ? "danger" : undefined} />
        <Metric label="Branches" value={client.branches.length.toString()} />
        <Metric label="Total scales" value={client.scales.reduce((a: number, s: any) => a + s.count, 0).toString()} />
      </div>

      <Tabs defaultValue="equipment">
        <TabsList>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="branches">Branches ({client.branches.length})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="service">Service history</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-accent/50 text-left"><tr><th className="p-3">Type</th><th className="p-3">Count</th><th className="p-3">Notes</th></tr></thead>
                <tbody>
                  {client.scales.map(s => (
                    <tr key={s.type} className="border-t border-border">
                      <td className="p-3 font-medium">{s.type}</td>
                      <td className="p-3">{s.count}</td>
                      <td className="p-3 text-muted-foreground">{s.type === "Weighbridge" ? "Annual re-cert required" : s.type === "Retail POS" ? "Legal-for-trade seals" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches">
          <Card className="bg-card border-border">
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {client.branches.map((b, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="font-medium flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />{b.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}, {b.province}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="space-y-2">
            {jobs.length === 0 && <p className="text-sm text-muted-foreground">No jobs recorded for this client yet.</p>}
            {jobs.map(j => (
              <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3 hover:border-primary/60">
                <Badge variant="outline" className={statusColorClasses(j.status)}>{j.status}</Badge>
                <Badge variant="outline" className={typeColorClasses(j.type)}>{j.type}</Badge>
                <div className="font-medium flex-1 min-w-0 truncate">{j.title}</div>
                <div className="text-xs text-muted-foreground">Due {format(parseISO(j.dueAt), "d MMM")}</div>
                <div className="text-xs">{j.technicianIds.map(id => techById(id)?.name).filter(Boolean).join(", ") || "Unassigned"}</div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="service">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-sm space-y-2">
              <Detail label="Last serviced">{format(parseISO(client.lastServiced), "d MMM yyyy")}</Detail>
              <Detail label="Next service due">{format(parseISO(client.nextServiceDue), "d MMM yyyy")}</Detail>
              <Detail label="Cadence">{client.cadence}</Detail>
              {client.notes && <Detail label="Notes">{client.notes}</Detail>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{children}</div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`text-2xl font-extrabold mt-1 ${tone === "danger" ? "text-destructive" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
