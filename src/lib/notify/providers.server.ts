export async function sendResendEmail(to: string[], subject: string, html: string, idempotencyKey?: string) {
  const key = process.env["RESEND_API_KEY"];
  const raw = process.env["RESEND_FROM_EMAIL"]?.trim().replace(/^["']|["']$/g, "");
  // Accepts a full address, "Name <address>", or just the verified domain (→ noreply@domain).
  const from = raw && !raw.includes("@") ? `noreply@${raw.replace(/^@/, "")}` : raw;
  if (!key || !from) throw new Error("Email sending is not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`, "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from: from.includes("<") ? from : `Spruceland IQ <${from}>`, to, subject, html }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${text.slice(0, 300)}`);
  return (JSON.parse(text) as { id?: string }).id ?? null;
}

export async function sendOneSignalPush(app: "stgl" | "yalelo", userIds: string[], title: string, body: string, data: Record<string, unknown>) {
  const appId = process.env[app === "stgl" ? "ONESIGNAL_STGL_APP_ID" : "ONESIGNAL_YALELO_APP_ID"];
  const key = process.env[app === "stgl" ? "ONESIGNAL_STGL_API_KEY" : "ONESIGNAL_YALELO_API_KEY"];
  if (!appId || !key) throw new Error(`Push for ${app} is not configured`);
  const res = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: appId, target_channel: "push", include_aliases: { external_id: userIds },
      headings: { en: title }, contents: { en: body || title }, data,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OneSignal ${res.status}: ${text.slice(0, 300)}`);
  const json = JSON.parse(text) as { id?: string; errors?: unknown };
  return { id: json.id ?? null, note: json.errors ? JSON.stringify(json.errors).slice(0, 300) : null };
}
