import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, LockKeyhole, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runSplash } from "@/components/brand/SplashHost";
import { clientAuth } from "@/lib/client-auth";
import { clientOrganizations, readPortalAccess, type PortalOrganization } from "@/lib/portal-access";
import { resolveClientSession } from "@/lib/client-session";
import { clientSessionRepo } from "@/repositories/portal-repo";
import { pageMeta } from "@/lib/meta";
import yalelo from "@/assets/brand/yalelo_logo.png.asset.json";

export const Route = createFileRoute("/client")({
  head: () => pageMeta("Client & Yalelo sign-in — Spruceland IQ", "Secure account access for client administrators and assigned store teams."),
  component: ClientSignIn,
});
function ClientSignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  const [organizations, setOrganizations] = useState<PortalOrganization[]>([]);
  const [organizationId, setOrganizationId] = useState(""); const [locationId, setLocationId] = useState("");
  const org = organizations.find(o => o.id === organizationId);

  async function openPortal(orgId: string, siteId?: string) {
    const session = await resolveClientSession({ clientId: orgId, locationId: siteId });
    if (!session) throw new Error("No client portal access. Accept an invitation or use your approved administrator email.");
    clientSessionRepo.set(session);
    await runSplash({ name: session.employeeName, brand: /yalelo/i.test(session.clientName) ? "yalelo" : "stgl", subtitle: `${session.clientName} · ${session.site.name}` });
    await navigate({ to: "/client/app" });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      if (organizations.length) { await openPortal(organizationId, locationId); return; }
      if (mode === "forgot") {
        const { error } = await clientAuth.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password?portal=client` });
        if (error) throw error;
        setNotice("If your account exists, a password reset link is on its way."); return;
      }
      if (mode === "signup") {
        const { error } = await clientAuth.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/client`, data: { full_name: name.trim() } } });
        if (error) throw error;
        setNotice("Check your email to confirm your account, then sign in. Store access requires an invitation; approved administrators receive access after confirmation."); setMode("signin"); return;
      }
      const { error } = await clientAuth.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      const access = await readPortalAccess(clientAuth);
      const list = access ? clientOrganizations(access) : [];
      if (!list.length) throw new Error("Your email has no client portal access yet. Accept your invitation, or ask an administrator to invite you.");
      const first = list[0];
      if (!first) return;
      if (list.length === 1 && first.locations.length <= 1) { await openPortal(first.id, first.locations[0]?.id); return; }
      setOrganizations(list); setOrganizationId(first.id); setLocationId(first.locations[0]?.id ?? "");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Sign-in failed"); }
    finally { setBusy(false); }
  }
  return <div className="min-h-dvh bg-background flex flex-col">
    <header className="flex items-center gap-3 px-4 h-14 border-b border-border"><Button asChild variant="ghost" size="icon"><Link to="/" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Link></Button><img src="/spruceland-logo.png" alt="Spruceland" className="h-7 w-auto" /><span className="ml-auto text-xs text-muted-foreground">Client Portal</span></header>
    <main className="w-full max-w-md mx-auto px-6 py-10 flex-1">
      <div className="flex items-center gap-3 mb-7"><img src={yalelo.url} alt="Yalelo" className="h-16 w-16 rounded-lg" /><div><div className="text-lg font-bold">Yalelo × Spruceland</div><div className="text-xs text-muted-foreground">Client administrators & store teams</div></div></div>
      <h1 className="text-2xl font-bold">{organizations.length ? "Your workspace" : mode === "signup" ? "Create an account" : mode === "forgot" ? "Reset password" : "Client sign-in"}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {organizations.length ? <>
          <div className="space-y-2"><Label>Company</Label><Select value={organizationId} onValueChange={id => { setOrganizationId(id); setLocationId(organizations.find(o => o.id === id)?.locations[0]?.id ?? ""); }}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
          {!!org?.locations.length && <div className="space-y-2"><Label className="flex gap-2 items-center"><MapPin className="h-4 w-4" />Assigned store / site</Label><Select value={locationId} onValueChange={setLocationId}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{org.locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}{l.province ? ` · ${l.province}` : ""}</SelectItem>)}</SelectContent></Select></div>}
        </> : <>
          {mode === "signup" && <div className="space-y-2"><Label htmlFor="client-name">Full name</Label><Input id="client-name" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} /></div>}
          <div className="space-y-2"><Label htmlFor="client-email">Work email</Label><Input id="client-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          {mode !== "forgot" && <div className="space-y-2"><Label htmlFor="client-password">Password</Label><Input id="client-password" type="password" minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={password} onChange={e => setPassword(e.target.value)} /></div>}
        </>}
        {notice && <p role="status" className="text-sm border border-border bg-muted p-3 rounded-md">{notice}</p>}
        <Button className="w-full h-11" disabled={busy || (!!organizations.length && !org)}><LockKeyhole className="h-4 w-4 mr-2" />{busy ? "Please wait…" : organizations.length ? "Open portal" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
        {!organizations.length && <div className="flex flex-wrap justify-between gap-2"><Button type="button" variant="link" className="px-0 text-xs" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setNotice(""); }}>{mode === "signup" ? "Already registered? Sign in" : "First time? Create account"}</Button><Button type="button" variant="link" className="px-0 text-xs" onClick={() => { setMode(mode === "forgot" ? "signin" : "forgot"); setNotice(""); }}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</Button></div>}
        {!!organizations.length && <Button type="button" variant="link" className="w-full" onClick={async () => { await clientAuth.auth.signOut(); setOrganizations([]); }}>Use another account</Button>}
      </form>
      <p className="mt-6 text-xs text-muted-foreground">Invited team members should open the invitation email first. Creating an account does not grant store or administrator access.</p>
      <Button asChild variant="link" className="mt-3 px-0"><Link to="/login">Spruceland staff sign-in</Link></Button>
    </main>
  </div>;
}
