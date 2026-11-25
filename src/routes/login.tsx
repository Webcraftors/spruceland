import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SessionProvider, useSession, ROLE_LABELS } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { resolveStaffSession } from "@/lib/staff-auth";
import { runSplash } from "@/components/brand/SplashHost";
const LOGO_URL = "/spruceland-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Staff sign-in — Spruceland IQ" },
    { name: "description", content: "Secure sign-in for Spruceland Technologies staff." },
    { property: "og:title", content: "Staff sign-in — Spruceland IQ" },
    { property: "og:description", content: "Secure sign-in for Spruceland Technologies staff." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => (<SessionProvider><LoginPage /></SessionProvider>),
});

type Mode = "signin" | "signup" | "forgot";

function LoginPage() {
  const { setSession } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setNotice("");
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("If that email has an account, a reset link is on its way.");
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/login`, data: { full_name: name.trim() } } });
        if (error) throw error;
        setNotice("Check your email to confirm your account, then sign in here.");
        setMode("signin");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      const s = await resolveStaffSession();
      if (!s) {
        await supabase.auth.signOut();
        throw new Error("This account has no Spruceland staff access. Ask an administrator to invite you.");
      }
      setSession(s);
      await runSplash({ name: s.name, brand: "stgl", subtitle: `Signed in as ${ROLE_LABELS[s.role]}.` });
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.05fr_1fr] bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-sidebar text-sidebar-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.09]" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, var(--primary) 0, transparent 45%), radial-gradient(circle at 85% 80%, var(--info) 0, transparent 40%)" }} />
        <div className="relative flex items-center gap-3">
          <div className="rounded-lg bg-sidebar-accent/60 backdrop-blur px-3 py-2"><img src={LOGO_URL} alt="Spruceland Technologies" className="h-10 w-auto" /></div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Operations Console</div>
        </div>
        <div className="relative">
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.05] tracking-tight">
            Field service, weighing &amp; installations — <span className="text-primary">one command centre.</span>
          </h1>
          <p className="mt-4 text-sidebar-foreground/70 max-w-lg text-[15px] leading-relaxed">Jobs, clients, technicians, inventory and knowledge — coordinated across your branches.</p>
        </div>
        <div className="relative text-[11px] text-sidebar-foreground/50">A Client Driven Partner · Spruceland Technologies Group Ltd</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md border-border bg-card">
          <CardContent className="p-8">
            <div className="lg:hidden mb-6 flex justify-center"><img src={LOGO_URL} alt="Spruceland" className="h-12 w-auto" /></div>
            <h2 className="text-2xl font-bold">{mode === "signup" ? "Create staff account" : mode === "forgot" ? "Reset password" : "Staff sign-in"}</h2>
            <p className="text-sm text-muted-foreground mt-1">{mode === "forgot" ? "We'll email you a reset link." : "Use your Spruceland work email."}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} required /></div>
              )}
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              {mode !== "forgot" && (
                <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /></div>
              )}
              {notice && <p className="text-sm rounded-md border border-border bg-muted p-3">{notice}</p>}
              <Button type="submit" disabled={busy} className="w-full h-11 text-base font-semibold">
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
              </Button>
              <div className="flex justify-between text-xs">
                {mode === "signin" ? (
                  <>
                    <button type="button" className="text-primary font-medium" onClick={() => setMode("forgot")}>Forgot password?</button>
                    <button type="button" className="text-primary font-medium" onClick={() => setMode("signup")}>First time? Create account</button>
                  </>
                ) : (
                  <button type="button" className="text-primary font-medium" onClick={() => setMode("signin")}>Back to sign in</button>
                )}
              </div>
              <p className="text-xs text-center text-muted-foreground">Client staff? <Link to="/client" className="text-primary font-medium">Use the Client Portal</Link></p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
