import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-EXECUTION-MODULE-001 · Phase 5 — Execution workspace item lifecycle,
// canonical compliance formula, violation candidates, action forms
// (SAQEEL-EXE-CANONICAL-PLAN v1.0 §15/§18/§20). Source-contract assertions
// only: no browser, no live backend.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

const migrationPath = "supabase/migrations/20260721150000_execution_item_lifecycle.sql";
const runtimePath = "apps/web/src/app/(app)/field/inspection/[id]/runtime.ts";
const offlinePath = "apps/web/src/lib/offline.ts";
const workspacePath = "apps/web/src/app/(app)/field/inspection/[id]/Workspace.tsx";
const workspacePagePath = "apps/web/src/app/(app)/field/inspection/[id]/page.tsx";
const decisionLogPath = "product-contract/execution/EXECUTION_DECISION_LOG.md";

test.describe("TASK-EXECUTION-MODULE-001 Phase 5 workspace item lifecycle", () => {
  test("migration creates inspection_item_states with a mandatory deselect reason and least-privilege RLS", () => {
    expect(exists(migrationPath)).toBeTruthy();
    const sql = read(migrationPath);
    expect(sql).toContain("create table if not exists public.inspection_item_states");
    expect(sql).toContain("inspection_id uuid not null references public.inspections(id)");
    expect(sql).toContain("item_id uuid not null references public.inspection_items(id)");
    expect(sql).toContain("state in ('added', 'deselected')");
    expect(sql).toContain("reverted_at timestamptz");
    expect(sql).toContain("primary key (inspection_id, item_id)");
    // Deselect requires a non-empty reason; added allows a null reason.
    expect(sql).toContain("inspection_item_states_reason_shape");
    expect(sql).toContain("reason is not null and length(trim(reason)) > 0");
    // RLS mirrors the responses_rw approach: read for inspector + oversight,
    // write for the assigned inspector only; no delete anywhere.
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("inspection_item_states_read");
    expect(sql).toContain("inspection_item_states_inspector_insert");
    expect(sql).toContain("inspection_item_states_inspector_update");
    expect(sql).toContain("is_assigned_inspector(i.visit_id)");
    expect(sql).not.toMatch(/create policy \w+ on public\.inspection_item_states\s+for delete/i);
    expect(sql).not.toMatch(/grant [^\n]*delete[^\n]*on table public\.inspection_item_states/i);
    // Submitted lock reuses the 0002 guard function verbatim via trigger.
    expect(sql).toContain("trg_guard_item_state");
    expect(sql).toContain("execute function public.guard_submitted_inspection()");
    // audit_row_change is incompatible with the composite PK; an equivalent
    // composite-key audit trigger is attached instead (D-017).
    expect(sql).toContain("audit_item_state_change");
    expect(sql).toContain("trg_audit_item_state");
  });

  test("violations gain invalidation columns with a narrow update guard (insert-only preserved)", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("alter table public.violations add column if not exists invalidated_at timestamptz");
    expect(sql).toContain("alter table public.violations add column if not exists invalidated_by uuid");
    expect(sql).toContain("alter table public.violations add column if not exists invalidate_reason text");
    expect(sql).toContain("violations_active_inspection_idx");
    expect(sql).toContain("where invalidated_at is null");
    // The guard allows ONLY the three invalidation columns to change, the
    // invalidation can never be cleared, and the parent lock list matches
    // guard_submitted_inspection.
    expect(sql).toContain("guard_violation_invalidate");
    expect(sql).toContain("before update on public.violations");
    expect(sql).toContain("new.violation_code_id is distinct from old.violation_code_id");
    expect(sql).toContain("new.mapping_version is distinct from old.mapping_version");
    expect(sql).toContain("new.invalidated_at is null");
    expect(sql).toContain("'submitted', 'under_review', 'approved', 'rejected'");
    // The update policy exists solely for the invalidation path.
    expect(sql).toContain("violations_invalidate");
  });

  test("runtime exposes the effective-set scope and the canonical §20 compliance rate", () => {
    const runtime = read(runtimePath);
    expect(runtime).toContain("export type ItemStates");
    expect(runtime).toContain("export const ADDED_SECTION_KEY");
    expect(runtime).toContain("export function effectiveSections");
    // Effective set = snapshot MINUS actively deselected PLUS actively added (deduped).
    expect(runtime).toContain('itemStates[it.id]?.state === "deselected"');
    expect(runtime).toContain('st.state !== "added"');
    // §20 formula pinned: compliant answered scored / total answered scored.
    expect(runtime).toContain("export function computePreliminaryCompliance");
    expect(runtime).toContain("compliant / answeredScored");
    // computeHealthScore signature preserved — delegates to the §20 rate (D-019).
    expect(runtime).toContain("export function computeHealthScore");
    expect(runtime).toContain("return computePreliminaryCompliance(items, answers, ctx, itemStates);");
    // Progress / summary / blockers accept itemStates and run the effective scope.
    expect(runtime).toContain("itemStates?: ItemStates");
    expect(runtime).toContain("const eff = itemStates ? effectiveSections(sections, imap, itemStates) : sections;");
  });

  test("offline outbox replays item_state and violation_invalidate idempotently", () => {
    const offline = read(offlinePath);
    expect(offline).toContain('kind: "item_state"');
    expect(offline).toContain('kind: "violation_invalidate"');
    expect(offline).toContain('op.kind === "item_state"');
    expect(offline).toContain('op.kind === "violation_invalidate"');
    // item_state upserts the desired final row on the composite key.
    expect(offline).toContain('sb.from("inspection_item_states").upsert');
    expect(offline).toContain('onConflict: "inspection_id,item_id"');
    // invalidate stamps the three columns, never deletes; the dependent
    // trigger-generated action forms are cancelled in the same replay (D-018).
    expect(offline).toContain("invalidated_at: new Date().toISOString()");
    expect(offline).toContain("invalidate_reason: op.reason");
    expect(offline).not.toMatch(/from\("violations"\)\.delete/);
    expect(offline).toContain('sb.from("action_forms").update({ status: "cancelled" })');
    expect(offline).toContain('.eq("violation_id", vid)');
  });

  test("Workspace wires deselect-with-reason, restore, add-item, invalidation and manual forms", () => {
    const ws = read(workspacePath);
    // Effective scope drives every runtime view.
    expect(ws).toContain("effectiveSections(sections, allMap, itemStates, strings.libAddedGroup)");
    expect(ws).toContain("sectionProgress(sections, allMap, answers, runtimeCtx, itemStates)");
    expect(ws).toContain("computeBlockers(sections, allMap, answers, runtimeCtx, evidencePerItem, forms, formDefs, itemStates)");
    // Deselect: optional/added only (fail closed when metadata is absent), dialog with mandatory reason.
    expect(ws).toContain('itemRules[it.code]?.requirement ?? "required"');
    expect(ws).toContain("setDeselecting({ item: it, reason: \"\" })");
    expect(ws).toContain("deselectNeedsReason");
    expect(ws).toContain("confirmDeselect");
    // Restore before submit via the same item_state op (reverted_at stamped).
    expect(ws).toContain("restoreBtn");
    expect(ws).toContain("pushItemState");
    expect(ws).toContain('kind: "item_state"');
    // Add from the active library; dedupe against the effective set.
    expect(ws).toContain("libraryCandidates");
    expect(ws).toContain('pushItemState(it, "added", null, false)');
    // Violation candidate lifecycle: invalidate (never delete) on Compliant flip.
    expect(ws).toContain("invalidateViolation");
    expect(ws).toContain('"Response changed to compliant"');
    expect(ws).toContain('kind: "violation_invalidate"');
    // Invalidated candidates stay visible with state; conflict shown honestly.
    expect(ws).toContain("invalidatedList");
    expect(ws).toContain('data-state="invalidated"');
    expect(ws).toContain("vioInvalidated");
    expect(ws).toContain("vioPenaltyConflict");
    // Manual action forms from published templates; included ≠ completed.
    expect(ws).toContain("addManualForm");
    expect(ws).toContain("afAddBtn");
    expect(ws).toContain("actionTemplates");
  });

  test("page loads library/item states/templates tolerantly and fails closed on penalty conflicts", () => {
    const page = read(workspacePagePath);
    expect(page).toContain("inspection_item_states");
    expect(page).toContain("serverItemStates");
    // Complete active item library for the additional-item panel (§15).
    expect(page).toContain('sb.from("inspection_items")');
    expect(page).toContain('.eq("active", true)');
    expect(page).toContain("library={library}");
    // Published action_form configuration templates for the manual add (§18).
    expect(page).toContain('sb.from("configuration_templates")');
    expect(page).toContain('"action_form"');
    // Penalty singularity: more than one active mapping → violation WITHOUT a
    // penalty and null mapping_version; the first row is never picked silently.
    expect(page).toContain("v.penalty_mappings.length > 1");
    expect(page).toContain("penalty_conflict: true");
    expect(page).toContain("Penalty mapping unavailable — configuration conflict");
  });

  test("new copy carries no banned plain-language-remediation phrases", () => {
    // Mirrors the banned list in e2e/terminology-regression.spec.ts.
    const banned = [
      "CR dossier",
      "Factory dossier",
      "factory registry",
      "plan register",
      "penalty lineage",
      "Evidence readiness & SLA-risk fingerprint",
      "scan-first queue",
      "contract-unverified",
      "RLS-scoped",
      "server-side projection",
      "read model",
    ];
    for (const file of [workspacePath, workspacePagePath, runtimePath, offlinePath]) {
      const content = read(file);
      for (const phrase of banned) {
        expect(content.includes(phrase), `${file} contains banned phrase "${phrase}"`).toBe(false);
      }
      expect(/dossier/i.test(content), `${file} contains bare "dossier"`).toBe(false);
    }
  });

  test("decision log records D-017, D-018 and D-019", () => {
    const log = read(decisionLogPath);
    expect(log).toContain("D-017");
    expect(log).toContain("D-018");
    expect(log).toContain("D-019");
  });
});

