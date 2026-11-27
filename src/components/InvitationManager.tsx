import { useEffect, useState } from "react";
import { UserPlus, RefreshCw, Ban, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { clientAuth } from "@/lib/client-auth";
interface Option { id: string; name: string; code?: string }
interface Organization extends Option { slug: string; roles: Option[]; locations: Option[]; applications: Option[] }
interface Invitation { invitation_id: string; email: string; full_name: string | null; status: string; expires_at: string; created_at: string }
export function InvitationManager({ audience = "staff" }: { audience?: "staff" | "client" }) {
  const client = audience === "client" ? clientAuth : supabase;
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgId, setOrgId] = useState(""); const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(""); const [fullName, setFullName] = useState(""); const [employeeRef, setEmployeeRef] = useState("");
  const [roleId, setRoleId] = useState(""); const [appId, setAppId] = useState(""); const [locations, setLocations] = useState<string[]>([]);
  const org = organizations.find(o => o.id === orgId);
  useEffect(() => {
    let active = true;
    void client.rpc("get_invitation_context").then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message);
      else { const list = (data as unknown as Organization[] ?? []).filter(o => audience === "staff" || o.slug !== "stgl"); setOrganizations(list); setOrgId(list[0]?.id ?? ""); }
      setLoading(false);
    });
    return () => { active = false; };
  }, [client, audience]);
  async function reload() {
    if (!orgId) return;
    const { data, error } = await client.rpc("list_org_invitations", { p_organization_id: orgId });
    if (error) { setError(error.message); return; }
    setError(""); setInvitations(data ?? []);
  }
  useEffect(() => { setRoleId(""); setAppId(""); setLocations([]); void reload(); }, [orgId]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!org || !roleId || !appId) return;
    setBusy(true);
    try {
      const { data } = await client.auth.getSession();
      if (!data.session) throw new Error("Please sign in again");
      const response = await fetch("/api/public/portal-invitations", { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: orgId, email: email.trim(), fullName: fullName.trim(), employeeRef, roleIds: [roleId], applicationIds: [appId], locationIds: locations }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Invitation failed");
      if (result.emailed) toast.success("Invitation created and accepted by the email service. Check the recipient's inbox.");
      else toast.warning("Invitation saved, but email sending failed. Cancel it and send a new invitation after checking email setup.");
      setEmail(""); setFullName(""); setEmployeeRef(""); await reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Invitation failed"); }
    finally { setBusy(false); }
  }
  async function cancel(invitation: Invitation) {
    if (!window.confirm(`Cancel the invitation for ${invitation.email}?`)) return;
    setBusy(true);
    const { error } = await client.rpc("revoke_user_invitation", { p_invitation_id: invitation.invitation_id });
    if (error) toast.error(error.message); else { toast.success("Invitation cancelled"); await reload(); }
    setBusy(false);
  }
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Loading invitation access…</p>;
  if (!organizations.length) return <div className="space-y-2"><h1 className="text-xl font-bold">People & invitations</h1><p className="text-sm text-muted-foreground">Your account does not have invitation permissions.</p>{error && <p role="alert" className="text-destructive text-sm">{error}</p>}</div>;
  return <div className="space-y-6">
    <header className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">People & invitations</h1><p className="text-sm text-muted-foreground">Invite team members to their company, role and assigned stores.</p></div><Button variant="outline" size="icon" aria-label="Refresh invitations" onClick={() => void reload()}><RefreshCw className="h-4 w-4" /></Button></header>
    <div className="max-w-sm space-y-2"><Label>Company</Label><Select value={orgId} onValueChange={setOrgId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8">
      <form onSubmit={submit} className="space-y-4 min-w-0">
        <h2 className="font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" />New invitation</h2>
        <div className="space-y-2"><Label htmlFor="invite-name">Full name</Label><Input id="invite-name" required minLength={2} value={fullName} onChange={e => setFullName(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="invite-email">Email address</Label><Input id="invite-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="invite-ref">Employee ID / NRC (optional)</Label><Input id="invite-ref" value={employeeRef} onChange={e => setEmployeeRef(e.target.value)} /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Role</Label><Select value={roleId} onValueChange={setRoleId}><SelectTrigger aria-label="Invitation role"><SelectValue placeholder="Choose role" /></SelectTrigger><SelectContent>{org?.roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Portal access</Label><Select value={appId} onValueChange={setAppId}><SelectTrigger aria-label="Invitation portal"><SelectValue placeholder="Choose portal" /></SelectTrigger><SelectContent>{org?.applications.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <fieldset className="space-y-2"><legend className="text-sm font-medium mb-2">Assigned stores / locations</legend>{org?.locations.length ? <div className="max-h-52 overflow-y-auto space-y-3 border border-border rounded-md p-3">{org.locations.map(l => <Label key={l.id} className="flex items-center gap-3 text-sm font-normal"><Checkbox checked={locations.includes(l.id)} onCheckedChange={checked => setLocations(p => checked ? [...p, l.id] : p.filter(id => id !== l.id))} />{l.name}</Label>)}</div> : <p className="text-xs text-muted-foreground">No locations available. A store account needs an assigned location before it can open its workspace.</p>}</fieldset>
        <Button type="submit" disabled={busy || !roleId || !appId} className="w-full"><Mail className="h-4 w-4 mr-2" />{busy ? "Sending…" : "Send invitation"}</Button>
      </form>
      <section className="min-w-0"><h2 className="font-semibold mb-3">Invitation history <span className="text-muted-foreground text-sm">({invitations.length})</span></h2>{!invitations.length ? <p className="text-sm text-muted-foreground py-6">No invitations sent yet.</p> : <ul className="divide-y divide-border">{invitations.map(i => <li key={i.invitation_id} className="py-4 flex items-start gap-3"><div className="flex-1 min-w-0"><div className="text-sm font-medium break-words">{i.full_name || i.email}</div><div className="text-xs text-muted-foreground break-all">{i.email}</div><div className="flex flex-wrap items-center gap-2 mt-2"><Badge variant="outline">{i.status}</Badge><span className="text-xs text-muted-foreground">Expires {new Date(i.expires_at).toLocaleDateString("en-GB")}</span></div></div>{i.status === "pending" && <Button size="icon" variant="ghost" disabled={busy} aria-label={`Cancel invitation for ${i.email}`} title="Cancel invitation" onClick={() => void cancel(i)}><Ban className="h-4 w-4" /></Button>}</li>)}</ul>}</section>
    </div>
  </div>;
}
