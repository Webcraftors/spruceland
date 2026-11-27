import { createFileRoute } from "@tanstack/react-router";
import { InvitationManager } from "@/components/InvitationManager";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/client_/app/people")({
  head: () => pageMeta("Client team invitations — Spruceland IQ", "Invite client team members with authorized roles and assigned stores."),
  component: () => <InvitationManager audience="client" />,
});
