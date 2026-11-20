export type AuditAction = "create" | "update" | "delete" | "status" | "assign";
export type AuditEntity = "job" | "client" | "inventory" | "order" | "ticket";

export interface AuditEntry {
  id: string;
  time: string;
  actor: string;
  role: string;
  entity: AuditEntity;
  entityId: string;
  entityLabel: string;
  action: AuditAction;
  detail?: string;
}

const t = (mins: number) => new Date(Date.now() - mins * 60000).toISOString();

export const SEED_AUDIT: AuditEntry[] = [
  { id: "a1", time: t(6),    actor: "Peter Mwanza",   role: "Owner",         entity: "job",       entityId: "JB-0007", entityLabel: "PNP East Park indicator swap",    action: "status", detail: "Scheduled → In Progress" },
  { id: "a2", time: t(28),   actor: "Chanda Zulu",    role: "Head of Tech",  entity: "job",       entityId: "JB-0004", entityLabel: "Yalelo Kafue Rd calibration",     action: "assign", detail: "Assigned to Chola M., Bwalya P." },
  { id: "a3", time: t(65),   actor: "Naomi Banda",    role: "Administrator", entity: "order",     entityId: "PO-1042", entityLabel: "Zemic HM9B 30t Load Cells x8",    action: "update", detail: "Status: Placed → In Transit" },
  { id: "a4", time: t(140),  actor: "Peter Mwanza",   role: "Owner",         entity: "client",    entityId: "cl-3",    entityLabel: "Chilanga Cement",                 action: "update", detail: "Cadence updated" },
  { id: "a5", time: t(220),  actor: "Chanda Zulu",    role: "Head of Tech",  entity: "inventory", entityId: "inv-4",   entityLabel: "Rinstrum R420 Weighbridge Ind.",  action: "update", detail: "Reorder level: 3 → 4" },
  { id: "a6", time: t(390),  actor: "Naomi Banda",    role: "Administrator", entity: "job",       entityId: "JB-0002", entityLabel: "FQM Kansanshi service call",       action: "create", detail: "New breakdown job" },
  { id: "a7", time: t(700),  actor: "Peter Mwanza",   role: "Owner",         entity: "inventory", entityId: "inv-8",   entityLabel: "6-core shielded cable",           action: "update", detail: "Stock adjusted -40m" },
  { id: "a8", time: t(1100), actor: "Naomi Banda",    role: "Administrator", entity: "order",     entityId: "PO-1044", entityLabel: "80T Weighbridge Deck Sections",   action: "update", detail: "Marked Delayed" },
];
