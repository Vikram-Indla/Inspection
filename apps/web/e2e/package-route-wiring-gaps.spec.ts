import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(__dirname, "..");
const source = (relativePath: string) => fs.readFileSync(path.join(webRoot, relativePath), "utf8");

const adminLayout = source("src/app/(app)/admin/layout.tsx");
const adminBoundary = source("src/components/AdminRouteBoundary.tsx");

test.describe("Package-focused route wiring gaps", () => {
  test("/ preserves the unified sign-in and authenticated role-routing contract", () => {
    const root = source("src/app/page.tsx");
    const login = source("src/app/login/field/FieldLoginClient.tsx");
    const launch = source("src/app/launch/page.tsx");

    expect(root).toContain('if (error || !user) redirect(localeHref(locale, "/login"));');
    expect(root).toContain('redirect(localeHref(locale, "/launch"));');
    expect(login).toContain('return "/launch";');
    expect(launch).toContain("getVerifiedUser(sb)");
    expect(launch).toContain("getUserRoles(user.id)");
    expect(launch).toContain("homeForRoles(");
    expect(launch).toContain('redirect(localeHref(locale, "/launch/no-workspace"));');
    expect(root).not.toMatch(/redirect\(["']\/(dashboard|admin|field)["']\)/);
  });

  test("/admin/bulk-violations is role-gated, package-wired, and fail-closed", () => {
    const page = source("src/app/(app)/admin/bulk-violations/page.tsx");
    const action = source("src/app/(app)/admin/bulk-violations/actions.ts");

    expectAdminBoundary();
    expect(page).toContain('sb.from("user_roles")');
    expect(page).toContain('roles.includes("supervisor") || roles.includes("admin")');
    expect(page).toContain('sb.from("package_versions")');
    expect(page).toContain('.eq("status", "locked")');
    expect(page).toContain("packagesError &&");
    expect(action).toContain('process.env.ENFORCEMENT_P0_RPCS_DEPLOYED !== "true"');
    expect(action).toContain('return { error: "issuing_unavailable" }');
    expect(action).toContain('sb.rpc("issue_bulk_violation"');
    expect(action).toContain('return { error: "write_failed" }');
    expect(action).toContain("return {");
    expect(action).toContain("successCount:");
  });

  test("/admin/dashboard-config uses governed tables and RPCs with guarded controls", () => {
    const queries = source("src/features/admin-dashboard-config/queries.ts");
    const screen = source("src/components/sections/admin-dashboard-config/dashboard-config-screen.tsx");
    const action = source("src/app/admin/dashboard-config/actions.ts");

    expectAdminBoundary();
    for (const table of ["mvp3_kpi_definitions", "dashboard_config_heads", "dashboard_config_versions", "dashboard_config_parameters", "user_roles"]) {
      expect(queries).toContain(`sb.from("${table}")`);
    }
    expect(queries).toContain('["admin", "supervisor"]');
    expect(queries).toContain('roleKeys.has("admin")');
    expect(screen).toContain("migrationApplied");
    for (const rpc of ["dash_create_config_draft", "dash_submit_config", "dash_return_config", "dash_publish_config"]) {
      expect(action).toContain(`sb.rpc("${rpc}"`);
    }
    expect(action).toContain("return { error: databaseMessage(error) }");
    expect(action).not.toContain("mock");
  });

  test("/admin/enforcement-recommendations separates reader/decider access and guarded writes", () => {
    const queries = source("src/features/admin-enforcement-recommendations/queries.ts");
    const screen = source("src/components/sections/admin-enforcement-recommendations/enforcement-recs-screen.tsx");
    const action = source("src/app/(app)/admin/enforcement-recommendations/actions.ts");

    expectAdminBoundary();
    expect(queries).toContain("getUserRoles(user.id)");
    expect(queries).toContain('const isDecider = roles.includes("supervisor") || roles.includes("admin")');
    expect(queries).toContain("const isReader = isDecider");
    expect(queries).toContain('sb.from("enforcement_recommendations")');
    expect(screen).toContain("pendingError &&");
    expect(action).toContain('process.env.ENFORCEMENT_P0_RPCS_DEPLOYED !== "true"');
    expect(action).toContain('return { error: "backend_guard_required" }');
    expect(action).toContain('sb.rpc("decide_enforcement_recommendation"');
    expect(action).toContain('return { error: "write_failed" }');
  });

  test("/admin/localization fails closed before loading its real dictionary", () => {
    const queries = source("src/features/admin-localization/queries.ts");
    const action = source("src/app/(app)/admin/localization/actions.ts");

    expectAdminBoundary();
    expect(queries).toContain("getVerifiedUser(sb)");
    expect(queries).toContain("getUserRoles(user.id)");
    expect(queries).toContain('const MANAGE_ROLES = ["admin", "compliance_admin", "security_admin", "workflow_admin"]');
    expect(queries.indexOf('if (!await canManageLocalization()) return { kind: "unauthorized" }'))
      .toBeLessThan(queries.indexOf('sb.from("ui_strings")'));
    expect(queries).toContain('return { kind: "error" }');
    expect(action).toContain('sb.from("ui_strings")');
    expect(action).toContain('sb.from("ui_string_revisions")');
    expect(action).toContain("if (authorization.error) return { error: authorization.error }");
  });

  test("/admin/notifications keeps reads truthful and mutations provider-backed", () => {
    const queries = source("src/features/admin-notifications/queries.ts");
    const screen = source("src/components/sections/admin-notifications/notifications-screen.tsx");
    const copy = source("src/i18n/locales/en/admin-notifications.json");
    const action = source("src/app/(app)/admin/notifications/actions.ts");

    expectAdminBoundary();
    expect(queries).toContain("getServerUser()");
    expect(queries).toContain("getUserRoles(user.id)");
    expect(queries).toContain('sb.from("notification_rules")');
    expect(queries).toContain('roles.has("admin")');
    expect(queries).toContain("roleRead.error");
    expect(screen).toContain("data.rulesFailed");
    expect(copy).toContain("Nothing is shown as zero");
    expect(action).toContain('sb.from("notification_rules").insert');
    expect(action).toContain('sb.rpc("publish_notification_rule"');
    expect(action).toContain('sb.rpc("deactivate_notification_rule"');
    expect(action).toContain("if (outcome.error) return { error: outcome.error }");
  });

  test("/incident-reports uses scoped table reads and authenticated real writes", () => {
    const page = source("src/app/(app)/incident-reports/page.tsx");
    const form = source("src/app/(app)/incident-reports/IncidentReportForm.tsx");
    const action = source("src/app/(app)/incident-reports/actions.ts");

    expect(page).toContain('current="/incident-reports"');
    expect(page).toContain('.from("incident_reports")');
    expect(page).toContain("error && (");
    expect(page).toContain("!error && (rows ?? []).length === 0");
    expect(form).toContain("createIncidentReport");
    expect(action).toContain("getVerifiedUser(sb)");
    expect(action).toContain('return { error: "Session expired — sign in again." }');
    expect(action).toContain('sb.from("incident_reports").insert');
    expect(action).toContain('return { error: `${NEUTRAL_WRITE_ERROR} (inspector scope required).` }');
    expect(action).toContain("return { ok: true }");
  });
});

function expectAdminBoundary() {
  expect(adminLayout).toContain("<AdminRouteBoundary allowedRoles={ADMINISTRATOR_CAPABILITY_ROLES}>");
  expect(adminBoundary).toContain("getServerUser()");
  expect(adminBoundary).toContain('redirect("/login")');
  expect(adminBoundary).toContain("getUserRoles(user.id)");
  expect(adminBoundary).toContain('throw new Error("admin_route_auth_unavailable")');
  expect(adminBoundary).toContain('throw new Error("admin_route_roles_unavailable")');
}
