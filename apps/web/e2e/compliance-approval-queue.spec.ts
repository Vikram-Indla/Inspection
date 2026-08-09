import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-WEB-COMPLIANCE-APPROVAL-QUEUE-004
// CMP-REQ-APQ-001..006 · CMP-ACC-APQ-001..020
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const readWeb = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");
const readRepo = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");

test.describe("Prompt 04 Compliance Approval Queue contract", () => {
  const queue = readWeb("src/app/(app)/admin/compliance-approvals/page.tsx");
  const layout = readWeb("src/app/(app)/admin/compliance-approvals/layout.tsx");
  const workspace = readWeb("src/app/(app)/admin/compliance-requests/[id]/page.tsx");
  const actions = readWeb("src/app/(app)/admin/compliance-requests/actions.ts");
  const navigation = readWeb("src/lib/shell-navigation.ts");
  const migration = readRepo("supabase/migrations/20260719213000_compliance_configuration_request_engine.sql");

  test("shared navigation resolves to a distinct Compliance queue route", () => {
    expect(navigation).toContain('href: "/admin/compliance-approvals"');
    expect(queue).toContain("Distinct from Inspection Review & Approval");
    expect(queue).toContain("does not contain inspection reports or Level 2 inspection reviews");
  });

  test("queue route is limited to existing reviewer authority", () => {
    // PO ruling 2026-08-05 (CC-CCR-REVIEWER-SUPERVISOR-20260805 / INSP-751):
    // supervisors approve compliance changes; the original compliance_admin/
    // reviewer names were never registered roles. The route boundary admits
    // admin (author visibility) and supervisor; the DB approval gate is
    // supervisor/compliance_admin/reviewer and stays maker-checked.
    expect(layout).toContain('allowedRoles={["admin", "supervisor"]}');
    const reviewerWidening = readRepo("supabase/migrations/20260805110000_ccr_reviewer_admit_supervisor.sql");
    expect(reviewerWidening).toContain("array['supervisor','compliance_admin','reviewer']");
    expect(migration).toContain("create policy ccr_requests_read");
    expect(migration).toContain("owner_id = auth.uid() or public.ccr_is_reviewer()");
  });

  test("maker-owned requests are excluded while the database remains authority", () => {
    expect(queue).toContain("row.owner_id !== user.id");
    expect(queue).toContain("Makers cannot decide or publish their own requests");
    expect(migration).toContain("if r.owner_id=auth.uid() then raise exception 'CCR_MAKER_CHECKER'");
  });

  test("queue has factual status views, deterministic order and progress", () => {
    for (const label of ["Pending Review", "Partially Approved", "Ready to Publish", "Decision progress", "Dependencies", "Correlation"])
      expect(queue).toContain(label);
    expect(queue).toContain('.order("submitted_at", { ascending: true })');
    expect(queue).toContain("no deadline or priority is assumed");
  });

  test("review workspace preserves component compare, comments and publication controls", () => {
    expect(queue).toContain("Open review");
    expect(workspace).toContain("Current value");
    expect(workspace).toContain("Proposed value");
    expect(workspace).toContain("Approve component");
    expect(workspace).toContain("Reject component");
    expect(workspace).toContain("Return reason (required)");
    expect(workspace).toContain("Rejection reason (required)");
    expect(workspace).toContain("Publish approved branches transactionally");
    expect(actions).toContain('revalidatePath("/admin/compliance-approvals")');
  });

  test("queue performs no direct decision writes and exposes honest states", () => {
    expect(queue).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.rpc\(/);
    expect(queue).toContain("Awaiting Approval can't load");
    expect(queue).toContain("No eligible maker-checker assignments for this view.");
    expect(readWeb("src/app/(app)/admin/compliance-approvals/loading.tsx")).toContain("Loading Awaiting Approval");
    expect(readWeb("src/app/(app)/admin/compliance-approvals/error.tsx")).toContain("no decision was recorded");
  });
});
