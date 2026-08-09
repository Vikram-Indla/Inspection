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
    const page = source("src/app/admin/dashboard-config/page.tsx");
    const action = source("src/app/admin/dashboard-config/actions.ts");

    expectAdminBoundary();
    for (const table of ["mvp3_kpi_definitions", "dashboard_config_heads", "dashboard_config_versions", "dashboard_config_parameters", "user_roles"]) {
      expect(page).toContain(`sb.from("${table}")`);
    }
    expect(page).toContain('const canWrite = ["admin", "supervisor"]');
    expect(page).toContain('const canReview = roleKeys.has("admin")');
    expect(page).toContain("!migrationApplied ?");
    for (const rpc of ["dash_create_config_draft", "dash_submit_config", "dash_return_config", "dash_publish_config"]) {
      expect(action).toContain(`sb.rpc("${rpc}"`);
    }
    expect(action).toContain("return { error: databaseMessage(error) }");
    expect(action).not.toContain("mock");
  });

  test("/admin/enforcement-recommendations separates reader/decider access and guarded writes", () => {
    const page = source("src/app/(app)/admin/enforcement-recommendations/page.tsx");
    const action = source("src/app/(app)/admin/enforcement-recommendations/actions.ts");

    expectAdminBoundary();
    expect(page).toContain("getUserRoles(user.id)");
    expect(page).toContain('const isDecider = roles.includes("supervisor") || roles.includes("admin")');
    expect(page).toContain("const isReader = isDecider");
    expect(page).toContain('sb.from("enforcement_recommendations")');
    expect(page).toContain("pendingError &&");
    expect(action).toContain('process.env.ENFORCEMENT_P0_RPCS_DEPLOYED !== "true"');
    expect(action).toContain('return { error: "backend_guard_required" }');
    expect(action).toContain('sb.rpc("decide_enforcement_recommendation"');
    expect(action).toContain('return { error: "write_failed" }');
  });

  test("/admin/localization fails closed before loading its real dictionary", () => {
    const page = source("src/app/(app)/admin/localization/page.tsx");
    const action = source("src/app/(app)/admin/localization/actions.ts");

    expectAdminBoundary();
    expect(page).toContain("getVerifiedUser(sb)");
    expect(page).toContain("getUserRoles(user.id)");
    expect(page).toContain('const canManageLocalization = ["admin", "compliance_admin", "security_admin", "workflow_admin"]');
    expect(page.indexOf("if (!canManageLocalization)")).toBeLessThan(page.indexOf('sb.from("ui_strings")'));
    expect(page).toContain('throw new Error("localization_auth_unavailable")');
    expect(page).toContain('throw new Error("localization_roles_unavailable")');
    expect(page).toContain("loadFailed = true");
    expect(action).toContain('sb.from("ui_strings")');
    expect(action).toContain('sb.from("ui_string_revisions")');
    expect(action).toContain("if (authorization.error) return { error: authorization.error }");
  });

  test("/admin/notifications keeps reads truthful and mutations provider-backed", () => {
    const page = source("src/app/(app)/admin/notifications/page.tsx");
    const action = source("src/app/(app)/admin/notifications/actions.ts");

    expectAdminBoundary();
    expect(page).toContain("getServerUser()");
    expect(page).toContain("getUserRoles(user.id)");
    expect(page).toContain('sb.from("notification_rules")');
    expect(page).toContain('const isWriter = roles.has("admin")');
    expect(page).toContain("roleError ?");
    expect(page).toContain("rulesError ? null : rows.map");
    expect(page).toContain("Nothing is shown as zero");
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
