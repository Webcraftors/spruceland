import { describe, expect, it } from "vitest";
import { breakdownEmail, invitationEmail } from "./templates";

const b = { reference: "BD-1", client: "Yalelo", location: "Kafue", equipment: null, priority: "high", fault: "<x>", reportedAt: "now", reason: "No response" };
describe("email templates", () => {
  it("escalation subject is flagged ESCALATED with priority", () => {
    expect(breakdownEmail("escalated", b, "u").subject).toBe("ESCALATED: Breakdown BD-1 – Yalelo [HIGH]");
  });
  it("escapes client-supplied fault text", () => {
    expect(breakdownEmail("reported", b, "u").html).toContain("&lt;x&gt;");
  });
  it("invitation links to the accept URL", () => {
    expect(invitationEmail({ orgName: "Yalelo", fullName: null, acceptUrl: "https://a/invite?token=t", expiresAt: "1" }).html).toContain("https://a/invite?token=t");
  });
});
