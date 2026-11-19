import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortalSession, Card, fmtDateTime } from "@/components/portal/shared";
import { CLIENTS } from "@/data/clients";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/client_/app/profile")({
  head: () => pageMeta("Profile — Spruceland Client Portal", "Your employee details, store and Spruceland contacts."),
  component: Profile,
});

function Profile() {
  const { session: s, signOut } = usePortalSession();
  const c = CLIENTS.find(x => x.id === s.clientId);
  const initials = s.employeeName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="grid place-items-center h-16 w-16 rounded-full bg-primary text-primary-foreground text-xl font-extrabold">{initials}</div>
        <div className="min-w-0"><h1 className="text-xl font-extrabold truncate">{s.employeeName}</h1><p className="text-xs text-muted-foreground">{s.department} · {s.clientName}</p></div>
      </div>
      <Card title="My details">
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <Kv k="NRC / Employee ID" v={s.employeeRef} /><Kv k="Department" v={s.department} />
          <Kv k="Company" v={s.clientName} /><Kv k="Store / site" v={s.site.name} />
          <Kv k="City" v={s.site.city} /><Kv k="Province" v={s.site.province} />
          <Kv k="Signed in" v={fmtDateTime(s.signedInAt)} />
        </dl>
      </Card>
      {c && (
        <Card title="Your company contact">
          <div className="text-sm font-semibold">{c.primaryContact.name}</div>
          <div className="mt-2 flex flex-col gap-1.5 text-xs">
            <a className="inline-flex items-center gap-2 text-primary" href={`tel:${c.primaryContact.phone.replace(/\s/g, "")}`}><Phone className="h-3.5 w-3.5" />{c.primaryContact.phone}</a>
            <a className="inline-flex items-center gap-2 text-primary" href={`mailto:${c.primaryContact.email}`}><Mail className="h-3.5 w-3.5" />{c.primaryContact.email}</a>
          </div>
        </Card>
      )}
      <Card title="Spruceland Help Desk">
        <p className="text-xs text-muted-foreground">{c?.office ?? "Lusaka"} office · Mon–Sat, 07:30–17:30</p>
        <a className="mt-2 inline-flex items-center gap-2 text-sm text-primary font-semibold" href="tel:+260211000000"><Phone className="h-4 w-4" />+260 211 000 000</a>
      </Card>
      <Button variant="outline" className="w-full h-11" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign out</Button>
    </div>
  );
}
const Kv = ({ k, v }: { k: string; v: string }) => <div className="min-w-0"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold truncate">{v}</dd></div>;
