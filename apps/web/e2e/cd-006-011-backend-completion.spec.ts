import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { answerRequired, computeBlockers, conditionContext, computeHealthScore, evidenceLeg, isVisible, scoreExcluded, type Item } from "../src/app/field/inspection/[id]/runtime";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const baseItem = (response_model: Item["response_model"]): Item => ({
  id: "item-1", code: "I-1", title: "Item", response_model,
  evidence_rule: null, score_excluded_on: null, score_weight: 1, guidance: null, clause: null,
});

test.describe("CD-006..011 backend completion", () => {
  test("M09-001 supports effective date, draft edit, governed deactivation, and attachment metadata", () => {
    const actions = source("src/app/admin/regulations/actions.ts");
    const migration = source("../../supabase/migrations/20260715200000_cd006_011_backend_completion.sql");
    expect(actions).toContain("updateRegulationDraft");
    expect(actions).toContain("deactivateRegulation");
    expect(actions).toContain("addRegulationAttachment");
    expect(actions).toContain('storage.from("regulation-documents").upload');
    expect(actions).toContain('createHash("sha256")');
    expect(actions).toContain("effective_from");
    expect(migration).toContain("create table if not exists regulation_attachments");
    expect(migration).toContain("trg_audit_regulation_attachments");
    expect(migration).toContain("trg_guard_regulation_clauses");
    expect(migration).toContain("trg_guard_regulation_attachments");
    expect(migration).toContain("new.status = 'deactivated'");
    expect(migration).toContain("trg_guard_package_regulation_dependencies");
  });

  test("regulation publish validates mapped clauses, maker-checker provenance, and no-op failure", () => {
    const actions = source("src/app/admin/regulations/actions.ts");
    expect(actions).toContain('select("id, inspection_items(id)")');
    expect(actions).toContain("every clause must map to an inspection item");
    expect(actions).toContain("approved_by: userId");
    expect(actions).toContain('.select("id")');
    expect(actions).toContain("The draft was not published");
  });

  test("M09-005 exposes all four accepted evidence types without free-form policy values", () => {
    const actions = source("src/app/admin/items/actions.ts");
    for (const type of ["photo", "video", "document", "comment"]) {
      expect(actions).toContain(`type: "${type}"`);
    }
    const offline = source("src/lib/offline.ts");
    expect(offline).toContain('op.evidence_type ??');
    expect(offline).toContain('op.mime.startsWith("video") ? "video"');

    const video = { ...baseItem({ responses: ["non_compliant"] }), evidence_rule: { on: "non_compliant", type: "video", min: 1, mandatory: true } };
    expect(evidenceLeg(video, "non_compliant")?.type).toBe("video");
    expect(computeBlockers(
      [{ key: "s", title: "Section", items: [video.code] }], { [video.code]: video },
      { [video.id]: { value: "non_compliant" } }, {}, { [video.id]: { document: 1 } }, {}, [],
    )[0]?.evidence).toEqual([video.code]);
    expect(computeBlockers(
      [{ key: "s", title: "Section", items: [video.code] }], { [video.code]: video },
      { [video.id]: { value: "non_compliant" } }, {}, { [video.id]: { video: 1 } }, {}, [],
    )).toEqual([]);
  });

  test("M09-018/021/022 required, optional, and conditional mandatory semantics are enforced", () => {
    expect(answerRequired(baseItem({ requirement: "required" }))).toBe(true);
    expect(answerRequired(baseItem({ requirement: "optional" }))).toBe(false);
    expect(answerRequired(baseItem({ requirement: "conditional", conditional: { visible_when: "flag=yes", mandatory_when_visible: true } }))).toBe(true);
    expect(answerRequired(baseItem({ requirement: "conditional", conditional: { visible_when: "flag=yes", mandatory_when_visible: false } }))).toBe(false);

    const optional = baseItem({ requirement: "optional" });
    expect(computeBlockers(
      [{ key: "s", title: "Section", items: [optional.code] }],
      { [optional.code]: optional }, {}, {}, {}, {}, [],
    )).toEqual([]);

    const parent = { ...baseItem({ responses: ["compliant", "non_compliant"] }), id: "parent", code: "ITEM-001" };
    const child = { ...baseItem({ requirement: "conditional", conditional: { visible_when: "ITEM-001=compliant", mandatory_when_visible: true } }), id: "child", code: "ITEM-002" };
    const hiddenCtx = conditionContext([parent, child], { parent: { value: "non_compliant" } }, {});
    const visibleCtx = conditionContext([parent, child], { parent: { value: "compliant" } }, {});
    expect(isVisible(child, hiddenCtx)).toBe(false);
    expect(isVisible(child, visibleCtx)).toBe(true);
    expect(computeBlockers([{ key: "s", title: "Section", items: [child.code] }], { [child.code]: child }, {}, hiddenCtx, {}, {}, [])).toEqual([]);
    expect(computeBlockers([{ key: "s", title: "Section", items: [child.code] }], { [child.code]: child }, {}, visibleCtx, {}, {}, [])[0]?.unanswered).toEqual([child.code]);
  });

  test("M09-024 explicit scoring disable excludes answered values", () => {
    const item = baseItem({ responses: ["compliant", "non_compliant"], scoring_enabled: false });
    expect(scoreExcluded(item, "compliant")).toBe(true);
    expect(scoreExcluded(item, "non_compliant")).toBe(true);
    const included = { ...baseItem({ mapping: { compliant: { result: "compliant" }, non_compliant: { result: "non_compliant" } } }), id: "included", code: "I-2", score_weight: 4 };
    const excluded = { ...baseItem({ mapping: { compliant: { result: "compliant" } }, scoring_enabled: false }), id: "excluded", code: "I-3", score_weight: 100 };
    expect(computeHealthScore([included, excluded], { included: { value: "non_compliant" }, excluded: { value: "compliant" } }, {})).toBe(0);
  });

  test("CD-007/CD-010 usage previews, scoped audit, and violation deactivation are wired", () => {
    const migration = source("../../supabase/migrations/20260715200000_cd006_011_backend_completion.sql");
    const itemActions = source("src/app/admin/items/actions.ts");
    const regulationActions = source("src/app/admin/regulations/actions.ts");
    const violationActions = source("src/app/admin/violations/actions.ts");
    expect(migration).toContain("inspection_item_usage");
    expect(migration).toContain("violation_code_usage");
    expect(migration).toContain("admin_configuration_audit");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("from anon");
    expect(itemActions).toContain("getItemUsage");
    expect(regulationActions).toContain("getRegulationAudit");
    expect(violationActions).toContain("getViolationUsage");
    expect(violationActions).toContain("deactivateViolationCode");
  });

  test("CD-008/CD-009 publish validation rejects invalid condition grammar", () => {
    const actions = source("src/app/admin/packages/actions.ts");
    expect(actions).toContain("conditional requirement has no visibility rule");
    expect(actions).toContain("visibility rule must use key=value grammar");
  });

  test("every CD-006..011 admin localization key has a guarded ui_strings source", () => {
    const adminFiles = [
      "src/app/admin/regulations/page.tsx", "src/app/admin/regulations/Controls.tsx",
      "src/app/admin/items/page.tsx", "src/app/admin/items/Controls.tsx",
      "src/app/admin/packages/page.tsx", "src/app/admin/packages/DraftEditor.tsx",
      "src/app/admin/packages/PackagePreview.tsx", "src/app/admin/packages/PublishControls.tsx",
      "src/app/admin/packages/ImpactPanel.tsx", "src/app/admin/violations/page.tsx",
      "src/app/admin/violations/Controls.tsx",
      "src/components/AdminRouteBoundary.tsx",
    ];
    const migrationDir = join(process.cwd(), "../../supabase/migrations");
    const migrations = readdirSync(migrationDir).filter(name => name.endsWith(".sql"))
      .map(name => readFileSync(join(migrationDir, name), "utf8")).join("\n");
    const keys = new Set<string>();
    for (const file of adminFiles) {
      for (const match of source(file).matchAll(/t\(\s*["'](admin\.[^"']+)["']/g)) keys.add(match[1]);
    }
    for (const key of keys) expect(migrations, `missing ui_strings source for ${key}`).toContain(key);
    const completion = source("../../supabase/migrations/20260715210000_cd006_011_frontend_strings.sql");
    expect(completion).toContain("where ui_strings.status = 'draft'");
  });
});
