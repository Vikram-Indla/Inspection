import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { answerRequired, computeBlockers, conditionContext, computeHealthScore, evidenceLeg, isVisible, scoreExcluded, type Item } from "../src/app/(app)/field/inspection/[id]/runtime";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const baseItem = (response_model: Item["response_model"]): Item => ({
  id: "item-1", code: "I-1", title: "Item", response_model,
  evidence_rule: null, score_excluded_on: null, score_weight: 1, guidance: null, clause: null,
});

test.describe("CD-006..011 backend completion", () => {
  test("M09-001 supports effective date, governed lifecycle with reason, and attachment metadata", () => {
    // Direct draft/attachment writes moved into the governed Compliance
    // Configuration Request engine; the regulations surface keeps only the
    // reasoned lifecycle RPCs behind requireConfigurationWriter.
    const actions = source("src/app/(app)/admin/regulations/actions.ts");
    const ccrActions = source("src/app/(app)/admin/compliance-requests/actions.ts");
    const regulationsPage = source("src/app/(app)/admin/regulations/page.tsx");
    const migration = source("../../supabase/migrations/20260715200000_cd006_011_backend_completion.sql");
    expect(actions).toContain("requireConfigurationWriter");
    expect(actions).toContain("deactivateRegulation");
    expect(actions).toContain('if (!reason) return { errorCode: "reason_required" }');
    expect(ccrActions).toContain('sb.rpc("create_compliance_request"');
    expect(ccrActions).toContain('rpc("update_compliance_request_draft"');
    expect(regulationsPage).toContain("effective_from");
    expect(regulationsPage).toContain("regulation_attachments");
    expect(migration).toContain("create table if not exists regulation_attachments");
    expect(migration).toContain("trg_audit_regulation_attachments");
    expect(migration).toContain("trg_guard_regulation_clauses");
    expect(migration).toContain("trg_guard_regulation_attachments");
    expect(migration).toContain("new.status = 'deactivated'");
    expect(migration).toContain("trg_guard_package_regulation_dependencies");
  });

  test("regulation publish validates mapped clauses, maker-checker provenance, and no-op failure", () => {
    // Publish left the direct surface for the CCR flow; the database contract
    // stays authoritative and the approval queue excludes the request owner.
    const approvalsQueries = source("src/features/compliance/queries.ts");
    const ccrActions = source("src/app/(app)/admin/compliance-requests/actions.ts");
    const authoritative = source("../../supabase/migrations/20260715220000_m09_authoritative_contract_completion.sql");
    expect(ccrActions).toContain('rpc("submit_compliance_request"');
    expect(approvalsQueries).toContain("row.owner_id !== user.id");
    expect(authoritative).toContain("maker-checker requires a distinct approver");
    expect(authoritative).toContain("successor effective date must follow active version");
    expect(authoritative).toContain("every regulation clause must map to an inspection item");
  });

  test("authoritative M09 contract closes versioning, templates, relationship rules, outcomes and frozen dependencies", () => {
    const migration = source("../../supabase/migrations/20260715220000_m09_authoritative_contract_completion.sql");
    const packages = source("src/app/(app)/admin/packages/actions.ts");
    const items = source("src/app/(app)/admin/items/actions.ts");
    const violations = source("src/app/(app)/admin/violations/actions.ts");
    const templates = source("src/app/(app)/admin/templates/actions.ts");
    const field = source("src/app/(app)/field/inspection/[id]/page.tsx");
    const report = source("src/app/reports/inspection/[id]/page.tsx");
    for (const token of [
      "configuration_templates", "inspection_item_versions", "corrective_action", "grace_period_days",
      "penalty_type", "template_version_id", "title_en and title_ar", "item_rules",
      "package_version_dependency_snapshots", "inspection_penalties", "issue_penalties_after_approval",
    ]) expect(migration).toContain(token);
    expect(packages).toContain("response_mapping");
    expect(packages).toContain("violation_snapshot");
    expect(packages).toContain("template_snapshot");
    expect(packages).toContain("English and Arabic names are required");
    expect(items).toContain('"needs_review"');
    expect(items).toContain("reviewer_flag: true");
    expect(violations).toContain("publishViolationCode");
    expect(source("src/app/(app)/admin/violations/page.tsx")).toContain("corrective_action");
    expect(templates).toContain("publishTemplateVersion");
    expect(field).toContain("companionViolations");
    expect(report).toContain("snap.violations");
  });

  test("M09-005 exposes all four accepted evidence types without free-form policy values", () => {
    const actions = source("src/app/(app)/admin/items/actions.ts");
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
    const itemActions = source("src/app/(app)/admin/items/actions.ts");
    const regulationActions = source("src/app/(app)/admin/regulations/actions.ts");
    const violationActions = source("src/app/(app)/admin/violations/actions.ts");
    expect(migration).toContain("inspection_item_usage");
    expect(migration).toContain("violation_code_usage");
    expect(migration).toContain("admin_configuration_audit");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("from anon");
    expect(itemActions).toContain("getItemUsage");
    expect(source("src/app/(app)/admin/regulations/page.tsx")).toContain('sb.rpc("compliance_regulation_audit"');
    expect(regulationActions).toContain("requireConfigurationWriter");
    expect(violationActions).toContain("getViolationUsage");
    expect(violationActions).toContain("deactivateViolationCode");
  });

  test("trigger-only and system issuance functions are not exposed as public RPCs", () => {
    const hardening = source("../../supabase/migrations/20260716200000_cd006_011_trigger_rpc_hardening.sql");
    for (const fn of [
      "archive_inspection_item_version",
      "materialize_informational_penalty",
      "issue_penalties_after_approval",
    ]) {
      expect(hardening).toContain(`revoke all on function public.${fn}()`);
    }
    expect(hardening).toContain("from public, anon, authenticated");
  });

  test("admin renders verify asymmetric JWT claims without per-component Auth API calls", () => {
    const middleware = source("src/middleware.ts");
    const serverAuth = source("src/lib/supabase-server.ts");
    expect(middleware).toContain("supabase.auth.getClaims()");
    expect(middleware).not.toContain("supabase.auth.getUser()");
    expect(serverAuth).toContain("cache(async () =>");
    expect(serverAuth).toContain("sb.auth.getClaims()");
  });

  test("CD-008/CD-009 publish validation rejects invalid condition grammar", () => {
    const actions = source("src/app/(app)/admin/packages/actions.ts");
    const migration = source("../../supabase/migrations/20260715200000_cd006_011_backend_completion.sql");
    const relationshipHardening = source("../../supabase/migrations/20260716210000_m09_relationship_contract_hardening.sql");
    expect(actions).toContain("conditional requirement has no visibility rule");
    expect(actions).toContain("visibility rule must use key=value grammar");
    expect(actions).toContain("Circular visibility rule");
    expect(actions).toContain("mandatory_when_visible must be boolean");
    expect(actions).toContain("scoring_enabled must be boolean");
    expect(actions).toContain("evidence type must be photo, video, document, or comment");
    expect(actions).toContain("item_snapshot");
    expect(actions).toContain('sb.rpc("publish_package_version"');
    expect(migration).toContain("package_version_item_snapshots");
    expect(migration).toContain("package_version_one_open_governed");
    expect(migration).toContain("maker-checker requires a distinct approver");
    expect(relationshipHardening).toContain("validate_inspection_item_authoring");
    expect(relationshipHardening).toContain("scoring-disabled responses must all be excluded");
    expect(relationshipHardening).toContain("circular visible_when chain");
    expect(relationshipHardening).toContain("evidence type is not accepted");
    expect(relationshipHardening).toContain("before insert or update of response_model");
    expect(source("src/app/(app)/field/inspection/[id]/page.tsx")).toContain("frozenDefinition.item_snapshot");
    expect(source("src/app/(app)/field/inspection/[id]/page.tsx")).toContain("companionSnapshot");
  });

  test("every CD-006..011 admin localization key has a guarded ui_strings source", () => {
    const adminFiles = [
      "src/app/(app)/admin/regulations/page.tsx", "src/app/(app)/admin/regulations/Controls.tsx",
      "src/app/(app)/admin/packages/page.tsx", "src/app/(app)/admin/packages/DraftEditor.tsx",
      "src/app/(app)/admin/packages/PackagePreview.tsx", "src/app/(app)/admin/packages/PublishControls.tsx",
      "src/app/(app)/admin/packages/ImpactPanel.tsx", "src/app/(app)/admin/violations/page.tsx",
      "src/app/(app)/admin/violations/Controls.tsx",
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
