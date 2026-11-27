import { createFileRoute } from "@tanstack/react-router";
import { InvitationManager } from "@/components/InvitationManager";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/_app/invitations")({
  head: () => pageMeta("Staff invitations — Spruceland IQ", "Manage authorized team invitations and assigned portal access."),
  component: () => <InvitationManager />,
});
