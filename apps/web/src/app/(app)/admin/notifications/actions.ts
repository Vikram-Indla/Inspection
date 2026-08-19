"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { insertNotification } from "@/lib/notify";

export type NotifRuleResult = { error?: string; ok?: boolean; notice?: string };

export async function createNotificationRule(_: NotifRuleResult, formData: FormData): Promise<NotifRuleResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "expired" };

  const event_key = String(formData.get("event_key") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const recipient_role = String(formData.get("recipient_role") ?? "").trim();
  const template = String(formData.get("template") ?? "").trim();
  const slaRaw = String(formData.get("sla_minutes") ?? "").trim();
  const escalation_role = String(formData.get("escalation_role") ?? "").trim();
  if (!event_key || !channel || !recipient_role || !template) return { error: "required" };
  const sla_minutes = slaRaw ? Number(slaRaw) : null;
  if (slaRaw && (!Number.isFinite(sla_minutes) || (sla_minutes as number) <= 0)) return { error: "bad_sla" };
  if ((sla_minutes != null) !== !!escalation_role) return { error: "sla_pair" };

  const { error } = await sb.from("notification_rules").insert({
    event_key, channel, recipient_role, template,
    sla_minutes, escalation_role: escalation_role || null,
    status: "draft", created_by: user.id,
  });
  if (error) {
    logProviderError("admin notification rule create", error);
    if (error.code === "23505") return { error: "duplicate" };
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function publishNotificationRule(_: NotifRuleResult, formData: FormData): Promise<NotifRuleResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "expired" };
  const id = String(formData.get("rule_id") ?? "");
  if (!id) return { error: "missing_ref" };
  const { error } = await sb.rpc("publish_notification_rule", { p_id: id });
  if (error) {
    logProviderError("admin notification rule publish", error);
    const message = String(error.message ?? "");
    if (message.includes("maker-checker")) return { error: "maker_checker" };
    if (message.includes("missing recipient")) return { error: "missing_recipient" };
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function deactivateNotificationRule(_: NotifRuleResult, formData: FormData): Promise<NotifRuleResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "expired" };
  const id = String(formData.get("rule_id") ?? "");
  const reason = String(formData.get("deactivation_reason") ?? "").trim();
  if (!id) return { error: "missing_ref" };
  if (!reason) return { error: "missing_reason" };
  const { error } = await sb.rpc("deactivate_notification_rule", { p_id: id, p_reason: reason });
  if (error) { logProviderError("admin notification rule deactivate", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function testNotificationRule(_: NotifRuleResult, formData: FormData): Promise<NotifRuleResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "expired" };
  const id = String(formData.get("rule_id") ?? "");
  if (!id) return { error: "missing_ref" };
  const { data: rule, error: ruleError } = await sb.from("notification_rules")
    .select("event_key, channel, template").eq("id", id).maybeSingle();
  if (ruleError) { logProviderError("admin notification rule test read", ruleError); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!rule) return { error: "not_found" };
  const outcome = await insertNotification(sb, {
    event_key: rule.event_key, recipient: user.id, channel: rule.channel as "inapp" | "push" | "sms" | "email",
    payload: { test: true, template: rule.template, triggered_by: user.id, to_email: user.email, subject: `MIM test — ${rule.event_key}` },
  });
  if (outcome.error) return { error: outcome.error };
  revalidatePath("/admin/notifications");
  return {
    ok: true,
    notice: outcome.delivery_state === "not_configured" ? "notice_not_configured" : "notice_delivered",
  };
}
