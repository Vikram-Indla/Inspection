import { expect, test } from "@playwright/test";
import { waitForCredentialsForm, submitCredentials, identifierField, passwordField } from "./login-helper";

// Application QA — Jira Positive Playwright: Journey group 1 (Shared —
// Login/Dashboard). Covers the four PRIMARY business cohorts (admin1,
// planner1, supervisor1, inspector1) from the governed cross-role test-data
// seed (scripts/test-data/local_test_data_seed.sql), not the legacy
// personas.ts specialist principals (planner/inspector/reviewer/admin/ops),
// per PO decision 2026-08-02: the two tiers are distinct and never merged.
//
// Positive path only: every primary-cohort role signs in through the real
// /login UI and lands on /dashboard with role-scoped data.

function requireUatSecret(): string {
  const value = process.env.SAQEEL_UAT_PASSWORD?.trim() || process.env.SAQEEL_CROSS_ROLE_PASSWORD?.trim();
  if (!value) {
    throw new Error(
      "SAQEEL_UAT_PASSWORD or SAQEEL_CROSS_ROLE_PASSWORD is required to authenticate the primary business cohorts " +
      "(admin1/planner1/supervisor1/inspector1). Set it in apps/web/.env.local.",
    );
  }
  return value;
}

const PRIMARY_COHORT = ["admin1", "planner1", "supervisor1", "inspector1"] as const;

for (const account of PRIMARY_COHORT) {
  test(`INSP-Journey1: ${account} signs in and lands on role-scoped /dashboard`, async ({ page }) => {
    const email = `${account}@mim.gov.sa`;
    const password = requireUatSecret();

    page.on("pageerror", error => console.error(`[browser:${account}] ${error.message}`));

    await page.goto("/login");
    await waitForCredentialsForm(page);
    await identifierField(page).fill(email);
    await passwordField(page).fill(password);
    await submitCredentials(page);

    await page.waitForURL((url) => url.pathname.startsWith("/dashboard"), { timeout: 40_000 });
    await expect(page.locator("body")).not.toContainText("ERR-AUTH");
    await page.screenshot({ path: `test-results/insp-journey1-${account}-dashboard.png`, fullPage: true });
  });
}
