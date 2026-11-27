import { clientAuth } from "@/lib/client-auth";
import { readPortalAccess, clientOrganizations } from "@/lib/portal-access";
import type { ClientSession } from "@/domain/types";

export async function resolveClientSession(selection?: { clientId?: string; locationId?: string }): Promise<ClientSession | null> {
  const access = await readPortalAccess(clientAuth);
  if (!access) return null;
  const organizations = clientOrganizations(access);
  const org = organizations.find(o => o.id === selection?.clientId) ?? organizations[0];
  if (!org) return null;
  const location = org.locations.find(l => l.id === selection?.locationId) ?? org.locations[0];
  if (!location && !org.can_invite && !access.platform_admin) throw new Error("Your account has no assigned store. Ask your administrator to assign a store.");
  return { clientId: org.id, clientName: org.name, employeeName: access.full_name || "Team member", employeeRef: access.employee_ref || "Not provided",
    department: org.can_invite ? "Administration" : "Store team", site: { name: location?.name ?? "All assigned stores", city: location?.city ?? "", province: location?.province ?? "" },
    signedInAt: new Date().toISOString(), userId: access.user_id, locationId: location?.id, canInvite: org.can_invite,
  };
}