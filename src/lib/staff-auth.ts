import { supabase } from "@/integrations/supabase/client";
import type { Role, Session } from "@/lib/session";

const ROLES: Role[] = ["owner", "head_tech", "technician", "administrator", "crm"];

/** Resolves the signed-in account's STGL staff role. Approved leadership emails are granted access on first sign-in. */
export async function resolveStaffSession(): Promise<Session | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  let role = await currentRole();
  if (!role) {
    const { data: s } = await supabase.auth.getSession();
    if (s.session) {
      await fetch("/api/public/provision-leadership", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.session.access_token}`, "Content-Type": "application/json" },
        body: "{}",
      }).catch(() => null);
      role = await currentRole();
    }
  }
  if (!role) return null;
  const { data: p } = await supabase.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle();
  const name = (p as { full_name?: string | null } | null)?.full_name || (u.user.user_metadata?.["full_name"] as string | undefined) || u.user.email?.split("@")[0] || "Team member";
  return { name, role, location: "Both", subcontractor: false };
}

async function currentRole(): Promise<Role | null> {
  const { data } = await supabase.rpc("current_internal_role");
  return ROLES.includes(data as Role) ? (data as Role) : null;
}
