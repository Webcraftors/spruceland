import { createContext, useContext, useState, type ReactNode } from "react";
import { useAccount } from "./account";

export type Role = "owner" | "head_tech" | "technician" | "administrator" | "crm";
export type Location = "Lusaka" | "Ndola" | "Both";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  head_tech: "Head of Tech",
  technician: "Technician",
  administrator: "Administrator",
  crm: "Client Relationship Manager",
};

export interface Session {
  name: string;
  role: Role;
  location: Location;
  subcontractor: boolean;
}

export type Module =
  | "dashboard" | "jobs" | "clients" | "inventory" | "orders"
  | "financials" | "team" | "knowledge" | "notifications" | "settings" | "permissions" | "activity";

export const PERMISSIONS: Record<Role, Module[]> = {
  owner:         ["dashboard","jobs","clients","inventory","orders","financials","team","knowledge","notifications","settings","permissions","activity"],
  administrator: ["dashboard","jobs","clients","inventory","orders","financials","team","knowledge","notifications","settings","permissions","activity"],
  head_tech:     ["dashboard","jobs","clients","inventory","orders","team","knowledge","notifications","settings","activity"],
  technician:    ["dashboard","jobs","clients","inventory","knowledge","notifications","settings"],
  crm:           ["dashboard","clients","jobs","financials","notifications","settings","activity"],
};

export function can(role: Role, m: Module) { return PERMISSIONS[role].includes(m); }

const Ctx = createContext<{ session: Session | null; setSession: (s: Session | null) => void }>({ session: null, setSession: () => {} });
export function SessionProvider({ children }: { children: ReactNode }) {
  const { account } = useAccount();
  const [location, setLocation] = useState<Location>("Lusaka");
  const session: Session | null = account?.role ? { name: account.profile.full_name || account.user.email || 'Staff', role: account.role, location, subcontractor: false } : null;
  // The office switch changes presentation only; it cannot change granted roles.
  const setSession = (s: Session | null) => { if (s) setLocation(s.location); };
  return <Ctx.Provider value={{ session, setSession }}>{children}</Ctx.Provider>;
}

export function useSession() { return useContext(Ctx); }

export function formatZMW(n: number) {
  return new Intl.NumberFormat("en-ZM", { style: "currency", currency: "ZMW", maximumFractionDigits: 0 }).format(n);
}
