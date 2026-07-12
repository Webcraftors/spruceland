import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { statusColorClasses, priorityColorClasses, typeColorClasses } from "@/data/jobs";
import { techById } from "@/data/technicians";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, parseISO } from "date-fns";
import { ArrowLeft, MapPin, Calendar, User2 } from "lucide-react";

export const Route = createFileRoute("/_app/jobs/$id")({
  head: ({ params }) => ({ meta: [{ title: `Job ${params.id} — Spruceland Ops` }] }),
  component: JobDetail,
  notFoundComponent: () => <div className="p-8 text-sm">Job not found. <Link to="/jobs" className="text-primary">Back</Link></div>,
});

function JobDetail() {
  const { id } = Route.useParams();
  const { jobs, clients } = useStore();
  const job = jobs.find(j => j.id === id);
  if (!job) throw notFound();
  const client = clients.find(c => c.id === job.clientId);
  const techs = job.technicianIds.map((tid: string) => techById(tid)).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="space-y-4 max-w-4xl">
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Back to jobs</Link>
      <header>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={`text-[10px] ${statusColorClasses(job.status)}`}>{job.status}</Badge>
          <Badge variant="outline" className={`text-[10px] ${priorityColorClasses(job.priority)}`}>{job.priority}</Badge>
          <Badge variant="outline" className={`text-[10px] ${typeColorClasses(job.type)}`}>{job.type}</Badge>
          <span className="text-[10px] text-muted-foreground">{job.id}</span>
        </div>
        <h1 className="mt-2 text-xl md:text-2xl font-extrabold tracking-tight">{job.title}</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="p-3"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <Row icon={MapPin} label="Site">{client && <Link to="/clients/$id" params={{ id: client.id }} className="text-primary hover:underline">{client.name}</Link>} · {job.branch} · {job.location}</Row>
            <Row icon={Calendar} label="Timeline">Opened {format(parseISO(job.createdAt), "d MMM yyyy")} · Due {format(parseISO(job.dueAt), "d MMM yyyy")}</Row>
            <Row icon={User2} label="Assigned">
              {techs.length === 0 ? "Unassigned" : techs.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1 mr-2 text-xs">
                  <span className="h-5 w-5 rounded-full bg-primary/20 text-primary grid place-items-center text-[9px] font-bold">{t.avatarInitials}</span>
                  {t.name}
                </span>
              ))}
            </Row>
            <div>
              <div className="text-xs font-semibold mb-1.5">Progress</div>
              <Progress value={job.progress} className="h-2" />
              <div className="text-[10px] text-muted-foreground mt-1">{job.progress}% complete</div>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1">Notes</div>
              <p className="text-xs text-muted-foreground">{job.notes || "No notes yet."}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="p-3"><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 space-y-2 text-xs">
            {[
              { t: "Job opened", d: format(parseISO(job.createdAt), "d MMM, HH:mm") },
              { t: "Technician assigned", d: "Auto-assigned by dispatcher" },
              { t: `Priority: ${job.priority}`, d: "Current" },
              { t: `Status: ${job.status}`, d: "Current" },
            ].map((a, i) => (
              <div key={i} className="flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <div className="font-medium">{a.t}</div>
                  <div className="text-[10px] text-muted-foreground">{a.d}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <div className="h-7 w-7 rounded-md bg-accent grid place-items-center shrink-0"><Icon className="h-3.5 w-3.5" /></div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xs mt-0.5">{children}</div>
      </div>
    </div>
  );
}
