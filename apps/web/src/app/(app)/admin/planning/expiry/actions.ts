"use server";
// M9 / PLN-CON-013 — governed writes over planning_expiry_rules for actors
// with planning.configure_expiry. RLS (planning_expiry_rules_write via
// f360_has_planning_capability) remains the authority; this layer re-checks
// the capability and validates shape. Every write is audited by
// trg_audit_planning_expiry_rules (20260721030100).
//
// Invariants enforced here:
//   • single enabled version per rule_type — enabling one version first
//     disables its siblings (and reports honestly if that step fails);
//   • new versions are created DISABLED — the admin enables one explicitly,
//     which retires the previously enabled version;
//   • scope is a guided exact-match object (visit_type / execution_mode /
//     priority), never free JSON.
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { RULE_TYPES, type ExpiryScope } from "./types";

export type ExpiryResult = { ok?: string; error?: string };

async function gate(sb: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return "Your session has ended. Sign in again.";
  const { data: allowed, error } = await sb.rpc("has_planning_capability", { p_capability: "planning.configure_expiry" });
  if (error) {
    logProviderError("expiry gate", error);
    return NEUTRAL_WRITE_ERROR;
  }
  if (allowed !== true) return "You do not have permission to configure planning expiry rules (planning.configure_expiry required).";
  return null;
}

function parseScope(fd: FormData): { scope?: ExpiryScope; error?: string } {
  const scope: ExpiryScope = {};
  const visitType = String(fd.get("scope_visit_type") ?? "any").trim();
  const executionMode = String(fd.get("scope_execution_mode") ?? "any").trim();
  const priority = String(fd.get("scope_priority") ?? "any").trim();
  if (visitType !== "any") {
    if (!["periodic", "follow_up", "complaint"].includes(visitType)) {
      return { error: "Invalid visit type scope. Nothing was changed." };
    }
    scope.visit_type = visitType as ExpiryScope["visit_type"];
  }
  if (executionMode !== "any") {
    if (!["physical", "virtual", "administrative"].includes(executionMode)) {
      return { error: "Invalid execution mode scope. Nothing was changed." };
    }
    scope.execution_mode = executionMode as ExpiryScope["execution_mode"];
  }
  if (priority !== "any") {
    if (!["low", "medium", "high", "urgent"].includes(priority)) {
      return { error: "Invalid priority scope. Nothing was changed." };
    }
    scope.priority = priority as ExpiryScope["priority"];
  }
  return { scope };
}

