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
  guidance: string | null;        // locale-resolved server-side (guidance_en/ar, M04-138)
  clause: Clause;                 // regulation reference (M04-138)
};
export type Answer = { value?: string; note?: string; date?: string };
export type FormDef = { key: string; title: string; blocking?: boolean; fields: string[] };
export type FormDraft = { [field: string]: string };
export type Section = { key: string; title: string; items?: string[] };
export type VioConfig = { id: string; code: string; title: string; level: string; penalty_ref: string | null; legal_basis: string | null; mapping_version: string | null };

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
  const keys = new Set<string>();
  for (const it of items) { const c = parseCondition(it.response_model); if (c) keys.add(c.key); }
  return [...keys].sort();
}

/** Is the current answer excluded from scoring (na handling, seed score_excluded_on)? */
export function scoreExcluded(item: Item, value: string | undefined): boolean {
  if (!value) return false;
  if (item.response_model.scoring_enabled === false) return true;
  const ex = item.response_model.score_excluded_on ?? item.score_excluded_on ?? [];
  return ex.includes(value);
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
export function sectionProgress(sections: Section[], imap: Record<string, Item>, answers: Record<string, Answer>, ctx: Record<string, string>): SectionProgress[] {
  return sections.map(s => {
    const vis = (s.items ?? []).map(c => imap[c]).filter((it): it is Item => !!it && isVisible(it, ctx));
    const answered = vis.filter(it => !!answers[it.id]?.value).length;
    return { key: s.key, title: s.title, total: vis.length, answered, pct: vis.length ? Math.round(100 * answered / vis.length) : 100 };
  });
}

export type Summary = { answered: number; pending: number; compliant: number; nonCompliant: number; violations: number; evidence: number };
export function summarize(sections: Section[], imap: Record<string, Item>, answers: Record<string, Answer>, ctx: Record<string, string>, evidenceCount: number): Summary {
  let answered = 0, pending = 0, compliant = 0, nonCompliant = 0, violations = 0;
  for (const s of sections) for (const c of s.items ?? []) {
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
export type SectionBlockers = { key: string; title: string; unanswered: string[]; evidence: string[]; forms: string[] };
export function computeBlockers(
  sections: Section[], imap: Record<string, Item>, answers: Record<string, Answer>,
  ctx: Record<string, string>, evidencePerItem: Record<string, number>,
  formDrafts: Record<string, FormDraft>, defs: FormDef[],
): SectionBlockers[] {
  const out: SectionBlockers[] = [];
  for (const s of sections) {
    const g: SectionBlockers = { key: s.key, title: s.title, unanswered: [], evidence: [], forms: [] };
    for (const c of s.items ?? []) {
      const it = imap[c]; if (!it || !isVisible(it, ctx)) continue;
      const v = answers[it.id]?.value;
      if (!v) { if (answerRequired(it)) g.unanswered.push(it.code); continue; }
      const leg = evidenceLeg(it, v);
      if (leg?.applies && leg.mandatory && (evidencePerItem[it.id] ?? 0) < leg.min) g.evidence.push(it.code);
      const def = formRequired(it, v, defs);
      if (def?.blocking && !formComplete(def, formDrafts[it.id])) g.forms.push(it.code);
    }
    if (g.unanswered.length || g.evidence.length || g.forms.length) out.push(g);
  }
  return out;
}
