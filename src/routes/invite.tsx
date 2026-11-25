import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { registerPushForUser } from "@/lib/push/native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/invite")({
  validateSearch: z.object({ token: z.string().min(10).max(200).optional() }),
  head: () => ({
    meta: [
      { title: "Accept your invitation — Spruceland IQ" },
      { name: "description", content: "Set up your Spruceland IQ account from your invitation." },
      { property: "og:title", content: "Accept your invitation — Spruceland IQ" },
      { property: "og:description", content: "Set up your Spruceland IQ account from your invitation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function accept() {
    const { error } = await (supabase as any).rpc("accept_user_invitation", { p_token: token });
    if (error) { setMsg(error.message); return; }
    const { data } = await supabase.auth.getUser();
    if (data.user) void registerPushForUser(data.user.id);
    setDone(true);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session && token) void accept(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const res = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) { setMsg(res.error.message); return; }
    if (!res.data.session) { setMsg("Check your inbox to confirm your email, then open the invitation link again."); return; }
    await accept();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <img src="/spruceland-logo.png" alt="Spruceland" className="mb-4 h-8" />
        {!token ? <p className="text-sm">This invitation link is incomplete. Ask your administrator to resend it.</p>
        : done ? (
          <div className="space-y-3">
            <h1 className="text-lg font-semibold">You're in</h1>
            <p className="text-sm text-muted-foreground">Your invitation has been accepted.</p>
            <Button asChild className="w-full"><Link to="/">Continue</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <h1 className="text-lg font-semibold">{mode === "signup" ? "Create your account" : "Sign in to accept"}</h1>
            <p className="text-xs text-muted-foreground">Use the email address the invitation was sent to.</p>
            <div className="space-y-1"><Label htmlFor="em">Email</Label><Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            {msg && <p className="text-sm text-destructive">{msg}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</Button>
            <button type="button" className="w-full text-xs text-primary" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
              {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
