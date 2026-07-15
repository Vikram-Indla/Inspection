"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_LOAD_ERROR, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { requireConfigurationWriter } from "@/lib/admin-configuration";

export type PkgResult = { error?: string; ok?: boolean };

// M09-013 — read-only publish-impact reader. Returns how many IN-FLIGHT visits
// and inspections are still pinned to PRIOR published versions of this package
// (they run on the frozen definition; a new publish never re-versions them).
// Backed by the SECURITY DEFINER aggregate RPC package_version_impact (0024) so
// the config-admin checker family reads COUNTS without row-level SELECT on the
// operational tables. Degrades to null if the RPC is unavailable or scoped out.
export type PinnedActiveImpact = {
  active_visits: number;
  active_inspections: number;
  prior_count: number;
  prior: { label: string; visits: number; inspections: number }[];
};

export async function getPinnedActiveImpact(versionId: string): Promise<PinnedActiveImpact | null> {
  if (!versionId) return null;
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc("package_version_impact", { p_version_id: versionId });
  if (error || !data || typeof data !== "object" || "error" in (data as object)) return null;
  const d = data as Record<string, unknown>;
  return {
    active_visits: Number(d.active_visits ?? 0),
    active_inspections: Number(d.active_inspections ?? 0),
    prior_count: Number(d.prior_count ?? 0),
    prior: Array.isArray(d.prior) ? (d.prior as PinnedActiveImpact["prior"]) : [],
  };
}

