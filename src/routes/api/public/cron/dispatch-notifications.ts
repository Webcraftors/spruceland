import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/cron/dispatch-notifications")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { dispatchPending } = await import("@/lib/notify/dispatch.server");
        try {
          return Response.json(await dispatchPending());
        } catch (e) {
          console.error(e);
          return Response.json({ error: "dispatch failed" }, { status: 500 });
        }
      },
    },
  },
});
