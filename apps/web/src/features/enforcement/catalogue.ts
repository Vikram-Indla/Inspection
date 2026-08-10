import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { readRows } from "@/lib/postgrest/read";
import type { Shape } from "@/lib/postgrest/shape";

export const CATALOGUE_MODES = ["catalogue", "penalty"] as const;
export type CatalogueMode = (typeof CATALOGUE_MODES)[number];

export type PenaltyMapping = {
  id: string;
  penalty_ref: string;
  mapping_version: string;
  legal_basis: string | null;
  status: string;
  effective_from: string | null;
  effective_to: string | null;
  penalty_type: string | null;
  amount: number | null;
  grace_period_days: number | null;
  due_period_days: number | null;
};

export type CatalogueCode = {
  id: string;
  code: string;
  title: string;
  level: string;
  status: string;
  corrective_action: string | null;
  grace_period_days: number | null;
  category: string | null;
  applicability: string | null;
  configuration_version: number;
  deactivation_reason: string | null;
  active_from: string | null;
  active_to: string | null;
  regulation_clauses: { clause_ref: string; regulations: { code: string } | null } | null;
  penalty_mappings: PenaltyMapping[] | null;
};

export type TriggerTrace = { readonly code: string; readonly title: string };

export type ViolationCatalogue = {
  readonly codes: readonly CatalogueCode[];
  readonly triggersByCode: ReadonlyMap<string, readonly TriggerTrace[]>;
  readonly catalogueReadable: boolean;
  readonly triggersReadable: boolean;
  readonly isWriter: boolean;
};

const WRITER_ROLES = ["admin", "compliance_admin", "form_admin"];

const CODE_SELECT =
  "id,code,title,level,status,corrective_action,grace_period_days,category,applicability,configuration_version,deactivation_reason,active_from,active_to,regulation_clauses(clause_ref,regulations(code)),penalty_mappings(id,penalty_ref,mapping_version,legal_basis,status,effective_from,effective_to,penalty_type,amount,grace_period_days,due_period_days)";

type ItemTrace = { code: string; title: string; response_model: unknown };

const penaltyMappingRow: Shape<PenaltyMapping> = f => ({
  id: f.text("id"),
  penalty_ref: f.text("penalty_ref"),
  mapping_version: f.text("mapping_version"),
  legal_basis: f.optionalText("legal_basis"),
  status: f.text("status"),
  effective_from: f.optionalText("effective_from"),
  effective_to: f.optionalText("effective_to"),
  penalty_type: f.optionalText("penalty_type"),
  amount: f.optionalNumber("amount"),
  grace_period_days: f.optionalNumber("grace_period_days"),
  due_period_days: f.optionalNumber("due_period_days"),
});

const catalogueCodeRow: Shape<CatalogueCode> = f => ({
  id: f.text("id"),
  code: f.text("code"),
  title: f.text("title"),
  level: f.text("level"),
  status: f.text("status"),
  corrective_action: f.optionalText("corrective_action"),
  grace_period_days: f.optionalNumber("grace_period_days"),
  category: f.optionalText("category"),
  applicability: f.optionalText("applicability"),
  configuration_version: f.number("configuration_version"),
  deactivation_reason: f.optionalText("deactivation_reason"),
  active_from: f.optionalText("active_from"),
  active_to: f.optionalText("active_to"),
  regulation_clauses: f.toOne("regulation_clauses", clause => ({
    clause_ref: clause.text("clause_ref"),
    regulations: clause.toOne("regulations", regulation => ({ code: regulation.text("code") })),
  })),
  penalty_mappings: f.optionalToMany("penalty_mappings", penaltyMappingRow),
});

const itemTraceRow: Shape<ItemTrace> = f => ({
  code: f.text("code"),
  title: f.text("title"),
  response_model: f.raw("response_model"),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Which inspection items raise each violation code.
 *
 * The link lives in `response_model.mapping.<response>.violation`, so it is
 * read from the item side and inverted here — there is no foreign key to join.
 */
function invertTriggers(items: readonly ItemTrace[]): Map<string, TriggerTrace[]> {
  const byCode = new Map<string, TriggerTrace[]>();
  for (const item of items) {
    const model = item.response_model;
    const mapping = isRecord(model) && isRecord(model.mapping) ? model.mapping : null;
    if (!mapping) continue;
    for (const outcome of Object.values(mapping)) {
      const code = isRecord(outcome) && typeof outcome.violation === "string" ? outcome.violation : null;
      if (!code) continue;
      const traces = byCode.get(code) ?? [];
      if (!traces.some(trace => trace.code === item.code)) traces.push({ code: item.code, title: item.title });
      byCode.set(code, traces);
    }
  }
  return byCode;
}

export async function queryViolationCatalogue(): Promise<ViolationCatalogue> {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();

  const [codeRead, itemRead, roleRead] = await Promise.all([
    sb.from("violation_codes").select(CODE_SELECT).order("code"),
    sb.from("inspection_items").select("code,title,response_model").order("code"),
    user
      ? sb.from("user_roles").select("role_key").eq("user_id", user.id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const codes = readRows(codeRead, catalogueCodeRow, "enforcement.violation_codes");
  const items = readRows(itemRead, itemTraceRow, "enforcement.inspection_items");
  const roles = new Set((roleRead.data ?? []).map(row => row.role_key));

  return {
    codes: codes.rows,
    triggersByCode: invertTriggers(items.rows),
    catalogueReadable: !codes.failed,
    triggersReadable: !items.failed,
    isWriter: WRITER_ROLES.some(role => roles.has(role)),
  };
}

export type Lifecycle = "active" | "future" | "deactivated";

/**
 * Lifecycle is **derived from the recorded dates**, never read from a status
 * enum — the screen states the derivation beside the result so the reader can
 * check it.
 */
export function deriveLifecycle(activeFrom: string | null, activeTo: string | null, today: string): Lifecycle {
  if (activeTo && activeTo < today) return "deactivated";
  if (activeFrom && activeFrom > today) return "future";
  return "active";
}

export const lifecycleTone = (kind: Lifecycle): StatusTone =>
  kind === "active" ? "success" : kind === "future" ? "info" : "warning";

export const severityTone = (level: string): StatusTone =>
  level === "L1" ? "danger" : level === "L2" ? "warning" : level === "L3" ? "info" : "neutral";

export type MappingState = "active" | "draft" | "none";

export function mappingStateOf(mappings: readonly PenaltyMapping[] | null): MappingState {
  const rows = mappings ?? [];
  if (rows.some(mapping => mapping.status === "published" || mapping.status === "locked")) return "active";
  if (rows.some(mapping => mapping.status === "draft")) return "draft";
  return "none";
}

export function primaryMapping(mappings: readonly PenaltyMapping[] | null): PenaltyMapping | null {
  const rows = mappings ?? [];
  return rows.find(mapping => mapping.status === "draft")
    ?? rows.find(mapping => mapping.status === "published" || mapping.status === "locked")
    ?? rows[0]
    ?? null;
}

export const versionsOf = (codes: readonly CatalogueCode[], code: string): readonly CatalogueCode[] =>
  codes.filter(candidate => candidate.code === code)
    .sort((a, b) => a.configuration_version - b.configuration_version);
