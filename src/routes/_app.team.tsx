import { createFileRoute } from "@tanstack/react-router";
import { TECHNICIANS } from "@/data/technicians";
import { JOBS } from "@/data/jobs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/team")({
  head: () => ({ meta: [{ title: "Team — Spruceland Ops" }] }),
  component: () => {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">Technicians, senior leads and subcontractors.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TECHNICIANS.map(t => {
            const openJobs = JOBS.filter(j => j.technicianIds.includes(t.id) && j.status !== "Closed" && j.status !== "Completed").length;
            return (
              <Card key={t.id} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">{t.avatarInitials}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role} · {t.location}</div>
                    </div>
                    {t.subcontractor && <Badge variant="outline">Subcontractor</Badge>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.skills.map(s => <Badge key={s} variant="outline" className="bg-info/10 text-info border-info/30">{s}</Badge>)}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-md border border-border py-2">
                      <div className="text-lg font-bold">{openJobs}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">Open jobs</div>
                    </div>
                    <div className="rounded-md border border-border py-2">
                      <div className="text-sm font-mono truncate">{t.phone}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">Direct</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  },
});
