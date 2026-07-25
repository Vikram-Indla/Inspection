import type { Page } from "@playwright/test";

// /login is the single Saqeel sign-in (Product-Owner direction 2026-07-25): the
// real field/PWA card (FieldLoginClient, SAQEEL PWA-Field Login.dc) rendered
// beside the atlas on wide screens. There is no second console form — the old
// email/password LoginClient was an orphan and has been deleted.
//
// The card signs in with National ID / Staff number, not an email, and its
// inputs carry no id attributes, so target them structurally through the form.
export async function waitForCredentialsForm(page: Page) {
  await page.locator("form.fl-form input.fl-in").first().waitFor();
}

export function identifierField(page: Page) {
  return page.locator("form.fl-form input.fl-in").first();
}

export function passwordField(page: Page) {
  return page.locator("form.fl-form input.fl-pw-in");
}

// Locale defaults to Arabic, so target the submit structurally rather than by
// label, which would need to match whichever language rendered.
export async function submitCredentials(page: Page) {
  await page.locator("form.fl-form button.fl-submit").click();
}
