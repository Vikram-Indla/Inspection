import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../../..");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260718150000_mvp3_enterprise_control_plane.sql"), "utf8");
const master = fs.readFileSync(path.join(root, "product-contract/mvp3/MVP3_84_ROW_MASTER_REGISTER.csv"), "utf8");
const reconciliation = fs.readFileSync(path.join(root, "product-contract/mvp3/MVP3_84_ROW_COVERAGE_RECONCILIATION_R2.csv"), "utf8");
const sequence = fs.readFileSync(path.join(root, "product-contract/mvp3/MVP3_MODULE_BUILD_SEQUENCE.csv"), "utf8");
const aiActions = fs.readFileSync(path.join(root, "apps/web/src/app/(app)/ai/suggestions/actions.ts"), "utf8");
const aiDockets = fs.readFileSync(path.join(root, "apps/web/src/app/(app)/ai/suggestions/AiDockets.tsx"), "utf8");

function requirementIds(csv: string) {
  return [...csv.matchAll(/MVP2-REQ-\d{4}/g)].map(x => x[0]);
}

test.describe("MVP3 exact control and enterprise foundation", () => {
  test("binds the exact 84-row register without duplication or loss", () => {
    const masterIds = requirementIds(master);
    const r2Ids = requirementIds(reconciliation);
    expect(masterIds).toHaveLength(84);
    expect(new Set(masterIds).size).toBe(84);
    expect(new Set(r2Ids).size).toBe(84);
    expect([...new Set(r2Ids)].sort()).toEqual([...new Set(masterIds)].sort());
    for (const module of ["M3-00","M3-01","M3-02","M3-03","M3-04","M3-05","M3-06","M3-07","M3-08","M3-09","M3-10","M3-11","M3-12"]) {
      expect(sequence).toContain(module);
    }
  });

  test("uses explicit grants and RLS on every additive control-plane table", () => {
    const tables = [
      "mvp3_integration_endpoints","mvp3_api_events","mvp3_export_jobs","mvp3_error_queue",
      "mvp3_feature_flags","mvp3_access_reviews","mvp3_evidence_access_grants","mvp3_devices",
      "mvp3_device_commands","mvp3_inspection_package_manifests","mvp3_package_access_events","mvp3_signature_refusals","mvp3_kpi_definitions",
    ];
    for (const table of tables) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`'${table}'`);
    }
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on table public.%I from anon, authenticated");
    expect(migration).toContain("grant select on public.mvp3_integration_endpoints");
    expect(migration).not.toMatch(/service_role/);
  });

  test("enforces maker-checker, append-only evidence, purpose and expiry", () => {
    expect(migration).toContain("approved_by <> created_by");
    expect(migration).toContain("maker cannot approve own flag");
    expect(migration).toContain("subject cannot review own access");
    expect(migration).toContain("mvp3_block_append_only_mutation");
    expect(migration).toContain("length(btrim(purpose)) >= 8");
    expect(migration).toContain("expires_at > granted_at");
    expect(migration).toContain("artifact_hash is not null and completed_at is not null");
  });

  test("keeps external dependencies fail closed", () => {
    expect(migration).toContain("dependency_blocked");
    expect(migration).toContain("x.endpoint_kind,'UNAPPROVED', 'dependency_blocked'");
    expect(migration).toContain("status <> 'configured' or nullif(base_url, '') is not null");
    expect(migration).not.toContain("verification_status text not null default 'verified'");
  });

  test("locks a complete package manifest and denies untrusted device access with an auditable outcome", () => {
    expect(migration).toContain("mvp3_compile_inspection_package");
    expect(migration).toContain("p_manifest ?& array['forms','clauses','evidence_rules','report_template','locales']");
    expect(migration).toContain("manifest_hash ~ '^[0-9a-f]{64}$'");
    expect(migration).toContain("trg_mvp3_package_manifests_append_only");
    expect(migration).toContain("trust_status <> 'trusted' or (nullif(mdm_reference,'') is not null and app_version_compliant)");
    expect(migration).toContain("jsonb_build_object('status','denied','reason',v_outcome)");
    expect(migration).toContain("requested_device_identifier text not null");
    expect(migration).toContain("device_id uuid references public.mvp3_devices(id)");
    expect(migration).not.toContain("trg_mvp3_device_commands_append_only");
  });

  test("records refusal as a distinct append-only fact with required context", () => {
    expect(migration).toContain("mvp3_record_signature_refusal");
    expect(migration).toContain("refusal_reason text not null");
    expect(migration).toContain("inspector_statement text not null");
    expect(migration).toContain("device_context jsonb not null");
    expect(migration).toContain("location_context jsonb not null");
    expect(migration).toContain("values('refusal','refusal','refused','unverified',auth.uid())");
    expect(migration).toContain("trg_mvp3_signature_refusals_append_only");
  });

  test("keeps AI advisory, evidence-cited and honest when confidence is unavailable", () => {
    expect(aiActions).toContain("At least one evidence reference is required");
    expect(aiActions).toContain("evidence_refs, clause_refs, confidence: null");
    expect(aiActions).toContain("provider_not_supplied");
    expect(aiDockets).toContain("confidenceUnavailable");
    expect(aiDockets).toContain("r.evidenceRefs.join");
  });

  test("mounts the missing MVP3 control-plane routes and preserves extended MVP1/MVP2 routes", () => {
    const routes = [
      "apps/web/src/app/(app)/admin/integrations/page.tsx",
      "apps/web/src/app/(app)/admin/operations/page.tsx",
      "apps/web/src/app/(app)/admin/security-access/page.tsx",
      "apps/web/src/app/(app)/admin/devices/page.tsx",
      "apps/web/src/app/(app)/enforcement/page.tsx",
      "apps/web/src/app/(app)/admin/workflows/page.tsx",
      "apps/web/src/app/(app)/admin/packages/page.tsx",
      "apps/web/src/app/(app)/admin/risk/page.tsx",
      "apps/web/src/app/(app)/admin/audit/page.tsx",
      "apps/web/src/app/(app)/admin/gis/page.tsx",
      "apps/web/src/app/(app)/dashboard/page.tsx",
      "apps/web/src/app/(app)/portal/page.tsx",
      "apps/web/src/app/(app)/ai/suggestions/page.tsx",
      "apps/web/src/app/(app)/committee/page.tsx",
    ];
    for (const route of routes) expect(fs.existsSync(path.join(root, route)), route).toBe(true);
  });

  test("ships reviewed Arabic fallbacks for every additive MVP3 control-plane key", () => {
    const pages = ["integrations", "operations", "security-access", "devices"]
      .map(name => fs.readFileSync(path.join(root, `apps/web/src/app/(app)/admin/${name}/page.tsx`), "utf8"))
      .join("\n");
    const i18n = fs.readFileSync(path.join(root, "apps/web/src/lib/i18n.ts"), "utf8");
    const keys = [...pages.matchAll(/t\("(mvp3\.[^"]+)"/g)].map(match => match[1]);
    expect(keys.length).toBeGreaterThan(50);
    for (const key of new Set(keys)) expect(i18n, key).toContain(`"${key}":`);
  });
});
