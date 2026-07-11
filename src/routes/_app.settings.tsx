import { createFileRoute } from "@tanstack/react-router";
import { useSession, ROLE_LABELS } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Spruceland Ops" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { session, setSession } = useSession();
  const [name, setName] = useState(session?.name ?? "");
  const [notif, setNotif] = useState(true);
  const [density, setDensity] = useState(false);

  if (!session) return null;
  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences.</p>
      </header>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="n">Display name</Label>
            <Input id="n" value={name} onChange={e => setName(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-muted-foreground">Role</div><div className="font-medium">{ROLE_LABELS[session.role]}</div></div>
            <div><div className="text-xs text-muted-foreground">Location</div><div className="font-medium">{session.location}</div></div>
          </div>
          <Button onClick={() => { setSession({ ...session, name }); toast.success("Profile updated"); }}>Save</Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Row label="Email notifications" desc="Receive updates when jobs are escalated or service is due.">
            <Switch checked={notif} onCheckedChange={setNotif} />
          </Row>
          <Row label="Compact density" desc="Reduce spacing across tables and job cards.">
            <Switch checked={density} onCheckedChange={setDensity} />
          </Row>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}
