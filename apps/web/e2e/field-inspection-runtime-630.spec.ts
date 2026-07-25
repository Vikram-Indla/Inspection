import { expect, test } from "@playwright/test";
import {
  answerRequired, computeBlockers, computePreliminaryCompliance, computeHealthScore,
  conditionContext, contextFlags, effectiveSections, evidenceLeg, formComplete, formRequired,
  impliedViolations, isVisible, parseCondition, scoreExcluded, sectionProgress, summarize,
  ADDED_SECTION_KEY,
  type Item, type ItemStates, type Section, type FormDef, type VioConfig,
} from "../src/app/(app)/field/inspection/[id]/runtime";

// SCR-IPAD-630 · P07 · DSG-031 — Inspection Workspace dynamic-form runtime.
// Executable behavioral coverage for the pure config-driven engine: conditional
// visibility (M04-119 / M09-021), required/optional/conditional semantics
// (M09-018/021/022), per-section progress (M04-081), live summary (M04-149),
// implied violations (M04-142), the canonical §20 Preliminary Compliance Rate
// (D-019), grouped submit blockers (M04-199/200/204/208) and the per-visit item
// lifecycle effective scope (§15 / D-017). Pure logic only: no browser, no backend.

const item = (over: Partial<Item> & { id: string; code: string }): Item => ({
  title: over.title ?? over.code,
  response_model: {},
  evidence_rule: null,
  score_excluded_on: null,
  score_weight: 1,
  guidance: null,
  clause: null,
  ...over,
});

const section = (key: string, items: string[], title = key): Section => ({ key, title, items });
const imap = (items: Item[]): Record<string, Item> => Object.fromEntries(items.map(i => [i.code, i]));

test.describe("SCR-IPAD-630 dynamic-form runtime — conditional visibility (M04-119/M09-021)", () => {
  test("unconditioned items are always visible; site flags drive conditional show/hide", () => {
    const plain = item({ id: "a", code: "A" });
    expect(isVisible(plain, {})).toBe(true);

    const conditional = item({ id: "b", code: "B", response_model: { conditional: { visible_when: "cold_storage=yes" } } });
    expect(isVisible(conditional, {})).toBe(false);                 // flag absent → hidden
    expect(isVisible(conditional, { cold_storage: "no" })).toBe(false);
    expect(isVisible(conditional, { cold_storage: "yes" })).toBe(true);
  });

  test("a malformed visible_when never hides the item (fail open on grammar, not on data)", () => {
    expect(parseCondition({ conditional: { visible_when: "=value" } })).toBeNull();
    const broken = item({ id: "x", code: "X", response_model: { conditional: { visible_when: "=value" } } });
    expect(isVisible(broken, {})).toBe(true);
  });

  test("item-answer conditions override site context (chained conditional questions)", () => {
    const parent = item({ id: "p", code: "ITEM-001", response_model: { responses: ["compliant", "non_compliant"] } });
    const child = item({ id: "c", code: "ITEM-002", response_model: { conditional: { visible_when: "ITEM-001=non_compliant" } } });
    const hidden = conditionContext([parent, child], { p: { value: "compliant" } }, {});
    const shown = conditionContext([parent, child], { p: { value: "non_compliant" } }, {});
    expect(isVisible(child, hidden)).toBe(false);
    expect(isVisible(child, shown)).toBe(true);
  });

  test("contextFlags lists only site flags, never other item codes referenced by a chain", () => {
    const parent = item({ id: "p", code: "ITEM-001", response_model: { responses: ["compliant"] } });
    const siteConditional = item({ id: "s", code: "ITEM-003", response_model: { conditional: { visible_when: "handles_food=yes" } } });
    const chained = item({ id: "c", code: "ITEM-002", response_model: { conditional: { visible_when: "ITEM-001=compliant" } } });
    // ITEM-001 is an item code (chain) → excluded; handles_food is a site flag → included.
    expect(contextFlags([parent, siteConditional, chained])).toEqual(["handles_food"]);
  });
});

test.describe("SCR-IPAD-630 dynamic-form runtime — required/optional/conditional semantics (M09-018/021/022)", () => {
  test("required is default, optional never blocks, conditional follows mandatory_when_visible", () => {
    expect(answerRequired(item({ id: "a", code: "A", response_model: {} }))).toBe(true);
    expect(answerRequired(item({ id: "a", code: "A", response_model: { requirement: "required" } }))).toBe(true);
    expect(answerRequired(item({ id: "a", code: "A", response_model: { requirement: "optional" } }))).toBe(false);
    expect(answerRequired(item({ id: "a", code: "A", response_model: { requirement: "conditional", conditional: { mandatory_when_visible: true } } }))).toBe(true);
    expect(answerRequired(item({ id: "a", code: "A", response_model: { requirement: "conditional", conditional: { mandatory_when_visible: false } } }))).toBe(false);
    expect(answerRequired(item({ id: "a", code: "A", response_model: { requirement: "conditional" } }))).toBe(false);
  });
});

