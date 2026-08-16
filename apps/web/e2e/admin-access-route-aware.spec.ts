import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// T-122 migrated /admin/access onto SAQEEL: the view parser moved to a pure
// feature module, the gating to the screen component, and every sentence to the
// admin-access resource namespace. The M8 claims are unchanged — only their
// addresses are — so each assertion below is re-pointed, not relaxed.
const repoRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");

const view = read("src/features/admin-access/view.ts");
const screen = read("src/components/sections/admin-access/access-screen/access-screen.tsx");
const frame = read("src/components/sections/admin-access/access-frame/access-frame.tsx");
const queries = read("src/features/admin-access/queries.ts");
const en = JSON.parse(read("src/i18n/locales/en/admin-access.json"));
const ar = JSON.parse(read("src/i18n/locales/ar/admin-access.json"));

test.describe("M8 admin access route-aware contract", () => {
  test("users and roles retain stable query deep links and view-specific tabs", () => {
    expect(view).toContain('export type AccessView = "users" | "roles"');
    expect(view).toContain('value === "roles" ? "roles" : "users"');
    expect(screen).toContain('href: "/admin/access?view=users"');
    expect(screen).toContain('href: "/admin/access?view=roles"');
    expect(screen).toContain('current: view === "users"');
    expect(screen).toContain('current: view === "roles"');
    expect(frame).toContain('aria-current={tab.current ? "page" : undefined}');
    expect(en.title).toBe("Users & roles");
    // Deep-linking a specific user survives the rebuild.
    expect(view).toContain("export function parseTargetUser");
  });

  test("management controls fail closed when gates or required sources fail", () => {
    expect(queries).toContain("permissionCheckUnavailable");
    expect(queries).toContain("manageSourcesUnavailable");
    expect(queries).toContain("roleCapSourcesUnavailable");
    expect(screen).toContain("!data.rolesUnavailable && !data.manageSourcesUnavailable");
    expect(screen).toContain("!data.roleCapSourcesUnavailable");
    expect(en.error.permissionsBody).toContain("Every write control is turned off");
  });

  test("partial reads are disclosed without replacing successful source data with a false empty state", () => {
    expect(en.error.rolesTitle).toBe("Role details are not available");
    expect(en.error.manageTitle).toBe("Access changes are unavailable");
    expect(en.error.roleCapsTitle).toBe("Role capability changes are unavailable");
    expect(en.error.rolesBody).toContain("The roster remains visible");
    expect(en.error.roleCapsBody).toContain("The role catalogue remains visible");
    // A failed role read degrades the column, it does not blank the roster.
    expect(read("src/components/sections/admin-access/access-roster/access-roster.tsx"))
      .toContain("rolesUnavailable");
  });

  test("every disclosed state ships in both locales", () => {
    expect(Object.keys(ar.error)).toEqual(Object.keys(en.error));
    expect(Object.keys(ar.governance)).toEqual(Object.keys(en.governance));
    for (const value of Object.values(ar.error)) {
      expect(typeof value === "string" && /[؀-ۿ]/.test(value)).toBeTruthy();
    }
  });
});
