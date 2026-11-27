import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
export interface PortalLocation { id: string; name: string; city: string | null; province: string | null; type: string }
export interface PortalOrganization { id: string; name: string; slug: string; can_invite: boolean; locations: PortalLocation[]; applications: { id: string; code: string; name: string }[] }
export interface PortalAccess { user_id: string; full_name: string | null; employee_ref: string | null; platform_admin: boolean; staff_role: string | null; organizations: PortalOrganization[] }

/** Provisioning is self-only and server-allowlisted; no role comes from local storage. */
export async function readPortalAccess(client: SupabaseClient<Database>, provision = true): Promise<PortalAccess | null> {
  const { data: identity, error: identityError } = await client.auth.getUser();
  if (identityError || !identity.user) return null;
  if (provision) {
    const { data } = await client.auth.getSession();
    if (data.session) {
      const response = await fetch("/api/public/provision-leadership", { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" }, body: "{}" });
      if (response.status >= 500 || response.status === 409 || response.status === 207) throw new Error("Approved account setup could not finish. Please retry or ask your administrator to check leadership setup.");
    }
  }
  const { data, error } = await client.rpc("get_portal_access");
  if (error) throw new Error(error.message);
  return data as unknown as PortalAccess | null;
}

export function clientOrganizations(access: PortalAccess): PortalOrganization[] {
  return access.organizations.filter(o => o.slug !== "stgl" && (access.platform_admin || o.applications.some(a => a.code === "client_admin" || a.code === "yalelo_manager")));
}