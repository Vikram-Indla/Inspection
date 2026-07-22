import { test, expect } from "@playwright/test";

// CD-002 Reset (AUTH-02) — runtime proof for the corrections baked into the
// handoff: explicit checking state, combined invalid-session copy (no
// account-existence claim), truthful "Go to sign in" recovery action, mismatch as
// a field error (not a duplicate alert), and the subordinated atlas on
// recovery views. Public pages — no auth needed.

test.beforeEach(async ({ page }) => {
  await page.goto("/locale?set=en");
});

test("/reset: checking is explicit, then a missing OTP recovery session fails closed", async ({ page }) => {
  await page.goto("/reset");

  const checking = page.locator('[role="status"][aria-busy="true"]');
  await expect(checking).toBeVisible();
  await expect(checking).toContainText(/Verifying your recovery session/i);

  // Next.js's own hidden route announcer (#__next-route-announcer__) also
  // carries role=alert — scope to the actual banner, not any alert on the page.
  const alert = page.locator(".ax-banner--critical[role='alert']");
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(/session is invalid or has expired/i);
  await expect(alert).not.toContainText(/only be used once|already used/i);

  // Truthful action + focus lands on it.
  const cta = page.getByRole("link", { name: /Go to sign in/i });
  await expect(cta).toBeVisible();
  await expect(cta).toBeFocused();
  await expect(cta).toHaveAttribute("href", "/login");
  await expect(page.locator(".lg-card")).toContainText(/Forgot your password/i);
  await expect(page.locator(".lg-card")).toContainText(/new code/i);
});

test("/login forgot: invalid email is a field error; valid format always reaches neutral OTP entry", async ({ page }) => {
  await page.route("**/auth/v1/recover", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "{}",
  }));
  await page.goto("/login");
  await page.getByRole("button", { name: /Forgot your password\?/i }).click();
  await expect(page.getByRole("heading", { name: /Reset your password/i })).toBeFocused();

  await page.locator("#email").fill("not-an-email");
  await page.getByRole("button", { name: /Send reset code/i }).click();
  await expect(page.locator("#email")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator(".ax-banner--critical")).toHaveCount(0); // format error is not role=alert

  await page.locator("#email").fill("nobody-at-all@example.com");
  await page.getByRole("button", { name: /Send reset code/i }).click();
  await expect(page.getByText(/Check your email/i)).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#reset-otp")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Check your email/i })).toBeFocused();
  await expect(page.getByRole("button", { name: /Verify code/i })).toBeVisible();
});

test("/login: security note is present and the atlas is subordinated on the forgot view", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/never confirm whether an account exists/i)).toBeVisible();
  await expect(page.getByRole("tablist")).toBeVisible(); // sign-in: full atlas

  await page.getByRole("button", { name: /Forgot your password\?/i }).click();
  await expect(page.getByRole("tablist")).toHaveCount(0); // forgot: subdued
  await expect(page.locator(".lg-hero")).toBeVisible();
});
