import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { identifierField, passwordField, submitCredentials, waitForCredentialsForm } from "./login-helper";

const PLANNER_EMAIL = "planner1@mim.gov.sa";
const withoutLocale = (pathname: string) => pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";

function plannerPassword(): string {
  const fromProcess = process.env.SAQEEL_UAT_PASSWORD?.trim() || process.env.SAQEEL_CROSS_ROLE_PASSWORD?.trim();
  if (fromProcess) return fromProcess;
  const envPath = join(resolve(__dirname, ".."), ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const key of ["SAQEEL_UAT_PASSWORD=", "SAQEEL_CROSS_ROLE_PASSWORD="]) {
      const line = lines.find(value => value.startsWith(key));
      const value = line?.slice(key.length).trim();
      if (value) return value;
    }
  }
  throw new Error("DM-007 requires the governed primary-cohort secret reference in the local test environment.");
}

test.use({ storageState: { cookies: [], origins: [] } });

test("DM-007 valid Planner session survives login bootstrap and reaches Planning", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(PLANNER_EMAIL);
  await passwordField(page).fill(plannerPassword());
  await submitCredentials(page);
  await page.waitForURL(url => ["/dashboard", "/planning"].includes(withoutLocale(url.pathname)), { timeout: 20_000 });

  await page.goto("/planning");
  await expect(page.getByRole("heading", { name: "Planning", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("ERR-AUTH");

  // Re-entering the shared login with a valid Planner session must hand that
  // session to /launch. It must never invoke the Field-only Inspector check
  // and sign a non-Inspector back out.
  await page.goto("/login");
  await page.waitForURL(url => ["/dashboard", "/planning"].includes(withoutLocale(url.pathname)), { timeout: 20_000 });
  await expect(page.locator("body")).not.toContainText("ERR-AUTH");
});

test("DM-007 invalid password is denied without leaving login", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(PLANNER_EMAIL);
  await passwordField(page).fill("__dm007_invalid_password__");
  await submitCredentials(page);

  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator(".fl-msg[role='alert']")).toContainText(
    "We could not sign you in with those details.",
  );
});
