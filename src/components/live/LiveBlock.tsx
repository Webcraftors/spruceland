import type { ReactNode } from "react";
import { RefreshCw, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LiveBlock({ title, hint, loading, error, empty, onReload, actions, children }: {
  title: string; hint?: string; loading: boolean; error: string | null; empty: boolean;
  onReload: () => void; actions?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-primary/30 bg-card p-3 space-y-2">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-bold"><Radio className="h-3.5 w-3.5 text-primary" />{title}</h2>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex gap-1.5">{actions}
          <Button size="sm" variant="outline" onClick={onReload} aria-label="Refresh"><RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /></Button>
        </div>
      </header>
      {error ? <p className="text-xs text-destructive">{error}</p>
        : loading && empty ? <p className="text-xs text-muted-foreground">Loading…</p>
        : empty ? <p className="text-xs text-muted-foreground">No records yet.</p>
        : children}
    </section>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ok" | "warn" | "bad" | "primary" }) {
  const cls = { muted: "bg-muted text-muted-foreground", ok: "bg-primary/10 text-primary", warn: "bg-accent text-accent-foreground", bad: "bg-destructive/15 text-destructive", primary: "bg-primary text-primary-foreground" }[tone];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${cls}`}>{children}</span>;
}

export function ask(label: string, required = true): string | null {
  const v = window.prompt(label)?.trim() ?? null;
  if (required && !v) return null;
  return v;
}
