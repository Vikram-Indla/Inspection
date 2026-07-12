import { test as setup, expect } from "@playwright/test";
import { PERSONAS, storageStatePath, type PersonaKey } from "./personas";
import { waitForCredentialsForm, submitCredentials } from "./login-helper";

// Signs each persona in through the real /login UI (SCR-PUB-010) and captures
// storage state so specs start authenticated. Landing is decided by role via
// /launch, never by URL — asserting the role home is itself a persona-tour check.
for (const key of Object.keys(PERSONAS) as PersonaKey[]) {
  const p = PERSONAS[key];
  setup(`authenticate ${key}`, async ({ page }) => {
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await page.locator("#email").fill(p.email);
    await page.locator("#pw").fill(p.password);
    await submitCredentials(page);
    await page.waitForURL((url) => url.pathname.startsWith(p.home), { timeout: 20_000 });
    await expect(page.locator("body")).not.toContainText("ERR-AUTH");
    await page.context().storageState({ path: storageStatePath(key) });
  });
}
