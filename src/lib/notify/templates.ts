// Pure email builders — no secrets, safe to unit test.
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function layout(title: string, rows: [string, string][], cta?: { label: string; url: string }, intro?: string) {
  const body = rows
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#5b6b82;font-size:13px;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;font-size:14px;color:#0f1c2e">${esc(v)}</td></tr>`)
    .join("");
  const button = cta
    ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="background:#1d5fbf;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:24px">
<div style="border-top:4px solid #1d5fbf;padding-top:16px"><strong style="color:#1d5fbf;font-size:16px">Spruceland IQ</strong></div>
<h1 style="font-size:20px;color:#0f1c2e;margin:16px 0">${esc(title)}</h1>${intro ? `<p style="font-size:14px;color:#0f1c2e">${esc(intro)}</p>` : ""}
<table style="border-collapse:collapse">${body}</table>${button}
<p style="font-size:12px;color:#8592a6;margin-top:32px">Spruceland Trading Group Ltd · Automated notification</p></div></body></html>`;
}

export interface BreakdownInfo {
  reference: string; client: string; location: string | null; equipment: string | null;
  priority: string; fault: string; reportedAt: string; reason?: string | null;
}

export function breakdownEmail(kind: "reported" | "escalated", b: BreakdownInfo, link: string) {
  const subject = kind === "escalated"
    ? `ESCALATED: Breakdown ${b.reference} – ${b.client} [${b.priority.toUpperCase()}]`
    : `New breakdown ${b.reference} – ${b.client} [${b.priority.toUpperCase()}]`;
  const rows: [string, string][] = [
    ["Reference", b.reference], ["Client", b.client], ["Store", b.location ?? "Not specified"],
    ["Equipment", b.equipment ?? "Not specified"], ["Priority", b.priority], ["Fault", b.fault], ["Reported", b.reportedAt],
  ];
  if (kind === "escalated" && b.reason) rows.unshift(["Escalation reason", b.reason]);
  return { subject, html: layout(kind === "escalated" ? "Breakdown escalated" : "New breakdown reported", rows, { label: "Open breakdown", url: link }) };
}

export function invitationEmail(p: { orgName: string; fullName: string | null; acceptUrl: string; expiresAt: string }) {
  return {
    subject: `You're invited to Spruceland IQ – ${p.orgName}`,
    html: layout(
      `Hello${p.fullName ? " " + p.fullName : ""}, you've been invited`,
      [["Organisation", p.orgName], ["Link expires", p.expiresAt]],
      { label: "Accept invitation", url: p.acceptUrl },
      "Use the button below to set up your Spruceland IQ account. This link can be used once.",
    ),
  };
}

/** Recipient app selection for push: STGL staff → Technician app, Yalelo → Yalelo app, others → none yet. */
export function pushAppFor(orgSlugOrType: "stgl" | "yalelo" | "other"): "stgl" | "yalelo" | null {
  return orgSlugOrType === "other" ? null : orgSlugOrType;
}