test.describe("SCR-IPAD-630 dynamic-form runtime — evidence & action-form gating (M04-165/171/177/183)", () => {
  test("evidenceLeg applies only to the mapped answer and floors min at 1", () => {
    const it = item({ id: "a", code: "A", evidence_rule: { on: "non_compliant", type: "photo", mandatory: true, min: 0 } });
    expect(evidenceLeg(it, undefined)).toEqual({ applies: false, mandatory: true, min: 1, type: "photo" });
    expect(evidenceLeg(it, "compliant")?.applies).toBe(false);
    expect(evidenceLeg(it, "non_compliant")).toEqual({ applies: true, mandatory: true, min: 1, type: "photo" });
    const anyRule = item({ id: "b", code: "B", evidence_rule: { on: "any", type: "document", min: 2 } });
    expect(evidenceLeg(anyRule, "compliant")).toEqual({ applies: true, mandatory: false, min: 2, type: "document" });
    expect(evidenceLeg(item({ id: "c", code: "C" }), "compliant")).toBeNull();
  });

  test("formRequired resolves the mapped action form; formComplete requires every trimmed field", () => {
    const defs: FormDef[] = [{ key: "corrective_action", title: "Corrective action", blocking: true, fields: ["owner_name", "due_at"] }];
    const it = item({ id: "a", code: "A", response_model: { mapping: { non_compliant: { action_form: "corrective_action" } } } });
    expect(formRequired(it, undefined, defs)).toBeNull();
    expect(formRequired(it, "compliant", defs)).toBeNull();          // value has no action_form mapping
    expect(formRequired(it, "non_compliant", defs)).toBe(defs[0]);
    expect(formRequired(it, "non_compliant", [])).toBeNull();        // def not published → null (no invention)

    expect(formComplete(defs[0], undefined)).toBe(false);
    expect(formComplete(defs[0], { owner_name: "Sara", due_at: "" })).toBe(false);
    expect(formComplete(defs[0], { owner_name: "Sara", due_at: "   " })).toBe(false);  // whitespace is not content
    expect(formComplete(defs[0], { owner_name: "Sara", due_at: "2026-08-01" })).toBe(true);
  });
});

test.describe("SCR-IPAD-630 dynamic-form runtime — per-section progress & live summary (M04-081/149)", () => {
  const A = item({ id: "a", code: "A", response_model: { responses: ["compliant", "non_compliant"] } });
  const B = item({ id: "b", code: "B", response_model: { responses: ["compliant", "non_compliant"] } });
  const cond = item({ id: "d", code: "D", response_model: { conditional: { visible_when: "flag=yes" } } });
  const secs = [section("s1", ["A", "B"]), section("s2", ["D"])];
  const map = imap([A, B, cond]);

  test("progress counts answered over visible items; hidden conditionals drop out; empty sections read 100%", () => {
    const ctx = {};                                                  // flag absent → D hidden
    const p = sectionProgress(secs, map, { a: { value: "compliant" } }, ctx);
    const s1 = p.find(x => x.key === "s1")!;
    const s2 = p.find(x => x.key === "s2")!;
    expect(s1).toMatchObject({ total: 2, answered: 1, pct: 50 });
    expect(s2).toMatchObject({ total: 0, answered: 0, pct: 100 });   // no visible item → complete
  });

  test("summary tallies answered/pending/compliant/non-compliant and mapped violations", () => {
    const V = item({ id: "v", code: "V", response_model: { responses: ["compliant", "non_compliant"], mapping: { non_compliant: { violation: "VC-1" } } } });
    const s = summarize([section("s", ["A", "B", "V"])], imap([A, B, V]), { a: { value: "compliant" }, v: { value: "non_compliant" } }, {}, 3);
    expect(s).toMatchObject({ answered: 2, pending: 1, compliant: 1, nonCompliant: 1, violations: 1, evidence: 3 });
  });
});