test.describe("PLAN item 4 report-kind package switch", () => {
  const page = read(workspacePagePath);
  const frozenDefinitionAt = page.indexOf("const frozenDefinition = packageVersion.definition;");
  const guardAt = page.indexOf("if (frozenDefinition.package_kind)");
  const packageCodesAt = page.indexOf("const packageCodes =");
  const guardBlock = page.slice(guardAt, packageCodesAt);

  test("a real visit-report definition without package_kind keeps the existing workspace path", () => {
    const visitReportDefinition: { package_kind?: unknown; sections: { items: string[] }[] } = {
      sections: [{ items: ["VISIT-001"] }],
    };

    expect(Boolean(visitReportDefinition.package_kind)).toBe(false);
    expect(frozenDefinitionAt).toBeGreaterThan(-1);
    expect(guardAt).toBeGreaterThan(frozenDefinitionAt);
    expect(packageCodesAt).toBeGreaterThan(guardAt);
    expect(page.slice(packageCodesAt)).toContain("<FactoryVerification");
    expect(page.slice(packageCodesAt)).toContain("<Workspace");
  });

  test("known draft package kinds return the governed empty state before protected reads", () => {
    for (const package_kind of ["chemical_clearance", "customs_exemption"]) {
      expect(Boolean(package_kind)).toBe(true);
    }

    expect(guardBlock).toContain("return (");
    expect(guardBlock).toContain("header(t(");
    expect(guardBlock).toContain('className="empty"');
    expect(guardBlock).toContain("Inspection package not configured");
    expect(guardBlock).not.toContain("<FactoryVerification");
    expect(guardBlock).not.toContain("<Workspace");

    for (const protectedRead of [
      "const itemRead =",
      "const libraryRead =",
      'sb.from("checklist_responses")',
      'sb.from("violations")',
    ]) {
      expect(page.indexOf(protectedRead), `${protectedRead} must remain after the early return`).toBeGreaterThan(guardAt);
    }
  });

  test("an unrecognized truthy package_kind also fails closed without an allowlist", () => {
    expect(Boolean("future_unknown_report_kind")).toBe(true);
    expect(guardBlock).toContain("if (frozenDefinition.package_kind)");
    expect(guardBlock).not.toContain("chemical_clearance");
    expect(guardBlock).not.toContain("customs_exemption");
    expect(guardBlock).not.toMatch(/includes|switch|case/);
  });
});
