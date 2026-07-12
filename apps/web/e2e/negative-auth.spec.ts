import { test, expect } from "@playwright/test";
import { PERSONAS } from "./personas";
import { waitForCredentialsForm, submitCredentials } from "./login-helper";

// Negative paths: authentication (ERR-AUTH-001 — deny with safe message).
test.describe("negative: authentication", () => {
  test("wrong password is denied with a safe banner, no session", async ({ page }) => {
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await page.locator("#email").fill(PERSONAS.inspector.email);
    await page.locator("#pw").fill("WrongPassword!0000");
    await submitCredentials(page);
    const banner = page.locator(".ax-banner--critical[role=alert]");
    await expect(banner).toBeVisible();
    // Safe message: must not leak whether the account exists or echo credentials.
    await expect(banner).not.toContainText(PERSONAS.inspector.email);
    await expect(page).toHaveURL(/\/login/);
  });

  test("unknown account is denied with the same safe shape", async ({ page }) => {
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await page.locator("#email").fill("nobody@mim.gov.sa");
    await page.locator("#pw").fill("Whatever!2026");
    await submitCredentials(page);
    await expect(page.locator(".ax-banner--critical[role=alert]")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated visit to a protected route lands on /login", async ({ page }) => {
    await page.goto("/launch");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
  });
});
