import { addDays, subDays } from "date-fns";
import { CLIENTS } from "@/data/clients";
import type { Asset, AssetType, Site, Ticket, FaultCategory, TicketPriority, TicketStatus } from "@/domain/types";

/** Departments offered per client in the raise-ticket form. */
export const DEPARTMENTS: Record<string, string[]> = {
  pnp: ["Butchery", "Bakery", "Deli", "Produce", "Receiving", "Production", "Tills / Front End"],
  yalelo: ["Receiving", "Sales Counter", "Cold Room", "Dispatch"],
  kachema: ["Butchery", "Receiving", "Processing", "Sales Counter"],
  zambeef: ["Butchery", "Processing", "Receiving", "Retail"],
  chilanga: ["Weighbridge", "Dispatch", "Laboratory", "Packing Plant"],
  sabo: ["Weighbridge", "Dispatch", "Laboratory"],
  zpc: ["Weighbridge", "Dispatch", "Laboratory"],
  kcm: ["Weighbridge", "Concentrator", "Laboratory", "Stores"],
  natbrew: ["Brewing", "Packaging", "Laboratory", "Dispatch"],
  parmalat: ["Production", "Laboratory", "Dispatch"],
};
export const DEFAULT_DEPARTMENTS = ["Receiving", "Sales", "Production", "Dispatch", "Laboratory"];
export const departmentsFor = (clientId: string) => DEPARTMENTS[clientId] ?? DEFAULT_DEPARTMENTS;

export const PORTAL_CLIENTS = CLIENTS.map(c => ({ id: c.id, name: c.name, industry: c.industry, branches: c.branches }));

export function sitesFor(clientId: string): Site[] {
  return CLIENTS.find(c => c.id === clientId)?.branches.map(b => ({ name: b.name, city: b.city, province: b.province })) ?? [];
}
export function provincesFor(clientId: string) {
  return Array.from(new Set(sitesFor(clientId).map(s => s.province)));
}

/** Demo employees — sign-in accepts anyone, but these get a matching department pre-filled. */
export const DEMO_EMPLOYEES = [
  { clientId: "pnp", name: "Mary Banda", employeeRef: "PNP-20417", department: "Butchery" },
  { clientId: "pnp", name: "Joseph Tembo", employeeRef: "PNP-20988", department: "Bakery" },
  { clientId: "yalelo", name: "Grace Mulenga", employeeRef: "YL-3301", department: "Receiving" },
  { clientId: "kachema", name: "Daniel Phiri", employeeRef: "KM-0142", department: "Butchery" },
  { clientId: "chilanga", name: "Ruth Lungu", employeeRef: "CC-7781", department: "Weighbridge" },
];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

const RETAIL_MODELS: [string, string, AssetType, string][] = [
  ["DIGI", "SM-5300", "Retail", "15 kg"], ["Mettler Toledo", "bPlus", "Retail", "30 kg"],
  ["CAS", "CL5200", "Retail", "30 kg"], ["Avery Berkel", "FX50", "Platform", "300 kg"],
  ["Mettler Toledo", "PBA430", "Floor", "1500 kg"], ["Adam Equipment", "PGL 2002", "Lab", "2 kg"],
  ["Ohaus", "Defender 3000", "Bench", "60 kg"],
];
const HEAVY_MODELS: [string, string, AssetType, string][] = [
  ["Mettler Toledo", "VTC221", "Weighbridge", "80 t"], ["Avery Weigh-Tronix", "BridgeWay", "Weighbridge", "60 t"],
  ["Ohaus", "Explorer EX224", "Lab", "220 g"], ["Mettler Toledo", "PFA779", "Floor", "3000 kg"],
];

/** Deterministic installed equipment for a site (no randomness, so server and browser agree). */
export function assetsForSite(clientId: string, site: Site): Asset[] {
  const heavy = ["chilanga", "sabo", "zpc", "kcm", "mpongwe"].includes(clientId);
  const pool = heavy ? HEAVY_MODELS : RETAIL_MODELS;
  const depts = departmentsFor(clientId);
  const h = hash(clientId + site.name);
  const count = heavy ? 3 : 5;
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const [make, model, type, capacity] = pool[(h + i) % pool.length];
    const last = subDays(now, ((h >> i) % 80) + 5);
    const zmaOn = subDays(now, ((h >> (i + 2)) % 300) + 30);
    return {
      id: `${clientId}-${hash(site.name) % 9999}-${i + 1}`,
      clientId, siteName: site.name,
      department: depts[(h + i) % depts.length],
      make, model, type, capacity,
      serial: `${make.slice(0, 2).toUpperCase()}${(h % 90000) + 10000}-${String(i + 1).padStart(2, "0")}`,
      lastServiced: last.toISOString(),
      nextServiceDue: addDays(last, heavy ? 180 : clientId === "pnp" ? 30 : 90).toISOString(),
      zmaVerifiedOn: zmaOn.toISOString(),
      zmaDue: addDays(zmaOn, 365).toISOString(),
      zmaCertificate: `ZMA-${new Date(zmaOn).getFullYear()}-${(h % 9000) + 1000 + i}`,
    };
  });
}

