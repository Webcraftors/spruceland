import { describe, it, expect } from "vitest";
import { canTransition, validateSignOff } from "./ticket-workflow";

describe("ticket workflow", () => {
  it("only closes from Awaiting Sign-off", () => {
    expect(canTransition("Awaiting Sign-off", "Closed")).toBe(true);
    expect(canTransition("In Progress", "Closed")).toBe(false);
    expect(canTransition("Open", "Closed")).toBe(false);
  });
  it("closed tickets cannot change", () => {
    expect(canTransition("Closed", "In Progress")).toBe(false);
  });
  it("client can dispute and reopen", () => {
    expect(canTransition("Awaiting Sign-off", "In Progress")).toBe(true);
  });
});

describe("sign-off", () => {
  const emp = { name: "Mary Banda", employeeRef: "123456/10/1" };
  const ok = { consent: true, confirmComplete: true, typedName: "mary banda", typedRef: "123456 10 1" };
  it("accepts matching name and NRC regardless of formatting", () => {
    expect(validateSignOff(ok, emp)).toEqual([]);
  });
  it("rejects wrong NRC", () => {
    expect(validateSignOff({ ...ok, typedRef: "999999/10/1" }, emp)).toContain("NRC / Employee ID does not match.");
  });
  it("rejects missing consent", () => {
    expect(validateSignOff({ ...ok, consent: false }, emp).length).toBe(1);
  });
  it("rejects approval without confirmation that work is complete", () => {
    expect(validateSignOff({ ...ok, confirmComplete: false }, emp)).toEqual(["Confirm the work is complete."]);
  });
  it("rejects wrong name", () => {
    expect(validateSignOff({ ...ok, typedName: "John" }, emp).length).toBe(1);
  });
});
