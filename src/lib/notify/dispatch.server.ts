import { breakdownEmail } from "./templates";
import { sendOneSignalPush, sendResendEmail } from "./providers.server";

const APP_URL = "https://spruceland.lovable.app";

/** Sends queued email/push deliveries. Prepared breakdown drafts are never read or modified here. */
export async function dispatchPending(limit = 25) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const { data: rows, error } = await db.from("notification_deliveries")
    .select("*").eq("status", "pending_provider").lt("attempts", 5).order("created_at").limit(limit);
  if (error) throw new Error(error.message);
  const { data: stgl } = await db.from("organizations").select("id").eq("organization_type", "stgl").single();
  const { data: yal } = await db.from("organizations").select("id").ilike("name", "%yalelo%").maybeSingle();
  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const d of rows ?? []) {
    try {
      let providerId: string | null = null;
      let note: string | null = null;
      if (d.channel === "email") {
        const bid = d.payload?.breakdown_id;
        if (!bid || d.email_recipients.length === 0) throw new Error("Nothing to send");
        const { data: b } = await db.from("breakdowns").select("*").eq("id", bid).single();
        const [{ data: org }, { data: loc }, { data: eq }] = await Promise.all([
          db.from("organizations").select("name").eq("id", b.organization_id).single(),
          b.location_id ? db.from("locations").select("name").eq("id", b.location_id).single() : { data: null },
          b.equipment_id ? db.from("equipment").select("equipment_name").eq("id", b.equipment_id).single() : { data: null },
        ]);
        const kind = d.event_type === "breakdown.escalated" ? "escalated" : "reported";
        const mail = breakdownEmail(kind, {
          reference: b.reference, client: org?.name ?? "Client", location: loc?.name ?? null, equipment: eq?.equipment_name ?? null,
          priority: b.priority, fault: b.fault_description,
          reportedAt: new Date(b.reported_at).toLocaleString("en-GB", { timeZone: "Africa/Lusaka" }) + " CAT",
          reason: b.escalation_reason,
        }, `${APP_URL}/breakdowns/${b.id}`);
        providerId = await sendResendEmail(d.email_recipients, mail.subject, mail.html, `delivery-${d.id}`);
      } else {
        const ids: string[] = d.recipient_user_ids ?? [];
        const { data: mem } = await db.from("organization_members").select("user_id, organization_id")
          .in("user_id", ids).eq("membership_status", "active");
        const groups = { stgl: new Set<string>(), yalelo: new Set<string>() };
        for (const m of mem ?? []) {
          if (m.organization_id === stgl?.id) groups.stgl.add(m.user_id);
          else if (yal && m.organization_id === yal.id) groups.yalelo.add(m.user_id);
        }
        const p = d.payload ?? {};
        const sentApps: string[] = [];
        for (const app of ["stgl", "yalelo"] as const) {
          if (groups[app].size === 0) continue;
          const r = await sendOneSignalPush(app, [...groups[app]], p.title ?? "Spruceland IQ", p.body ?? "", {
            link: p.link, entity_type: p.entity_type, entity_id: p.entity_id,
          });
          sentApps.push(`${app}:${r.id ?? "none"}`);
          if (r.note) note = r.note;
        }
        if (sentApps.length === 0) {
          await db.from("notification_deliveries").update({ status: "skipped", processed_at: new Date().toISOString(), last_error: "No recipients with a mobile app" }).eq("id", d.id);
          results.skipped++; continue;
        }
        providerId = sentApps.join(",");
      }
      await db.from("notification_deliveries").update({
        status: "sent", processed_at: new Date().toISOString(), provider_message_id: providerId, attempts: d.attempts + 1, last_error: note,
      }).eq("id", d.id);
      results.sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("delivery failed", d.id, msg);
      const attempts = d.attempts + 1;
      await db.from("notification_deliveries").update({
        attempts, last_error: msg.slice(0, 500), ...(attempts >= 5 ? { status: "failed", processed_at: new Date().toISOString() } : {}),
      }).eq("id", d.id);
      results.failed++;
    }
  }
  return results;
}
