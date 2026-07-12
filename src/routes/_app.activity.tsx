import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useStore, type AuditEntry } from "@/lib/store";
import { downloadCSV } from "@/lib/export";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { Briefcase, Users2, Package, ShoppingCart, Download, Activity } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({ meta: [{ title: "Activity log — Spruceland Ops" }, { name: "description", content: "Audit log of key CRUD actions." }] }),
  component: ActivityPage,
});

const ENTITY_ICON: Record<AuditEntry["entity"], any> = {
  job: Briefcase, client: Users2, inventory: Package, order: ShoppingCart,
};

const ACTION_TONE: Record<AuditEntry["action"], string> = {
  create: "bg-success/15 text-success border-success/40",
  update: "bg-info/15 text-info border-info/40",
  delete: "bg-destructive/15 text-destructive border-destructive/40",
  status: "bg-warning/15 text-warning border-warning/40",
  assign: "bg-primary/15 text-primary border-primary/40",
};

function ActivityPage() {
  const { audit } = useStore();
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState<string>("all");
  const [action, setAction] = useState<string>("all");

  const filtered = useMemo(() => audit.filter(a => {
    if (entity !== "all" && a.entity !== entity) return false;
    if (action !== "all" && a.action !== action) return false;
    if (q) {
      const s = `${a.actor} ${a.entityLabel} ${a.detail ?? ""} ${a.entityId}`.toLowerCase();
      if (!s.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [audit, q, entity, action]);

  const exportCSV = () => {
    downloadCSV(`spruceland-activity-${new Date().toISOString().slice(0,10)}.csv`, [
      ["Time", "Actor", "Role", "Entity", "Entity ID", "Label", "Action", "Detail"],
      ...filtered.map(a => [a.time, a.actor, a.role, a.entity, a.entityId, a.entityLabel, a.action, a.detail ?? ""]),
    ]);
    toast.success(`Exported ${filtered.length} entries`);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />Activity & audit log
          </h1>
          <p className="text-[11px] text-muted-foreground">Every create, update, delete, status change and assignment across jobs, clients, inventory, and orders.</p>
        </div>
        <Button size="sm" className="h-8" onClick={exportCSV}><Download className="h-3.5 w-3.5 mr-1" />Export CSV</Button>
      </header>

      <Card className="bg-card border-border">
        <CardHeader className="p-3 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="Search actor, item, ID…" value={q} onChange={e => setQ(e.target.value)} className="h-8 text-xs md:col-span-2" />
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Entity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                <SelectItem value="job">Jobs</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="create">Created</SelectItem>
                <SelectItem value="update">Updated</SelectItem>
                <SelectItem value="delete">Deleted</SelectItem>
                <SelectItem value="status">Status change</SelectItem>
                <SelectItem value="assign">Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {filtered.length === 0 && <li className="p-6 text-xs text-muted-foreground text-center">No activity matches your filters.</li>}
            {filtered.map(a => {
              const Icon = ENTITY_ICON[a.entity];
              return (
                <li key={a.id} className="flex items-start gap-3 p-3">
                  <div className="h-8 w-8 rounded-md bg-muted grid place-items-center shrink-0"><Icon className="h-3.5 w-3.5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold">{a.actor}</span>
                      <span className="text-[10px] text-muted-foreground">· {a.role}</span>
                      <Badge variant="outline" className={`text-[10px] ${ACTION_TONE[a.action]}`}>{a.action}</Badge>
                      <span className="text-[10px] text-muted-foreground capitalize">{a.entity}</span>
                    </div>
                    <div className="text-xs mt-0.5 truncate">
                      <span className="font-medium">{a.entityLabel}</span>
                      <span className="text-muted-foreground"> · {a.entityId}</span>
                    </div>
                    {a.detail && <div className="text-[11px] text-muted-foreground mt-0.5">{a.detail}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground">{formatDistanceToNow(parseISO(a.time), { addSuffix: true })}</div>
                    <div className="text-[10px] text-muted-foreground/70">{format(parseISO(a.time), "d MMM HH:mm")}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
