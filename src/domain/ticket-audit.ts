import type { AuditEntry } from "@/data/audit";
import type { Ticket } from "./types";

/** Derive the shared audit feed from persisted ticket history, without duplicating events. */
export function ticketAuditEntries(tickets: Ticket[]): AuditEntry[] {
  return tickets.flatMap(ticket => ticket.activity.map((event, index) => ({
    id: `ticket-${ticket.id}-${index}`,
    time: event.at,
    actor: event.actor,
    role: event.side === "client" ? "Client employee" : event.side === "system" ? "System" : "Spruceland team",
    entity: "ticket" as const,
    entityId: ticket.id,
    entityLabel: `${ticket.clientName} · ${ticket.site.name}`,
    action: index === 0 ? "create" as const : event.text.startsWith("Assigned to") ? "assign" as const : "status" as const,
    detail: event.text,
  })));
}