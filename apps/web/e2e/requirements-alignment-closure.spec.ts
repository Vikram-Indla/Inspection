import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(resolve(
  process.cwd(),
  "../../supabase/migrations/20260729010000_requirements_alignment_closure.sql",
), "utf8");
const singleAction = readFileSync(resolve(
  process.cwd(),
  "src/app/(app)/planning/single/actions.ts",
), "utf8");
const singleWizard = readFileSync(resolve(
  process.cwd(),
  "src/app/(app)/planning/single/Wizard.tsx",
), "utf8");
const planningPage = readFileSync(resolve(
  process.cwd(),
  "src/app/(app)/planning/page.tsx",
), "utf8");

test.describe("REQ-ALIGNMENT-CLOSURE-IMPLEMENTATION-001 source contract", () => {
  test("REQ-013 resolves an effective versioned inclusive cutoff", () => {
    expect(migration).toContain("create table if not exists public.planning_lifecycle_rules");
    expect(migration).toContain("'planner_cancel_reschedule_window', 1, 2592000, 'inclusive'");
    expect(migration).toContain("p_evaluated_at<=cutoff_at");
    expect(migration).toContain("PLANNING-CUTOFF-NOT-CONFIGURED");
    expect(migration).toContain("cutoff_rule_version");
    expect(migration).toContain("trg_guard_planning_lifecycle_cutoff");
    expect(migration).toContain("trg_stamp_planning_cutoff_receipt");
    expect(migration).not.toContain("interval '720 hours'");
  });

  test("REQ-011/016 preserves saved history and fails closed for stale identity", () => {
    expect(migration).toContain("assert_resumed_planning_target_current");
    expect(migration).toContain("PLANNING-DRAFT-TARGET-RESELECT-REQUIRED");
    expect(migration).not.toMatch(/update\s+public\.visit_plans\s+set\s+draft_payload/i);
    expect(migration).not.toMatch(/update\s+public\.factories/i);
    expect(singleWizard).toContain('name="target_reselected"');
    expect(singleWizard).toContain("setTargetReselected(true)");
    expect(singleAction).toContain('sb.rpc("assert_resumed_planning_target_current"');
    expect(singleAction).toContain("The historical draft remains unchanged");
  });

  test("REQ-008 returns explainable availability and region factors", () => {
    expect(migration).toContain("recommend_planning_inspectors");
    expect(migration).toContain("'region_factor_available'");
    expect(migration).toContain("'active_inspector_role'");
    expect(migration).toContain("'window_capacity'");
    expect(migration).toContain("inspector_window_capacity");
    expect(migration).toContain("trg_apply_planning_assignment_recommendation");
    expect(migration).toContain("'ranked_candidates'");
    expect(singleAction).toContain('sb.rpc("recommend_planning_inspectors"');
    expect(migration).toContain("override_planning_assignment_atomic");
    expect(migration).toContain("planning.override_assignment");
    expect(migration).toContain("assignment_override_reason");
    expect(migration).toContain("PLANNING_ASSIGNMENT_OVERRIDE");
    expect(migration).toContain("and p.account_status='active'");
    expect(migration).toContain("planning.create.single");
    expect(migration).toContain("planning.create.bulk");
    expect(migration).toContain("planning.create.immediate");
    expect(migration).toContain("v_planning_method:='immediate'");
    expect(migration).toContain("v_planning_method not in ('single','bulk','immediate')");
    expect(migration).toContain("'planning_method',v_planning_method");
    expect(migration).toContain("PLANNING-RECOMMENDATION-CAPACITY-UNAVAILABLE");
    expect(migration).not.toContain("coalesce(to_jsonb(p)->>'account_status','active')");
  });

  test("REQ-018 uses configured attachment policy without invented defaults", () => {
    expect(migration).toContain("planning_attachment_policies");
    expect(migration).toContain("PLANNING-ATTACHMENT-POLICY-NOT-CONFIGURED");
    expect(migration).toContain("allowed_mime_types");
    expect(migration).toContain("max_file_bytes");
    expect(migration).toContain("v_size_text is null or v_size_text!~'^[0-9]+$'");
    expect(migration).toContain("exception when numeric_value_out_of_range");
    expect(migration).toContain("v_size_bytes>v_policy.max_file_bytes");
    expect(migration).not.toContain("coalesce((v_item->>'size_bytes')::bigint,-1)");
    expect(migration).not.toMatch(/image\/jpeg.*image\/png/);
  });

  test("REQ-005/014 retains Immediate as a truthful permissioned exception", () => {
    expect(planningPage).toContain('title: t("plan.method.single.title", "Plan single visit")');
    expect(planningPage).not.toContain('"Plan one visit"');
    expect(planningPage).toContain("separately permissioned urgent visit");
    expect(planningPage).toContain("remain unverified");
    expect(planningPage).not.toContain("plan.method.decisionPending");
  });

  test("Single Visit search does not render stale results as a false no-match", () => {
    expect(singleWizard).toContain("useTransition");
    expect(singleWizard).toContain("const searchSettled = queryInput.trim() === query && !searchPending");
    expect(singleWizard).toContain("searching && searchSettled && !registryUnavailable");
    expect(singleWizard).toContain("aria-busy={!searchSettled}");
    expect(singleWizard).toContain("searchSettled && results.length > 0");
    expect(singleWizard).toContain("searchSettled && portfolios.length > 0");
  });
});