test.describe("SCR-IPAD-630 dynamic-form runtime — implied violations (M04-142)", () => {
  const vconfig: Record<string, VioConfig> = {
    "VC-1": { id: "vc1", code: "VC-1", title: "Blocked exit", level: "critical", penalty_ref: "PEN-1", legal_basis: null, mapping_version: "v1" },
  };
  const it = item({ id: "a", code: "A", response_model: { responses: ["compliant", "non_compliant"], mapping: { non_compliant: { violation: "VC-1", action_form: "corrective_action" } } } });

  test("a violation-mapped answer implies the configured violation; a compliant flip clears it", () => {
    const nonCompliant = impliedViolations([it], { a: { value: "non_compliant" } }, {}, vconfig);
    expect(nonCompliant).toHaveLength(1);
    expect(nonCompliant[0]).toMatchObject({ itemCode: "A", code: "VC-1", actionFormKey: "corrective_action" });
    expect(nonCompliant[0].config?.level).toBe("critical");
    expect(impliedViolations([it], { a: { value: "compliant" } }, {}, vconfig)).toEqual([]);
  });

  test("a hidden conditional item never implies a violation", () => {
    const hidden = item({ id: "h", code: "H", response_model: { conditional: { visible_when: "flag=yes" }, mapping: { non_compliant: { violation: "VC-1" } } } });
    expect(impliedViolations([hidden], { h: { value: "non_compliant" } }, {}, vconfig)).toEqual([]);
  });
});

test.describe("SCR-IPAD-630 dynamic-form runtime — canonical §20 Preliminary Compliance Rate (D-019)", () => {
  const scored = (id: string, code: string, weight: number): Item =>
    item({ id, code, score_weight: weight, response_model: { mapping: { compliant: { result: "compliant" }, non_compliant: { result: "non_compliant" } } } });

  test("rate = compliant answered scored / total answered scored, rounded to 0.1", () => {
    const items = [scored("a", "A", 1), scored("b", "B", 1), scored("c", "C", 1)];
    // 2 compliant of 3 answered scored → 66.7
    expect(computePreliminaryCompliance(items, { a: { value: "compliant" }, b: { value: "compliant" }, c: { value: "non_compliant" } }, {})).toBe(66.7);
  });

  test("returns null before any scored item is answered", () => {
    expect(computePreliminaryCompliance([scored("a", "A", 1)], {}, {})).toBeNull();
  });

  test("zero-weight, scoring-disabled and score-excluded (na) answers leave the denominator", () => {
    const weightless = scored("w", "W", 0);
    const disabled = item({ id: "x", code: "X", score_weight: 5, response_model: { scoring_enabled: false, mapping: { compliant: { result: "compliant" } } } });
    const naExcluded = item({ id: "n", code: "N", score_weight: 5, response_model: { score_excluded_on: ["na"], mapping: { na: { result: "compliant" } } } });
    const real = scored("r", "R", 1);
    expect(scoreExcluded(naExcluded, "na")).toBe(true);
    // Only R participates: 1/1 → 100. The other three are structurally excluded.
    expect(computePreliminaryCompliance(
      [weightless, disabled, naExcluded, real],
      { w: { value: "compliant" }, x: { value: "compliant" }, n: { value: "na" }, r: { value: "compliant" } }, {},
    )).toBe(100);
    // computeHealthScore is the preserved alias of the same §20 rate (D-019).
    expect(computeHealthScore([real], { r: { value: "compliant" } }, {})).toBe(100);
  });

  test("hidden conditional scored items never participate", () => {
    const hidden = item({ id: "h", code: "H", response_model: { conditional: { visible_when: "flag=yes" }, mapping: { non_compliant: { result: "non_compliant" } } } });
    expect(computePreliminaryCompliance([hidden], { h: { value: "non_compliant" } }, {})).toBeNull();
  });
});

