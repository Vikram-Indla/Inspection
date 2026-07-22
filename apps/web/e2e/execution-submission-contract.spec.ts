import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-EXECUTION-MODULE-001 · Phase 6 — Submission + Review hardening
// (SAQEEL-EXE-CANONICAL-PLAN v1.0 §21/§22). Source-contract assertions only:
// no browser, no live backend.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

test.describe("TASK-EXECUTION-MODULE-001 Phase 6 submission + review hardening", () => {
  const migrationPath = "supabase/migrations/20260721160000_execution_submission_review.sql";
  const offlinePath = "apps/web/src/lib/offline.ts";
  const workspacePath = "apps/web/src/app/(app)/field/inspection/[id]/Workspace.tsx";
  const opsSlaPath = "apps/web/src/app/(app)/operations/sla.ts";
  const opsPagePath = "apps/web/src/app/(app)/operations/page.tsx";

  test("submit_inspection RPC is one atomic definer transaction with every §21 guard", () => {
    expect(exists(migrationPath)).toBeTruthy();
    const sql = read(migrationPath);
    expect(sql).toContain("create or replace function public.submit_inspection(");
    expect(sql).toContain("p_inspection uuid");
    expect(sql).toContain("p_snapshot jsonb");
    expect(sql).toContain("p_idempotency_key text");
    expect(sql).toContain("p_acknowledgement jsonb");
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    // Guards: assigned inspector + capability, lifecycle states.
    expect(sql).toContain("public.is_assigned_inspector(v_ins.visit_id)");
    expect(sql).toContain("public.has_capability('execution.submit')");
    expect(sql).toContain("EXE-SUBMIT-TERMINAL");
    expect(sql).toContain("EXE-SUBMIT-UNDER-REVIEW");
    // Idempotent replay returns the existing version.
    expect(sql).toContain("where sv.idempotency_key = p_idempotency_key");
    expect(sql).toContain("'reused', true");
    expect(sql).toContain("when unique_violation then");
    // Granted to authenticated only.
    expect(sql).toContain("grant execute on function public.submit_inspection(uuid, jsonb, text, jsonb) to authenticated");
    expect(sql).toContain("revoke all on function public.submit_inspection(uuid, jsonb, text, jsonb) from public, anon");
  });

  test("version numbering is server-authoritative under a row lock (client race fixed)", () => {
    const sql = read(migrationPath);
    // The inspections row lock serializes concurrent devices before max+1.
    expect(sql).toContain("from public.inspections i where i.id = p_inspection for update");
    expect(sql).toContain("coalesce(max(sv.version_number), 0) + 1");
  });

  test("returned-scope byte-equality guard blocks out-of-scope changes (D-020)", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("EXE-SUBMIT-SCOPE-VIOLATION");
    // Latest decided Return review is the sole scope authority.
    expect(sql).toContain("r.decision = 'return'");
    expect(sql).toContain("r.returned_sections is not null");
    // Canonical jsonb comparison of per-section sub-objects; evidence by id+sha.
    expect(sql).toContain("private.execution_section_slice");
    expect(sql).toContain("private.execution_evidence_sorted");
    expect(sql).toContain("jsonb_object_keys(coalesce(p_snapshot -> 'sections'");
    // Legacy prior snapshots are sliced from flat maps via section membership.
    expect(sql).toContain("p_section_items -> p_section_key");
  });

  test("mandatory-evidence-sync precondition is enforced over frozen snapshot rules (D-022)", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("EXE-SUBMIT-EVIDENCE-PENDING");
    // Unsynced evidence blocks; deleted/archived rows never count.
    expect(sql).toContain("e.synced_at is null");
    expect(sql).toContain("e.deleted_at is null");
    expect(sql).toContain("e.archived_at is null");
    // Mandatory set rides the frozen snapshot — live config is never re-read.
    expect(sql).toContain("p_snapshot -> 'evidence_required'");
    expect(sql).not.toMatch(/from public\.engine_settings[^;]*evidence/i);
  });

  test("atomic writes: CAS status, visit op-state, journey completion, audit", () => {
    const sql = read(migrationPath);
    // CAS: only in_progress/returned may transition; zero rows = race.
    expect(sql).toContain("set status = 'submitted', submitted_at = now()");
    expect(sql).toContain("and i.status in ('in_progress', 'returned')");
    expect(sql).toContain("EXE-SUBMIT-RACE");
    // Visit Operational State Submitted (§21) + session completes/tracking stops.
    expect(sql).toContain("set operational_state = 'submitted'");
    expect(sql).toMatch(/update public\.journey_sessions js\s+set status = 'completed', ended_at = now\(\)/);
    // Audit with the requirement trace and version/section facts.
    expect(sql).toContain("array['EXE-SUBMIT']");
    expect(sql).toContain("'version_number', v_version");
    expect(sql).toContain("'sections', v_section_count");
  });

  test("trg_review_operational_state wires under_review/submitted only (D-021)", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("create trigger trg_review_operational_state");
    expect(sql).toContain("after update of status on public.inspections");
    expect(sql).toContain("create or replace function public.sync_review_operational_state()");
    expect(sql).toContain("set operational_state = 'under_review'");
    expect(sql).toContain("set operational_state = 'submitted'");
    // Decision outcomes deliberately leave the operational state untouched.
    expect(sql).not.toContain("set operational_state = 'approved'");
    expect(sql).not.toContain("set operational_state = 'rejected'");
    expect(sql).not.toContain("set operational_state = 'returned'");
    // Definer-hardened so reviewer CAS updates cannot roll back on visits RLS.
    expect(sql).toMatch(/public\.sync_review_operational_state\(\)[\s\S]*?security definer/);
  });

  test("offline submit handler uses the RPC with a 42883 legacy fallback and never masks EXE refusals", () => {
    const ts = read(offlinePath);
    expect(ts).toContain('await guard.network(() => sb.rpc("submit_inspection"');
    expect(ts).toContain('"42883"');
    expect(ts).toContain("LEGACY FALLBACK");
    // EXE-SUBMIT-SCOPE-VIOLATION (and every EXE-* token) is an explicit failure.
    expect(ts).toContain("EXE-SUBMIT-SCOPE-VIOLATION");
    expect(ts).toContain("never masked");
    // Duplicate-tolerance survives ONLY inside the legacy fallback branch.
    const submitBlock = ts.slice(ts.indexOf('op.kind === "submit"'), ts.indexOf('op.kind === "factory_check"'));
    const legacyIdx = submitBlock.indexOf("LEGACY FALLBACK");
    expect(legacyIdx).toBeGreaterThan(-1);
    expect(submitBlock.indexOf('includes("duplicate")')).toBeGreaterThan(legacyIdx);
    // The RPC path reports the server-assigned version back to the workspace.
    expect(ts).toContain("onSubmitSynced?.(op.inspection_id");
  });

  test("Workspace no longer treats the client-side version_number as authoritative", () => {
    const ts = read(workspacePath);
    // The client number is computed once as an explicitly legacy-only value.
    expect(ts).toContain("legacyVersion");
    expect((ts.match(/submission_versions \?\? \[\]\)\.map\(s => s\.version_number\)/g) ?? []).length).toBe(1);
    // The snapshot carries the frozen contract the server enforces.
    expect(ts).toContain("sections: sectionSlices");
    expect(ts).toContain("section_items");
    expect(ts).toContain("evidence_required");
    // Evidence manifest entries travel as {id, sha} — compared by id+sha (D-020).
    expect(ts).toContain("sha: e.content_sha256 ?? null");
    // Local state follows the SERVER-assigned version after an RPC submit.
    expect(ts).toContain("info.version_number");
  });

  test("resubmission SLA is surfaced display-only with an honest unavailable state", () => {
    const sla = read(opsSlaPath);
    expect(sla).toContain("computeResubmissionFlags");
    expect(sla).toContain("resubmission_business_days");
    expect(sla).toContain("addBusinessDays(base, days, wd)");
    const page = read(opsPagePath);
    expect(page).toContain("resubSlaAvailable");
    expect(page).toContain("SLA unavailable");
    expect(page).toContain("resubFlags.map");
    // Display-only: no writes, no escalation rows.
    expect(page).not.toMatch(/resub[\s\S]{0,400}\.insert\(/);
  });
});
