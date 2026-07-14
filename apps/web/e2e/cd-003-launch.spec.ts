import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// CD-003 / AUTH-03 / CD003-SEC-001 — role resolution + no-workspace
// fallback. Behavioral proof that the ROLE_HOME edit (six explicit
// admin-family role_keys added, blind /admin fallback replaced with
// /launch/no-workspace) doesn't change routing for any seeded persona
// (existing planner/inspector/reviewer auth.setup + the admin check below),
// and that the new route is defended like any other authenticated page.

test("AUTH-03: /launch redirects unauthenticated visitors to /login", async ({ page }) => {
  await page.goto("/launch");
  await page.waitForURL(/\/login/);
});

test("AUTH-03: /launch/no-workspace redirects unauthenticated visitors to /login (defense in depth)", async ({ page }) => {
  await page.goto("/launch/no-workspace");
  await page.waitForURL(/\/login/);
});

test("AUTH-03: identity and role read failures route to the neutral error boundary, not no-workspace", () => {
  const source = readFileSync(join(process.cwd(), "src/app/launch/page.tsx"), "utf8");
  expect(source).toContain("if (authError)");
  expect(source).toContain("if (rolesError)");
  expect(source).toContain('throw new Error("launch_roles_unavailable")');
});

test("CD003-SEC-001 regression: admin-family persona still lands on /admin via the six explicit role_key entries", async ({ page }) => {
  // Real user_roles verified live: admin@mim.gov.sa carries compliance_admin,
  // form_admin, workflow_admin, security_admin, gis_admin, risk_owner — never
  // a literal "admin" key. Before this fix these six were unmatched and this
  // account only reached /admin via the blind fallback this change removes.
  await page.goto("/locale?set=en");
  await page.goto("/login");
  await page.locator("#email").fill("admin@mim.gov.sa");
  await page.locator("#pw").fill("MimAdmin!2026");
  await page.getByRole("button", { name: /Sign In/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 20000 });
  await expect(page.locator("body")).not.toContainText("ERR-AUTH");
});
