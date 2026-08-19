import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError } from "@/lib/neutral-error";
import { RULE_TYPES, type ExpiryRuleRow, type ExpiryScope } from "@/app/(app)/admin/planning/expiry/types";

const COLUMNS = "id, rule_type, enabled, scope, offset_minutes, reason, notify_plan_creator, notify_inspector, version, effective_from, effective_to";

const VISIT_TYPES = ["periodic", "follow_up", "complaint"] as const;
const EXECUTION_MODES = ["physical", "virtual", "administrative"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type ExpiryRuleGroup = {
  ruleType: string;
  versions: readonly ExpiryRuleRow[];
  live: ExpiryRuleRow | null;
};

export type PlanningExpiryData = {
  groups: readonly ExpiryRuleGroup[];
  canConfigure: boolean;
  readFailed: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" ? allowed.find(option => option === value) : undefined;
}

function toScope(value: unknown): ExpiryScope | null {
  if (!isRecord(value)) return null;
  const scope: ExpiryScope = {
    visit_type: pick(value.visit_type, VISIT_TYPES),
    execution_mode: pick(value.execution_mode, EXECUTION_MODES),
    priority: pick(value.priority, PRIORITIES),
  };
  return scope;
}

function toRow(value: unknown): ExpiryRuleRow | null {
  if (!isRecord(value)) return null;
  const { id, rule_type, version, effective_from, effective_to, offset_minutes, reason } = value;
  if (typeof id !== "string" || typeof rule_type !== "string") return null;
  if (typeof version !== "number" || typeof effective_from !== "string") return null;
  return {
    id,
    rule_type,
    enabled: value.enabled === true,
    scope: toScope(value.scope),
    offset_minutes: typeof offset_minutes === "number" ? offset_minutes : 0,
    reason: typeof reason === "string" ? reason : "",
    notify_plan_creator: value.notify_plan_creator === true,
    notify_inspector: value.notify_inspector === true,
    version,
    effective_from,
    effective_to: typeof effective_to === "string" ? effective_to : null,
  };
}

function group(rows: readonly ExpiryRuleRow[]): readonly ExpiryRuleGroup[] {
  return RULE_TYPES.map(ruleType => {
    const versions = rows
      .filter(row => row.rule_type === ruleType)
      .sort((a, b) => b.version - a.version);
    return { ruleType, versions, live: versions.find(row => row.enabled) ?? null };
  });
}

export async function loadPlanningExpiry(): Promise<PlanningExpiryData> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  const gate = user
    ? await sb.rpc("has_planning_capability", { p_capability: "planning.configure_expiry" })
    : { data: false, error: null };
  if (gate.error) logProviderError("admin planning expiry gate", gate.error);

  const { data, error } = await sb
    .from("planning_expiry_rules")
    .select(COLUMNS)
    .order("rule_type")
    .order("version", { ascending: false });
  if (error) logProviderError("admin planning expiry read", error);

  const rows = (data ?? [])
    .map(toRow)
    .filter((row): row is ExpiryRuleRow => row !== null);

  return {
    groups: group(rows),
    canConfigure: gate.data === true,
    readFailed: Boolean(error),
  };
}
