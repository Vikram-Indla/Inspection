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
  if (!package_id || !version_label) return { error: "Version label is required." };

  const { data: latest } = await sb.from("package_versions")
    .select("definition").eq("package_id", package_id)
    .order("published_at", { ascending: false, nullsFirst: false }).limit(1).single();

  const { error } = await sb.from("package_versions").insert({
    package_id, version_label, status: "draft",
    definition: latest?.definition ?? { sections: [], action_forms: [] },
    created_by: userId,
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
type DefSection = { key?: string; title?: string; items?: unknown; fields?: unknown; mandatory?: boolean };
type DefActionForm = { key?: string; title?: string; blocking?: boolean };
type PkgDefinition = { sections?: unknown; action_forms?: unknown };
type ItemBankRow = {
  code: string; active: boolean;
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
  for (const f of actionForms) {
    if (!f || typeof f.key !== "string" || f.key.length === 0) { blockers.push("Action form without a key in definition.action_forms (M09-029)"); continue; }
    if (typeof f.title !== "string" || f.title.length === 0) blockers.push(`Action form "${f.key}" has no title (M09-029)`);
    formKeys.add(f.key);
  }

  // Collect referenced item codes section by section.
  const wanted = new Map<string, string>();   // code -> section title (first reference)
  for (const s of sections) {
    const title = typeof s?.title === "string" && s.title ? s.title : (s?.key ?? "?");
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
      .select("code, active, response_model, evidence_rule").in("code", codes);
    if (error) { logProviderError("admin package item-bank validation", error); return [NEUTRAL_LOAD_ERROR]; }
    for (const row of (data ?? []) as ItemBankRow[]) bank.set(row.code, row);
  }

  const violationRefs = new Map<string, string>();  // violation code -> item code (first reference)
  for (const [code, sectionTitle] of wanted) {
    const item = bank.get(code);
    if (!item) { blockers.push(`Section "${sectionTitle}": item ${code} does not exist in the item bank (M09-012)`); continue; }
    if (!item.active) blockers.push(`Section "${sectionTitle}": item ${code} is inactive (M09-012)`);
    const mapping = item.response_model?.mapping ?? {};
    const nc = mapping["non_compliant"];
    if (nc?.violation && !violationRefs.has(nc.violation)) violationRefs.set(nc.violation, code);
    if (nc?.action_form && !formKeys.has(nc.action_form)) {
      blockers.push(`Item ${code}: non-compliant mapping triggers action form "${nc.action_form}" which is not defined in this package version (M09-029)`);
    }
    const condition = item.response_model?.conditional?.visible_when;
    if (item.response_model?.requirement === "conditional" && !condition) {
      blockers.push(`Item ${code}: conditional requirement has no visibility rule (M09-021)`);
    } else if (condition && !/^[A-Za-z0-9_.-]+=[A-Za-z0-9_.-]+$/.test(condition)) {
      blockers.push(`Item ${code}: visibility rule must use key=value grammar (M09-021)`);
    }
    blockers.push(...evidenceRuleBlockers(code, item.evidence_rule));
  }

  // Violation codes must exist AND carry a penalty mapping (M09-004).
  if (violationRefs.size > 0) {
    const vioCodes = [...violationRefs.keys()];
    const { data: vios, error: vErr } = await sb.from("violation_codes").select("id, code").in("code", vioCodes);
    if (vErr) { logProviderError("admin package violation validation", vErr); return [...blockers, NEUTRAL_LOAD_ERROR]; }
    const vioByCode = new Map((vios ?? []).map(v => [v.code as string, v.id as string]));
    const vioIds = [...vioByCode.values()];
    let mappedIds = new Set<string>();
    if (vioIds.length > 0) {
      const { data: pens, error: pErr } = await sb.from("penalty_mappings").select("violation_code_id").in("violation_code_id", vioIds);
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

  const { error } = await sb.from("package_versions").update({
    approved_by: userId, status: "published", published_at: new Date().toISOString(),
  }).eq("id", version_id).eq("status", "draft");
  if (error) { logProviderError("admin package publish", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/packages");
  return { ok: true };
}
