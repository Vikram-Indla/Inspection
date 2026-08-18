import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-WEB-COMPLIANCE-REQUEST-ENGINE-002
// CMP-REQ-CCR-001..010 · CMP-ACC-CCR-001..030
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const readWeb = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");
const readRepo = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const migration = readRepo("supabase/migrations/20260719213000_compliance_configuration_request_engine.sql");

test.describe("Prompt 02 governed Compliance Configuration Request contract", () => {
  test("request envelope, statuses, four component types and immutable snapshots are additive", () => {
    for (const table of [
      "compliance_configuration_requests", "compliance_request_revisions", "compliance_request_components",
      "compliance_request_component_dependencies", "compliance_request_decisions", "compliance_entity_versions",
      "compliance_entity_heads", "compliance_request_publications",
    ]) expect(migration).toContain(`create table if not exists public.${table}`);
    for (const status of ["draft", "pending_review", "returned", "partially_approved", "approved", "rejected", "cancelled"])
      expect(migration).toContain(`'${status}'`);
    for (const kind of ["regulation", "inspection_item", "violation", "penalty"])
      expect(migration).toContain(`'${kind}'`);
    expect(migration).toContain("current_value_snapshot jsonb");
    expect(migration).toContain("proposed_value_snapshot jsonb not null");
  });

  test("revision resubmission copies content and graph while submitted revisions stay immutable", () => {
    expect(migration).toContain("if old.submitted_at is not null then raise exception 'CCR_IMMUTABLE");
    expect(migration).toContain("if v.status <> 'returned' then raise exception 'CCR_REVISION_REQUIRES_RETURNED'");
    expect(migration).toContain("v_new := v.current_revision + 1");
    expect(migration).toContain("from public.compliance_request_component_dependencies d where d.request_id=p_request and d.revision_number=v.current_revision");
    expect(migration).toContain("set current_revision=v_new,status='draft'");
  });

  test("maker-checker and database authorization do not depend on hidden UI", () => {
    expect(migration).toContain("if r.owner_id=auth.uid() then raise exception 'CCR_MAKER_CHECKER'");
    expect(migration).toContain("if not public.ccr_is_reviewer() then raise exception 'CCR_REVIEW_NOT_AUTHORIZED'");
    expect(migration).toContain("revoke insert, update, delete on public.compliance_configuration_requests from authenticated");
    expect(migration).toContain("create policy ccr_requests_read");
    expect(migration).toContain("using (owner_id = auth.uid() or public.ccr_is_reviewer())");
    expect(migration).not.toMatch(/grant (?:insert|update|delete).*compliance_request.*authenticated/i);
  });

  test("return and reject require comments and every decision is append-only and audited", () => {
    expect(migration.match(/CCR_COMMENT_REQUIRED/g)?.length).toBeGreaterThanOrEqual(3);
    expect(migration).toContain("decision not in ('return','reject')");
    expect(migration).toContain("trg_ccr_decisions_immutable");
    for (const action of ["CCR_CREATED", "CCR_SUBMITTED", "CCR_RETURNED", "CCR_REJECTED", "CCR_PUBLISHED"])
      expect(migration).toContain(`'${action}'`);
    expect(migration).toContain("correlation_id uuid not null");
  });

  test("parent rejection cascades deterministically and independent branches can partially approve", () => {
    expect(migration).toContain("with recursive descendants(id)");
    expect(migration).toContain("component_status='auto_rejected'");
    expect(migration).toContain("when v_approved>0 and v_rejected>0 then 'partially_approved'");
    expect(migration).toContain("order by case entity_kind when 'regulation' then 1 when 'inspection_item' then 2 when 'violation' then 3 else 4 end, created_at, id");
  });

  test("publication is transactional, versioned and rejects orphan branches before changing heads", () => {
    const preflight = migration.indexOf("then raise exception 'CCR_ORPHAN_COMPONENT'");
    const versionInsert = migration.indexOf("insert into public.compliance_entity_versions", preflight);
    const headSwitch = migration.indexOf("insert into public.compliance_entity_heads", versionInsert);
    expect(preflight).toBeGreaterThan(0);
    expect(versionInsert).toBeGreaterThan(preflight);
    expect(headSwitch).toBeGreaterThan(versionInsert);
    expect(migration).toContain("on conflict(entity_kind,entity_id) do update set current_version_id=excluded.current_version_id");
    expect(migration).toContain("CCR_NO_APPROVED_COMPONENTS");
    expect(migration).toContain("trg_ccr_versions_immutable");
  });

  test("legacy configuration and provider engines are not rewritten", () => {
    expect(migration).not.toMatch(/(?:alter|drop|truncate|delete\s+from)\s+(?:table\s+)?public\.(?:regulations|inspection_items|violation_codes|penalty_mappings)/i);
    expect(migration).not.toMatch(/create table.*(?:mapbox|signature|offline)/i);
    expect(migration).toContain("insert into public.notifications");
    expect(migration).not.toContain("create table if not exists public.notifications");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).not.toContain("create table if not exists public.audit_events");
    expect(migration).toContain("compliance_configuration_compatibility with (security_invoker = true)");
  });

  test("minimum working UI exposes register, create, detail, revision, comparison and honest states", () => {
    const copy = readWeb("src/i18n/locales/en/admin-compliance-requests.json");
    const register = readWeb("src/components/sections/admin-compliance-requests/register-screen.tsx");
    const create = readWeb("src/components/sections/admin-compliance-requests/request-create.tsx");
    const workspace = readWeb("src/components/sections/admin-compliance-requests/request-workspace.tsx");
    const componentCard = readWeb("src/components/sections/admin-compliance-requests/component-card.tsx");
    const actions = readWeb("src/app/(app)/admin/compliance-requests/actions.ts");
    expect(copy).toContain("No configuration requests");
    expect(copy).toContain("Request list can't load");
    expect(register).toContain("emptyTitle");
    expect(copy).toContain("Create compliance configuration request");
    expect(create).toContain("createComplianceRequest");
    expect(copy).toContain("Current value");
    expect(copy).toContain("Proposed value");
    expect(componentCard).toContain("currentValue");
    expect(componentCard).toContain("proposedValue");
    expect(workspace).toContain("DependenciesPanel");
    expect(copy).toContain("Revision history");
    expect(copy).toContain("Publish approved branches transactionally");
    expect(actions).not.toMatch(/service[_-]?role/i);
    expect(actions).toContain('import { insertNotification');
    expect(actions).toContain('from("notification_rules")');
    expect(copy).toContain("Configuration requests can't load right now");
  });
});
