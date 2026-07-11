import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
  | "financials" | "team" | "knowledge" | "notifications" | "settings" | "permissions";

export const PERMISSIONS: Record<Role, Module[]> = {
  owner:         ["dashboard","jobs","clients","inventory","orders","financials","team","knowledge","notifications","settings","permissions"],
  administrator: ["dashboard","jobs","clients","inventory","orders","financials","team","knowledge","notifications","settings","permissions"],
  head_tech:     ["dashboard","jobs","clients","inventory","orders","team","knowledge","notifications","settings"],
  technician:    ["dashboard","jobs","clients","inventory","knowledge","notifications","settings"],
  crm:           ["dashboard","clients","jobs","financials","notifications","settings"],
};

export function can(role: Role, m: Module) { return PERMISSIONS[role].includes(m); }

const KEY = "spruceland.session.v1";
const Ctx = createContext<{ session: Session | null; setSession: (s: Session | null) => void }>({
  session: null, setSession: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSessionState(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);
  const setSession = (s: Session | null) => {
    setSessionState(s);
    if (typeof window !== "undefined") {
      if (s) localStorage.setItem(KEY, JSON.stringify(s));
      else localStorage.removeItem(KEY);
    }
  };
  if (!hydrated) return null;
  return <Ctx.Provider value={{ session, setSession }}>{children}</Ctx.Provider>;
}

export function useSession() { return useContext(Ctx); }

export function formatZMW(n: number) {
  return new Intl.NumberFormat("en-ZM", { style: "currency", currency: "ZMW", maximumFractionDigits: 0 }).format(n);
}
