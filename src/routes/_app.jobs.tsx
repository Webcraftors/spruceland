import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DndContext, DragEndEvent, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  JOBS as SEED_JOBS, JOB_STATUSES, statusColorClasses, priorityColorClasses, typeColorClasses,
  type Job, type JobStatus, type JobPriority,
} from "@/data/jobs";
import { CLIENTS } from "@/data/clients";
import { TECHNICIANS } from "@/data/technicians";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ArrowUp, ArrowDown, Pause, CheckCircle2, MapPin, User2 } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({
  view: z.enum(["kanban","calendar","grid","tv"]).catch("kanban").optional(),
});

export const Route = createFileRoute("/_app/jobs")({
  head: () => ({ meta: [{ title: "Jobs board — Spruceland Ops" }, { name: "description", content: "Kanban, calendar, grid and TV views of all field jobs." }] }),
  validateSearch: searchSchema,
  component: JobsPage,
});

function JobsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const view = search.view ?? "kanban";
  const [jobs, setJobs] = useState<Job[]>(SEED_JOBS);
  const [locFilter, setLocFilter] = useState<"All"|"Lusaka"|"Ndola">("All");
  const [clientFilter, setClientFilter] = useState<string>("All");

  const filtered = useMemo(() => jobs.filter(j =>
    (locFilter === "All" || j.location === locFilter) &&
    (clientFilter === "All" || j.clientId === clientFilter)
  ), [jobs, locFilter, clientFilter]);

  const setStatus = (id: string, status: JobStatus) => setJobs(js => js.map(j => j.id === id ? { ...j, status } : j));
  const setPriority = (id: string, priority: JobPriority) => setJobs(js => js.map(j => j.id === id ? { ...j, priority } : j));

  const escalate = (id: string) => { setPriority(id, "Escalated"); toast.success("Job escalated"); };
  const deescalate = (id: string) => { setPriority(id, "Normal"); toast.success("Job de-escalated"); };
  const hold = (id: string) => { setStatus(id, "On Hold"); toast("Job put on hold"); };
  const close = (id: string) => { setStatus(id, "Closed"); toast.success("Job closed"); };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl tv:text-4xl font-extrabold tracking-tight">Jobs board</h1>
          <p className="text-sm text-muted-foreground">Drag cards between columns. Escalate, hold or close from any card.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={locFilter} onValueChange={(v: any) => setLocFilter(v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All locations</SelectItem>
              <SelectItem value="Lusaka">Lusaka</SelectItem>
              <SelectItem value="Ndola">Ndola</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All clients</SelectItem>
              {CLIENTS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </header>

      <Tabs value={view} onValueChange={(v) => navigate({ to: "/jobs", search: { view: v as any } })}>
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="tv">TV wall</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "kanban" && <Kanban jobs={filtered} onMove={setStatus} onEscalate={escalate} onDeescalate={deescalate} onHold={hold} onClose={close} />}
      {view === "calendar" && <CalendarView jobs={filtered} />}
      {view === "grid" && <GridView jobs={filtered} onEscalate={escalate} onDeescalate={deescalate} onHold={hold} onClose={close} />}
      {view === "tv" && <TVView jobs={filtered} />}
    </div>
  );
}

// ---------- Kanban ----------
function Kanban({ jobs, onMove, onEscalate, onDeescalate, onHold, onClose }: {
  jobs: Job[]; onMove: (id: string, s: JobStatus) => void;
  onEscalate: (id: string) => void; onDeescalate: (id: string) => void; onHold: (id: string) => void; onClose: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [dragged, setDragged] = useState<Job | null>(null);

  const onEnd = (e: DragEndEvent) => {
    setDragged(null);
    if (!e.over) return;
    const jobId = String(e.active.id);
    const newStatus = String(e.over.id) as JobStatus;
    onMove(jobId, newStatus);
    toast.success(`Moved to ${newStatus}`);
  };

  return (
    <DndContext sensors={sensors} onDragStart={(e) => setDragged(jobs.find(j => j.id === e.active.id) ?? null)} onDragEnd={onEnd} onDragCancel={() => setDragged(null)}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 tv:grid-cols-7 gap-4">
        {JOB_STATUSES.map(status => (
          <Column key={status} status={status} jobs={jobs.filter(j => j.status === status)} onEscalate={onEscalate} onDeescalate={onDeescalate} onHold={onHold} onClose={onClose} />
        ))}
      </div>
      <DragOverlay>
        {dragged && <JobCard job={dragged} dragging />}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ status, jobs, onEscalate, onDeescalate, onHold, onClose }: {
  status: JobStatus; jobs: Job[];
  onEscalate: (id: string) => void; onDeescalate: (id: string) => void; onHold: (id: string) => void; onClose: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`rounded-xl border border-border bg-card/60 p-3 min-h-[200px] transition-colors ${isOver ? "border-primary bg-primary/5" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusColorClasses(status).split(" ")[0]}`} />
          <h3 className="text-sm font-semibold">{status}</h3>
        </div>
        <Badge variant="outline">{jobs.length}</Badge>
      </div>
      <div className="space-y-2">
        {jobs.map(j => <DraggableCard key={j.id} job={j} onEscalate={onEscalate} onDeescalate={onDeescalate} onHold={onHold} onClose={onClose} />)}
        {jobs.length === 0 && <p className="text-xs text-muted-foreground px-1 py-4 text-center">Drop jobs here</p>}
      </div>
    </div>
  );
}

function DraggableCard(props: { job: Job; onEscalate: (id: string) => void; onDeescalate: (id: string) => void; onHold: (id: string) => void; onClose: (id: string) => void; }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.job.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={isDragging ? "opacity-40" : ""}>
      <JobCard {...props} />
    </div>
  );
}

