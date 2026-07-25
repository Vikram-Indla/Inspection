// Slice E2 — pure runtime logic for the inspection workspace (no I/O, no React).
// Covers: conditional visibility (M04-119), evidence legs (M04-165/199),
// action-form requirements (M04-171/177/204), per-section progress (M04-081),
// live summary counts (M04-149/192) and grouped submit blockers (M04-200/204/208).

export type ResponseModel = {
  responses?: string[];
  mapping?: Record<string, { result?: string; violation?: string; action_form?: string }>;
  conditional?: { visible_when?: string; mandatory_when_visible?: boolean };
  requirement?: "required" | "optional" | "conditional";
  scoring_enabled?: boolean;
  score_excluded_on?: string[];
};
export type EvidenceRule = { on?: string; type?: string; min?: number; mandatory?: boolean; note?: boolean } | null;
export type Clause = { clause_ref: string; legal_source: string | null } | null;
export type Item = {
  id: string; code: string; title: string;
  response_model: ResponseModel; evidence_rule: EvidenceRule;
  score_excluded_on: string[] | null;
  score_weight: number | null;
  guidance: string | null;        // locale-resolved server-side (guidance_en/ar, M04-138)
  clause: Clause;                 // regulation reference (M04-138)
};
export type Answer = { value?: string; note?: string; date?: string };
export type FormDef = { key: string; title: string; blocking?: boolean; fields: string[] };
export type FormDraft = { [field: string]: string };
export type FindingDraft = { id?: string; description: string; severity: string; classification: string; sync: "synced" | "pending" | "failed" };
export type Section = { key: string; title: string; items?: string[] };
export type VioConfig = { id: string; code: string; title: string; level: string; penalty_ref: string | null; legal_basis: string | null; mapping_version: string | null; penalty_conflict?: boolean };

// Phase 5 (§15/§18/§20) — per-visit item lifecycle. Keyed by item id; a state
// is ACTIVE while reverted_at is null (the page maps reverted_at → active).
export type ItemState = { state: "added" | "deselected"; reason: string | null; active: boolean };
export type ItemStates = Record<string, ItemState>;

/** Synthetic section key for inspector-added items not in the frozen package. */
export const ADDED_SECTION_KEY = "__added";

/**
 * Effective item scope (§15): snapshot default items MINUS actively deselected
 * PLUS actively added (dedupe — an added item already in the snapshot is a
 * no-op). Added items land in one synthetic "Added items" section because the
 * frozen definition only references items by code inside section lists; no
 * item→section mapping metadata exists outside those lists.
 */
export function effectiveSections(sections: Section[], imap: Record<string, Item>, itemStates: ItemStates, addedTitle = "Added items"): Section[] {
  const isDeselected = (it: Item | undefined) => !!it && !!itemStates[it.id]?.active && itemStates[it.id]?.state === "deselected";
  const base = sections.map(s => ({ ...s, items: (s.items ?? []).filter(c => !isDeselected(imap[c])) }));
  const inSnapshot = new Set(sections.flatMap(s => s.items ?? []));
  const byId = new Map(Object.values(imap).map(it => [it.id, it]));
  const added: string[] = [];
  for (const [itemId, st] of Object.entries(itemStates)) {
    if (!st.active || st.state !== "added") continue;
    const it = byId.get(itemId);
    if (!it || inSnapshot.has(it.code) || added.includes(it.code)) continue;  // no-op against snapshot, no duplicates
    added.push(it.code);
  }
  return added.length ? [...base, { key: ADDED_SECTION_KEY, title: addedTitle, items: added }] : base;
}

/** Parse 'key=value' from response_model.conditional.visible_when. */
export function parseCondition(m: ResponseModel): { key: string; value: string } | null {
  const w = m.conditional?.visible_when;
  if (!w) return null;
  const i = w.indexOf("=");
  if (i <= 0) return null;
  return { key: w.slice(0, i).trim(), value: w.slice(i + 1).trim() };
}

/** Conditional visibility (M04-119): unconditioned items are always visible. */
export function isVisible(item: Item, ctx: Record<string, string>): boolean {
  const c = parseCondition(item.response_model);
  return !c || ctx[c.key] === c.value;
}

/** All distinct context flags referenced by any item's visible_when. */
export function contextFlags(items: Item[]): string[] {
  const itemCodes = new Set(items.map(it => it.code));
  const keys = new Set<string>();
  for (const it of items) {
    const c = parseCondition(it.response_model);
    if (c && !itemCodes.has(c.key)) keys.add(c.key);
  }
  return [...keys].sort();
}

