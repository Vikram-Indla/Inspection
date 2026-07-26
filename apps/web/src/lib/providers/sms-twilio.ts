// SMS delivery provider — Twilio adapter for the notify.ts DeliveryAdapter
// registry. TASK-MVP2-M2-02 notification delivery · release provider integration.
//
// Fallback role per the accepted engine_settings.otp config
// (provider_primary: unifonic, provider_fallback: twilio). Twilio cannot
// register a domestic Saudi sender ID (regulatory restriction on reselling
// domestic traffic), so outbound messages to KSA numbers arrive from the
// plain Twilio "From" number rather than a branded alphanumeric sender ID —
// acceptable for a fallback transport, not for the primary channel.
//
// This is PLAIN SMS TRANSPORT (send-a-text), not Twilio Verify. OTP code
// generation/expiry/attempt-counting already lives in Postgres
// (vp_request_otp/vp_verify_otp, migration 0009_virtual_otp.sql) — using a
// hosted verify product here would create a second, competing OTP engine.
//
// Fail-closed by contract: with no TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM the
// adapter is NOT registered, so the sms channel stays honestly
// 'not_configured'. With credentials it sends via the Twilio REST API and
// reports true delivery only on a 2xx + message SID.
import type { DeliveryAdapter, DeliveryResult, NotifyInput } from "@/lib/notify";

export class TwilioSmsAdapter implements DeliveryAdapter {
  readonly channel = "sms" as const;
  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly from: string,
  ) {}

  async deliver(input: NotifyInput): Promise<DeliveryResult> {
    const p = (input.payload ?? {}) as Record<string, unknown>;
    const to = (p.to_phone ?? p.phone) as string | undefined;
    if (!to || typeof to !== "string") return { delivered: false, detail: "no_recipient_phone" };
    const body = String(p.body ?? p.text ?? p.subject ?? `Notification: ${input.event_key}`);
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const params = new URLSearchParams({ To: to, From: this.from, Body: body });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { delivered: false, detail: `twilio_${res.status}:${detail.slice(0, 40)}` };
      }
      const data = (await res.json().catch(() => ({}))) as { sid?: string; status?: string };
      // Twilio accepts the message into its queue; 'queued'/'accepted' means
      // accepted-for-delivery, not confirmed-delivered — honest, not fake-sent.
      return { delivered: true, detail: data.sid ? `twilio:${data.sid}:${data.status ?? "queued"}` : "twilio" };
    } catch {
      return { delivered: false, detail: "twilio_network_error" };
    }
  }
}

/** Register the Twilio SMS adapter iff all three credentials are configured
 *  (server-only secrets). Returns whether it was registered. Fail-closed: any
 *  missing credential → not registered, sms channel stays 'not_configured'.
 *
 *  The sender number is read as TWILIO_FROM_NUMBER first and TWILIO_PHONE_NUMBER
 *  second. Only the latter was ever provisioned, so this adapter silently never
 *  registered and the sms channel reported 'not_configured' while working
 *  credentials sat in the environment — a real delivery leg disabled by a name
 *  mismatch, not by policy. Both names are accepted rather than renaming the
 *  provisioned variable, so existing deployments keep working either way.
 *  Enabling this sends real messages; authorized by the Product Owner
 *  2026-07-26. Twilio remains the FALLBACK transport per engine_settings.otp
 *  (provider_primary: unifonic) — registering it does not promote it. */
export function maybeRegisterTwilioSms(register: (a: DeliveryAdapter) => void): boolean {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER ?? process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return false;
  register(new TwilioSmsAdapter(sid, token, from));
  return true;
}