function parseRuleFields(fd: FormData): {
  fields?: {
    offset_minutes: number;
    reason: string;
    notify_plan_creator: boolean;
    notify_inspector: boolean;
    scope: ExpiryScope;
  };
  error?: string;
} {
  const offsetMinutes = Number(String(fd.get("offset_minutes") ?? "0").trim());
  if (!Number.isInteger(offsetMinutes) || offsetMinutes < 0 || offsetMinutes > 525600) {
    return { error: "Offset must be a whole number of minutes between 0 and 525600. Nothing was changed." };
  }
  const reason = String(fd.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required — it is recorded in the audit trail. Nothing was changed." };
  if (reason.length > 500) return { error: "The reason must be 500 characters or fewer. Nothing was changed." };
  const parsed = parseScope(fd);
  if (parsed.error) return { error: parsed.error };
  return {
    fields: {
      offset_minutes: offsetMinutes,
      reason,
      notify_plan_creator: fd.get("notify_plan_creator") === "1",
      notify_inspector: fd.get("notify_inspector") === "1",
      scope: parsed.scope ?? {},
    },
  };
}

export async function setRuleEnabled(fd: FormData): Promise<ExpiryResult> {
  const sb = await supabaseServer();
  const denied = await gate(sb);
  if (denied) return { error: denied };

  const ruleId = String(fd.get("rule_id") ?? "").trim();
  const ruleType = String(fd.get("rule_type") ?? "").trim();
  const enable = String(fd.get("enable") ?? "") === "1";
  if (!ruleId || !ruleType) return { error: "Missing rule. Nothing was changed." };

  if (enable) {
    // Single enabled version per rule type: retire every other version first.
    const { error: disableError } = await sb
      .from("planning_expiry_rules")
      .update({ enabled: false })
      .eq("rule_type", ruleType)
      .neq("id", ruleId);
    if (disableError) {
      logProviderError("expiry single-enable", disableError);
      return { error: "Could not retire the other versions of this rule type, so this version was left disabled. Nothing was changed — try again." };
    }
  }

  const { data, error } = await sb
    .from("planning_expiry_rules")
    .update({ enabled: enable })
    .eq("id", ruleId)
    .select("rule_type, version");
  if (error) {
    logProviderError("expiry enable toggle", error);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  if (!data?.length) return { error: "That rule no longer exists or RLS denied the update. Nothing was changed." };
  revalidatePath("/admin/planning/expiry");
  const { rule_type, version } = data[0] as { rule_type: string; version: number };
  return {
    ok: enable
      ? `“${rule_type}” v${version} enabled — every other version of this rule type is now retired. Audited; the next 15-minute sweep uses it.`
      : `“${rule_type}” v${version} disabled — this rule type currently has NO enabled version until you enable one. Audited.`,
  };
}

export async function updateRule(fd: FormData): Promise<ExpiryResult> {
  const sb = await supabaseServer();
  const denied = await gate(sb);
  if (denied) return { error: denied };

  const id = String(fd.get("rule_id") ?? "").trim();
  if (!id) return { error: "Missing rule. Nothing was changed." };
  const parsed = parseRuleFields(fd);
  if (parsed.error || !parsed.fields) return { error: parsed.error ?? NEUTRAL_WRITE_ERROR };

  const { data, error } = await sb
    .from("planning_expiry_rules")
    .update({
      offset_minutes: parsed.fields.offset_minutes,
      reason: parsed.fields.reason,
      notify_plan_creator: parsed.fields.notify_plan_creator,
      notify_inspector: parsed.fields.notify_inspector,
      scope: parsed.fields.scope,
    })
    .eq("id", id)
    .select("rule_type, version");
  if (error) {
    logProviderError("expiry update", error);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  if (!data?.length) return { error: "That rule no longer exists or RLS denied the update. Nothing was changed." };
  revalidatePath("/admin/planning/expiry");
  const { rule_type, version } = data[0] as { rule_type: string; version: number };
  return { ok: `“${rule_type}” v${version} updated — audited; the next 15-minute sweep uses the new values.` };
}

export async function createRuleVersion(fd: FormData): Promise<ExpiryResult> {
  const sb = await supabaseServer();
  const denied = await gate(sb);
  if (denied) return { error: denied };

  const ruleType = String(fd.get("rule_type") ?? "").trim();
  if (!(RULE_TYPES as readonly string[]).includes(ruleType)) {
    return { error: "Unknown rule type. Nothing was changed." };
  }
  const parsed = parseRuleFields(fd);
  if (parsed.error || !parsed.fields) return { error: parsed.error ?? NEUTRAL_WRITE_ERROR };

  const { data: existing, error: readError } = await sb
    .from("planning_expiry_rules")
    .select("version")
    .eq("rule_type", ruleType)
    .order("version", { ascending: false })
    .limit(1);
  if (readError) {
    logProviderError("expiry version read", readError);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  const nextVersion = ((existing?.[0] as { version: number } | undefined)?.version ?? 0) + 1;

  // Created DISABLED: the admin enables a version explicitly, which retires
  // the previously enabled one (single enabled per rule type).
  const { error } = await sb.from("planning_expiry_rules").insert({
    rule_type: ruleType,
    enabled: false,
    scope: parsed.fields.scope,
    offset_minutes: parsed.fields.offset_minutes,
    reason: parsed.fields.reason,
    notify_plan_creator: parsed.fields.notify_plan_creator,
    notify_inspector: parsed.fields.notify_inspector,
    version: nextVersion,
    effective_from: new Date().toISOString(),
  });
  if (error) {
    if (error.code === "23505") {
      return { error: `Version ${nextVersion} of “${ruleType}” already exists. Refresh and try again. Nothing was changed.` };
    }
    logProviderError("expiry create version", error);
    return { error: NEUTRAL_WRITE_ERROR };
  }
  revalidatePath("/admin/planning/expiry");
  return { ok: `“${ruleType}” v${nextVersion} created DISABLED — the currently enabled version is untouched. Enable the new version explicitly when ready. Audited.` };
}
