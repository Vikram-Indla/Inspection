import { test, expect } from "@playwright/test";
import { TwilioSmsAdapter, maybeRegisterTwilioSms } from "../src/lib/providers/sms-twilio";
import type { DeliveryAdapter } from "../src/lib/notify";

// Twilio SMS provider certification (fallback role, per engine_settings.otp).
// No browser/DB. The LIVE send test runs only when TWILIO_ACCOUNT_SID/AUTH_TOKEN
// are present; it sends to a Twilio-verified caller ID (safe on a trial account —
// Twilio itself refuses unverified destinations, so this cannot reach an
// arbitrary real number by accident).

test("fail-closed: adapter delivers nothing without a recipient phone", async () => {
  const adapter = new TwilioSmsAdapter("ACdummy", "dummytoken", "+15005550006");
  const r = await adapter.deliver({ event_key: "x", recipient: "u1", payload: {}, channel: "sms" });
  expect(r.delivered).toBe(false);
  expect(r.detail).toBe("no_recipient_phone");
});

test("fail-closed: missing any credential → sms adapter not registered", () => {
  const prevSid = process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_ACCOUNT_SID;
  try {
    const registered: DeliveryAdapter[] = [];
    const ok = maybeRegisterTwilioSms((a) => registered.push(a));
    expect(ok).toBe(false);
    expect(registered).toHaveLength(0);
  } finally { if (prevSid !== undefined) process.env.TWILIO_ACCOUNT_SID = prevSid; }
});

test("LIVE: Twilio sends a real SMS to a verified number and reports delivered", async () => {
  test.skip(!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_TEST_TO, "Twilio live creds/destination not set in this run");
  const adapter = new TwilioSmsAdapter(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!, process.env.TWILIO_FROM_NUMBER!);
  const r = await adapter.deliver({
    event_key: "provider.cert", recipient: null, channel: "sms",
    payload: { to_phone: process.env.TWILIO_TEST_TO, body: "MIM Inspection SMS provider certification (Twilio fallback)." },
  });
  expect(r.delivered).toBe(true);
  expect(r.detail).toContain("twilio:");
});
