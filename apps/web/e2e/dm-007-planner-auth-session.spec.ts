import { expect, test } from "@playwright/test";
import { identifierField, passwordField, submitCredentials, waitForCredentialsForm } from "./login-helper";

const PLANNER_EMAIL = "planner.one@saqeel.test";

function plannerPassword(): string {
  if (!Object.prototype.hasOwnProperty.call(process.env, "SAQEEL_TEST_PASSWORD")) {
    throw new Error("DM-007 requires SAQEEL_TEST_PASSWORD in the local test environment.");
  }
  return process.env.SAQEEL_TEST_PASSWORD!;
}

test.use({ storageState: { cookies: [], origins: [] } });

test("DM-007 valid Planner session survives login bootstrap and reaches Planning", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(PLANNER_EMAIL);
  await passwordField(page).fill(plannerPassword());
  await submitCredentials(page);
  await page.waitForURL(url => url.pathname === "/planning", { timeout: 20_000 });

  // Re-entering the shared login with a valid Planner session must hand that
  // session to /launch. It must never invoke the Field-only Inspector check
  // and sign a non-Inspector back out.
  await page.goto("/login");
  await page.waitForURL(url => url.pathname === "/planning", { timeout: 20_000 });
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
