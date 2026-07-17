// Cycle 2 Wave 2.E — deterministic staging adapters for the OTP sink and
// push/SMS/email notification channels. Real OTP verification is already
// live (vp_request_otp/vp_verify_otp RPCs, supabase/migrations/0009_virtual_otp.sql)
// — this module never touches that. It plugs into the EXISTING notify.ts
// DeliveryAdapter registry (src/lib/notify.ts) so push/sms/email can report a
// deterministic staging outcome instead of the honest-but-unhelpful
// "not_configured" default, for environments that want to exercise the full
// delivery/escalation/dedup UI without a real provider. Never sends a real
// external message — every "send" is recorded to an in-memory sink only.
import type { DeliveryAdapter, DeliveryResult, NotifyChannel, NotifyInput } from "@/lib/notify";
import { assertNonProduction, resolveFeatureFlag, seededFraction } from "./env-gate";

export type SinkRecord = { channel: NotifyChannel; recipient: string | null; eventKey: string; at: string; outcome: DeliveryResult };

const sink: SinkRecord[] = [];
const seenDedupeKeys = new Set<string>();

export function readSink(): readonly SinkRecord[] { return sink; }
export function clearSink(): void { sink.length = 0; seenDedupeKeys.clear(); }

function dedupeKey(input: NotifyInput): string {
  return `${input.event_key}:${input.recipient ?? "external"}:${input.channel ?? "inapp"}`;
}

/** success / wrong-or-expired / retry-limit / provider-down / dedup, deterministic per event+recipient+channel. */
function simulateDelivery(channel: NotifyChannel, input: NotifyInput): DeliveryResult {
  const key = dedupeKey(input);
  if (seenDedupeKeys.has(key)) return { delivered: false, detail: "duplicate_suppressed" };
  seenDedupeKeys.add(key);
  const f = seededFraction(key);
  if (f < 0.1) return { delivered: false, detail: "provider_down" };
  if (f < 0.18) return { delivered: false, detail: "retry_limit_exceeded" };
  return { delivered: true, detail: `staging:${channel}` };
}

class StagingChannelAdapter implements DeliveryAdapter {
  constructor(public readonly channel: NotifyChannel) { assertNonProduction(`StagingChannelAdapter(${channel})`); }
  async deliver(input: NotifyInput): Promise<DeliveryResult> {
    const outcome = simulateDelivery(this.channel, input);
    sink.push({ channel: this.channel, recipient: input.recipient, eventKey: input.event_key, at: new Date().toISOString(), outcome });
    return outcome;
  }
}

export const NOTIFICATION_STUB_MODES = ["staging", "off"] as const;
export type NotificationStubMode = (typeof NOTIFICATION_STUB_MODES)[number];

/**
 * Call once at startup (test/staging bootstrap only) to register deterministic
 * push/sms/email adapters with the real notify.ts registry. Never call this
 * in production — assertNonProduction() throws if attempted.
 */
export function registerStagingNotificationAdapters(registerAdapter: (a: DeliveryAdapter) => void): void {
  const mode = resolveFeatureFlag(process.env.FEATURE_NOTIFICATION_STUBS, NOTIFICATION_STUB_MODES, "off");
  if (mode === "off") return;
  (["push", "sms", "email"] as const).forEach(channel => registerAdapter(new StagingChannelAdapter(channel)));
}

/** OTP delivery sink — the code itself stays real (DB-generated); this only
 *  simulates *transmitting* it over SMS/push so a test can assert on what
 *  "would have been sent" without a real telecom provider. */
export function simulateOtpTransmission(channel: "sms" | "push", recipientHint: string, code: string): DeliveryResult {
  assertNonProduction("simulateOtpTransmission");
  const outcome = simulateDelivery(channel, { event_key: "otp_code", recipient: recipientHint, payload: { code } });
  sink.push({ channel, recipient: recipientHint, eventKey: "otp_code", at: new Date().toISOString(), outcome });
  return outcome;
}