let seq = 1040;
export function nextTicketId() { return `TK-${++seq}`; }

/** Seed tickets for a site so a freshly signed-in employee sees a realistic history. */
export function seedTicketsForSite(clientId: string, clientName: string, site: Site, reporter: { name: string; employeeRef: string }): Ticket[] {
  const assets = assetsForSite(clientId, site);
  const now = new Date();
  const mk = (i: number, status: TicketStatus, fault: FaultCategory, priority: TicketPriority, description: string, daysAgo: number, tech?: string): Ticket => {
    const a = assets[i % assets.length];
    const created = subDays(now, daysAgo).toISOString();
    const t: Ticket = {
      id: `TK-${1000 + (hash(site.name + i) % 900)}`,
      clientId, clientName, site, department: a.department,
      asset: { id: a.id, make: a.make, model: a.model, serial: a.serial, type: a.type },
      fault, priority, description, attachments: [], status,
      reportedBy: reporter, createdAt: created,
      activity: [{ at: created, actor: reporter.name, side: "client", text: "Ticket raised" }],
    };
    if (tech) {
      t.technicianId = tech;
      t.scheduledFor = addDays(new Date(created), 1).toISOString();
      t.activity.push({ at: addDays(new Date(created), 0.2).toISOString(), actor: "Spruceland Dispatch", side: "spruceland", text: `Assigned to technician` });
    }
    return t;
  };
  const awaiting = mk(1, "Awaiting Sign-off", "Calibration issue", "High", "Scale reading 40 g heavy on reference weights. Customers complaining at counter.", 3, "charles");
  awaiting.resolution = {
    technicianId: "charles", technicianName: "Charles Banda",
    arrivedAt: subDays(now, 1).toISOString(),
    diagnosis: "Span drift after load cell shock. Zero stable, span +0.27%.",
    workDone: "Re-levelled platform, recalibrated span with 15 kg certified M1 weights, tested eccentricity on four corners.",
    partsUsed: "None",
    readings: "Zero 0.000 kg · 5 kg 5.000 · 10 kg 10.000 · 15 kg 15.000 (within ±e)",
    resolvedAt: subDays(now, 1).toISOString(),
  };
  awaiting.activity.push({ at: awaiting.resolution.resolvedAt, actor: "Charles Banda", side: "spruceland", text: "Work completed — awaiting client sign-off" });

  const closed = mk(2, "Closed", "Label printing issue", "Normal", "Labels printing faded and cutting off the barcode.", 21, "chris");
  closed.resolution = {
    technicianId: "chris", technicianName: "Chris Phiri", arrivedAt: subDays(now, 20).toISOString(),
    diagnosis: "Worn thermal print head and incorrect label gap setting.",
    workDone: "Replaced print head, cleaned platen roller, reset label gap sensor and test-printed 20 labels.",
    partsUsed: "1 × thermal print head (SKU PH-5300)", readings: "Barcode scan test 20/20 pass",
    resolvedAt: subDays(now, 20).toISOString(),
  };
  closed.signOff = { name: reporter.name, employeeRef: reporter.employeeRef, consent: true, signedAt: subDays(now, 19.8).toISOString() };
  closed.activity.push(
    { at: closed.resolution.resolvedAt, actor: "Chris Phiri", side: "spruceland", text: "Work completed — awaiting client sign-off" },
    { at: closed.signOff.signedAt, actor: reporter.name, side: "client", text: "Signed off — ticket closed" },
  );

  return [
    mk(0, "Open", "Display / indicator fault", "Normal", "Display flickers and goes blank intermittently during the morning rush.", 0.3),
    mk(3, "Assigned", "Faulty wiring / power", "High", "Scale switches off when the cable is moved. Plug looks burnt.", 1.5, "peter"),
    awaiting,
    closed,
  ];
}
