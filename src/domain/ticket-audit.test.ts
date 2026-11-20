import { describe, expect, it } from "vitest";
import { seedTicketsForSite } from "@/data/portal";
import { ticketAuditEntries } from "./ticket-audit";

describe("shared client ticket audit", () => {
  it("retains the actor, time and assignment from the persisted ticket history", () => {
    const tickets = seedTicketsForSite("pnp", "Pick n Pay", { name: "East Park", city: "Lusaka", province: "Lusaka" }, { name: "Mary Banda", employeeRef: "PNP-20417" });
    const entries = ticketAuditEntries(tickets);
    expect(entries[0]).toMatchObject({ actor: "Mary Banda", time: tickets[0].createdAt, entity: "ticket", action: "create", entityId: tickets[0].id });
    expect(entries.some(event => event.action === "assign")).toBe(true);
    expect(new Set(entries.map(event => event.id)).size).toBe(entries.length);
  });
});