// M09-030 — new draft version clones the latest definition; published versions stay immutable.
export async function createDraftVersion(_: PkgResult, formData: FormData): Promise<PkgResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const userId = gate.userId;
  const sb = await supabaseServer();

  const package_id = String(formData.get("package_id") ?? "");
  const version_label = String(formData.get("version_label") ?? "").trim();
  const effective_from = String(formData.get("effective_from") ?? "").trim();
  if (!package_id || !version_label) return { error: "Version label is required." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effective_from)) return { error: "A valid effective-from date is required." };

  const { data: latest } = await sb.from("package_versions")
    .select("id, definition").eq("package_id", package_id)
    .order("published_at", { ascending: false, nullsFirst: false }).limit(1).single();

  const { error } = await sb.from("package_versions").insert({
    package_id, version_label, status: "draft",
    definition: latest?.definition ?? { sections: [], action_forms: [] },
    created_by: userId, effective_from, supersedes_id: latest?.id ?? null,
  });
  if (error) { logProviderError("admin package draft", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/packages");
  return { ok: true };
}

// M09-019/025 — draft definitions are editable; published versions are immutable
// (trg_guard_pkg). Save is rejected server-side unless status is still draft.
export async function saveDraftDefinition(_: PkgResult, formData: FormData): Promise<PkgResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();

  const version_id = String(formData.get("version_id") ?? "");
  let definition: unknown;
  try { definition = JSON.parse(String(formData.get("definition") ?? "")); }
  catch { return { error: "Definition payload was not valid JSON." }; }

  const { error, count } = await sb.from("package_versions")
    .update({ definition }, { count: "exact" })
    .eq("id", version_id).eq("status", "draft");
  if (error) { logProviderError("admin package definition", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "Only draft versions are editable (M09-030 — published is immutable)." };
  revalidatePath("/admin/packages");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// FIX WAVE F4 · M09-012/029 — publish-time dependency validation. Before the
// status flip, the draft definition is checked against the live item bank,
// violation codes, penalty mappings, evidence rules and its own action-form
// registry. Blockers are returned VERBATIM, joined by newlines; publish only
// proceeds with zero blockers. Maker-checker (RBAC-002) stays in the database.
// ---------------------------------------------------------------------------
type DefSection = { key?: string; title?: string; title_en?: string; title_ar?: string; items?: unknown; fields?: unknown; mandatory?: boolean };
type DefActionForm = { key?: string; title?: string; blocking?: boolean; template_version_id?: string; required?: boolean };
type ItemRule = {
  requirement?: "required" | "optional" | "conditional";
  conditional?: { visible_when?: string; mandatory_when_visible?: boolean };
  evidence_rule?: unknown;
  scoring_enabled?: boolean;
  score_weight?: number | null;
  response_mapping?: Record<string, { result?: string; violation?: string; action_form?: string }>;
};
type PkgDefinition = {
  sections?: unknown; action_forms?: unknown; item_rules?: Record<string, ItemRule>;
  template_refs?: string[]; item_snapshot?: unknown; violation_snapshot?: unknown;
  template_snapshot?: unknown;
};
type ItemBankRow = {
  code: string; active: boolean;
  regulation_clauses: { regulations: { status: string; effective_from: string | null } | { status: string; effective_from: string | null }[] | null } | { regulations: { status: string; effective_from: string | null }[] | null }[] | null;
  response_model: {
    mapping?: Record<string, { violation?: string; action_form?: string }>;
    requirement?: "required" | "optional" | "conditional";
    conditional?: { visible_when?: string; mandatory_when_visible?: boolean };
  } | null;
  evidence_rule: unknown;
};

function evidenceRuleBlockers(code: string, rule: unknown): string[] {
  if (rule === null || rule === undefined) return [];
  const out: string[] = [];
  if (typeof rule !== "object" || Array.isArray(rule)) {
    return [`Item ${code}: evidence rule is not an object (M09-029)`];
  }
  const r = rule as Record<string, unknown>;
  if (typeof r.on !== "string" || r.on.length === 0) out.push(`Item ${code}: evidence rule is missing its trigger "on" (M09-029)`);
  if (typeof r.type !== "string" || r.type.length === 0) out.push(`Item ${code}: evidence rule is missing its evidence "type" (M09-029)`);
  if (r.min !== undefined && typeof r.min !== "number") out.push(`Item ${code}: evidence rule "min" must be a number (M09-029)`);
  if (r.mandatory !== undefined && typeof r.mandatory !== "boolean") out.push(`Item ${code}: evidence rule "mandatory" must be boolean (M09-029)`);
  return out;
}

async function validateDefinition(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  definition: PkgDefinition,
): Promise<string[]> {
  const blockers: string[] = [];
  const sections = Array.isArray(definition?.sections) ? definition.sections as DefSection[] : null;
  if (!sections) return ["Definition has no sections array — nothing to publish (M09-029)"];

  const actionForms = Array.isArray(definition?.action_forms) ? definition.action_forms as DefActionForm[] : [];
  const formKeys = new Set<string>();
  const templateRefs = new Set<string>(Array.isArray(definition.template_refs) ? definition.template_refs.filter((id): id is string => typeof id === "string" && id.length > 0) : []);
  for (const f of actionForms) {
    if (!f || typeof f.key !== "string" || f.key.length === 0) { blockers.push("Action form without a key in definition.action_forms (M09-029)"); continue; }
    if (typeof f.title !== "string" || f.title.length === 0) blockers.push(`Action form "${f.key}" has no title (M09-029)`);
    if (f.template_version_id) templateRefs.add(f.template_version_id);
    formKeys.add(f.key);
  }

  if (templateRefs.size > 0) {
    const { data: templates, error } = await sb.from("configuration_templates")
      .select("id, status, effective_from").in("id", [...templateRefs]);
    if (error) { logProviderError("admin package template validation", error); return [NEUTRAL_LOAD_ERROR]; }
    const active = new Set((templates ?? []).filter(t => ["published", "locked"].includes(String(t.status)))
      .filter(t => !t.effective_from || String(t.effective_from) <= new Date().toISOString().slice(0, 10)).map(t => String(t.id)));
    for (const id of templateRefs) if (!active.has(id)) blockers.push(`Template version ${id} is missing, inactive, or not effective (M09-008/029)`);
  }

  // Collect referenced item codes section by section.
  const wanted = new Map<string, string>();   // code -> section title (first reference)
  for (const s of sections) {
    const title = typeof s?.title === "string" && s.title ? s.title : (s?.key ?? "?");
    if (!s?.title_en?.trim() || !s?.title_ar?.trim()) blockers.push(`Section "${title}": English and Arabic names are required (M09-016/029)`);
    if (s?.items === undefined) continue;     // report-head sections carry fields, not items
    if (!Array.isArray(s.items)) { blockers.push(`Section "${title}": items is not an array (M09-029)`); continue; }
    for (const it of s.items) {
      if (typeof it !== "string" || it.length === 0) { blockers.push(`Section "${title}": non-string item code (M09-029)`); continue; }
      if (!wanted.has(it)) wanted.set(it, String(title));
    }
  }

  const codes = [...wanted.keys()];
  const bank = new Map<string, ItemBankRow>();
  if (codes.length > 0) {
    const { data, error } = await sb.from("inspection_items")
      .select("code, active, response_model, evidence_rule, regulation_clauses(regulations(status, effective_from))").in("code", codes);
    if (error) { logProviderError("admin package item-bank validation", error); return [NEUTRAL_LOAD_ERROR]; }
    for (const row of (data ?? []) as unknown as ItemBankRow[]) bank.set(row.code, row);
  }

  const violationRefs = new Map<string, string>();  // violation code -> item code (first reference)
  const conditionEdges = new Map<string, string>();
  for (const [code, sectionTitle] of wanted) {
    const item = bank.get(code);
    if (!item) { blockers.push(`Section "${sectionTitle}": item ${code} does not exist in the item bank (M09-012)`); continue; }
    if (!item.active) blockers.push(`Section "${sectionTitle}": item ${code} is inactive (M09-012)`);
    const clause = Array.isArray(item.regulation_clauses) ? item.regulation_clauses[0] : item.regulation_clauses;
    const relation = clause?.regulations;
    const regulation = Array.isArray(relation) ? relation[0] : relation;
    const today = new Date().toISOString().slice(0, 10);
    if (!regulation || !["published", "locked"].includes(regulation.status)) {
      blockers.push(`Section "${sectionTitle}": item ${code} is not anchored to an active published regulation (M09-001/012)`);
    } else if (regulation.effective_from && regulation.effective_from > today) {
      blockers.push(`Section "${sectionTitle}": item ${code} regulation is not effective until ${regulation.effective_from} (M09-001/012)`);
    }
    const rule = definition.item_rules?.[code];
    if (!rule || !["required", "optional", "conditional"].includes(String(rule.requirement))) {
      blockers.push(`Item ${code}: package relationship must define required, optional, or conditional (M09-018)`);
    }
    const mapping = rule?.response_mapping ?? item.response_model?.mapping ?? {};
    const nc = mapping["non_compliant"];
    if (nc?.violation && !violationRefs.has(nc.violation)) violationRefs.set(nc.violation, code);
    if (nc?.action_form && !formKeys.has(nc.action_form)) {
      blockers.push(`Item ${code}: non-compliant mapping triggers action form "${nc.action_form}" which is not defined in this package version (M09-029)`);
    }
    const condition = rule?.conditional?.visible_when;
    if (rule?.requirement === "conditional" && !condition) {
      blockers.push(`Item ${code}: conditional requirement has no visibility rule (M09-021)`);
    } else if (condition && !/^[A-Za-z0-9_.-]+=[A-Za-z0-9_.-]+$/.test(condition)) {
      blockers.push(`Item ${code}: visibility rule must use key=value grammar (M09-021)`);
    } else if (condition) {
      const dependency = condition.slice(0, condition.indexOf("="));
      if (wanted.has(dependency)) conditionEdges.set(code, dependency);
    }
    blockers.push(...evidenceRuleBlockers(code, rule?.evidence_rule ?? item.evidence_rule));
  }

  // Each item has at most one visible_when dependency. Follow the chain from
  // every item and reject self/circular activation before publication.
  for (const start of conditionEdges.keys()) {
    const path: string[] = [];
    const seen = new Map<string, number>();
    let cursor: string | undefined = start;
    while (cursor && conditionEdges.has(cursor)) {
      const at = seen.get(cursor);
      if (at !== undefined) {
        blockers.push(`Circular visibility rule: ${[...path.slice(at), cursor].join(" -> ")} (M09-021/029)`);
        break;
      }
      seen.set(cursor, path.length);
      path.push(cursor);
      cursor = conditionEdges.get(cursor);
    }
  }

  // Violation codes must exist AND carry a penalty mapping (M09-004).
  if (violationRefs.size > 0) {
    const vioCodes = [...violationRefs.keys()];
    const { data: vios, error: vErr } = await sb.from("violation_codes").select("id, code, status, active_from, active_to").in("code", vioCodes);
    if (vErr) { logProviderError("admin package violation validation", vErr); return [...blockers, NEUTRAL_LOAD_ERROR]; }
    const today = new Date().toISOString().slice(0, 10);
    const vioByCode = new Map((vios ?? []).filter(v => ["published", "locked"].includes(String(v.status)))
      .filter(v => (!v.active_from || String(v.active_from) <= today) && (!v.active_to || String(v.active_to) >= today))
      .map(v => [v.code as string, v.id as string]));
    const vioIds = [...vioByCode.values()];
    let mappedIds = new Set<string>();
    if (vioIds.length > 0) {
      const { data: pens, error: pErr } = await sb.from("penalty_mappings").select("violation_code_id, status").in("violation_code_id", vioIds).in("status", ["published", "locked"]);
      if (pErr) { logProviderError("admin package penalty validation", pErr); return [...blockers, NEUTRAL_LOAD_ERROR]; }
      mappedIds = new Set((pens ?? []).map(p => p.violation_code_id as string));
    }
    for (const [vCode, itemCode] of violationRefs) {
      const vid = vioByCode.get(vCode);
      if (!vid) { blockers.push(`Item ${itemCode}: non-compliant mapping references violation code ${vCode} which does not exist (M09-012)`); continue; }
      if (!mappedIds.has(vid)) blockers.push(`Violation code ${vCode} (item ${itemCode}) has no penalty mapping (M09-004)`);
    }
  }

  return blockers;
}

/** Freeze item semantics into the governed package version so later catalogue edits
 * cannot change an already-published inspection contract (M09-008/030). */
async function freezeDefinition(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  definition: PkgDefinition,
): Promise<PkgDefinition> {
  const codes = [...new Set((Array.isArray(definition.sections) ? definition.sections as DefSection[] : [])
    .flatMap(section => Array.isArray(section.items) ? section.items.filter((item): item is string => typeof item === "string") : []))];
  if (!codes.length) return { ...definition, item_snapshot: {}, violation_snapshot: {}, template_snapshot: {} };
  const { data, error } = await sb.from("inspection_items").select(
    "id, code, title, response_model, evidence_rule, score_weight, score_excluded_on, guidance_en, guidance_ar, regulation_clauses(clause_ref, legal_source)",
  ).in("code", codes);
  if (error) throw error;
  const itemSnapshot = Object.fromEntries((data ?? []).map(row => {
    const rule = definition.item_rules?.[String(row.code)] ?? {};
    return [row.code, {
      ...row,
      response_model: {
        ...(row.response_model as object),
        ...(rule.requirement ? { requirement: rule.requirement } : {}),
        ...(rule.conditional ? { conditional: rule.conditional } : {}),
        ...(rule.response_mapping ? { mapping: rule.response_mapping } : {}),
        ...(rule.scoring_enabled !== undefined ? { scoring_enabled: rule.scoring_enabled } : {}),
      },
      evidence_rule: rule.evidence_rule ?? row.evidence_rule,
      score_weight: rule.score_weight !== undefined ? rule.score_weight : row.score_weight,
    }];
  }));
  const violationCodes = [...new Set(Object.values(itemSnapshot).flatMap(row => {
    const mapping = (row as { response_model?: { mapping?: Record<string, { violation?: string }> } }).response_model?.mapping ?? {};
    return Object.values(mapping).flatMap(value => value.violation ? [value.violation] : []);
  }))];
  let violationSnapshot: Record<string, unknown> = {};
  if (violationCodes.length) {
    const { data: violations, error: violationError } = await sb.from("violation_codes").select(
      "id, code, title, level, corrective_action, grace_period_days, category, applicability, configuration_version, active_from, active_to, penalty_mappings(id, penalty_ref, penalty_type, amount, grace_period_days, due_period_days, legal_basis, mapping_version, template_version_id, status)",
    ).in("code", violationCodes).in("status", ["published", "locked"]);
    if (violationError) throw violationError;
    violationSnapshot = Object.fromEntries((violations ?? []).map(row => [row.code, row]));
  }
  const templateIds = [...new Set([
    ...(definition.template_refs ?? []),
    ...((Array.isArray(definition.action_forms) ? definition.action_forms as DefActionForm[] : []).flatMap(f => f.template_version_id ? [f.template_version_id] : [])),
  ])];
  let templateSnapshot: Record<string, unknown> = {};
  if (templateIds.length) {
    const { data: templates, error: templateError } = await sb.from("configuration_templates")
      .select("id, template_key, template_type, version_label, title_en, title_ar, schema, effective_from")
      .in("id", templateIds).in("status", ["published", "locked"]);
    if (templateError) throw templateError;
    templateSnapshot = Object.fromEntries((templates ?? []).map(row => [row.id, row]));
  }
  return { ...definition, item_snapshot: itemSnapshot, violation_snapshot: violationSnapshot, template_snapshot: templateSnapshot };
}

// RBAC-002 maker-checker — approver must differ from creator; the database
// constraint pkg_maker_checker + trg_pkg_approver reject self-approval.
// M09-012/029 — the definition is dependency-validated BEFORE the flip;
// blockers are returned verbatim and publish is refused while any remain.
export async function approveAndPublish(_: PkgResult, formData: FormData): Promise<PkgResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const userId = gate.userId;
  const sb = await supabaseServer();

  const version_id = String(formData.get("version_id") ?? "");
  const { data: ver, error: verErr } = await sb.from("package_versions")
    .select("status, definition").eq("id", version_id).maybeSingle();
  if (verErr) { logProviderError("admin package version read", verErr); return { error: NEUTRAL_LOAD_ERROR }; }
  if (!ver) return { error: "Version not found or outside your scope (RLS)." };
  if (ver.status !== "draft") return { error: "Only draft versions can be published (M09-030)." };

  const blockers = await validateDefinition(sb, (ver.definition ?? {}) as PkgDefinition);
  if (blockers.length > 0) {
    return { error: `Publish blocked — ${blockers.length} validation issue(s) (M09-012/029):\n${blockers.join("\n")}` };
  }

  let frozenDefinition: PkgDefinition;
  try { frozenDefinition = await freezeDefinition(sb, (ver.definition ?? {}) as PkgDefinition); }
  catch (freezeError) {
    logProviderError("admin package frozen item snapshot", freezeError);
    return { error: NEUTRAL_LOAD_ERROR };
  }

  const { error } = await sb.rpc("publish_package_version", {
    p_version_id: version_id, p_definition: frozenDefinition,
  });
  if (error) { logProviderError("admin package publish", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/packages");
  return { ok: true };
}

export async function deactivatePackageVersion(_: PkgResult, formData: FormData): Promise<PkgResult> {
  const gate = await requireConfigurationWriter();
  if (!gate.ok) return { error: gate.message };
  const sb = await supabaseServer();
  const version_id = String(formData.get("version_id") ?? "");
  const effective_to = String(formData.get("effective_to") ?? "").trim();
  const deactivation_reason = String(formData.get("deactivation_reason") ?? "").trim();
  if (!version_id || !/^\d{4}-\d{2}-\d{2}$/.test(effective_to) || !deactivation_reason) {
    return { error: "Package version, valid effective-to date, and deactivation reason are required." };
  }
  const { data, error } = await sb.from("package_versions").update({ status: "deactivated", effective_to, deactivation_reason })
    .eq("id", version_id).in("status", ["published", "locked"]).select("id");
  if (error) { logProviderError("admin package deactivate", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!data?.length) return { error: "Only a governed active package version can be deactivated." };
  revalidatePath("/admin/packages");
  return { ok: true };
}
