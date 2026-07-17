import { test, expect } from "@playwright/test";
import { ResendEmailAdapter, maybeRegisterResendEmail } from "../src/lib/providers/email-resend";
import type { DeliveryAdapter } from "../src/lib/notify";

// Resend email provider certification. No browser/DB. The live-send test runs only
// when RESEND_API_KEY is present (fail-closed contract otherwise).
// TASK-MVP2-M2-02 notification delivery.

test("fail-closed: adapter delivers nothing without a recipient email", async () => {
  const adapter = new ResendEmailAdapter("re_dummy", "onboarding@resend.dev");
  const r = await adapter.deliver({ event_key: "x", recipient: "u1", payload: {}, channel: "email" });
  expect(r.delivered).toBe(false);
  expect(r.detail).toBe("no_recipient_email");
});

test("fail-closed: no RESEND_API_KEY → email adapter not registered", () => {
  const prev = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  try {
    const registered: DeliveryAdapter[] = [];
    const ok = maybeRegisterResendEmail((a) => registered.push(a));
    expect(ok).toBe(false);
    expect(registered).toHaveLength(0);
  } finally { if (prev !== undefined) process.env.RESEND_API_KEY = prev; }
});

test("LIVE: Resend sends a real email to the safe test sink and reports delivered", async () => {
  test.skip(!process.env.RESEND_API_KEY, "RESEND_API_KEY not set in this run");
  const adapter = new ResendEmailAdapter(process.env.RESEND_API_KEY!, process.env.RESEND_FROM ?? "onboarding@resend.dev");
  // delivered@resend.dev is Resend's success sink — no real inbox is emailed.
  const r = await adapter.deliver({
    event_key: "provider.cert", recipient: null, channel: "email",
    payload: { to_email: "delivered@resend.dev", subject: "MIM Inspection email provider cert", html: "<p>live</p>" },
  });
  expect(r.delivered).toBe(true);
  expect(r.detail).toContain("resend");
});
