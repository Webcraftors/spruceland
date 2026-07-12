import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users2, Package, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { scopedJobs, scopedClients, scopedInventory } from "@/lib/scope";

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { session } = useSession();
  const store = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => { if (!open) setQ(""); }, [open]);

  if (!session) return null;
  const term = q.trim().toLowerCase();
  const jobs = scopedJobs(store.jobs, session.role, session.location);
  const clients = scopedClients(store.clients, session.role, session.location);
  const inv = scopedInventory(store.inventory, session.role, session.location);

  const jobMatches = term ? jobs.filter(j => j.title.toLowerCase().includes(term) || j.branch.toLowerCase().includes(term) || j.id.toLowerCase().includes(term)).slice(0, 6) : [];
  const clientMatches = term ? clients.filter(c => c.name.toLowerCase().includes(term) || c.industry.toLowerCase().includes(term)).slice(0, 6) : [];
  const invMatches = term ? inv.filter(i => i.name.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term)).slice(0, 6) : [];

  const go = (fn: () => void) => { onOpenChange(false); fn(); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search jobs, clients, inventory…"
            className="border-0 shadow-none focus-visible:ring-0 h-8 px-0" />
          <Badge variant="outline" className="text-[10px]">{session.location} · {session.role}</Badge>
        </div>
        <div className="max-h-[380px] overflow-y-auto">
          {!term && <p className="p-6 text-center text-sm text-muted-foreground">Start typing to search across jobs, clients and inventory scoped to your role & location.</p>}
          {term && jobMatches.length === 0 && clientMatches.length === 0 && invMatches.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No matches in your scope.</p>
          )}
          {jobMatches.length > 0 && (
            <Group icon={Briefcase} label="Jobs">
              {jobMatches.map(j => (
                <Row key={j.id} onClick={() => go(() => navigate({ to: "/jobs/$id", params: { id: j.id } }))}
                  title={j.title} sub={`${j.branch} · ${j.status}`} />
              ))}
            </Group>
          )}
          {clientMatches.length > 0 && (
            <Group icon={Users2} label="Clients">
              {clientMatches.map(c => (
                <Row key={c.id} onClick={() => go(() => navigate({ to: "/clients/$id", params: { id: c.id } }))}
                  title={c.name} sub={`${c.industry} · ${c.office}`} />
              ))}
            </Group>
          )}
          {invMatches.length > 0 && (
            <Group icon={Package} label="Inventory">
              {invMatches.map(i => (
                <Row key={i.id} onClick={() => go(() => navigate({ to: "/inventory" }))}
                  title={i.name} sub={`${i.sku} · ${i.onHand} on hand`} />
              ))}
            </Group>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Group({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Icon className="h-3 w-3" />{label}</div>
      {children}
    </div>
  );
}
function Row({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-2 hover:bg-accent">
      <div className="text-sm font-medium truncate">{title}</div>
      <div className="text-xs text-muted-foreground truncate">{sub}</div>
    </button>
  );
}
