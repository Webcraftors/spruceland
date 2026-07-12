import type { Role, Location } from "@/lib/session";
import type { Job, Client, InventoryItem } from "@/lib/store";

/** Returns true when the given office matches the user's selected location. */
export function locationMatches(userLoc: Location, itemLoc: "Lusaka" | "Ndola") {
  if (userLoc === "Both") return true;
  return userLoc === itemLoc;
}

/** Whether the role is allowed to see a module category in search results. */
export function roleAllowsCategory(role: Role, cat: "job" | "client" | "inventory") {
  if (cat === "inventory") return role !== "crm"; // CRM doesn't manage inventory
  return true; // jobs & clients: everyone visible
}

export function scopedJobs(jobs: Job[], role: Role, loc: Location) {
  return jobs.filter(j => locationMatches(loc, j.location) && roleAllowsCategory(role, "job"));
}
export function scopedClients(clients: Client[], role: Role, loc: Location) {
  return clients.filter(c => locationMatches(loc, c.office));
}
export function scopedInventory(items: InventoryItem[], role: Role, loc: Location) {
  if (!roleAllowsCategory(role, "inventory")) return [];
  return items.filter(i => locationMatches(loc, i.location));
}
