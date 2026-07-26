// Push delivery provider — Web Push (VAPID) adapter for the notify.ts
// DeliveryAdapter registry. TASK-MVP2-M2-02 notification delivery.
//
// Free, no vendor account: VAPID is a self-issued keypair (RFC 8292), not a
// third-party credential. Requires the recipient's browser to have
// subscribed (Notification permission granted + PushSubscription registered —
// see PushOptIn.tsx). The responsive application does not install or globally
// register an app-shell worker. Browsers that require a Home Screen web app for
// push apply that platform rule; SAQEEL does not advertise a separate PWA.
//
// Fail-closed by contract: with no VAPID keys the adapter is NOT registered,
// so the push channel stays honestly 'not_configured'. With keys configured,
// 'delivered' means the push service (Apple/Google/Mozilla) ACCEPTED the
// message for delivery to the device — not that the user saw it (same honesty
// tier as 'queued' for SMS/email; push delivery to a sleeping device can be
// deferred by the OS).
import webpush from "web-push";
import type { DeliveryAdapter, DeliveryResult, NotifyInput } from "@/lib/notify";
import type { SupabaseClient } from "@supabase/supabase-js";

export class WebPushAdapter implements DeliveryAdapter {
  readonly channel = "push" as const;
  constructor(publicKey: string, privateKey: string, subject: string) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  // sb is the per-request authenticated client (the actor triggering this
  // notification) — the get_push_subscriptions_for_user RPC checks THEIR role,
  // not some ambient service-role identity (this repo has no service-role client).
  async deliver(input: NotifyInput, sb: SupabaseClient): Promise<DeliveryResult> {
    if (!input.recipient) return { delivered: false, detail: "no_recipient_user" };
    const { data: subs, error } = await sb.rpc("get_push_subscriptions_for_user", { p_user_id: input.recipient });
    if (error) return { delivered: false, detail: `subscription_lookup_error:${error.code ?? "unknown"}` };
    const rows = (subs ?? []) as { endpoint: string; p256dh: string; auth: string }[];
    if (rows.length === 0) return { delivered: false, detail: "no_push_subscription" };

    const p = (input.payload ?? {}) as Record<string, unknown>;
    const title = String(p.title ?? p.subject ?? "MIM Inspection");
    const body = String(p.body ?? p.text ?? `Notification: ${input.event_key}`);
    const payload = JSON.stringify({ title, body, event_key: input.event_key });

    let anyDelivered = false;
    const details: string[] = [];
    for (const row of rows) {
      try {
        const res = await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payload,
        );
        anyDelivered = true;
        details.push(`webpush:${res.statusCode}`);
      } catch (e) {
        const err = e as { statusCode?: number };
        details.push(`webpush_failed:${err.statusCode ?? "unknown"}`);
        // 404/410 = the subscription is gone (uninstalled/expired) — the
        // caller is responsible for pruning it; this adapter only reports.
      }
    }
    return anyDelivered
      ? { delivered: true, detail: details.join(",").slice(0, 120) }
      : { delivered: false, detail: details.join(",").slice(0, 120) || "all_subscriptions_failed" };
  }
}

/** Register the Web Push adapter iff VAPID keys are configured (server-only
 *  secrets). Returns whether it was registered. Fail-closed: missing key(s) →
 *  not registered, push channel stays 'not_configured'. */
export function maybeRegisterWebPush(register: (a: DeliveryAdapter) => void): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return false;
  register(new WebPushAdapter(pub, priv, subject));
  return true;
}
