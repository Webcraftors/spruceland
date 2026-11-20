import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Ticket } from "@/domain/types";

const input: Omit<Ticket, "id" | "status" | "createdAt" | "activity"> = {
  clientId: "pnp", clientName: "Pick n Pay", site: { name: "East Park", city: "Lusaka", province: "Lusaka" },
  department: "Butchery", asset: { id: "asset-1", make: "DIGI", model: "SM-5300", serial: "DG-01", type: "Retail" },
  fault: "Calibration issue", priority: "High", description: "Scale reads heavy with the reference weight.", attachments: [],
  reportedBy: { name: "Mary Banda", employeeRef: "PNP-20417" },
};

beforeEach(() => {
  vi.resetModules();
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
});

describe("ticket repository lifecycle", () => {
  it("requires two-party completion and persists the original on-site time", async () => {
    const { ticketsRepo } = await import("./portal-repo");
    const ticket = await ticketsRepo.create(input);
    await ticketsRepo.assign(ticket.id, "charles", "2026-11-21T08:00:00Z", "Dispatch");
    const started = await ticketsRepo.startWork(ticket.id, "Charles Banda");
    const resolved = await ticketsRepo.resolve(ticket.id, { technicianId: "charles", technicianName: "Charles Banda", arrivedAt: "2026-11-21T09:00:00Z", diagnosis: "Span drift", workDone: "Recalibrated", partsUsed: "None", readings: "5 kg → 5.000 kg" });
    expect(resolved.status).toBe("Awaiting Sign-off");
    expect(resolved.resolution?.arrivedAt).toBe(started.workStartedAt);
    await expect(ticketsRepo.assign(ticket.id, "charles", "2026-11-21T08:00:00Z", "Dispatch")).rejects.toThrow("Only open or assigned");
    const closed = await ticketsRepo.signOff(ticket.id, { consent: true, confirmComplete: true, typedName: "Mary Banda", typedRef: "PNP-20417" }, input.reportedBy);
    expect(closed.status).toBe("Closed");
    expect(closed.activity.map(event => event.actor)).toEqual(["Mary Banda", "Dispatch", "Charles Banda", "Charles Banda", "Mary Banda"]);
    expect(JSON.parse(localStorage.getItem("spruceland.portal.tickets.v1") ?? "[]")[0].status).toBe("Closed");
  });

  it("rejects a resolution from a technician other than the assigned technician", async () => {
    const { ticketsRepo } = await import("./portal-repo");
    const ticket = await ticketsRepo.create(input);
    await ticketsRepo.assign(ticket.id, "charles", "2026-11-21T08:00:00Z", "Dispatch");
    await ticketsRepo.startWork(ticket.id, "Charles Banda");
    await expect(ticketsRepo.resolve(ticket.id, { technicianId: "chris", technicianName: "Chris Phiri", arrivedAt: "2026-11-21T08:00:00Z", diagnosis: "Drift", workDone: "Calibrated", partsUsed: "None", readings: "Pass" })).rejects.toThrow("assigned technician");
    expect((await ticketsRepo.get(ticket.id))?.status).toBe("In Progress");
  });
});