import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { JOBS, statusColorClasses, priorityColorClasses, typeColorClasses } from "@/data/jobs";
import { clientById } from "@/data/clients";
import { techById } from "@/data/technicians";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, parseISO } from "date-fns";
import { ArrowLeft, MapPin, Calendar, User2 } from "lucide-react";

export const Route = createFileRoute("/_app/jobs/$id")({
  head: ({ params }) => ({ meta: [{ title: `Job ${params.id} — Spruceland Ops` }] }),
  loader: ({ params }) => {
    const job = JOBS.find(j => j.id === params.id);
    if (!job) throw notFound();
    return { job };
  },
  component: JobDetail,
  notFoundComponent: () => <div className="p-8">Job not found. <Link to="/jobs" className="text-primary">Back to jobs</Link></div>,
});

function JobDetail() {
  const { job } = Route.useLoaderData();
  const client = clientById(job.clientId);
  const techs = job.technicianIds.map(id => techById(id)).filter(Boolean);

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to jobs</Link>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={statusColorClasses(job.status)}>{job.status}</Badge>
          <Badge variant="outline" className={priorityColorClasses(job.priority)}>{job.priority}</Badge>
          <Badge variant="outline" className={typeColorClasses(job.type)}>{job.type}</Badge>
          <span className="text-xs text-muted-foreground">{job.id}</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{job.title}</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Row icon={MapPin} label="Site"><Link to="/clients/$id" params={{ id: client!.id }} className="text-primary hover:underline">{client?.name}</Link> · {job.branch} · {job.location}</Row>
            <Row icon={Calendar} label="Timeline">Opened {format(parseISO(job.createdAt), "d MMM yyyy")} · Due {format(parseISO(job.dueAt), "d MMM yyyy")}</Row>
            <Row icon={User2} label="Assigned">
              {techs.length === 0 ? "Unassigned" : techs.map(t => (
                <span key={t!.id} className="inline-flex items-center gap-1 mr-3">
                  <span className="h-6 w-6 rounded-full bg-primary/20 text-primary grid place-items-center text-[10px] font-bold">{t!.avatarInitials}</span>
                  {t!.name}{t!.subcontractor && <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">Sub</Badge>}
                </span>
              ))}
            </Row>
            <div>
              <div className="text-sm font-semibold mb-2">Progress</div>
              <Progress value={job.progress} className="h-3" />
              <div className="text-xs text-muted-foreground mt-1">{job.progress}% complete</div>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2">Notes</div>
              <p className="text-sm text-muted-foreground">{job.notes || "No notes yet."}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { t: "Job opened", d: format(parseISO(job.createdAt), "d MMM, HH:mm") },
              { t: "Technician assigned", d: "Auto-assigned by dispatcher" },
              { t: `Priority set to ${job.priority}`, d: "By Head of Tech" },
              { t: `Status: ${job.status}`, d: "Current" },
            ].map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <div className="font-medium">{a.t}</div>
                  <div className="text-xs text-muted-foreground">{a.d}</div>
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
    <div className="flex gap-3">
      <div className="h-9 w-9 rounded-md bg-accent grid place-items-center"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm mt-0.5">{children}</div>
      </div>
    </div>
  );
}
