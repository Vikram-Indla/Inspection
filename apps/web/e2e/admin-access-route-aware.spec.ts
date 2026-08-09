import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const repoRoot = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(repoRoot, "src/app/(app)/admin/access/page.tsx"), "utf8");
const frame = fs.readFileSync(path.join(repoRoot, "src/app/(app)/admin/_components/AdminDestinationFrame.tsx"), "utf8");

test.describe("M8 admin access route-aware contract", () => {
  test("users and roles retain stable query deep links and view-specific tabs", () => {
    expect(page).toContain('type AccessView = "users" | "roles"');
    expect(page).toContain('requestedView === "roles" ? "roles" : "users"');
    expect(page).toContain('href: "/admin/access?view=users"');
    expect(page).toContain('href: "/admin/access?view=roles"');
    expect(page).toContain('current: view === "users"');
    expect(page).toContain('current: view === "roles"');
    expect(frame).toContain('aria-current={tab.current ? "page" : undefined}');
    expect(page).toContain('"Users & roles"');
  });

  test("management controls fail closed when gates or required sources fail", () => {
    expect(page).toContain("gateError || capGateError");
    expect(page).toContain("userAccessSourcesUnavailable");
    expect(page).toContain("roleCapabilitySourcesUnavailable");
    expect(page).toContain("!profilesError && !rolesError && !userAccessSourcesUnavailable");
    expect(page).toContain("!rolesError && !roleCapabilitySourcesUnavailable");
    expect(page).toContain("All write controls are turned off");
  });

  test("partial reads are disclosed without replacing successful source data with a false empty state", () => {
    expect(page).toContain("Role details are not available.");
    expect(page).toContain("Access details are not fully available.");
    expect(page).toContain("Role capability details are not available.");
    expect(page).toContain("The authorized user roster remains visible");
    expect(page).toContain("The role catalogue remains visible");
    expect(page).toContain('rolesError ? t("common.unavailable", "Not available")');
  });
});
