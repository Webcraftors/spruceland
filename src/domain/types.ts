/** Shared domain types for the client portal and digital job card.
 *  These mirror the future backend tables — see docs/domain-model.md. */

export type TicketStatus = "Open" | "Assigned" | "In Progress" | "Awaiting Sign-off" | "Closed";
export type TicketPriority = "Low" | "Normal" | "High" | "Critical";
export type AssetType = "Platform" | "Retail" | "Floor" | "Lab" | "Bench" | "Weighbridge";
export type FaultCategory =
  | "Calibration issue" | "Display / indicator fault" | "Load cell fault" | "Label printing issue"
  | "Product / PLU issue" | "Faulty wiring / power" | "Communication / network" | "Physical damage" | "Other";

export const FAULT_CATEGORIES: FaultCategory[] = [
  "Calibration issue", "Display / indicator fault", "Load cell fault", "Label printing issue",
  "Product / PLU issue", "Faulty wiring / power", "Communication / network", "Physical damage", "Other",
];
export const PRIORITIES: TicketPriority[] = ["Low", "Normal", "High", "Critical"];

export interface Site { name: string; city: string; province: string }

export interface Asset {
  id: string;
  clientId: string;
  siteName: string;
  department: string;
  make: string;
  model: string;
  serial: string;
  type: AssetType;
  capacity: string;
  lastServiced: string;   // ISO
  nextServiceDue: string; // ISO — Spruceland preventive maintenance
  zmaVerifiedOn: string;  // ISO
  zmaDue: string;         // ISO — Zambia Metrology Agency verification
  zmaCertificate: string;
}

export interface ClientSession {
  clientId: string;
  clientName: string;
  employeeName: string;
  employeeRef: string; // NRC or Employee ID
  department: string;
  site: Site;
  signedInAt: string;
}

export interface Attachment { id: string; name: string; kind: "image" | "video"; size: number; preview?: string }

export interface Resolution {
  technicianId: string;
  technicianName: string;
  arrivedAt: string;
  diagnosis: string;
  workDone: string;
  partsUsed: string;
  readings: string;
  resolvedAt: string;
}

export interface SignOff { name: string; employeeRef: string; consent: true; signedAt: string }

export interface TicketActivity { at: string; actor: string; side: "client" | "spruceland" | "system"; text: string }

export interface Ticket {
  id: string;
  clientId: string;
  clientName: string;
  site: Site;
  department: string;
  asset: Pick<Asset, "id" | "make" | "model" | "serial" | "type">;
  fault: FaultCategory;
  priority: TicketPriority;
  description: string;
  attachments: Attachment[];
  status: TicketStatus;
  reportedBy: { name: string; employeeRef: string };
  createdAt: string;
  technicianId?: string;
  scheduledFor?: string;
  workStartedAt?: string;
  resolution?: Resolution;
  signOff?: SignOff;
  activity: TicketActivity[];
}
