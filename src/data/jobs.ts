import { addDays, subDays } from "date-fns";

export type JobStatus = "Backlog" | "Scheduled" | "In Progress" | "On Hold" | "Awaiting Parts" | "Completed" | "Closed";
export type JobType = "Delivery" | "Installation" | "Service" | "Calibration" | "Breakdown" | "Assembly" | "Inspection";
export type JobPriority = "Low" | "Normal" | "High" | "Escalated";

export interface Job {
  id: string;
  title: string;
  clientId: string;
  branch: string;
  location: "Lusaka" | "Ndola";
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  progress: number;
  technicianIds: string[];
  createdAt: string;
  dueAt: string;
  notes: string;
}

const today = new Date();
const iso = (d: Date) => d.toISOString();

let idc = 0;
const j = (o: Omit<Job, "id">): Job => ({ id: `JB-${(++idc).toString().padStart(4, "0")}`, ...o });

export const JOBS: Job[] = [
  j({ title: "PNP Manda Hill — POS scale calibration (Lanes 1–8)", clientId: "pnp", branch: "Pick n Pay Manda Hill", location: "Lusaka", type: "Calibration", status: "In Progress", priority: "Normal", progress: 55, technicianIds: ["charles","peter"], createdAt: iso(subDays(today,3)), dueAt: iso(addDays(today,1)), notes: "Monthly preventive. Verify legal trade seals." }),
  j({ title: "Chilanga Cement — 80T Weighbridge civils supervision", clientId: "chilanga", branch: "Chilanga Plant", location: "Lusaka", type: "Installation", status: "In Progress", priority: "High", progress: 40, technicianIds: ["martin","kalulu"], createdAt: iso(subDays(today,42)), dueAt: iso(addDays(today,21)), notes: "Civils week 5. Foundation cured, pit forming next." }),
  j({ title: "Yalelo Solwezi Hub — Platform scale delivery", clientId: "yalelo", branch: "Yalelo North-Western Hub", location: "Lusaka", type: "Delivery", status: "Scheduled", priority: "Normal", progress: 0, technicianIds: ["mwando"], createdAt: iso(subDays(today,2)), dueAt: iso(addDays(today,4)), notes: "2x 500kg platform + indicators. Route via Solwezi." }),
  j({ title: "KCM Chingola — Weighbridge breakdown (WB-02)", clientId: "kcm", branch: "Nchanga Plant", location: "Ndola", type: "Breakdown", status: "In Progress", priority: "Escalated", progress: 20, technicianIds: ["charles","brian"], createdAt: iso(subDays(today,1)), dueAt: iso(addDays(today,1)), notes: "Load cell reading drift. Production impacted." }),
  j({ title: "Bonaventure — Quarterly service (weighbridge + platforms)", clientId: "bonaventure", branch: "Bonaventure Depot", location: "Lusaka", type: "Service", status: "Scheduled", priority: "High", progress: 0, technicianIds: ["peter"], createdAt: iso(subDays(today,5)), dueAt: iso(addDays(today,5)), notes: "Client due date approaching in 5 days." }),
  j({ title: "Kachema Chelston — Bench scale assembly (x4)", clientId: "kachema", branch: "Kachema Chelston", location: "Lusaka", type: "Assembly", status: "Backlog", priority: "Normal", progress: 0, technicianIds: [], createdAt: iso(subDays(today,1)), dueAt: iso(addDays(today,10)), notes: "New units received from Lusaka warehouse." }),
  j({ title: "Zambeef Lusaka — Retail POS scale calibration (Batch A)", clientId: "zambeef", branch: "Zambeef Lusaka", location: "Lusaka", type: "Calibration", status: "In Progress", priority: "Normal", progress: 70, technicianIds: ["chris"], createdAt: iso(subDays(today,4)), dueAt: iso(addDays(today,2)), notes: "20 of 30 heads verified." }),
  j({ title: "National Breweries Ndola — Hopper scale service", clientId: "natbrew", branch: "Natbrew Ndola", location: "Ndola", type: "Service", status: "Awaiting Parts", priority: "High", progress: 30, technicianIds: ["brian"], createdAt: iso(subDays(today,9)), dueAt: iso(addDays(today,3)), notes: "Awaiting replacement load cell (ETA 2 days)." }),
  j({ title: "Sabo Cement — Weighbridge inspection", clientId: "sabo", branch: "Sabo Plant", location: "Ndola", type: "Inspection", status: "Scheduled", priority: "Normal", progress: 0, technicianIds: ["mwando"], createdAt: iso(subDays(today,2)), dueAt: iso(addDays(today,7)), notes: "" }),
  j({ title: "Parmalat — Floor scale relocation", clientId: "parmalat", branch: "Parmalat Plant", location: "Lusaka", type: "Installation", status: "Completed", priority: "Normal", progress: 100, technicianIds: ["peter","chris"], createdAt: iso(subDays(today,12)), dueAt: iso(subDays(today,1)), notes: "Signed off by client. Invoice pending." }),
  j({ title: "First Quantum — Kansanshi WB-03 calibration", clientId: "fqm", branch: "Kansanshi Mine", location: "Ndola", type: "Calibration", status: "Scheduled", priority: "High", progress: 0, technicianIds: ["charles","peter"], createdAt: iso(subDays(today,3)), dueAt: iso(addDays(today,9)), notes: "10-tonne test weight fleet required." }),
  j({ title: "Indeni Petroleum — Annual weighbridge cert", clientId: "indeni", branch: "Indeni Refinery", location: "Ndola", type: "Calibration", status: "On Hold", priority: "Low", progress: 10, technicianIds: ["brian"], createdAt: iso(subDays(today,20)), dueAt: iso(addDays(today,40)), notes: "Waiting on client production window." }),
  j({ title: "DHL Airport — Bench scale service (x12)", clientId: "dhl", branch: "DHL Airport", location: "Lusaka", type: "Service", status: "In Progress", priority: "Normal", progress: 45, technicianIds: ["chris"], createdAt: iso(subDays(today,2)), dueAt: iso(addDays(today,2)), notes: "" }),
  j({ title: "Zambia Sugar Nakambala — Axle scale diagnostic", clientId: "zamsugar", branch: "Nakambala Estate", location: "Lusaka", type: "Breakdown", status: "Scheduled", priority: "High", progress: 0, technicianIds: ["martin"], createdAt: iso(subDays(today,1)), dueAt: iso(addDays(today,3)), notes: "Intermittent zero fault." }),
  j({ title: "AFGRI — Quarterly platform scale service", clientId: "afgri", branch: "AFGRI Lusaka", location: "Lusaka", type: "Service", status: "Backlog", priority: "Normal", progress: 0, technicianIds: [], createdAt: iso(subDays(today,0)), dueAt: iso(addDays(today,25)), notes: "" }),
  j({ title: "Mpongwe Milling — Hopper scale breakdown", clientId: "mpongwe", branch: "Mpongwe Mill", location: "Ndola", type: "Breakdown", status: "In Progress", priority: "Escalated", progress: 25, technicianIds: ["mwando","brian"], createdAt: iso(subDays(today,1)), dueAt: iso(addDays(today,1)), notes: "Milling line stalled. Priority response." }),
  j({ title: "ZPC — Weighbridge annual recert", clientId: "zpc", branch: "ZPC Plant", location: "Ndola", type: "Calibration", status: "Scheduled", priority: "Normal", progress: 0, technicianIds: ["charles"], createdAt: iso(subDays(today,4)), dueAt: iso(addDays(today,20)), notes: "" }),
  j({ title: "Superior Milling — Platform scale service", clientId: "superior", branch: "Superior Ndola", location: "Ndola", type: "Service", status: "Closed", priority: "Normal", progress: 100, technicianIds: ["brian"], createdAt: iso(subDays(today,15)), dueAt: iso(subDays(today,3)), notes: "Closed, invoice paid." }),
];

