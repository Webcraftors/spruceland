import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useSession, formatZMW } from "@/lib/session";
import { scopedClients } from "@/lib/scope";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { differenceInDays, parseISO } from "date-fns";
import { Search, MapPin, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { ClientFormDialog } from "@/components/CrudDialogs";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clients")({
  head: () => ({ meta: [{ title: "Clients — Spruceland Ops" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const [q, setQ] = useState("");
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const store = useStore();
  const { session } = useSession();
  if (!session) return null;

  const scoped = scopedClients(store.clients, session.role, session.location);
  const list = scoped.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Clients</h1>
          <p className="text-[11px] text-muted-foreground">{scoped.length} clients in {session.location}.</p>
        </div>
        <div className="flex gap-1.5 flex-1 md:flex-initial">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-8 h-8 text-xs" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Button size="sm" className="h-8" onClick={() => { setEditing(null); setDlgOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1" />New</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 tv:grid-cols-4 gap-2.5">
        {list.map(c => {
          const daysToService = differenceInDays(parseISO(c.nextServiceDue), new Date());
          const totalScales = c.scales.reduce((a, s) => a + s.count, 0);
          return (
            <Card key={c.id} className="bg-card border-border hover:border-primary/60 transition-colors">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link to="/clients/$id" params={{ id: c.id }} className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm leading-tight truncate">{c.name}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">{c.industry}</p>
                  </Link>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${c.paymentStatus === "Paid" ? "bg-success/15 text-success border-success/40" : c.paymentStatus === "Pending" ? "bg-warning/15 text-warning border-warning/40" : "bg-destructive/15 text-destructive border-destructive/40"}`}>{c.paymentStatus}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><button className="p-0.5 hover:bg-accent rounded"><MoreVertical className="h-3 w-3" /></button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(c); setDlgOpen(true); }}><Pencil className="h-3 w-3 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDel(c.id)}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <Link to="/clients/$id" params={{ id: c.id }} className="block space-y-2">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="h-2.5 w-2.5" />{c.branches.length} branches · {c.office}</div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <Stat n={totalScales} label="Scales" />
                    <Stat n={c.scales.find(s => s.type === "Weighbridge")?.count ?? 0} label="WB" />
                    <Stat n={c.cadence} label="Cadence" small />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Next service</span>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${daysToService <= 7 ? "bg-destructive/15 text-destructive border-destructive/40" : daysToService <= 30 ? "bg-warning/15 text-warning border-warning/40" : "bg-info/15 text-info border-info/40"}`}>{daysToService <= 0 ? "Overdue" : `${daysToService}d`}</Badge>
                  </div>
                  {c.outstandingZMW > 0 && <div className="text-[10px] text-destructive">Owing: {formatZMW(c.outstandingZMW)}</div>}
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ClientFormDialog open={dlgOpen} onOpenChange={setDlgOpen} editing={editing} />

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove this client?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDel) { store.deleteClient(confirmDel); toast.success("Client removed"); setConfirmDel(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ n, label, small }: { n: any; label: string; small?: boolean }) {
  return (
    <div className="rounded bg-background/50 border border-border py-1">
      <div className={small ? "text-[10px] font-bold" : "text-xs font-bold"}>{n}</div>
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
