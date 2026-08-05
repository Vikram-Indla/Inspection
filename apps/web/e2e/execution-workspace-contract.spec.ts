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
    // The manual "add action form" affordance was removed (governance finding
    // 2026-08-05): no BRD document describes a standalone form-creation path,
    // and the manual route produced forms with no way to fill their mandatory
    // fields, permanently blocking submission. The per-item flow (pushForm/
    // editForm, asserted elsewhere in this file) is the only route now, and
    // is what the requirements actually describe.
    expect(ws).not.toContain("addManualForm");
    expect(ws).not.toContain("afAddBtn");
    expect(ws).not.toContain("actionTemplates");
  });

  test("page loads library/item states tolerantly and fails closed on penalty conflicts", () => {
    const page = read(workspacePagePath);
    expect(page).toContain("inspection_item_states");
    expect(page).toContain("serverItemStates");
    // Complete active item library for the additional-item panel (§15).
    expect(page).toContain('sb.from("inspection_items")');
    expect(page).toContain('.eq("active", true)');
    expect(page).toContain("library={library}");
    // The manual "add action form" affordance's supporting fetch was removed
    // alongside the button (governance finding 2026-08-05) — no BRD document
    // describes a standalone form-creation path.
    expect(page).not.toContain('sb.from("configuration_templates")');
    // Penalty singularity: more than one active mapping → violation WITHOUT a
    // penalty and null mapping_version; the first row is never picked silently.
    expect(page).toContain("v.penalty_mappings.length > 1");
    expect(page).toContain("penalty_conflict: true");
    expect(page).toContain("Penalty mapping not available — settings conflict");
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
    expect(guardBlock).toContain("Inspection checklist not set up");
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

// INSP-773 — violations recordable against a facility not in production.
// Confirmed governed rule (INS-BR-045/BC021, product-contract/requirements-
// control/brd-notion-index/INS.md): a data-mismatch response is only
// recordable as a violation while the facility's on-site status this visit
// is Production; every other status must refuse it, explicitly, not
// silently. Source-contract assertions only: no browser, no live backend.
test.describe("INSP-773 facility production-status gate on violation creation", () => {
  const insp773MigrationPath = "supabase/migrations/20260805190000_insp773_violation_production_status_gate.sql";

  test("migration adds a BEFORE INSERT trigger on violations keyed on inspections.context->>'factory_status'", () => {
    expect(exists(insp773MigrationPath)).toBeTruthy();
    const sql = read(insp773MigrationPath);
    expect(sql).toContain("create or replace function public.guard_violation_production_status_gate()");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("i.context ->> 'factory_status'");
    // Refuses every non-Production status, explicitly — never a silent no-op.
    expect(sql).toContain("lower(v_factory_status) <> 'production'");
    expect(sql).toContain("EXE-VIOLATION-NOT-PRODUCTION");
    // Documented scope decision: no answer yet (null) does not retroactively
    // block every inspection that predates this field.
    expect(sql).toContain("v_factory_status is not null and lower(v_factory_status)");
    expect(sql).toContain("before insert on public.violations");
    expect(sql).toContain("trg_guard_violation_production_status");
    // The trigger function body itself only checks facility status — it has
    // no branch for INS-BR-047/BC023 (the two system-auto-generated
    // violation types, unimplemented in this codebase) to accidentally catch.
    const fn = sql.slice(sql.indexOf("create or replace function public.guard_violation_production_status_gate()"), sql.indexOf("revoke all"));
    expect(fn).not.toContain("BC023");
  });

  test("Workspace pre-checks facility status client-side before inserting, and surfaces the DB's refusal explicitly rather than a generic save-failed message", () => {
    const ws = read(workspacePath);
    expect(ws).toContain('const facilityStatus = ctxRef.current.factory_status;');
    expect(ws).toContain('if (facilityStatus && facilityStatus !== "production")');
    expect(ws).toContain("strings.vioFacilityNotProduction");
    // The DB trigger remains the authority: a stale-client race still gets
    // the same explicit message, not the generic save-failed copy, and is
    // never queued for a retry that would just refuse again.
    expect(ws).toContain('error.message.includes("EXE-VIOLATION-NOT-PRODUCTION")');
    // The mandatory facility-status picker is presented, wired through the
    // existing durable context mechanism (pushCtx/saveCtx) — no new
    // persistence path was invented for it.
    expect(ws).toContain("strings.facStatusTitle");
    expect(ws).toContain('saveCtx("factory_status", e.target.value)');
  });

  test("page defines the facility-status options and the explicit refusal copy, in business language", () => {
    const page = read(workspacePagePath);
    expect(page).toContain("facStatusLabels");
    expect(page).toContain("field.ws.facStatus.production");
    expect(page).toContain("field.ws.vio.notProduction");
    expect(page).toContain("INS-BR-045");
  });
});
