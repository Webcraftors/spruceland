import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { JOBS as SEED_JOBS, type Job, type JobStatus, type JobPriority, type JobType } from "@/data/jobs";
import { CLIENTS as SEED_CLIENTS, type Client } from "@/data/clients";
import { INVENTORY as SEED_INV, ORDERS as SEED_ORDERS, type InventoryItem, type Order } from "@/data/inventory";
import { NOTIFICATIONS as SEED_NOTIFS, type AppNotification } from "@/data/notifications";
import { SEED_AUDIT, type AuditEntry, type AuditAction, type AuditEntity } from "@/data/audit";
import { addDays } from "date-fns";

export type NewJob = Omit<Job, "id" | "createdAt">;
export type NewClient = Omit<Client, "id">;
export type NewInv = Omit<InventoryItem, "id">;
export type NewOrder = Omit<Order, "id">;

interface StoreValue {
  jobs: Job[];
  clients: Client[];
  inventory: InventoryItem[];
  orders: Order[];
  notifications: AppNotification[];
  audit: AuditEntry[];
  actingAs: { name: string; role: string };
  setActingAs: (a: { name: string; role: string }) => void;
  // jobs
  addJob: (j: NewJob) => Job;
  updateJob: (id: string, patch: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  assignJob: (id: string, techIds: string[]) => void;
  // clients
  addClient: (c: NewClient) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  // inventory
  addInventory: (i: NewInv) => InventoryItem;
  updateInventory: (id: string, patch: Partial<InventoryItem>) => void;
  deleteInventory: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  // orders
  addOrder: (o: NewOrder) => Order;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  // notifications
  pushNotification: (n: Omit<AppNotification, "id" | "time" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

let jobSeq = SEED_JOBS.length;
let clientSeq = 100;
let invSeq = SEED_INV.length;
let orderSeq = 2000;
let notifSeq = SEED_NOTIFS.length;
let auditSeq = SEED_AUDIT.length;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(SEED_JOBS);
  const [clients, setClients] = useState<Client[]>(SEED_CLIENTS);
  const [inventory, setInventory] = useState<InventoryItem[]>(SEED_INV);
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFS);
  const [audit, setAudit] = useState<AuditEntry[]>(SEED_AUDIT);
  const [actingAs, setActingAs] = useState<{ name: string; role: string }>({ name: "System", role: "System" });
  const actor = useRef(actingAs);
  actor.current = actingAs;

  const log = useCallback((entity: AuditEntity, entityId: string, entityLabel: string, action: AuditAction, detail?: string) => {
    const entry: AuditEntry = {
      id: `a${++auditSeq}`,
      time: new Date().toISOString(),
      actor: actor.current.name,
      role: actor.current.role,
      entity, entityId, entityLabel, action, detail,
    };
    setAudit(prev => [entry, ...prev].slice(0, 200));
  }, []);

  const pushNotification = useCallback((n: Omit<AppNotification, "id" | "time" | "read">) => {
    const item: AppNotification = { id: `n${++notifSeq}`, time: new Date().toISOString(), read: false, ...n };
    setNotifications(prev => [item, ...prev].slice(0, 40));
  }, []);

  const value = useMemo<StoreValue>(() => ({
    jobs, clients, inventory, orders, notifications, audit, actingAs, setActingAs,
    addJob: (j) => {
      const item: Job = { ...j, id: `JB-${(++jobSeq).toString().padStart(4, "0")}`, createdAt: new Date().toISOString() };
      setJobs(prev => [item, ...prev]);
      log("job", item.id, item.title, "create", `${item.branch} · ${item.type}`);
      pushNotification({ kind: "escalation", title: `New job created: ${item.title}`, detail: `${item.branch} · Due soon`, jobId: item.id });
      return item;
    },
    updateJob: (id, patch) => {
      setJobs(prev => prev.map(j => {
        if (j.id !== id) return j;
        const next = { ...j, ...patch };
        if (patch.status && patch.status !== j.status) {
          log("job", j.id, j.title, "status", `${j.status} → ${patch.status}`);
        }
        if (patch.priority === "Escalated" && j.priority !== "Escalated") {
          log("job", j.id, j.title, "update", `Escalated`);
          pushNotification({ kind: "escalation", title: `Escalated: ${j.title}`, detail: `${j.branch} — needs attention`, jobId: j.id });
        }
        if (patch.technicianIds && patch.technicianIds.length && (patch.technicianIds.join() !== j.technicianIds.join())) {
          log("job", j.id, j.title, "assign", `${patch.technicianIds.length} technician(s) assigned`);
          pushNotification({ kind: "escalation", title: `Assigned: ${j.title}`, detail: `${patch.technicianIds.length} technician(s) attached`, jobId: j.id });
        }
        return next;
      }));
    },
    deleteJob: (id) => {
      const target = jobs.find(j => j.id === id);
      setJobs(prev => prev.filter(j => j.id !== id));
      if (target) log("job", target.id, target.title, "delete");
    },
    assignJob: (id, techIds) => {
      const target = jobs.find(j => j.id === id);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, technicianIds: techIds } : j));
      if (target) log("job", target.id, target.title, "assign", `${techIds.length} technician(s)`);
    },

    addClient: (c) => {
      const item: Client = { ...c, id: `cl-${++clientSeq}` };
      setClients(prev => [item, ...prev]);
      log("client", item.id, item.name, "create");
      return item;
    },
    updateClient: (id, patch) => {
      const t = clients.find(c => c.id === id);
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
      if (t) log("client", id, t.name, "update", Object.keys(patch).join(", "));
    },
    deleteClient: (id) => {
      const t = clients.find(c => c.id === id);
      setClients(prev => prev.filter(c => c.id !== id));
      if (t) log("client", id, t.name, "delete");
    },

    addInventory: (i) => {
      const item: InventoryItem = { ...i, id: `inv-${++invSeq}` };
      setInventory(prev => [item, ...prev]);
      log("inventory", item.id, item.name, "create", `SKU ${item.sku}`);
      return item;
    },
    updateInventory: (id, patch) => {
      const t = inventory.find(x => x.id === id);
      setInventory(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
      if (t) log("inventory", id, t.name, "update", Object.keys(patch).join(", "));
    },
    deleteInventory: (id) => {
      const t = inventory.find(x => x.id === id);
      setInventory(prev => prev.filter(i => i.id !== id));
      if (t) log("inventory", id, t.name, "delete");
    },
    adjustStock: (id, delta) => {
      const t = inventory.find(x => x.id === id);
      setInventory(prev => prev.map(i => i.id === id ? { ...i, onHand: Math.max(0, i.onHand + delta) } : i));
      if (t) log("inventory", id, t.name, "update", `Stock ${delta > 0 ? "+" : ""}${delta}`);
    },

    addOrder: (o) => {
      const item: Order = { ...o, id: `PO-${++orderSeq}` };
      setOrders(prev => [item, ...prev]);
      log("order", item.id, item.item, "create", `${item.supplier}`);
      pushNotification({ kind: "delivery", title: `Order placed: ${item.id}`, detail: `${item.item} — ${item.supplier}` });
      return item;
    },
    updateOrder: (id, patch) => {
      const t = orders.find(o => o.id === id);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
      if (t) {
        if (patch.status && patch.status !== t.status) log("order", id, t.item, "status", `${t.status} → ${patch.status}`);
        else log("order", id, t.item, "update", Object.keys(patch).join(", "));
      }
    },
    deleteOrder: (id) => {
      const t = orders.find(o => o.id === id);
      setOrders(prev => prev.filter(o => o.id !== id));
      if (t) log("order", id, t.item, "delete");
    },

    pushNotification,
    markRead: (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)),
    markAllRead: () => setNotifications(prev => prev.map(n => ({ ...n, read: true }))),
  }), [jobs, clients, inventory, orders, notifications, audit, actingAs, pushNotification, log]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}

// helper types
export type { Job, JobStatus, JobPriority, JobType, Client, InventoryItem, Order, AuditEntry };

// default demo new-job template
export function newJobTemplate(): NewJob {
  return {
    title: "", clientId: "", branch: "", location: "Lusaka",
    type: "Service", status: "Backlog", priority: "Normal",
    progress: 0, technicianIds: [],
    dueAt: addDays(new Date(), 7).toISOString(), notes: "",
  };
}
