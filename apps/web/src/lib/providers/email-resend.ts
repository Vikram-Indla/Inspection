// Email delivery provider — Resend adapter for the notify.ts DeliveryAdapter
// registry. TASK-MVP2-M2-02 notification delivery · release provider integration.
//
// Fail-closed by contract: with no RESEND_API_KEY the adapter is NOT registered,
// so the email channel stays honestly 'not_configured' (never a fake "sent").
// With a key it sends through Resend and reports true delivery only on a 2xx +
// message id. The recipient address comes from the notification payload
// (to_email / email); without one it returns an honest no_recipient_email.
import type { DeliveryAdapter, DeliveryResult, NotifyInput } from "@/lib/notify";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export class ResendEmailAdapter implements DeliveryAdapter {
  readonly channel = "email" as const;
  constructor(private readonly apiKey: string, private readonly from: string) {}

  async deliver(input: NotifyInput): Promise<DeliveryResult> {
    const p = (input.payload ?? {}) as Record<string, unknown>;
    const to = (p.to_email ?? p.email) as string | undefined;
    if (!to || typeof to !== "string") return { delivered: false, detail: "no_recipient_email" };
    const subject = String(p.subject ?? p.template ?? `Notification: ${input.event_key}`);
    const html = String(p.html ?? p.body ?? `<p>${subject}</p>`);
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: this.from, to, subject, html }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return { delivered: false, detail: `resend_${res.status}:${detail.slice(0, 40)}` };
      }
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      return { delivered: true, detail: data.id ? `resend:${data.id}` : "resend" };
    } catch {
      return { delivered: false, detail: "resend_network_error" };
    }
  }
}

/** Register the Resend email adapter iff RESEND_API_KEY is configured (server-only
 *  secret). Returns whether it was registered. Fail-closed: no key → not registered. */
export function maybeRegisterResendEmail(register: (a: DeliveryAdapter) => void): boolean {
  // The project-scoped key is named RESEND_API_KEY_INSPECTION in the deployed
  // environments; accept either so a correctly-provisioned environment does not
  // silently fall through to "email not configured".
  const key = process.env.RESEND_API_KEY_INSPECTION || process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";
  register(new ResendEmailAdapter(key, from));
  return true;
}