/** Item-answer conditions override site context; ITEM-001=compliant is runtime-native. */
export function conditionContext(items: Item[], answers: Record<string, Answer>, site: Record<string, string>): Record<string, string> {
  const itemAnswers = Object.fromEntries(items.flatMap(it => {
    const value = answers[it.id]?.value;
    return value ? [[it.code, value]] : [];
  }));
  return { ...site, ...itemAnswers };
}

/** Is the current answer excluded from scoring (na handling, seed score_excluded_on)? */
export function scoreExcluded(item: Item, value: string | undefined): boolean {
  if (!value) return false;
  if (item.response_model.scoring_enabled === false) return true;
  const ex = item.response_model.score_excluded_on ?? item.score_excluded_on ?? [];
  return ex.includes(value);
}

/**
 * Preliminary Compliance Rate (canonical plan §20, D-019 — EXACT):
 *   Compliant answered SCORED items / total answered SCORED items × 100.
 * An item is SCORED when response_model.scoring_enabled !== false, its
 * score_weight is positive (non-scoring items carry no weight), the answered
 * value is not score-excluded (scoreExcluded — na handling), and the value's
 * mapping result is compliant/non_compliant. Unanswered items leave BOTH the
 * numerator and the denominator; actively deselected items never participate
 * (§15); Form-Level Questions (definition section.questions — string_id-keyed,
 * never item codes), admin fields (section.fields) and Action Form questions
 * (action_forms defs) are structurally excluded because they never appear in
 * the item set. Returns null while no scored item is answered.
 */
export function computePreliminaryCompliance(items: Item[], answers: Record<string, Answer>, ctx: Record<string, string>, itemStates?: ItemStates): number | null {
  let compliant = 0;
  let answeredScored = 0;
  for (const item of items) {
    if (itemStates && itemStates[item.id]?.active && itemStates[item.id]?.state === "deselected") continue;
    if (!isVisible(item, ctx)) continue;
    const value = answers[item.id]?.value;
    if (!value || scoreExcluded(item, value)) continue;
    const result = item.response_model.mapping?.[value]?.result;
    if (result !== "compliant" && result !== "non_compliant") continue;
    const weight = item.score_weight ?? 0;
    if (!(weight > 0)) continue;
    answeredScored += 1;
    if (result === "compliant") compliant += 1;
  }
  return answeredScored > 0 ? Math.round((compliant / answeredScored) * 1000) / 10 : null;
}

/** Preserved export (D-019): now the canonical §20 Preliminary Compliance Rate. */
export function computeHealthScore(items: Item[], answers: Record<string, Answer>, ctx: Record<string, string>, itemStates?: ItemStates): number | null {
  return computePreliminaryCompliance(items, answers, ctx, itemStates);
}

/** Required/optional/conditional submission semantics (M09-018/021/022). */
export function answerRequired(item: Item): boolean {
  const mode = item.response_model.requirement ?? "required";
  if (mode === "optional") return false;
  if (mode === "conditional") return !!item.response_model.conditional?.mandatory_when_visible;
  return true;
}

/** Evidence leg required by the item's rule for the current answer (M04-165). */
export function evidenceLeg(item: Item, value: string | undefined):
  { applies: boolean; mandatory: boolean; min: number; type: string } | null {
  const r = item.evidence_rule;
  if (!r?.on) return null;
  const applies = !!value && (r.on === "any" || r.on === value);
  return { applies, mandatory: !!r.mandatory, min: Math.max(1, r.min ?? 1), type: r.type ?? "photo" };
}

/** Action form definition demanded by the current answer's mapping (M04-171/172). */
export function formRequired(item: Item, value: string | undefined, defs: FormDef[]): FormDef | null {
  if (!value) return null;
  const key = item.response_model.mapping?.[value]?.action_form;
  if (!key) return null;
  return defs.find(d => d.key === key) ?? null;
}

/** Mandatory-field completeness of an action form draft (M04-177/183). */
export function formComplete(def: FormDef, draft: FormDraft | undefined): boolean {
  return def.fields.every(f => !!draft?.[f]?.trim());
}

