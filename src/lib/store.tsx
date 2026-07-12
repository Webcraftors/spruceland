import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { JOBS as SEED_JOBS, type Job, type JobStatus, type JobPriority, type JobType } from "@/data/jobs";
import { CLIENTS as SEED_CLIENTS, type Client } from "@/data/clients";
import { INVENTORY as SEED_INV, ORDERS as SEED_ORDERS, type InventoryItem, type Order } from "@/data/inventory";
import { NOTIFICATIONS as SEED_NOTIFS, type AppNotification } from "@/data/notifications";
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(SEED_JOBS);
  const [clients, setClients] = useState<Client[]>(SEED_CLIENTS);
  const [inventory, setInventory] = useState<InventoryItem[]>(SEED_INV);
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFS);

  const pushNotification = useCallback((n: Omit<AppNotification, "id" | "time" | "read">) => {
    const item: AppNotification = { id: `n${++notifSeq}`, time: new Date().toISOString(), read: false, ...n };
    setNotifications(prev => [item, ...prev].slice(0, 40));
  }, []);

  const value = useMemo<StoreValue>(() => ({
    jobs, clients, inventory, orders, notifications,
    addJob: (j) => {
      const item: Job = { ...j, id: `JB-${(++jobSeq).toString().padStart(4, "0")}`, createdAt: new Date().toISOString() };
      setJobs(prev => [item, ...prev]);
      pushNotification({ kind: "escalation", title: `New job created: ${item.title}`, detail: `${item.branch} · Due soon`, jobId: item.id });
      return item;
    },
    updateJob: (id, patch) => {
      setJobs(prev => prev.map(j => {
        if (j.id !== id) return j;
        const next = { ...j, ...patch };
        if (patch.priority === "Escalated" && j.priority !== "Escalated") {
          pushNotification({ kind: "escalation", title: `Escalated: ${j.title}`, detail: `${j.branch} — needs attention`, jobId: j.id });
        }
        if (patch.technicianIds && patch.technicianIds.length && (patch.technicianIds.join() !== j.technicianIds.join())) {
          pushNotification({ kind: "escalation", title: `Assigned: ${j.title}`, detail: `${patch.technicianIds.length} technician(s) attached`, jobId: j.id });
        }
        return next;
      }));
    },
    deleteJob: (id) => setJobs(prev => prev.filter(j => j.id !== id)),
    assignJob: (id, techIds) => setJobs(prev => prev.map(j => j.id === id ? { ...j, technicianIds: techIds } : j)),

    addClient: (c) => {
      const item: Client = { ...c, id: `cl-${++clientSeq}` };
      setClients(prev => [item, ...prev]);
      return item;
    },
    updateClient: (id, patch) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c)),
    deleteClient: (id) => setClients(prev => prev.filter(c => c.id !== id)),

    addInventory: (i) => {
      const item: InventoryItem = { ...i, id: `inv-${++invSeq}` };
      setInventory(prev => [item, ...prev]);
      return item;
    },
    updateInventory: (id, patch) => setInventory(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i)),
    deleteInventory: (id) => setInventory(prev => prev.filter(i => i.id !== id)),
    adjustStock: (id, delta) => setInventory(prev => prev.map(i => i.id === id ? { ...i, onHand: Math.max(0, i.onHand + delta) } : i)),

    addOrder: (o) => {
      const item: Order = { ...o, id: `PO-${++orderSeq}` };
      setOrders(prev => [item, ...prev]);
      pushNotification({ kind: "delivery", title: `Order placed: ${item.id}`, detail: `${item.item} — ${item.supplier}` });
      return item;
    },
    updateOrder: (id, patch) => setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o)),
    deleteOrder: (id) => setOrders(prev => prev.filter(o => o.id !== id)),

    pushNotification,
    markRead: (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)),
    markAllRead: () => setNotifications(prev => prev.map(n => ({ ...n, read: true }))),
  }), [jobs, clients, inventory, orders, notifications, pushNotification]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}

// helper types
export type { Job, JobStatus, JobPriority, JobType, Client, InventoryItem, Order };

// default demo new-job template
export function newJobTemplate(): NewJob {
  return {
    title: "", clientId: "", branch: "", location: "Lusaka",
    type: "Service", status: "Backlog", priority: "Normal",
    progress: 0, technicianIds: [],
    dueAt: addDays(new Date(), 7).toISOString(), notes: "",
  };
}
