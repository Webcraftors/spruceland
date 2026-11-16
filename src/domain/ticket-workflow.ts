import type { TicketStatus } from "./types";

/** Allowed ticket status transitions. Single source of truth for UI and (later) backend checks. */
export const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  "Open": ["Assigned"],
  "Assigned": ["In Progress", "Open"],
  "In Progress": ["Awaiting Sign-off"],
  "Awaiting Sign-off": ["Closed", "In Progress"], // client approves, or disputes and reopens
  "Closed": [],
};

export function canTransition(from: TicketStatus, to: TicketStatus) {
  return TRANSITIONS[from].includes(to);
}

/** Normalise an NRC / employee ID for comparison: case-insensitive, ignores spaces, slashes and dashes. */
export function normaliseRef(ref: string) {
  return ref.toUpperCase().replace(/[\s/\-]/g, "");
}

export interface SignOffInput { consent: boolean; confirmComplete: boolean; typedName: string; typedRef: string }

/** Returns a list of problems; empty means the sign-off is valid. */
export function validateSignOff(input: SignOffInput, employee: { name: string; employeeRef: string }): string[] {
  const errors: string[] = [];
  if (!input.consent) errors.push("Tick the consent box.");
  if (!input.confirmComplete) errors.push("Confirm the work is complete.");
  if (input.typedName.trim().toLowerCase() !== employee.name.trim().toLowerCase()) errors.push("Name must match the signed-in employee.");
  if (normaliseRef(input.typedRef) !== normaliseRef(employee.employeeRef)) errors.push("NRC / Employee ID does not match.");
  return errors;
}

export const STATUS_STYLES: Record<TicketStatus, string> = {
  "Open": "bg-destructive/12 text-destructive border-destructive/30",
  "Assigned": "bg-info/12 text-info border-info/30",
  "In Progress": "bg-warning/15 text-warning-foreground border-warning/40",
  "Awaiting Sign-off": "bg-primary/12 text-primary border-primary/30",
  "Closed": "bg-success/12 text-success border-success/30",
};
