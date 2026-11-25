import { LiveJobs } from "@/components/live/LiveJobs";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  DndContext, DragEndEvent, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  JOB_STATUSES, statusColorClasses, priorityColorClasses, typeColorClasses,
  type Job, type JobStatus,
} from "@/data/jobs";
import { TECHNICIANS } from "@/data/technicians";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { scopedJobs } from "@/lib/scope";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from "date-fns";
import { ArrowUp, ArrowDown, Pause, CheckCircle2, MapPin, User2, Plus, MoreVertical, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { JobFormDialog } from "@/components/JobFormDialog";

const searchSchema = z.object({
  view: z.enum(["kanban","calendar","grid","tv"]).catch("kanban").optional(),
});

export const Route = createFileRoute("/_app/jobs")({
  head: () => ({ meta: [{ title: "Jobs board — Spruceland Ops" }] }),
  validateSearch: searchSchema,
  component: JobsPage,
});

function JobsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const view = search.view ?? "kanban";
  const { session } = useSession();
  const store = useStore();
  const [locFilter, setLocFilter] = useState<"All"|"Lusaka"|"Ndola">("All");
  const [clientFilter, setClientFilter] = useState<string>("All");
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  if (!session) return null;

  const scoped = scopedJobs(store.jobs, session.role, session.location);
  const filtered = useMemo(() => scoped.filter(j =>
    (locFilter === "All" || j.location === locFilter) &&
    (clientFilter === "All" || j.clientId === clientFilter)
  ), [scoped, locFilter, clientFilter]);

  const setStatus = (id: string, status: JobStatus) => { store.updateJob(id, { status }); toast.success(`Moved to ${status}`); };
  const escalate = (id: string) => { store.updateJob(id, { priority: "Escalated" }); toast.success("Job escalated"); };
  const deescalate = (id: string) => { store.updateJob(id, { priority: "Normal" }); };
  const hold = (id: string) => { store.updateJob(id, { status: "On Hold" }); };
  const close = (id: string) => { store.updateJob(id, { status: "Closed", progress: 100 }); toast.success("Job closed"); };
  const openEdit = (j: Job) => { setEditing(j); setDlgOpen(true); };
  const openNew = () => { setEditing(null); setDlgOpen(true); };
  const doDelete = () => { if (confirmDel) { store.deleteJob(confirmDel); toast.success("Job deleted"); setConfirmDel(null); } };

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Jobs board</h1>
          <p className="text-[11px] text-muted-foreground">Drag between columns · escalate, hold, close, edit.</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Select value={locFilter} onValueChange={(v: any) => setLocFilter(v)}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All locations</SelectItem>
              <SelectItem value="Lusaka">Lusaka</SelectItem>
              <SelectItem value="Ndola">Ndola</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All clients</SelectItem>
              {store.clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1" />New job</Button>
        </div>
      </header>
      <LiveJobs />

      <Tabs value={view} onValueChange={(v) => navigate({ to: "/jobs", search: { view: v as any } })}>
        <TabsList className="h-8">
          <TabsTrigger value="kanban" className="text-xs">Kanban</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs">Calendar</TabsTrigger>
          <TabsTrigger value="grid" className="text-xs">Grid</TabsTrigger>
          <TabsTrigger value="tv" className="text-xs">TV wall</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "kanban" && <Kanban jobs={filtered} onMove={setStatus} onEscalate={escalate} onDeescalate={deescalate} onHold={hold} onClose={close} onEdit={openEdit} onDelete={setConfirmDel} />}
      {view === "calendar" && <CalendarView jobs={filtered} />}
      {view === "grid" && <GridView jobs={filtered} onEscalate={escalate} onDeescalate={deescalate} onHold={hold} onClose={close} onEdit={openEdit} onDelete={setConfirmDel} />}
      {view === "tv" && <TVView jobs={filtered} />}

      <JobFormDialog open={dlgOpen} onOpenChange={setDlgOpen} editing={editing} />

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone in the demo build.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- Kanban ----------
function Kanban(props: any) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [dragged, setDragged] = useState<Job | null>(null);
  const onEnd = (e: DragEndEvent) => {
    setDragged(null);
    if (!e.over) return;
    props.onMove(String(e.active.id), String(e.over.id) as JobStatus);
  };
  return (
    <DndContext sensors={sensors} onDragStart={(e) => setDragged(props.jobs.find((j: Job) => j.id === e.active.id) ?? null)} onDragEnd={onEnd} onDragCancel={() => setDragged(null)}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 tv:grid-cols-7 gap-3 overflow-x-auto">
        {JOB_STATUSES.map(status => (
          <Column key={status} status={status} jobs={props.jobs.filter((j: Job) => j.status === status)} {...props} />
        ))}
      </div>
      <DragOverlay>{dragged && <JobCard job={dragged} dragging />}</DragOverlay>
    </DndContext>
  );
}

