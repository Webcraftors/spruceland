import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { invitationEmail } from "@/lib/notify/templates";
import { invitationToken } from "@/lib/invitation-token";

const Input = z.object({
  organizationId: z.string().uuid(),
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().max(120).optional(),
  roleIds: z.array(z.string().uuid()).min(1).max(10),
  locationIds: z.array(z.string().uuid()).max(100).default([]),
});

/** Creates an invitation as the signed-in user (permission checks run in the database) and emails the one-time link. */
export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { randomBytes, createHash } = await import("node:crypto");
    const token = invitationToken(randomBytes(32));
    const hash = createHash("sha256").update(token).digest("hex");
    const { data: id, error } = await (context.supabase as any).rpc("create_user_invitation", {
      p_organization_id: data.organizationId, p_email: data.email, p_token_hash: hash,
      p_role_ids: data.roleIds, p_location_ids: data.locationIds, p_full_name: data.fullName ?? null,
    });
    if (error) return { ok: false as const, error: error.message };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inv } = await (supabaseAdmin as any).from("user_invitations").select("expires_at, organizations(name)").eq("id", id).single();
    const mail = invitationEmail({
      orgName: inv?.organizations?.name ?? "Spruceland IQ", fullName: data.fullName ?? null,
      acceptUrl: `https://spruceland.lovable.app/invite?token=${token}`,
      expiresAt: inv ? new Date(inv.expires_at).toLocaleDateString("en-GB") : "7 days",
    });
    try {
      const { sendResendEmail } = await import("@/lib/notify/providers.server");
      await sendResendEmail([data.email], mail.subject, mail.html, `invite-${id}`);
      return { ok: true as const, invitationId: id as string, emailed: true };
    } catch (e) {
      console.error("invitation email failed", id, e);
      return { ok: true as const, invitationId: id as string, emailed: false };
    }
  });
