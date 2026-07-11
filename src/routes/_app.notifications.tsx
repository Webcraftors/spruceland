import { createFileRoute } from "@tanstack/react-router";
import { NOTIFICATIONS } from "@/data/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, Wrench, CreditCard, Truck } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

const ICONS = { breakdown: AlertTriangle, escalation: Wrench, service_due: Calendar, payment: CreditCard, delivery: Truck } as const;

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Spruceland Ops" }] }),
  component: () => (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Alerts across jobs, service schedule, deliveries and payments.</p>
      </header>
      <div className="space-y-2">
        {NOTIFICATIONS.map(n => {
          const Icon = ICONS[n.kind];
          return (
            <Card key={n.id} className={`bg-card border-border ${!n.read ? "border-l-4 border-l-primary" : ""}`}>
              <CardContent className="p-4 flex gap-4">
                <div className="h-10 w-10 rounded-md bg-accent grid place-items-center shrink-0"><Icon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{n.title}</h3>
                    {!n.read && <Badge className="bg-primary text-primary-foreground">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.detail}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(parseISO(n.time), { addSuffix: true })}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  ),
});
