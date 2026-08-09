import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-EXECUTION-MODULE-001 · Phase 2A — admin execution control plane.
// Source-contract assertions only: no browser, no live backend.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

test.describe("TASK-EXECUTION-MODULE-001 Phase 2A execution admin control plane", () => {
  const pagePath = "apps/web/src/app/admin/execution/page.tsx";
  const actionsPath = "apps/web/src/app/admin/execution/actions.ts";
  const migrationPath = "supabase/migrations/20260721100000_execution_admin_audit.sql";

  test("route files exist for /admin/execution with all governed sections", () => {
    for (const file of [
      pagePath,
      actionsPath,
      "apps/web/src/app/admin/execution/CapacityForm.tsx",
      "apps/web/src/app/admin/execution/VisitModesForm.tsx",
      "apps/web/src/app/admin/execution/ReasonsManager.tsx",
      "apps/web/src/app/admin/execution/GisRulesForm.tsx",
      "apps/web/src/app/admin/execution/EvidencePolicyForm.tsx",
      "apps/web/src/app/admin/execution/OfflinePolicyForm.tsx",
      "apps/web/src/app/admin/execution/RawJsonDetails.tsx",
    ]) {
      expect(exists(file), `missing ${file}`).toBeTruthy();
    }
    const page = read(pagePath);
    expect(page).toContain("Daily capacity & journey");
    expect(page).toContain("Visit mode eligibility");
    expect(page).toContain("Cancellation & exception reasons");
    expect(page).toContain("Arrival & geofence rules");
    expect(page).toContain("Evidence policy");
    expect(page).toContain("Offline & sync policy");
    // Per-section capability gates, evaluated server-side via the RPC.
    expect(page).toContain('sb.rpc("has_capability"');
    expect(page).toContain("admin.execution_workflow");
    expect(page).toContain("admin.mode_eligibility");
    expect(page).toContain("admin.evidence_policy");
    expect(page).toContain("admin.offline_policy");
    // Raw JSON (advanced) read-only view per engine row.
    expect(page).toContain("RawJsonDetails");
    expect(read("apps/web/src/app/admin/execution/RawJsonDetails.tsx")).toContain("Raw JSON (advanced)");
  });

  test("every write action is capability-gated, merge-scoped and audited", () => {
    const actions = read(actionsPath);
    expect(actions).toContain("getVerifiedUser");
    expect(actions).toContain('rpc("has_capability"');
    // Six governed writes, each with its own capability.
    expect(actions).toContain("export async function saveDailyCapacity");
    expect(actions).toContain("export async function saveVisitModes");
    expect(actions).toContain("export async function saveReasons");
    expect(actions).toContain("export async function saveGisRules");
    expect(actions).toContain("export async function saveEvidencePolicy");
    expect(actions).toContain("export async function saveOfflinePolicy");
    expect((actions.match(/capability: "admin\./g) ?? []).length).toBeGreaterThanOrEqual(6);
    // Read-modify-write of only the governed keys, version bump, audit row.
    expect(actions).toContain("governedKeys");
    expect(actions).toContain("version_label");
    expect(actions).toContain("updated_by");
    expect(actions).toContain('from("audit_events")');
    expect(actions).toContain('object_type: "engine_settings"');
    expect(actions).toContain('action: "execution_config_update"');
    expect(actions).toContain('requirement_refs: ["EXE-ADMIN"]');
  });

  test("self-assessment enable is refused (Release 1 gate)", () => {
    const actions = read(actionsPath);
    expect(actions).toContain("self_assessment_enabled");
    expect(actions).toContain("gated to release_2 and cannot be enabled");
    // Stored object keeps the gate marker and never flips enabled on.
    expect(actions).toContain('self_assessment: { enabled: false, release_gate: "release_2" }');
  });

  test("offline section is honestly unset — platform default, no invented numbers", () => {
    const page = read(pagePath);
    const form = read("apps/web/src/app/admin/execution/OfflinePolicyForm.tsx");
    const actions = read(actionsPath);
    expect(page).toContain("platform default");
    expect(form).toContain("platformDefault");
    expect(actions).toContain("platform default");
    // No hardcoded retry/autosave default anywhere in the section's code.
    for (const source of [page, form, actions]) {
      expect(source).not.toMatch(/max_sync_attempts["'\s]*[:=]["'\s]*\d/);
      expect(source).not.toMatch(/autosave_interval_s["'\s]*[:=]["'\s]*\d/);
    }
    // Validation bounds when a value IS supplied.
    expect(actions).toContain("attempts < 1 || attempts > 100");
    expect(actions).toContain("seconds < 5 || seconds > 600");
  });

  test("reason lists preserve protected keys and bilingual labels", () => {
    const actions = read(actionsPath);
    expect(actions).toContain('"other"');
    expect(actions).toContain('"safety_security"');
    expect(actions).toContain("at least one reason is required");
    expect(actions).toContain("both an English and an Arabic label");
  });

  test("audit migration verifies the engine_settings trigger, non-destructive", () => {
    expect(exists(migrationPath)).toBeTruthy();
    const sql = read(migrationPath).toLowerCase();
    expect(sql).toContain("trg_audit_engine_settings");
    expect(sql).toContain("audit_row_change");
    expect(sql).not.toMatch(/drop table/);
    expect(sql).not.toMatch(/drop trigger/);
    expect(sql).not.toMatch(/truncate/);
    // The 0002 trigger attachment is the source of truth being verified.
    const rbac = read("supabase/migrations/0002_rbac_audit.sql");
    expect(rbac).toContain("'engine_settings'");
    expect(rbac).toContain("trg_audit_%s");
  });

  test("navigation registers the route under the canonical admin visibility", () => {
    const nav = read("apps/web/src/lib/shell-navigation.ts");
    expect(nav).toContain('href: "/admin/execution"');
    expect(nav).toContain("shell.nav.executionSettings");
    expect(nav).toMatch(/id: "adm-execution"[^\n]*visibility: "canonical-admin"/);
  });

  test("decision log records D-004 and D-005", () => {
    const log = read("product-contract/execution/EXECUTION_DECISION_LOG.md");
    expect(log).toContain("D-004");
    expect(log).toContain("D-005");
  });
});
