import type { Page } from "@playwright/test";

// SCR-PUB-010 v2 — /login is the single Saqeel sign-in: the credential form
// renders directly (view="signin") with a persona selector above it that
// defaults to the web portal, so #email/#pw are present on initial render.
export async function waitForCredentialsForm(page: Page) {
  await page.locator("#email").waitFor();
}

// Locale defaults to Arabic, so target the credentials form structurally
// (id + class) instead of by button label, which would need to match
// whichever language rendered.
export async function submitCredentials(page: Page) {
  await page.locator("form:has(#email) button.ax-btn--prominent").click();
}
