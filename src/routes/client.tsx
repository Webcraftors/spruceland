import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Check, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PORTAL_CLIENTS, provincesFor, sitesFor, DEMO_EMPLOYEES, departmentsFor } from "@/data/portal";
import { runSplash, brandForApp } from "@/components/brand/SplashHost";
import { clientSessionRepo, ticketsRepo } from "@/repositories/portal-repo";

export const Route = createFileRoute("/client")({
  head: () => ({
    meta: [
      { title: "Client sign-in — Spruceland Client Portal" },
      { name: "description", content: "Find your company, enter your employee details and choose your store to access the Spruceland Client Portal." },
      { property: "og:title", content: "Client sign-in — Spruceland Client Portal" },
      { property: "og:description", content: "Raise scale breakdowns and sign off repairs for your store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClientSignIn,
});

function ClientSignIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [q, setQ] = useState("");
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [ref, setRef] = useState("");
  const [province, setProvince] = useState("");
  const [siteName, setSiteName] = useState("");

  const client = PORTAL_CLIENTS.find(c => c.id === clientId);
  const matches = useMemo(() => PORTAL_CLIENTS.filter(c => c.name.toLowerCase().includes(q.toLowerCase())), [q]);
  const provinces = clientId ? provincesFor(clientId) : [];
  const sites = clientId && province ? sitesFor(clientId).filter(s => s.province === province) : [];
  const site = sites.length === 1 ? sites[0] : sites.find(s => s.name === siteName);
  const canSubmit = !!client && name.trim().length > 1 && ref.trim().length > 2 && !!site;

  const pickClient = (id: string) => {
    setClientId(id); setProvince(""); setSiteName("");
    const p = provincesFor(id); if (p.length === 1) setProvince(p[0]);
    setStep(1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !client || !site) return;
    const known = DEMO_EMPLOYEES.find(d => d.clientId === client.id && d.employeeRef.toLowerCase() === ref.trim().toLowerCase());
    const session = {
      clientId: client.id, clientName: client.name, employeeName: name.trim(), employeeRef: ref.trim(),
      department: known?.department ?? departmentsFor(client.id)[0], site, signedInAt: new Date().toISOString(),
    };
    clientSessionRepo.set(session);
    await ticketsRepo.ensureSiteSeed(session);
    await runSplash({ name: session.employeeName, brand: client.name.toLowerCase().includes("yalelo") ? "yalelo" : brandForApp(), subtitle: `${session.site.name} · ${client.name}` });
    navigate({ to: "/client/app" });
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="flex items-center gap-3 px-4 h-14 border-b border-border">
        {step === 0
          ? <Link to="/" aria-label="Back" className="p-2 -ml-2 rounded-lg hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
          : <button aria-label="Back" onClick={() => setStep(0)} className="p-2 -ml-2 rounded-lg hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button>}
        <img src="/spruceland-logo.png" alt="Spruceland" className="h-7 w-auto" />
        <span className="ml-auto text-xs text-muted-foreground">Step {step + 1} of 2</span>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-5 py-6">
        {step === 0 ? (
          <>
            <h1 className="text-xl font-extrabold">Find your company</h1>
            <p className="text-sm text-muted-foreground mt-1">Search for the company you work for.</p>
            <div className="relative mt-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. Yalelo, Pick n Pay, Kachema" className="pl-9 h-12" />
            </div>
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
              {matches.map(c => (
                <li key={c.id}>
                  <button onClick={() => pickClient(c.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 active:bg-muted">
                    <div className="grid place-items-center h-10 w-10 rounded-lg bg-primary/10 text-primary font-bold text-sm">{c.name.slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.industry} · {c.branches.length} site{c.branches.length > 1 ? "s" : ""}</div>
                    </div>
                    {clientId === c.id && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              ))}
              {!matches.length && <li className="px-4 py-6 text-sm text-center text-muted-foreground">No company found. Contact Spruceland to be added.</li>}
            </ul>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="rounded-xl bg-primary/8 border border-primary/20 p-3 flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm">{client?.name.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0"><div className="font-semibold text-sm truncate">{client?.name}</div><button type="button" onClick={() => setStep(0)} className="text-xs text-primary">Change company</button></div>
            </div>
            <h1 className="text-xl font-extrabold">Your details</h1>
            <div className="space-y-2"><Label htmlFor="n">Full name</Label><Input id="n" className="h-12" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mary Banda" autoComplete="name" /></div>
            <div className="space-y-2"><Label htmlFor="r">NRC or Employee ID</Label><Input id="r" className="h-12" value={ref} onChange={e => setRef(e.target.value)} placeholder="e.g. 123456/10/1 or PNP-20417" /></div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Province</Label>
              <Select value={province} onValueChange={v => { setProvince(v); setSiteName(""); }}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Select province" /></SelectTrigger>
                <SelectContent>{provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {sites.length > 1 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Store className="h-3.5 w-3.5" />Store / site</Label>
                <Select value={siteName} onValueChange={setSiteName}>
                  <SelectTrigger className="h-12"><SelectValue placeholder={`Select from ${sites.length} sites`} /></SelectTrigger>
                  <SelectContent>{sites.map(s => <SelectItem key={s.name} value={s.name}>{s.name} · {s.city}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {sites.length === 1 && <p className="text-xs text-muted-foreground">Site: <span className="font-medium text-foreground">{sites[0].name}, {sites[0].city}</span></p>}
            <Button type="submit" disabled={!canSubmit} className="w-full h-12 text-base font-semibold">Sign in</Button>
          </form>
        )}
      </main>
    </div>
  );
}
