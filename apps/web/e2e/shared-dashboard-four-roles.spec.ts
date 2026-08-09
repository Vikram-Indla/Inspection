import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { dashboardPersonaFor, ROLE_DASHBOARD_METRICS } from "../src/lib/dashboard-role";
import { homeForRoles } from "../src/lib/role-home";
import { buildShellNavigation } from "../src/lib/shell-navigation";

const webRoot = resolve(__dirname, "..");
const repoRoot = resolve(webRoot, "../..");
const source = (path: string) => readFileSync(join(webRoot, path), "utf8");

test.describe("TASK-DASHBOARD-SHARED-FOUR-ROLE-20260802", () => {
  test("all four canonical roles land on, see, and pass the Dashboard persona gate", () => {
    for (const role of ["admin", "planner", "supervisor", "inspector"] as const) {
      expect(homeForRoles([role])).toBe("/dashboard");
      expect(dashboardPersonaFor([role])).toBe(role);
      expect(buildShellNavigation([role]).flatMap(group => group.items))
        .toEqual(expect.arrayContaining([expect.objectContaining({ href: "/dashboard", enabled: true })]));
    }
  });

  test("role summaries use governed KPI definitions and Inspector uses the personal projection", () => {
    expect(ROLE_DASHBOARD_METRICS.admin).toEqual(["STR-KPI-009", "OPS-KPI-004", "STR-KPI-003", "OPS-KPI-008"]);
    expect(ROLE_DASHBOARD_METRICS.planner).toEqual(["OPS-KPI-001", "OPS-KPI-002", "OPS-KPI-006", "STR-KPI-006"]);
    expect(ROLE_DASHBOARD_METRICS.supervisor).toEqual(["OPS-KPI-003", "OPS-KPI-007", "OPS-KPI-004", "OPS-KPI-008"]);
    expect(ROLE_DASHBOARD_METRICS.inspector).toEqual(["IPAD-KPI-001", "IPAD-KPI-002", "IPAD-KPI-003", "IPAD-KPI-004"]);
    const sections = source("src/components/dashboard/dashboard-sections/dashboard-sections.tsx");
    const scopeSource = source("src/features/dashboard/scope.ts");
    const snapshotRoute = source("src/app/api/dashboard/snapshot/route.ts");
    const snapshotSource = source("src/features/dashboard/snapshot.ts");
    expect(sections).toContain("buildInspectorKpiProjection");
    expect(scopeSource).toContain('return scope.viewExplicit || isAdmin ? scope.view : "operational";');
    expect(snapshotRoute).toContain('effectiveView(requestedScope, persona === "admin")');
    expect(snapshotSource).toContain('const audit = !strategic || persona === "admin"');
    expect(sections).toContain("syncQueueCount: 0");
    expect(snapshotRoute).toContain("const sb = await supabaseServer()");
    expect(sections + scopeSource + snapshotRoute + snapshotSource).not.toMatch(/service[_-]?role|bypassRls/i);
  });

  test("canonical Dashboard RLS seams are read-only and keep Inspector assignment-scoped", () => {
    const sql = readFileSync(join(repoRoot, "supabase/migrations/20260802090000_shared_dashboard_four_roles.sql"), "utf8");
    expect(sql).toContain("public.is_assigned_inspector(id)");
    expect(sql).toContain("public.is_assigned_inspector(visit_id)");
    expect(sql).toContain("public.has_internal_role('admin')");
    expect(sql).toContain("public.has_internal_role('planner')");
    expect(sql).toContain("public.has_internal_role('supervisor')");
    expect(sql).not.toMatch(/for\s+(?:insert|update|delete|all)/i);
    expect(sql).not.toMatch(/service[_-]?role|bypassrls/i);
  });
});