export const JOB_STATUSES: JobStatus[] = ["Backlog","Scheduled","In Progress","On Hold","Awaiting Parts","Completed","Closed"];

export function statusColorClasses(status: JobStatus) {
  switch (status) {
    case "Backlog":         return "bg-muted text-muted-foreground border-border";
    case "Scheduled":       return "bg-info/20 text-info border-info/40";
    case "In Progress":     return "bg-primary/25 text-primary border-primary/50";
    case "On Hold":         return "bg-muted/60 text-muted-foreground border-border";
    case "Awaiting Parts":  return "bg-warning/20 text-warning border-warning/40";
    case "Completed":       return "bg-success/20 text-success border-success/40";
    case "Closed":          return "bg-success/30 text-success border-success/60";
  }
}

export function priorityColorClasses(p: JobPriority) {
  switch (p) {
    case "Low":       return "bg-muted text-muted-foreground";
    case "Normal":    return "bg-info/20 text-info";
    case "High":      return "bg-warning/25 text-warning";
    case "Escalated": return "bg-destructive/25 text-destructive";
  }
}

export function typeColorClasses(t: JobType) {
  switch (t) {
    case "Delivery":     return "bg-info/15 text-info";
    case "Installation": return "bg-primary/20 text-primary";
    case "Service":      return "bg-success/15 text-success";
    case "Calibration":  return "bg-[color:var(--chart-5)]/20 text-[color:var(--chart-5)]";
    case "Breakdown":    return "bg-destructive/20 text-destructive";
    case "Assembly":     return "bg-warning/15 text-warning";
    case "Inspection":   return "bg-muted text-muted-foreground";
  }
}
