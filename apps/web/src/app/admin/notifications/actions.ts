"use server";
// SCR-ADM-080 / DEF-ADM-080 — Notification & SLA Rules (Cycle 2 Wave 0). Governed
// maker-checker configuration for the existing notify.ts delivery service
// (event, channel, recipient role, template, SLA timer, escalation role).
// RLS (notification_rules_admin) is the authority; publish_notification_rule /
// deactivate_notification_rule are SECURITY DEFINER RPCs that enforce
// maker-checker (a distinct approver) and immutability of published rows.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { insertNotification } from "@/lib/notify";

export type NotifRuleResult = { error?: string; ok?: boolean; notice?: string };

export async function createNotificationRule(_: NotifRuleResult, formData: FormData): Promise<NotifRuleResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const event_key = String(formData.get("event_key") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const recipient_role = String(formData.get("recipient_role") ?? "").trim();
  const template = String(formData.get("template") ?? "").trim();
  const slaRaw = String(formData.get("sla_minutes") ?? "").trim();
  const escalation_role = String(formData.get("escalation_role") ?? "").trim();
  if (!event_key || !channel || !recipient_role || !template)
    return { error: "Event, channel, recipient role and template are required." };
  const sla_minutes = slaRaw ? Number(slaRaw) : null;
  if (slaRaw && (!Number.isFinite(sla_minutes) || (sla_minutes as number) <= 0))
    return { error: "SLA timer must be a positive number of minutes." };
  if ((sla_minutes != null) !== !!escalation_role)
    return { error: "An SLA timer requires an escalation role, and vice versa." };

  const { error } = await sb.from("notification_rules").insert({
    event_key, channel, recipient_role, template,
    sla_minutes, escalation_role: escalation_role || null,
    status: "draft", created_by: user.id,
  });
  if (error) {
    logProviderError("admin notification rule create", error);
    if (error.code === "23505") return { error: "A draft or published rule already exists for this event + channel." };
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function publishNotificationRule(_: NotifRuleResult, formData: FormData): Promise<NotifRuleResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(formData.get("rule_id") ?? "");
  if (!id) return { error: "Missing rule reference." };
  const { error } = await sb.rpc("publish_notification_rule", { p_id: id });
  if (error) {
    logProviderError("admin notification rule publish", error);
    const message = String(error.message ?? "");
    if (message.includes("maker-checker")) return { error: "A different configuration writer must approve this draft." };
    if (message.includes("missing recipient")) return { error: "Missing recipient — recipient role is not governed." };
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function deactivateNotificationRule(_: NotifRuleResult, formData: FormData): Promise<NotifRuleResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(formData.get("rule_id") ?? "");
  const reason = String(formData.get("deactivation_reason") ?? "").trim();
  if (!id) return { error: "Missing rule reference." };
  if (!reason) return { error: "A deactivation reason is required." };
  const { error } = await sb.rpc("deactivate_notification_rule", { p_id: id, p_reason: reason });
  if (error) { logProviderError("admin notification rule deactivate", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/notifications");
  return { ok: true };
}

// "Test" primary action (screen contract) — sends a real notification through
// the same insertNotification() runtime path, addressed only to the tester,
// clearly flagged as a test in the payload. inapp/push/sms/email honesty rules
// are unchanged: a channel with no registered adapter still reports
// not_configured rather than a fake "sent".
export async function testNotificationRule(_: NotifRuleResult, formData: FormData): Promise<NotifRuleResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(formData.get("rule_id") ?? "");
  if (!id) return { error: "Missing rule reference." };
  const { data: rule, error: ruleError } = await sb.from("notification_rules")
    .select("event_key, channel, template").eq("id", id).maybeSingle();
  if (ruleError) { logProviderError("admin notification rule test read", ruleError); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!rule) return { error: "Rule not found, or outside your scope (RLS)." };
  const outcome = await insertNotification(sb, {
    event_key: rule.event_key, recipient: user.id, channel: rule.channel as "inapp" | "push" | "sms" | "email",
    payload: { test: true, template: rule.template, triggered_by: user.id },
  });
  if (outcome.error) return { error: outcome.error };
  revalidatePath("/admin/notifications");
  return {
    ok: true,
    notice: outcome.delivery_state === "not_configured"
      ? "Provider unavailable — recorded as a test row only; no live provider is configured for this channel."
      : "Test notification delivered.",
  };
}
