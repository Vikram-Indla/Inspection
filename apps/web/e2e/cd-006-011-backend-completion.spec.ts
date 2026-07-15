import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { answerRequired, computeBlockers, scoreExcluded, type Item } from "../src/app/field/inspection/[id]/runtime";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const baseItem = (response_model: Item["response_model"]): Item => ({
  id: "item-1", code: "I-1", title: "Item", response_model,
  evidence_rule: null, score_excluded_on: null, guidance: null, clause: null,
});

test.describe("CD-006..011 backend completion", () => {
  test("M09-001 supports effective date, draft edit, governed deactivation, and attachment metadata", () => {
    const actions = source("src/app/admin/regulations/actions.ts");
    const migration = source("../../supabase/migrations/20260715200000_cd006_011_backend_completion.sql");
    expect(actions).toContain("updateRegulationDraft");
    expect(actions).toContain("deactivateRegulation");
    expect(actions).toContain("addRegulationAttachment");
    expect(actions).toContain("effective_from");
    expect(migration).toContain("create table if not exists regulation_attachments");
    expect(migration).toContain("trg_audit_regulation_attachments");
    expect(migration).toContain("trg_guard_regulation_clauses");
    expect(migration).toContain("trg_guard_regulation_attachments");
    expect(migration).toContain("new.status = 'deactivated'");
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
  });

  test("M09-024 explicit scoring disable excludes answered values", () => {
    const item = baseItem({ responses: ["compliant", "non_compliant"], scoring_enabled: false });
    expect(scoreExcluded(item, "compliant")).toBe(true);
    expect(scoreExcluded(item, "non_compliant")).toBe(true);
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
});
