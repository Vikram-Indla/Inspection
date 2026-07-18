import { test, expect } from "@playwright/test";
import {
  DocuSignSignatureAdapter,
  maybeBuildDocuSignAdapter,
  mapEnvelopeStatusToVerification,
} from "../src/lib/providers/signature-docusign";

// DocuSign digital-signature provider certification. No browser/DB.
// LIVE test runs only when DOCUSIGN_* env vars are present (fail-closed
// contract otherwise). TASK-MVP2-M2-12-COMMITTEE-SIGNATURE-001 · CD-049.
// Short-term provider — production must rotate to the real KSA PKI/EBDA
// authority; see signature-docusign.ts header for the reasoning.

test("fail-closed: missing DOCUSIGN_* env -> adapter not built", () => {
  const keys = [
    "DOCUSIGN_INTEGRATION_KEY", "DOCUSIGN_CLIENT_SECRET", "DOCUSIGN_REFRESH_TOKEN",
    "DOCUSIGN_ACCOUNT_ID", "DOCUSIGN_BASE_URI", "DOCUSIGN_AUTH_SERVER",
  ] as const;
  const prev: Record<string, string | undefined> = {};
  for (const k of keys) { prev[k] = process.env[k]; delete process.env[k]; }
  try {
    expect(maybeBuildDocuSignAdapter()).toBeNull();
  } finally {
    for (const k of keys) if (prev[k] !== undefined) process.env[k] = prev[k];
  }
});

test("mapEnvelopeStatusToVerification: never returns 'verified' except on genuine 'completed'", () => {
  expect(mapEnvelopeStatusToVerification("completed")).toBe("verified");
  expect(mapEnvelopeStatusToVerification("sent")).toBe("pending");
  expect(mapEnvelopeStatusToVerification("delivered")).toBe("pending");
  expect(mapEnvelopeStatusToVerification("declined")).toBe("failed");
  expect(mapEnvelopeStatusToVerification("voided")).toBe("failed");
  expect(mapEnvelopeStatusToVerification(undefined)).toBe("unavailable");
  expect(mapEnvelopeStatusToVerification("some_unknown_future_status")).toBe("unavailable");
});

test("fail-closed: bad credentials -> requestSignature reports docusign_auth_failed, no envelope", async () => {
  const adapter = new DocuSignSignatureAdapter({
    integrationKey: "00000000-0000-0000-0000-000000000000",
    clientSecret: "not-a-real-secret",
    refreshToken: "not-a-real-refresh-token",
    accountId: "00000000-0000-0000-0000-000000000000",
    baseUri: "https://demo.docusign.net",
    authServer: "account-d.docusign.com",
  });
  const r = await adapter.requestSignature({ reportHash: "deadbeef", signerEmail: "nobody@example.com", signerName: "Nobody" });
  expect(r.ok).toBe(false);
  expect(r.envelopeId).toBeUndefined();
});

test("LIVE: DocuSign creates a real envelope, reports genuine status, then voids it", async () => {
  test.skip(!process.env.DOCUSIGN_REFRESH_TOKEN, "DOCUSIGN_* not set in this run");
  const adapter = maybeBuildDocuSignAdapter();
  expect(adapter).not.toBeNull();
  if (!adapter) return;

  const reportHash = `cert-${Date.now() % 1000000}`;
  const created = await adapter.requestSignature({
    reportHash,
    signerEmail: "vikramataol@gmail.com",
    signerName: "MIM Certification Run",
  });
  expect(created.ok).toBe(true);
  expect(created.envelopeId).toBeTruthy();
  // DocuSign accepted a real envelope into its 'sent' pipeline — genuine
  // provider evidence, not a stub. Never claims 'verified' at this point.
  expect(mapEnvelopeStatusToVerification(created.providerStatus)).toBe("pending");
  if (!created.envelopeId) return;

  const status = await adapter.getEnvelopeStatus(created.envelopeId);
  expect(status.ok).toBe(true);
  expect(["sent", "delivered"]).toContain(status.providerStatus);

  // Second genuine write call — proves the void path also actually works,
  // and keeps the sandbox account from accumulating live envelopes.
  const voided = await adapter.voidEnvelope(created.envelopeId, "MIM live-certification cleanup");
  expect(voided.ok).toBe(true);
});
