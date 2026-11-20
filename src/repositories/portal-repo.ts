/**
 * Portal data layer. Every screen talks to these async functions only.
 * Current implementation: browser localStorage (demo). To connect the backend,
 * re-implement the same functions against Lovable Cloud / an API — screens stay unchanged.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import type { ClientSession, Ticket, TicketStatus, Resolution } from "@/domain/types";
import { canTransition, validateSignOff, type SignOffInput } from "@/domain/ticket-workflow";
import { seedTicketsForSite } from "@/data/portal";
import { techById } from "@/data/technicians";

const TICKETS_KEY = "spruceland.portal.tickets.v1";
const SESSION_KEY = "spruceland.client.session.v1";

const listeners = new Set<() => void>();
let cache: Ticket[] | null = null;

function load(): Ticket[] {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]"); } catch { cache = []; }
  return cache ?? [];
}
function save(next: Ticket[]) {
  try { localStorage.setItem(TICKETS_KEY, JSON.stringify(next)); }
  catch { throw new Error("Could not save this change. Free device storage and try again."); }
  cache = next;
  listeners.forEach(l => l());
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === TICKETS_KEY) { cache = null; listeners.forEach(l => l()); } });
}
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
const EMPTY: Ticket[] = [];

function update(id: string, fn: (t: Ticket) => Ticket) {
  const list = load();
  const t = list.find(x => x.id === id);
  if (!t) throw new Error("Ticket not found");
  const next = fn(structuredClone(t));
  save(list.map(x => x.id === id ? next : x));
  return next;
}
function move(t: Ticket, to: TicketStatus) {
  if (!canTransition(t.status, to)) throw new Error(`Cannot move ticket from ${t.status} to ${to}`);
  t.status = to;
}
const now = () => new Date().toISOString();

export const ticketsRepo = {
  async list(): Promise<Ticket[]> { return load(); },
  async get(id: string) { return load().find(t => t.id === id) ?? null; },
  async create(input: Omit<Ticket, "id" | "status" | "createdAt" | "activity">): Promise<Ticket> {
    const list = load();
    let n = 1100 + list.length; let id = `TK-${n}`;
    while (list.some(t => t.id === id)) id = `TK-${++n}`;
    const t: Ticket = { ...input, id, status: "Open", createdAt: now(), activity: [{ at: now(), actor: input.reportedBy.name, side: "client", text: "Ticket raised" }] };
    save([t, ...list]);
    return t;
  },
  async assign(id: string, technicianId: string, scheduledFor: string, actor: string) {
    return update(id, t => {
      if (t.status !== "Open" && t.status !== "Assigned") throw new Error("Only open or assigned tickets can be assigned.");
      if (!techById(technicianId)) throw new Error("Choose a valid technician.");
      if (!Number.isFinite(Date.parse(scheduledFor))) throw new Error("Choose a valid visit date.");
      if (t.status === "Open") move(t, "Assigned");
      t.technicianId = technicianId; t.scheduledFor = scheduledFor;
      t.activity.push({ at: now(), actor, side: "spruceland", text: `Assigned to ${techById(technicianId)?.name ?? technicianId}` });
      return t;
    });
  },
  async startWork(id: string, actor: string) {
    return update(id, t => { move(t, "In Progress"); t.workStartedAt = now(); t.activity.push({ at: t.workStartedAt, actor, side: "spruceland", text: "Technician on site — work started" }); return t; });
  },
  async resolve(id: string, r: Omit<Resolution, "resolvedAt">) {
    return update(id, t => {
      if (!r.diagnosis.trim() || !r.workDone.trim()) throw new Error("Enter the diagnosis and work completed.");
      if (!t.technicianId || t.technicianId !== r.technicianId) throw new Error("The assigned technician must complete the repair report.");
      move(t, "Awaiting Sign-off");
      t.resolution = { ...r, arrivedAt: t.workStartedAt ?? r.arrivedAt, resolvedAt: now() };
      t.activity.push({ at: now(), actor: r.technicianName, side: "spruceland", text: "Work completed — awaiting client sign-off" });
      return t;
    });
  },
  async signOff(id: string, input: SignOffInput, employee: { name: string; employeeRef: string }) {
    const errors = validateSignOff(input, employee);
    if (errors.length) throw new Error(errors.join(" "));
    return update(id, t => {
      if (!t.resolution) throw new Error("The technician report is required before sign-off.");
      move(t, "Closed");
      t.signOff = { name: input.typedName.trim(), employeeRef: input.typedRef.trim(), consent: true, signedAt: now() };
      t.activity.push({ at: now(), actor: employee.name, side: "client", text: "Signed off — ticket closed" });
      return t;
    });
  },
  async dispute(id: string, reason: string, actor: string) {
    if (reason.trim().length < 5) throw new Error("Tell us what is still wrong.");
    return update(id, t => { move(t, "In Progress"); t.activity.push({ at: now(), actor, side: "client", text: `Sign-off declined: ${reason}` }); return t; });
  },
  /** Demo only: give a site a realistic history the first time someone signs in there. */
  async ensureSiteSeed(s: ClientSession) {
    const list = load();
    if (list.some(t => t.clientId === s.clientId && t.site.name === s.site.name)) return;
    const seeds = seedTicketsForSite(s.clientId, s.clientName, s.site, { name: s.employeeName, employeeRef: s.employeeRef })
      .filter(t => !list.some(x => x.id === t.id));
    save([...seeds, ...list]);
  },
};

/** Live list of tickets; empty during SSR and before hydration. */
export function useTickets(): Ticket[] {
  return useSyncExternalStore(subscribe, () => (typeof window === "undefined" ? EMPTY : load()), () => EMPTY);
}

export const clientSessionRepo = {
  get(): ClientSession | null { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } },
  set(s: ClientSession | null) { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); },
};

/** undefined = still loading, null = signed out. */
export function useClientSession() {
  const [s, setS] = useState<ClientSession | null | undefined>(undefined);
  useEffect(() => { setS(clientSessionRepo.get()); }, []);
  return [s, (v: ClientSession | null) => { clientSessionRepo.set(v); setS(v); }] as const;
}
