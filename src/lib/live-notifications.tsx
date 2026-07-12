import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

/** Simulates real-time events every ~25s. */
export function LiveNotifications() {
  const { jobs, pushNotification } = useStore();
  const idxRef = useRef(0);
  useEffect(() => {
    const tick = () => {
      const openJobs = jobs.filter(j => j.status !== "Closed" && j.status !== "Completed");
      if (openJobs.length === 0) return;
      const j = openJobs[idxRef.current % openJobs.length];
      idxRef.current++;
      const kinds = ["escalation", "service_due", "breakdown"] as const;
      const kind = kinds[idxRef.current % kinds.length];
      const title =
        kind === "escalation" ? `Escalated: ${j.title.slice(0, 40)}` :
        kind === "service_due" ? `Service reminder: ${j.branch}` :
        `New breakdown reported: ${j.branch}`;
      pushNotification({ kind, title, detail: j.notes || "Auto-generated event.", jobId: j.id });
      toast(title, {
        description: j.branch,
        action: {
          label: "Open job",
          onClick: () => { window.location.href = `/jobs/${j.id}`; },
        },
      });
    };
    const t = setInterval(tick, 25_000);
    return () => clearInterval(t);
  }, [jobs, pushNotification]);
  return null;
}

/** Renders a link-style quick action to open a job — reused inside notification dropdown */
export function NotifQuickOpen({ jobId, clientId }: { jobId?: string; clientId?: string }) {
  if (jobId) return <Link to="/jobs/$id" params={{ id: jobId }} className="text-[11px] text-primary hover:underline">Open job →</Link>;
  if (clientId) return <Link to="/clients/$id" params={{ id: clientId }} className="text-[11px] text-primary hover:underline">Open client →</Link>;
  return null;
}
