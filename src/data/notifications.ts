export interface AppNotification {
  id: string;
  kind: "service_due" | "breakdown" | "escalation" | "payment" | "delivery";
  title: string;
  detail: string;
  time: string;
  read: boolean;
  jobId?: string;
  clientId?: string;
}

const ago = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", kind: "breakdown",  title: "KCM Chingola — Weighbridge WB-02 down",    detail: "Load cell reading drift. Production impacted.",        time: ago(1),  read: false, jobId: "JB-0004" },
  { id: "n2", kind: "escalation", title: "Mpongwe Milling — job escalated",           detail: "Hopper scale breakdown. Milling line stalled.",         time: ago(2),  read: false, jobId: "JB-0016" },
  { id: "n3", kind: "service_due",title: "Bonaventure quarterly service due in 5d",   detail: "Weighbridge + 4 platforms.",                            time: ago(6),  read: false, clientId: "bonaventure" },
  { id: "n4", kind: "service_due",title: "Zambeef Lusaka monthly service due in 5d",  detail: "Retail POS batch B.",                                   time: ago(10), read: true,  clientId: "zambeef" },
  { id: "n5", kind: "payment",    title: "KCM invoice overdue: ZMW 410,000",          detail: "45 days past due. CRM follow-up needed.",               time: ago(28), read: false, clientId: "kcm" },
  { id: "n6", kind: "delivery",   title: "PO-1042 in transit — 8x load cells",        detail: "Zemic shipment, ETA 5 days.",                           time: ago(30), read: true },
  { id: "n7", kind: "payment",    title: "National Breweries invoice overdue: ZMW 118,000", detail: "22 days past due.",                                time: ago(40), read: true, clientId: "natbrew" },
];
