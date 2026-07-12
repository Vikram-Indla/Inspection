import type { Page } from "@playwright/test";

// SCR-PUB-010 — /login shows the credential form directly (view="methods");
// Nafath is an optional sign-in method (a button into a separate NID ->
// waiting-for-app-approval sub-flow), not a mandatory gate in front of
// credentials. #email/#pw are present on initial render, so no navigation
// through Nafath is needed to sign in with a password.
export async function waitForCredentialsForm(page: Page) {
  await page.locator("#email").waitFor();
}

// Locale defaults to Arabic, so target the credentials form structurally
// (id + class) instead of by button label, which would need to match
// whichever language rendered.
export async function submitCredentials(page: Page) {
  await page.locator("form:has(#email) button.ax-btn--prominent").click();
}
