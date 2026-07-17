// Notification delivery (ENG-11 · REF-014) — single insert path + adapter
// registry. The notifications row is the source of truth; delivery_state is
// never claimed without a registered adapter actually delivering:
//   inapp          → the row itself IS the delivery (bell/inboxes read it),
//                    so it is 'delivered' the moment it lands.
//   push/sms/email → no provider is configured in this environment (contract
//                    DEC: provider adapters land at release), so rows are
//                    stored honestly as 'not_configured' — never fake-sent.
// RLS is the authority: notif_insert_authed (0018) gates writes; notif_own
// (0002) scopes reads to the recipient; notif_update_recipient (0015) scopes
// read receipts.
import type { SupabaseClient } from "@supabase/supabase-js";
import { NEUTRAL_WRITE_ERROR } from "./neutral-error";

export type NotifyChannel = "inapp" | "push" | "sms" | "email";

export type NotifyInput = {
  event_key: string;                       // REF-014 event catalogue key
  recipient: string | null;                // profiles.user_id; null = external party (payload carries identity)
  payload: Record<string, unknown>;
  channel?: NotifyChannel;                 // default 'inapp'
};

export type DeliveryResult = { delivered: boolean; detail?: string };

export interface DeliveryAdapter {
  channel: NotifyChannel;
  deliver(input: NotifyInput): Promise<DeliveryResult>;
}

const registry = new Map<NotifyChannel, DeliveryAdapter>();

/** Release integration point: register a real provider (Unifonic SMS, APNs push, SMTP). */
export function registerAdapter(adapter: DeliveryAdapter): void {
  registry.set(adapter.channel, adapter);
}

export function configuredChannels(): NotifyChannel[] {
  return Array.from(registry.keys());
}

// In-app is always configured: persistence of the row is the delivery.
registerAdapter({ channel: "inapp", deliver: async () => ({ delivered: true }) });

// Release provider integration — register the Resend email adapter when
// RESEND_API_KEY is configured (server-only). Fail-closed: no key → email stays
// 'not_configured'. Import is side-effect-free on the client (no server env).
import { maybeRegisterResendEmail } from "./providers/email-resend";
maybeRegisterResendEmail(registerAdapter);

export type NotifyOutcome = { error?: string; delivery_state?: string };

/**
 * Single insert path for every caller (server actions and client flows share it).
 * Never throws; the caller decides whether a failed notification blocks its flow
 * (it usually must not — the primary write already succeeded).
 */
const PREF_COLUMN: Partial<Record<NotifyChannel, string>> = { push: "push_enabled", sms: "sms_enabled", email: "email_enabled" };

export async function insertNotification(sb: SupabaseClient, input: NotifyInput): Promise<NotifyOutcome> {
  const channel: NotifyChannel = input.channel ?? "inapp";
  // DEF-PRF-003 — inapp is never opt-outable (it IS the bell/inbox); push/sms/
  // email honor the recipient's own preference row. No row = default enabled.
  const prefColumn = PREF_COLUMN[channel];
  if (prefColumn && input.recipient) {
    const { data: pref } = await sb.from("notification_preferences")
      .select("push_enabled, sms_enabled, email_enabled").eq("user_id", input.recipient).maybeSingle();
    if (pref && (pref as unknown as Record<string, boolean>)[prefColumn] === false) {
      const { error } = await sb.from("notifications").insert({
        event_key: input.event_key, recipient: input.recipient, payload: input.payload,
        channel, delivery_state: "suppressed_by_preference", delivered_at: null,
      });
      if (error) { console.error("[notification insert]", error); return { error: NEUTRAL_WRITE_ERROR }; }
      return { delivery_state: "suppressed_by_preference" };
    }
  }
  const adapter = registry.get(channel);
  let delivery_state = "not_configured";   // honest default — no adapter, no claim
  let delivered_at: string | null = null;
  if (adapter) {
    try {
      const r = await adapter.deliver(input);
      if (r.delivered) { delivery_state = "delivered"; delivered_at = new Date().toISOString(); }
      else delivery_state = `failed:${(r.detail ?? "unknown").slice(0, 60)}`;
    } catch (e) {
      console.error(`[notification ${channel} adapter]`, e);
      delivery_state = "failed";
    }
  }
  // SCR-ADM-080 / DEF-ADM-080 — when a governed rule is published for this
  // event+channel, stamp the delivered row with which rule/version handled it
  // (runtime consumption + audit proof; a rule-less send is unaffected).
  const { data: rule } = await sb.from("notification_rules")
    .select("id, version_label").eq("event_key", input.event_key).eq("channel", channel)
    .eq("status", "published").maybeSingle();
  const { error } = await sb.from("notifications").insert({
    event_key: input.event_key,
    recipient: input.recipient,
    payload: input.payload,
    channel,
    delivery_state,
    delivered_at,
    notification_rule_id: rule?.id ?? null,
    rule_version_label: rule?.version_label ?? null,
  });
  if (error) {
    console.error("[notification insert]", error);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  return { delivery_state };
}