function JobCard({ job, dragging, onEscalate, onDeescalate, onHold, onClose }: {
  job: Job; dragging?: boolean;
  onEscalate?: (id: string) => void; onDeescalate?: (id: string) => void; onHold?: (id: string) => void; onClose?: (id: string) => void;
}) {
  const client = CLIENTS.find(c => c.id === job.clientId);
  const techs = job.technicianIds.map(id => TECHNICIANS.find(t => t.id === id)).filter(Boolean);
  return (
    <div className={`rounded-lg border border-border bg-background p-3 shadow-sm ${dragging ? "shadow-2xl rotate-1" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className={priorityColorClasses(job.priority)}>{job.priority}</Badge>
        <Badge variant="outline" className={typeColorClasses(job.type)}>{job.type}</Badge>
      </div>
      <Link to="/jobs/$id" params={{ id: job.id }} className="block mt-2 font-semibold text-sm leading-tight hover:text-primary">{job.title}</Link>
      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{client?.name} · {job.branch}</div>
      <Progress value={job.progress} className="mt-2 h-1.5" />
      <div className="mt-2 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {techs.length === 0 && <span className="text-[11px] text-muted-foreground">Unassigned</span>}
          {techs.map(t => (
            <div key={t!.id} title={t!.name} className="h-6 w-6 rounded-full ring-2 ring-background bg-primary/20 text-primary grid place-items-center text-[10px] font-bold">{t!.avatarInitials}</div>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">Due {format(parseISO(job.dueAt), "d MMM")}</span>
      </div>
      {onEscalate && (
        <div className="mt-2 flex flex-wrap gap-1">
          {job.priority !== "Escalated" ? (
            <button onClick={() => onEscalate!(job.id)} className="text-[10px] rounded border border-destructive/40 text-destructive px-1.5 py-0.5 hover:bg-destructive/10 flex items-center gap-1"><ArrowUp className="h-3 w-3" />Escalate</button>
          ) : (
            <button onClick={() => onDeescalate!(job.id)} className="text-[10px] rounded border border-border px-1.5 py-0.5 hover:bg-accent flex items-center gap-1"><ArrowDown className="h-3 w-3" />De-esc</button>
          )}
          <button onClick={() => onHold!(job.id)} className="text-[10px] rounded border border-border px-1.5 py-0.5 hover:bg-accent flex items-center gap-1"><Pause className="h-3 w-3" />Hold</button>
          <button onClick={() => onClose!(job.id)} className="text-[10px] rounded border border-success/40 text-success px-1.5 py-0.5 hover:bg-success/10 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Close</button>
        </div>
      )}
    </div>
  );
}

// ---------- Calendar ----------
function CalendarView({ jobs }: { jobs: Job[] }) {
  const [cursor] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) });
  const startOffset = startOfMonth(cursor).getDay();
  return (
    <Card className="bg-card border-border">
      <CardHeader><CardTitle>{format(cursor, "MMMM yyyy")}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-muted-foreground mb-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="p-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(d => {
            const dj = jobs.filter(j => isSameDay(parseISO(j.dueAt), d));
            return (
              <div key={d.toISOString()} className="min-h-[110px] rounded-md border border-border bg-background/40 p-2">
                <div className="text-xs font-semibold mb-1">{format(d, "d")}</div>
                <div className="space-y-1">
                  {dj.slice(0, 3).map(j => (
                    <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className={`block truncate text-[10px] rounded px-1.5 py-0.5 border ${statusColorClasses(j.status)}`}>{j.title}</Link>
                  ))}
                  {dj.length > 3 && <div className="text-[10px] text-muted-foreground">+{dj.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Grid ----------
function GridView({ jobs, onEscalate, onDeescalate, onHold, onClose }: {
  jobs: Job[]; onEscalate: (id: string) => void; onDeescalate: (id: string) => void; onHold: (id: string) => void; onClose: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 tv:grid-cols-4 gap-3">
      {jobs.map(j => <JobCard key={j.id} job={j} onEscalate={onEscalate} onDeescalate={onDeescalate} onHold={onHold} onClose={onClose} />)}
    </div>
  );
}

// ---------- TV wall ----------
function TVView({ jobs }: { jobs: Job[] }) {
  const active = jobs.filter(j => j.status !== "Closed").sort((a,b) => (a.priority === "Escalated" ? -1 : 1));
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 tv:grid-cols-5 gap-4">
      {active.map(j => {
        const c = CLIENTS.find(x => x.id === j.clientId);
        const techs = j.technicianIds.map(id => TECHNICIANS.find(t => t.id === id)?.name).filter(Boolean).join(", ");
        return (
          <div key={j.id} className={`rounded-2xl border-2 p-5 ${statusColorClasses(j.status)} ${j.priority === "Escalated" ? "ring-2 ring-destructive animate-pulse" : ""}`}>
            <div className="flex items-center justify-between text-xs uppercase tracking-widest opacity-80">
              <span>{j.status}</span>
              <span>{j.type}</span>
            </div>
            <div className="mt-3 text-lg tv:text-2xl font-extrabold leading-tight">{c?.name}</div>
            <div className="text-sm tv:text-lg opacity-90 mt-1">{j.branch}</div>
            <div className="mt-3 text-xs tv:text-base opacity-80">{j.title}</div>
            <div className="mt-4 flex items-center justify-between text-xs tv:text-base">
              <span className="flex items-center gap-1"><User2 className="h-3 w-3 tv:h-4 tv:w-4" />{techs || "Unassigned"}</span>
              <span>Due {format(parseISO(j.dueAt), "d MMM")}</span>
            </div>
            <Progress value={j.progress} className="mt-3 h-2" />
          </div>
        );
      })}
    </div>
  );
}
