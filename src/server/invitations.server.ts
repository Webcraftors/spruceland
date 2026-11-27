import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { invitationToken } from "@/lib/invitation-token";
import { invitationEmail } from "@/lib/notify/templates";

export const InvitationInput = z.object({
  organizationId: z.string().uuid(), email: z.string().trim().email().max(255),
  fullName: z.string().trim().min(2).max(120), employeeRef: z.string().trim().max(150).default(""),
  roleIds: z.array(z.string().uuid()).min(1).max(10),
  applicationIds: z.array(z.string().uuid()).min(1).max(10),
  locationIds: z.array(z.string().uuid()).max(100).default([]),
});

export async function createAndEmailInvitation(client: SupabaseClient<Database>, input: z.infer<typeof InvitationInput>) {
  const { randomBytes, createHash } = await import("node:crypto");
  const token = invitationToken(randomBytes(32));
  const hash = createHash("sha256").update(token).digest("hex");
  // This transactional RPC verifies the inviter and every delegated role, app and location.
  const { data: id, error } = await client.rpc("create_user_invitation", {
    p_organization_id: input.organizationId, p_email: input.email, p_token_hash: hash,
    p_role_ids: input.roleIds, p_application_ids: input.applicationIds, p_location_ids: input.locationIds,
    p_full_name: input.fullName, p_employee_ref: input.employeeRef,
  });
  if (error) throw new Error(error.message);
  // Privileged read is confined to the invitation just authorized and created above.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: invitation, error: readError } = await supabaseAdmin.from("user_invitations").select("expires_at, organizations(name,slug)").eq("id", id).single();
  if (readError || !invitation) throw new Error("Invitation created, but email details are unavailable. Cancel it and invite again.");
  const org = invitation.organizations;
  const portal = org?.slug === "stgl" ? "staff" : "client";
  const mail = invitationEmail({ orgName: org?.name ?? "Spruceland IQ", fullName: input.fullName,
    acceptUrl: `https://spruceland.lovable.app/invite?portal=${portal}&token=${token}`,
    expiresAt: new Date(invitation.expires_at).toLocaleDateString("en-GB"),
  });
  try {
    const { sendResendEmail } = await import("@/lib/notify/providers.server");
    const messageId = await sendResendEmail([input.email], mail.subject, mail.html, `invite-${id}`);
    return { ok: true, invitationId: id, emailed: Boolean(messageId) };
  } catch {
    return { ok: true, invitationId: id, emailed: false };
  }
}

export async function handleInvitationRequest(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origin not permitted" }, { status: 403, headers });
  const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get("Authorization") ?? "")?.[1];
  if (!token) return Response.json({ error: "Please sign in" }, { status: 401, headers });
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return Response.json({ error: "Sign-in unavailable" }, { status: 503, headers });
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}`, apikey: key } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.email_confirmed_at) return Response.json({ error: "A confirmed account is required" }, { status: 401, headers });
  if (Number(request.headers.get("Content-Length") ?? 0) > 16000) return Response.json({ error: "Request too large" }, { status: 413, headers });
  try {
    const text = await request.text();
    if (text.length > 16000) return Response.json({ error: "Request too large" }, { status: 413, headers });
    const input = InvitationInput.parse(JSON.parse(text));
    return Response.json(await createAndEmailInvitation(client, input), { headers });
  } catch (e) {
    return Response.json({ error: e instanceof z.ZodError ? "Check the invitation details" : e instanceof Error ? e.message : "Invitation failed" }, { status: 400, headers });
  }
}