import { test, expect } from "@playwright/test";

// CD-002 Reset (AUTH-02) — runtime proof for the recovery surface: truthful
// invalid-link copy (no already-used claim), truthful "Go to sign in" recovery
// action with focus, and the subordinated recovery view. Public pages — no
// auth needed.
//
// KNOWN APP-GAP (2026-08-08): the reset-REQUEST capability was removed with
// the old console login form (commit 07e8aa21 deleted LoginClient.tsx and its
// resetPasswordForEmail flow). /login "Forgot password?" links to /reset,
// whose invalid state links back to /login — a circular dead-end with no way
// to request a recovery code. The third test below asserts the AUTH-02
// requirement and fails until the request path is restored.

test.beforeEach(async ({ page }) => {
  await page.goto("/locale?set=en");
});

test("/reset without a token lands on the truthful invalid state with a focused recovery action", async ({ page }) => {
  await page.goto("/reset");

  // The checking phase is now instantaneous without a recovery token; if a
  // checking region does render, it must be an explicit busy status.
  const checking = page.locator('[role="status"][aria-busy="true"]');
  if (await checking.count()) {
    await expect(checking).toContainText(/Verifying your reset link/i);
  }

  // Next.js's own hidden route announcer (#__next-route-announcer__) also
  // carries role=alert — scope to the actual banner, not any alert on the page.
  const alert = page.locator(".sq-banner--critical[role='alert']");
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(alert).toContainText(/invalid or has expired/i);
  await expect(alert).not.toContainText(/only be used once|already used/i);

  // Truthful action + focus lands on it.
  const cta = page.getByRole("link", { name: /Go to sign in/i });
  await expect(cta).toBeVisible();
  await expect(cta).toBeFocused();
  await expect(cta).toHaveAttribute("href", "/login");
  await expect(page.getByText(/Forgot your password/i)).toBeVisible();
});

test("recovery surface stays subdued and never confirms whether an account exists", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("tablist")).toBeVisible();

  await page.goto("/reset");
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await expect(page.getByText(/account exists|no account|unknown account|not registered/i)).toHaveCount(0);
});

test("AUTH-02 APP-GAP: the sign-in surface must offer a working reset-request path", async ({ page }) => {
  await page.goto("/login");
  const forgot = page.getByText(/Forgot password\?|Forgot your password\?/i).first();
  await expect(forgot).toBeVisible();
  await forgot.click();
  // The destination must let the user request a recovery code/link. Today
  // /reset renders only the invalid-session state pointing back to /login,
  // so no request control exists anywhere — the assertion below fails until
  // the reset-request flow is restored.
  const requestControl = page
    .locator('input[type="email"], #email, input[name="identifier"], input[autocomplete="username"]')
    .or(page.getByRole("button", { name: /Send reset link|Request.*code/i }));
  await expect(requestControl.first()).toBeVisible({ timeout: 10_000 });
});
