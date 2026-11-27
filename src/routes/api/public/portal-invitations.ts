import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/portal-invitations")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleInvitationRequest } = await import("@/server/invitations.server");
    return handleInvitationRequest(request);
  } } },
});