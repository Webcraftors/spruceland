import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { SessionProvider, useSession, ROLE_LABELS, type Role, type Location } from "@/lib/session";
const LOGO_URL = "/spruceland-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Spruceland Ops" }, { name: "description", content: "Sign in to the Spruceland operations dashboard." }] }),
  component: () => (
    <SessionProvider>
      <LoginPage />
    </SessionProvider>
  ),
});

function LoginPage() {
  const { setSession } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("owner");
  const [location, setLocation] = useState<Location>("Lusaka");
  const [sub, setSub] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSession({ name: name.trim(), role, location, subcontractor: sub });
    navigate({ to: "/dashboard" });
  };

  const showSub = role === "technician" || role === "head_tech";

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.05fr_1fr] bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-sidebar text-sidebar-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.09]" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, var(--primary) 0, transparent 45%), radial-gradient(circle at 85% 80%, var(--info) 0, transparent 40%)" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(var(--sidebar-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--sidebar-foreground) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="relative flex items-center gap-3">
          <div className="rounded-lg bg-sidebar-accent/60 backdrop-blur px-3 py-2">
            <img src={LOGO_URL} alt="Spruceland Technologies" className="h-10 w-auto" />
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Operations Console</div>
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/40 px-3 py-1 text-[11px] text-sidebar-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live across Lusaka &amp; Ndola
          </div>
          <h1 className="mt-5 text-4xl xl:text-5xl font-extrabold leading-[1.05] tracking-tight">
            Field service, weighing &amp; installations — <span className="text-primary">one command centre.</span>
          </h1>
          <p className="mt-4 text-sidebar-foreground/70 max-w-lg text-[15px] leading-relaxed">
            Jobs, clients, technicians, inventory and knowledge — coordinated across your branches. Built for site teams, TV walls and the front office.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
            <Stat kpi="18" label="Active clients" />
            <Stat kpi="2" label="Regional offices" />
            <Stat kpi="7" label="Techs on the road" />
          </div>
        </div>
        <div className="relative text-[11px] text-sidebar-foreground/50">A Client Driven Partner · Spruceland Technologies Group Ltd</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md border-border bg-card">
          <CardContent className="p-8">
            <div className="lg:hidden mb-6 flex justify-center">
              <img src={LOGO_URL} alt="Spruceland" className="h-12 w-auto" />
            </div>
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">Choose your role and location to continue.</p>

            <form onSubmit={submit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" placeholder="e.g. Peter Mwanza" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={location} onValueChange={(v) => setLocation(v as Location)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lusaka">Lusaka</SelectItem>
                    <SelectItem value="Ndola">Ndola</SelectItem>
                    <SelectItem value="Both">Both offices</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showSub && (
                <div className="flex items-center justify-between rounded-md border border-border bg-background/40 p-3">
                  <div>
                    <Label htmlFor="sub" className="cursor-pointer">Subcontractor</Label>
                    <p className="text-xs text-muted-foreground">Tick if you are working under contract, not staff.</p>
                  </div>
                  <Switch id="sub" checked={sub} onCheckedChange={setSub} />
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base font-semibold">Enter dashboard</Button>
              <p className="text-xs text-center text-muted-foreground">Demo build — no password required. Session stored locally.</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ kpi, label }: { kpi: string; label: string }) {
  return (
    <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 backdrop-blur px-3 py-4 text-center">
      <div className="text-2xl font-extrabold text-primary tracking-tight">{kpi}</div>
      <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 mt-1">{label}</div>
    </div>
  );
}
