import { supabase } from "@/integrations/supabase/client";
import type { Role, Session } from "@/lib/session";
import { readPortalAccess } from "@/lib/portal-access";

const ROLES: Role[] = ["owner", "head_tech", "technician", "administrator", "crm"];

/** Resolves the signed-in account's STGL staff role. Approved leadership emails are granted access on first sign-in. */
export async function resolveStaffSession(): Promise<Session | null> {
  const access = await readPortalAccess(supabase);
  if (!access) return null;
  const role = access.platform_admin ? "administrator" : ROLES.includes(access.staff_role as Role) ? access.staff_role as Role : null;
  if (!role) return null;
  return { name: access.full_name || "Team member", role, location: "Both", subcontractor: false, platformAdmin: access.platform_admin };
}