function Column({ status, jobs, onEscalate, onDeescalate, onHold, onClose, onEdit, onDelete }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`rounded-lg border border-border bg-card/60 p-2 min-h-[160px] transition-colors ${isOver ? "border-primary bg-primary/5" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider">{status}</h3>
        <Badge variant="outline" className="text-[10px]">{jobs.length}</Badge>
      </div>
      <div className="space-y-1.5">
        {jobs.map((j: Job) => <DraggableCard key={j.id} job={j} onEscalate={onEscalate} onDeescalate={onDeescalate} onHold={onHold} onClose={onClose} onEdit={onEdit} onDelete={onDelete} />)}
        {jobs.length === 0 && <p className="text-[10px] text-muted-foreground px-1 py-3 text-center">Drop jobs here</p>}
      </div>
    </div>
  );
}

function DraggableCard(props: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.job.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={isDragging ? "opacity-40" : ""}>
      <JobCard {...props} />
    </div>
  );
}

function JobCard({ job, dragging, onEscalate, onDeescalate, onHold, onClose, onEdit, onDelete }: {
  job: Job; dragging?: boolean; onEscalate?: any; onDeescalate?: any; onHold?: any; onClose?: any; onEdit?: any; onDelete?: any;
}) {
  const { clients } = useStore();
  const client = clients.find(c => c.id === job.clientId);
  const techs = job.technicianIds.map(id => TECHNICIANS.find(t => t.id === id)).filter(Boolean);
  return (
    <div className={`rounded-md border border-border bg-background p-2 shadow-sm ${dragging ? "shadow-xl rotate-1" : ""}`}>
      <div className="flex items-center justify-between gap-1">
        <Badge variant="outline" className={`${priorityColorClasses(job.priority)} text-[9px] px-1 py-0`}>{job.priority}</Badge>
        <div className="flex items-center gap-0.5">
          <Badge variant="outline" className={`${typeColorClasses(job.type)} text-[9px] px-1 py-0`}>{job.type}</Badge>
          {onEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button className="p-0.5 hover:bg-accent rounded" onPointerDown={(e) => e.stopPropagation()}><MoreVertical className="h-3 w-3" /></button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" onPointerDown={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onEdit(job)}><Pencil className="h-3 w-3 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(job.id)}><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <Link to="/jobs/$id" params={{ id: job.id }} className="block mt-1 font-semibold text-[12px] leading-tight hover:text-primary line-clamp-2">{job.title}</Link>
      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate"><MapPin className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{client?.name} · {job.branch}</span></div>
      <Progress value={job.progress} className="mt-1.5 h-1" />
      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex -space-x-1">
          {techs.length === 0 && <span className="text-[10px] text-muted-foreground">Unassigned</span>}
          {techs.map(t => (
            <div key={t!.id} title={t!.name} className="h-4 w-4 rounded-full ring-1 ring-background bg-primary/20 text-primary grid place-items-center text-[8px] font-bold">{t!.avatarInitials}</div>
          ))}
        </div>
        <span className="text-[9px] text-muted-foreground">{format(parseISO(job.dueAt), "d MMM")}</span>
      </div>
      {onEscalate && (
        <div className="mt-1.5 flex flex-wrap gap-1" onPointerDown={(e) => e.stopPropagation()}>
          {job.priority !== "Escalated" ? (
            <button onClick={() => onEscalate!(job.id)} className="text-[9px] rounded border border-destructive/40 text-destructive px-1 py-0.5 hover:bg-destructive/10 flex items-center gap-0.5"><ArrowUp className="h-2.5 w-2.5" />Esc</button>
          ) : (
            <button onClick={() => onDeescalate!(job.id)} className="text-[9px] rounded border border-border px-1 py-0.5 hover:bg-accent flex items-center gap-0.5"><ArrowDown className="h-2.5 w-2.5" />De-esc</button>
          )}
          <button onClick={() => onHold!(job.id)} className="text-[9px] rounded border border-border px-1 py-0.5 hover:bg-accent flex items-center gap-0.5"><Pause className="h-2.5 w-2.5" />Hold</button>
          <button onClick={() => onClose!(job.id)} className="text-[9px] rounded border border-success/40 text-success px-1 py-0.5 hover:bg-success/10 flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" />Close</button>
        </div>
      )}
    </div>
  );
}

// ---------- Calendar (with mobile agenda) ----------
function CalendarView({ jobs }: { jobs: Job[] }) {
  const [cursor, setCursor] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) });
  const startOffset = startOfMonth(cursor).getDay();
  const [mode, setMode] = useState<"grid"|"agenda">(typeof window !== "undefined" && window.innerWidth < 640 ? "agenda" : "grid");
  const jobsInMonth = jobs.filter(j => {
    const d = parseISO(j.dueAt); return d >= startOfMonth(cursor) && d <= endOfMonth(cursor);
  }).sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="p-3 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCursor(c => addMonths(c, -1))}><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <CardTitle className="text-sm">{format(cursor, "MMMM yyyy")}</CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCursor(c => addMonths(c, 1))}><ChevronRight className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="flex gap-1">
          <Button variant={mode === "grid" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setMode("grid")}>Month</Button>
          <Button variant={mode === "agenda" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setMode("agenda")}>Agenda</Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {mode === "grid" ? (
          <>
            <div className="grid grid-cols-7 gap-0.5 text-[10px] font-semibold text-muted-foreground mb-1">
              {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="p-1 text-center">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
              {days.map(d => {
                const dj = jobs.filter(j => isSameDay(parseISO(j.dueAt), d));
                return (
                  <div key={d.toISOString()} className="min-h-[60px] md:min-h-[90px] rounded border border-border bg-background/40 p-1">
                    <div className="text-[10px] font-semibold mb-0.5">{format(d, "d")}</div>
                    <div className="space-y-0.5">
                      {dj.slice(0, 2).map(j => (
                        <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className={`block truncate text-[9px] rounded px-1 py-0.5 border ${statusColorClasses(j.status)}`}>{j.title.slice(0, 12)}</Link>
                      ))}
                      {dj.length > 2 && <div className="text-[9px] text-muted-foreground">+{dj.length - 2}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            {jobsInMonth.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No jobs this month.</p>}
            {jobsInMonth.map(j => (
              <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="flex items-center gap-2 rounded-md border border-border p-2 hover:border-primary/60">
                <div className="text-center w-10 shrink-0">
                  <div className="text-[9px] uppercase text-muted-foreground">{format(parseISO(j.dueAt), "MMM")}</div>
                  <div className="text-base font-bold leading-none">{format(parseISO(j.dueAt), "d")}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{j.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{j.branch}</div>
                </div>
                <Badge variant="outline" className={`${statusColorClasses(j.status)} text-[9px]`}>{j.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Grid ----------
function GridView({ jobs, onEscalate, onDeescalate, onHold, onClose, onEdit, onDelete }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 tv:grid-cols-4 gap-2">
      {jobs.map((j: Job) => <JobCard key={j.id} job={j} onEscalate={onEscalate} onDeescalate={onDeescalate} onHold={onHold} onClose={onClose} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  );
}

// ---------- TV wall (responsive: compact on mobile, huge on TV) ----------
function TVView({ jobs }: { jobs: Job[] }) {
  const { clients } = useStore();
  const active = jobs.filter(j => j.status !== "Closed").sort((a, b) => (a.priority === "Escalated" ? -1 : 1));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 tv:grid-cols-5 gap-2.5">
      {active.map(j => {
        const c = clients.find(x => x.id === j.clientId);
        const techs = j.technicianIds.map(id => TECHNICIANS.find(t => t.id === id)?.name).filter(Boolean).join(", ");
        return (
          <Link key={j.id} to="/jobs/$id" params={{ id: j.id }}
            className={`block rounded-lg border-2 p-2.5 tv:p-4 ${statusColorClasses(j.status)} ${j.priority === "Escalated" ? "ring-2 ring-destructive animate-pulse" : ""}`}>
            <div className="flex items-center justify-between text-[9px] tv:text-sm uppercase tracking-wider opacity-80">
              <span className="truncate">{j.status}</span>
              <span className="truncate ml-1">{j.type}</span>
            </div>
            <div className="mt-1.5 text-sm tv:text-2xl font-extrabold leading-tight line-clamp-2">{c?.name}</div>
            <div className="text-[11px] tv:text-lg opacity-90 mt-0.5 truncate">{j.branch}</div>
            <div className="mt-1.5 text-[11px] tv:text-base opacity-80 line-clamp-2">{j.title}</div>
            <div className="mt-2 flex items-center justify-between text-[9px] tv:text-sm gap-1">
              <span className="flex items-center gap-1 truncate"><User2 className="h-2.5 w-2.5 tv:h-4 tv:w-4 shrink-0" /><span className="truncate">{techs || "Unassigned"}</span></span>
              <span className="shrink-0">{format(parseISO(j.dueAt), "d MMM")}</span>
            </div>
            <Progress value={j.progress} className="mt-1.5 h-1 tv:h-2" />
          </Link>
        );
      })}
    </div>
  );
}
