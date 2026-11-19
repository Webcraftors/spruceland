import { createContext, useContext } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import type { ClientSession, Ticket, TicketStatus } from "@/domain/types";
import { STATUS_STYLES } from "@/domain/ticket-workflow";
import { cn } from "@/lib/utils";

export const ClientSessionCtx = createContext<{ session: ClientSession; signOut: () => void } | null>(null);
export function usePortalSession() {
  const v = useContext(ClientSessionCtx);
  if (!v) throw new Error("usePortalSession must be used inside the client app layout");
  return v;
}

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", STATUS_STYLES[status], className)}>{status}</span>;
}

export const fmtDate = (iso?: string) => (iso ? format(parseISO(iso), "d MMM yyyy") : "—");
export const fmtDateTime = (iso?: string) => (iso ? format(parseISO(iso), "d MMM yyyy, HH:mm") : "—");

export function dueInfo(iso: string) {
  const d = differenceInCalendarDays(parseISO(iso), new Date());
  if (d < 0) return { label: `Overdue ${-d}d`, tone: "bg-destructive/12 text-destructive border-destructive/30" };
  if (d <= 14) return { label: d === 0 ? "Due today" : `Due in ${d}d`, tone: "bg-warning/15 text-warning-foreground border-warning/40" };
  return { label: `In ${d} days`, tone: "bg-success/12 text-success border-success/30" };
}
export function DueBadge({ iso }: { iso: string }) {
  const i = dueInfo(iso);
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", i.tone)}>{i.label}</span>;
}

export function TicketTimeline({ ticket }: { ticket: Ticket }) {
  return (
    <ol className="relative border-l border-border ml-2 space-y-3">
      {[...ticket.activity].reverse().map((a, i) => (
        <li key={i} className="ml-4">
          <span className={cn("absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full", a.side === "client" ? "bg-primary" : a.side === "spruceland" ? "bg-info" : "bg-muted-foreground")} />
          <div className="text-sm font-medium">{a.text}</div>
          <div className="text-[11px] text-muted-foreground">{a.actor} · {fmtDateTime(a.at)}</div>
        </li>
      ))}
    </ol>
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4", className)}>
      {(title || action) && <div className="flex items-center justify-between mb-2"><h2 className="text-sm font-bold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}
