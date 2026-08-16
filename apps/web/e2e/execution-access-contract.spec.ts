import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-EXECUTION-MODULE-001 · Phase 2B — governed role/capability grants.
// Source-contract assertions only: no browser, no live backend.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(repoRoot, file));

test.describe("TASK-EXECUTION-MODULE-001 Phase 2B governed access grants", () => {
  const migrationPath = "supabase/migrations/20260721110000_execution_access_grants.sql";
  const pagePath = "apps/web/src/app/(app)/admin/access/page.tsx";
  const actionsPath = "apps/web/src/app/(app)/admin/access/actions.ts";
  // T-122 migrated this route onto SAQEEL. The reads moved to a feature query
  // module, the effective-access computation to a pure view module, and the
  // panel to components/sections/admin-access. Every claim below is unchanged;
  // only its address is.
  const queriesPath = "apps/web/src/features/admin-access/queries.ts";
  const viewPath = "apps/web/src/features/admin-access/view.ts";
  const screenPath = "apps/web/src/components/sections/admin-access/access-screen/access-screen.tsx";
  const managerPath = "apps/web/src/components/sections/admin-access/access-manager/access-manager.tsx";
  const copyPath = "apps/web/src/i18n/locales/en/admin-access.json";

  test("migration creates user_capability_grants with least-privilege RLS", () => {
    expect(exists(migrationPath)).toBeTruthy();
    const sql = read(migrationPath);
    expect(sql).toContain("create table if not exists public.user_capability_grants");
    expect(sql).toContain("references auth.users(id)");
    expect(sql).toContain("references public.capabilities(capability_key)");
    expect(sql).toContain("primary key (user_id, capability_key)");
    expect(sql).toContain("enable row level security");
    // SELECT policies only — writes exist solely through the guarded RPCs.
    expect(sql).toContain("user_capability_grants_read_own");
    expect(sql).toContain("user_capability_grants_read_admin");
    expect(sql).not.toMatch(/create policy \w+ on public\.user_capability_grants\s+for (insert|update|delete)/i);
    // Additive: nothing destructive anywhere in the migration.
    expect(sql).not.toMatch(/drop table/i);
    expect(sql).not.toMatch(/truncate/i);
    expect(sql).not.toMatch(/alter type \S+ drop value/i);
  });

  test("has_capability unions role defaults with direct grants", () => {
    const sql = read(migrationPath);
    const redefinition = sql.slice(sql.indexOf("create or replace function public.has_capability"));
    expect(redefinition).toContain("public.user_roles");
    expect(redefinition).toContain("public.role_capabilities");
    expect(redefinition).toContain("public.user_capability_grants");
    expect(redefinition).toContain("or exists");
    expect(redefinition).toContain("grant execute on function public.has_capability(text) to authenticated");
  });

  test("all four governed RPCs exist, definer-hardened and audited", () => {
    const sql = read(migrationPath);
    for (const rpc of ["admin_grant_role", "admin_revoke_role", "admin_grant_capability", "admin_revoke_capability"]) {
      expect(sql).toContain(`create or replace function public.${rpc}(p_user uuid, p_`);
      expect(sql).toContain(`grant execute on function public.${rpc}(uuid, text) to authenticated`);
    }
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    // security_admin is the grant authority on every RPC.
    expect((sql.match(/public\.has_role\('security_admin'\)/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(sql).toContain("raise insufficient_privilege");
    // Every change appends an EXE-ACCESS audit row on the right object types.
    expect(sql).toContain("'user_roles', null, 'role_grant'");
    expect(sql).toContain("'user_roles', null, 'role_revoke'");
    expect(sql).toContain("'user_capability_grants', null, 'capability_grant'");
    expect(sql).toContain("'user_capability_grants', null, 'capability_revoke'");
    expect((sql.match(/array\['EXE-ACCESS'\]/g) ?? []).length).toBe(4);
  });

  test("self-escalation and sole-security_admin guards carry stable tokens", () => {
    const sql = read(migrationPath);
    expect(sql).toContain("EXE-ACCESS-SELF");
    expect(sql).toContain("EXE-ACCESS-LAST-SECURITY-ADMIN");
    expect(sql).toContain("EXE-ACCESS-DENIED");
    expect(sql).toContain("EXE-ACCESS-UNKNOWN-ROLE");
    expect(sql).toContain("EXE-ACCESS-UNKNOWN-CAPABILITY");
    // The guard raises a check_violation-style error, and the self-guard
    // compares the target against auth.uid() in all four RPCs.
    expect(sql).toContain("raise check_violation");
    expect((sql.match(/p_user = v_actor/g) ?? []).length).toBe(4);
    // Sole-security_admin guard counts remaining holders before revoking.
    expect(sql).toContain("count(distinct ur.user_id)");
    expect(sql).toContain("v_admin_holders <= 1");
    // Idempotent no-ops: existing grant / absent grant return early.
    expect((sql.match(/no-op success/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  test("access actions call the RPCs and never write grant tables directly", () => {
    const actions = read(actionsPath);
    expect(actions).toContain('"use server"');
    expect(actions).toContain("getVerifiedUser");
    expect(actions).toContain('sb.rpc(rpc, { p_user: targetUser, [keyField]: key })');
    for (const rpc of ["admin_grant_role", "admin_revoke_role", "admin_grant_capability", "admin_revoke_capability"]) {
      expect(actions).toContain(`"${rpc}"`);
    }
    // No direct table writes anywhere in the access route.
    expect(actions).not.toContain('.from("user_roles")');
    expect(actions).not.toContain('.from("user_capability_grants")');
    // Neutral mapping for every stable guard token.
    for (const token of ["EXE-ACCESS-SELF", "EXE-ACCESS-LAST-SECURITY-ADMIN", "EXE-ACCESS-UNKNOWN-ROLE", "EXE-ACCESS-UNKNOWN-CAPABILITY", "EXE-ACCESS-DENIED"]) {
      expect(actions).toContain(token);
    }
    expect(actions).toContain("NEUTRAL_WRITE_ERROR");
  });

  test("page gates the panel on the canonical admin authority and replaces both seams", () => {
    const queries = read(queriesPath);
    expect(queries).toContain('sb.rpc("has_internal_role", { p_role: "admin" })');
    expect(queries).toContain('sb.rpc("has_planning_capability", { p_capability: "admin.access.manage" })');
    expect(read(screenPath)).toContain("AccessManager");
    // Effective-access explainer: computed from role defaults + direct grants.
    expect(queries).toContain('sb.from("role_capabilities")');
    expect(queries).toContain('sb.from("user_capability_grants")');
    expect(read(viewPath)).toContain("viaRoles");
    // The route file stays composition only (WEB-001 §2).
    expect(read(pagePath).split(/\r?\n/).length).toBeLessThanOrEqual(40);
    // NotYetBoundary is fully retired from the access route.
    const accessDir = path.join(repoRoot, "apps/web/src/app/(app)/admin/access");
    for (const file of fs.readdirSync(accessDir)) {
      expect(read(`apps/web/src/app/(app)/admin/access/${file}`), `${file} still references NotYetBoundary`).not.toContain("NotYetBoundary");
    }
  });

  test("management panel has confirmation steps and honest copy", () => {
    const manager = read(managerPath);
    expect(manager).toContain('"use client"');
    // Confirmation step for revokes and admin-role grants.
    expect(manager).toContain("confirmRevokeRole");
    expect(manager).toContain("confirmGrantAdminRole");
    expect(manager).toContain("confirmRevokeCapability");
    // Every user-visible sentence is a resource key in both locales (WEB-013),
    // so the copy claims are asserted against the resource, not the component.
    const copy = JSON.parse(read(copyPath));
    expect(copy.governance.effect).toContain("next authorized request");
    expect(copy.governance.readOnly).toContain("cannot change access");
    expect(copy.manage.selfTarget).toContain("self-escalation guard");
    const arabic = JSON.parse(read("apps/web/src/i18n/locales/ar/admin-access.json"));
    expect(Object.keys(arabic.manage)).toEqual(Object.keys(copy.manage));
  });

  test("decision log records D-006", () => {
    const log = read("product-contract/execution/EXECUTION_DECISION_LOG.md");
    expect(log).toContain("D-006");
    expect(log).toContain("grant-only");
    expect(log).toContain("self-escalation");
  });
});
