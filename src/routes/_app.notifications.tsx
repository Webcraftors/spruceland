import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Wrench, CreditCard, Truck } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

const ICONS = { breakdown: AlertTriangle, escalation: Wrench, service_due: Calendar, payment: CreditCard, delivery: Truck } as const;

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Spruceland Ops" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, markAllRead, markRead } = useStore();
  return (
    <div className="space-y-3 max-w-3xl">
      <header className="flex items-end justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Notifications</h1>
          <p className="text-[11px] text-muted-foreground">Alerts across jobs, service schedule, deliveries and payments.</p>
        </div>
        <Button size="sm" variant="outline" className="h-8" onClick={markAllRead}>Mark all read</Button>
      </header>
      <div className="space-y-1.5">
        {notifications.map(n => {
          const Icon = ICONS[n.kind];
          return (
            <Card key={n.id} className={`bg-card border-border ${!n.read ? "border-l-4 border-l-primary" : ""}`}>
              <CardContent className="p-3 flex gap-3">
                <div className="h-8 w-8 rounded-md bg-accent grid place-items-center shrink-0"><Icon className="h-3.5 w-3.5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-semibold truncate">{n.title}</h3>
                    {!n.read && <Badge className="bg-primary text-primary-foreground text-[9px] px-1 py-0">New</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.detail}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(parseISO(n.time), { addSuffix: true })}</span>
                    {n.jobId && <Link to="/jobs/$id" params={{ id: n.jobId }} onClick={() => markRead(n.id)} className="text-[10px] text-primary hover:underline">Open job →</Link>}
                    {n.clientId && !n.jobId && <Link to="/clients/$id" params={{ id: n.clientId }} onClick={() => markRead(n.id)} className="text-[10px] text-primary hover:underline">Open client →</Link>}
                    {!n.read && <button onClick={() => markRead(n.id)} className="text-[10px] text-muted-foreground hover:text-foreground">Mark read</button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