export type SectionProgress = { key: string; title: string; total: number; answered: number; pct: number };
export function sectionProgress(sections: Section[], imap: Record<string, Item>, answers: Record<string, Answer>, ctx: Record<string, string>, itemStates?: ItemStates): SectionProgress[] {
  // §20 — progress over the ACTIVE scope: deselected excluded, added included immediately.
  const eff = itemStates ? effectiveSections(sections, imap, itemStates) : sections;
  return eff.map(s => {
    const vis = (s.items ?? []).map(c => imap[c]).filter((it): it is Item => !!it && isVisible(it, ctx));
    const answered = vis.filter(it => !!answers[it.id]?.value).length;
    return { key: s.key, title: s.title, total: vis.length, answered, pct: vis.length ? Math.round(100 * answered / vis.length) : 100 };
  });
}

export type Summary = { answered: number; pending: number; compliant: number; nonCompliant: number; violations: number; evidence: number };
export function summarize(sections: Section[], imap: Record<string, Item>, answers: Record<string, Answer>, ctx: Record<string, string>, evidenceCount: number, itemStates?: ItemStates): Summary {
  const eff = itemStates ? effectiveSections(sections, imap, itemStates) : sections;
  let answered = 0, pending = 0, compliant = 0, nonCompliant = 0, violations = 0;
  for (const s of eff) for (const c of s.items ?? []) {
    const it = imap[c]; if (!it || !isVisible(it, ctx)) continue;
    const v = answers[it.id]?.value;
    if (!v) { pending++; continue; }
    answered++;
    if (v === "compliant") compliant++;
    if (v === "non_compliant") nonCompliant++;
    if (it.response_model.mapping?.[v]?.violation) violations++;
  }
  return { answered, pending, compliant, nonCompliant, violations, evidence: evidenceCount };
}

/** Violations implied by current answers, joined to compliance config (M04-142/143/144). */
export type ImpliedViolation = { itemCode: string; itemId: string; code: string; config: VioConfig | null; actionFormKey: string | null };
export function impliedViolations(items: Item[], answers: Record<string, Answer>, ctx: Record<string, string>, vconfig: Record<string, VioConfig>): ImpliedViolation[] {
  const out: ImpliedViolation[] = [];
  for (const it of items) {
    if (!isVisible(it, ctx)) continue;
    const v = answers[it.id]?.value; if (!v) continue;
    const m = it.response_model.mapping?.[v];
    if (m?.violation) out.push({ itemCode: it.code, itemId: it.id, code: m.violation, config: vconfig[m.violation] ?? null, actionFormKey: m.action_form ?? null });
  }
  return out;
}

/** Grouped submit blockers (M04-199/200/204/208): unanswered · evidence · forms. */
export type SectionBlockers = { key: string; title: string; unanswered: string[]; evidence: string[]; forms: string[]; findings: string[] };
export function computeBlockers(
  sections: Section[], imap: Record<string, Item>, answers: Record<string, Answer>,
  ctx: Record<string, string>, evidencePerItem: Record<string, Record<string, number>>,
  formDrafts: Record<string, FormDraft>, defs: FormDef[], itemStates?: ItemStates,
  findingDrafts: Record<string, FindingDraft> = {},
): SectionBlockers[] {
  // §15/§20 — deselected items require nothing; added items are fully required
  // per their own rules (effective scope, same as progress).
  const eff = itemStates ? effectiveSections(sections, imap, itemStates) : sections;
  const out: SectionBlockers[] = [];
  for (const s of eff) {
    const g: SectionBlockers = { key: s.key, title: s.title, unanswered: [], evidence: [], forms: [], findings: [] };
    for (const c of s.items ?? []) {
      const it = imap[c]; if (!it || !isVisible(it, ctx)) continue;
      const v = answers[it.id]?.value;
      if (!v) { if (answerRequired(it)) g.unanswered.push(it.code); continue; }
      const leg = evidenceLeg(it, v);
      if (leg?.applies && leg.mandatory && (evidencePerItem[it.id]?.[leg.type] ?? 0) < leg.min) g.evidence.push(it.code);
      const def = formRequired(it, v, defs);
      if (def?.blocking && !formComplete(def, formDrafts[it.id])) g.forms.push(it.code);
      if (it.response_model.mapping?.[v]?.violation && !findingDrafts[it.id]?.description.trim()) g.findings.push(it.code);
    }
    if (g.unanswered.length || g.evidence.length || g.forms.length || g.findings.length) out.push(g);
  }
  return out;
}
