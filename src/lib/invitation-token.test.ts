import { describe, expect, it } from "vitest";
import { invitationToken } from "./invitation-token";

describe("invitation acceptance contract", () => {
  it("creates the 64-character lowercase hex token required by acceptance", () => {
    const bytes = Uint8Array.from({ length: 32 }, (_, i) => i);
    expect(invitationToken(bytes)).toBe("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");
  });
  it("rejects a token with less than 32 bytes", () => {
    expect(() => invitationToken(new Uint8Array(31))).toThrow();
  });
});