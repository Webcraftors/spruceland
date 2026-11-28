import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { clientAuth } from "@/lib/client-auth";
import { z } from "zod";

export const Route = createFileRoute("/reset-password")({
  validateSearch: z.object({ portal: z.enum(["staff", "client"]).optional() }),
  head: () => ({ meta: [
    { title: "Set a new password — Spruceland IQ" },
    { name: "description", content: "Choose a new password for your Spruceland IQ account." },
    { property: "og:title", content: "Set a new password — Spruceland IQ" },
    { property: "og:description", content: "Choose a new password for your Spruceland IQ account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const { portal } = Route.useSearch();
  const client = portal === "client" ? clientAuth : supabase;
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await client.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. Please sign in.");
    await client.auth.signOut();
    navigate({ to: portal === "client" ? "/client" : "/login" });
  };
  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <Card className="w-full max-w-sm"><CardContent className="p-8">
        <h1 className="text-xl font-bold">Set a new password</h1>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-2"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" minLength={8} autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} required /></div>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Save password"}</Button>
        </form>
      </CardContent></Card>
    </div>
  );
}