test.describe("SCR-IPAD-630 dynamic-form runtime — grouped submit blockers (M04-199/200/204/208)", () => {
  test("groups unanswered · missing mandatory evidence · incomplete blocking forms; non-blocking forms never block", () => {
    const defs: FormDef[] = [
      { key: "corrective_action", title: "Corrective action", blocking: true, fields: ["owner_name"] },
      { key: "advisory_note", title: "Advisory", blocking: false, fields: ["owner_name"] },
    ];
    const unanswered = item({ id: "u", code: "U", response_model: { responses: ["compliant", "non_compliant"] } });
    const needsPhoto = item({ id: "p", code: "P", response_model: { responses: ["non_compliant"] }, evidence_rule: { on: "non_compliant", type: "photo", mandatory: true, min: 1 } });
    const needsForm = item({ id: "f", code: "F", response_model: { responses: ["non_compliant"], mapping: { non_compliant: { action_form: "corrective_action" } } } });
    const advisory = item({ id: "n", code: "N", response_model: { responses: ["non_compliant"], mapping: { non_compliant: { action_form: "advisory_note" } } } });

    const sections = [section("s", ["U", "P", "F", "N"])];
    const map = imap([unanswered, needsPhoto, needsForm, advisory]);
    const answers = { p: { value: "non_compliant" }, f: { value: "non_compliant" }, n: { value: "non_compliant" } };
    const blockers = computeBlockers(sections, map, answers, {}, {}, {}, defs);

    expect(blockers).toHaveLength(1);
    expect(blockers[0].unanswered).toEqual(["U"]);                   // U required and unanswered
    expect(blockers[0].evidence).toEqual(["P"]);                     // mandatory photo missing
    expect(blockers[0].forms).toEqual(["F"]);                        // blocking form incomplete; advisory N excluded
  });

  test("a satisfied section produces no blocker (positive path)", () => {
    const defs: FormDef[] = [{ key: "corrective_action", title: "Corrective action", blocking: true, fields: ["owner_name"] }];
    const needsPhoto = item({ id: "p", code: "P", response_model: { responses: ["non_compliant"] }, evidence_rule: { on: "non_compliant", type: "photo", mandatory: true, min: 1 } });
    const needsForm = item({ id: "f", code: "F", response_model: { responses: ["non_compliant"], mapping: { non_compliant: { action_form: "corrective_action" } } } });
    const sections = [section("s", ["P", "F"])];
    const map = imap([needsPhoto, needsForm]);
    const answers = { p: { value: "non_compliant" }, f: { value: "non_compliant" } };
    const evidence = { p: { photo: 1 } };
    const forms = { f: { owner_name: "Sara" } };
    expect(computeBlockers(sections, map, answers, {}, evidence, forms, defs)).toEqual([]);
  });
});

test.describe("SCR-IPAD-630 dynamic-form runtime — item lifecycle effective scope (§15 / D-017)", () => {
  const A = item({ id: "a", code: "A", response_model: { requirement: "optional", responses: ["compliant"] } });
  const B = item({ id: "b", code: "B", response_model: { responses: ["compliant"] } });
  const LIB = item({ id: "l", code: "L", response_model: { responses: ["compliant"] } });
  const map = imap([A, B, LIB]);
  const base = [section("s", ["A", "B"])];

  test("an actively deselected item leaves the effective scope; a reverted (restored) one stays", () => {
    const deselected: ItemStates = { a: { state: "deselected", reason: "N/A on site", active: true } };
    const eff = effectiveSections(base, map, deselected);
    expect(eff[0].items).toEqual(["B"]);                             // A removed

    const restored: ItemStates = { a: { state: "deselected", reason: "N/A on site", active: false } };
    expect(effectiveSections(base, map, restored)[0].items).toEqual(["A", "B"]);
  });

  test("an actively added library item lands in the synthetic added section; a snapshot duplicate is a no-op", () => {
    const added: ItemStates = { l: { state: "added", reason: null, active: true } };
    const eff = effectiveSections(base, map, added, "Added items");
    const addedSection = eff.find(s => s.key === ADDED_SECTION_KEY);
    expect(addedSection?.items).toEqual(["L"]);
    expect(addedSection?.title).toBe("Added items");

    // Adding an item already in the snapshot must not duplicate a section row.
    const dupe: ItemStates = { b: { state: "added", reason: null, active: true } };
    expect(effectiveSections(base, map, dupe).some(s => s.key === ADDED_SECTION_KEY)).toBe(false);
  });

  test("deselected items require nothing at submit and are excluded from progress and compliance", () => {
    const deselected: ItemStates = { b: { state: "deselected", reason: "duplicate check", active: true } };
    // B (required, unanswered) is deselected → no blocker, and progress runs over the reduced scope.
    expect(computeBlockers(base, map, {}, {}, {}, {}, [], deselected)).toEqual([]);
    const prog = sectionProgress(base, map, { a: { value: "compliant" } }, {}, deselected);
    expect(prog.find(s => s.key === "s")).toMatchObject({ total: 1, answered: 1, pct: 100 });

    // A deselected non-compliant scored item never drags the compliance rate.
    const scored = item({ id: "z", code: "Z", score_weight: 1, response_model: { mapping: { non_compliant: { result: "non_compliant" }, compliant: { result: "compliant" } } } });
    const good = item({ id: "g", code: "G", score_weight: 1, response_model: { mapping: { compliant: { result: "compliant" } } } });
    const withDeselect: ItemStates = { z: { state: "deselected", reason: "out of scope", active: true } };
    expect(computePreliminaryCompliance([scored, good], { z: { value: "non_compliant" }, g: { value: "compliant" } }, {}, withDeselect)).toBe(100);
  });
});
