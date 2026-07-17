import { test, expect } from "@playwright/test";
import { isOutcomeConsistent, resolveVerification, acknowledgementIsNotSignature } from "../src/lib/committee/signature";

// TASK-MVP2-M2-12-COMMITTEE-SIGNATURE-001 · MVP2-REQ-0128..0136 · CD-049.
test("signature vs refusal outcomes stay distinct", () => {
  expect(isOutcomeConsistent("refusal", "refused")).toBe(true);
  expect(isOutcomeConsistent("refusal", "captured")).toBe(false);
  expect(isOutcomeConsistent("signature", "captured")).toBe(true);
  expect(isOutcomeConsistent("signature", "queued")).toBe(true);   // queued != delivered
  expect(isOutcomeConsistent("signature", "refused")).toBe(false);
});

test("verification is never verified without a provider pass", () => {
  expect(resolveVerification({ providerConfigured: false })).toBe("unavailable");
  expect(resolveVerification({ providerConfigured: true, providerResult: "pending" })).toBe("pending");
  expect(resolveVerification({ providerConfigured: true, providerResult: "fail" })).toBe("failed");
  expect(resolveVerification({ providerConfigured: true, providerResult: "pass" })).toBe("verified");
  expect(resolveVerification({ providerConfigured: true })).toBe("unverified"); // no result
});

test("DEC-009 acknowledgement is not a signature", () => {
  expect(acknowledgementIsNotSignature("acknowledgement")).toBe(false);
  expect(acknowledgementIsNotSignature("pki")).toBe(true);
});
