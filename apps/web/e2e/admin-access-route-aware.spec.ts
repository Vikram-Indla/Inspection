import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const repoRoot = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(repoRoot, "src/app/(app)/admin/access/page.tsx"), "utf8");

test.describe("M8 admin access route-aware contract", () => {
  test("users and roles retain stable query deep links and view-specific titles", () => {
    expect(page).toContain('type AccessView = "users" | "roles"');
    expect(page).toContain('requestedView === "roles" ? "roles" : "users"');
    expect(page).toContain('href="/admin/access?view=users"');
    expect(page).toContain('href="/admin/access?view=roles"');
    expect(page).toContain('aria-current={view === "users" ? "page" : undefined}');
    expect(page).toContain('aria-current={view === "roles" ? "page" : undefined}');
    expect(page).toContain('"Users & roles"');
    expect(page).toContain('"Roles & capability profiles"');
  });

  test("management controls fail closed when gates or required sources fail", () => {
    expect(page).toContain("gateError || capGateError");
    expect(page).toContain("userAccessSourcesUnavailable");
    expect(page).toContain("roleCapabilitySourcesUnavailable");
    expect(page).toContain("!profilesError && !rolesError && !userAccessSourcesUnavailable");
    expect(page).toContain("!rolesError && !roleCapabilitySourcesUnavailable");
    expect(page).toContain("All write controls are unavailable");
  });

  test("partial reads are disclosed without replacing successful source data with a false empty state", () => {
    expect(page).toContain("Role details are unavailable.");
    expect(page).toContain("Access details are partially unavailable.");
    expect(page).toContain("Role capability details are unavailable.");
    expect(page).toContain("The authorized user roster remains visible");
    expect(page).toContain("The role catalogue remains visible");
    expect(page).toContain('? t("common.unavailable", "Unavailable")');
  });

  test("canonical role presentation never replaces guarded legacy write keys", () => {
    expect(page).toContain("CANONICAL_ROLE_PRESENTATION.map");
    expect(page).toContain("canonicalRolesForLegacy(legacyRoles)");
    expect(page).toContain("rolePresentationLabel(r.role_key, locale)");
    expect(page).toContain("roleKey: r.role_key");
    expect(page).toContain('sb.rpc("has_role", { r: "security_admin" })');
    expect(page).toContain('sb.rpc("has_planning_capability", { p_capability: "admin.access.manage" })');
  });
});
