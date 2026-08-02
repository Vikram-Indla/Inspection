import { test as setup, expect } from "@playwright/test";
import { PERSONAS, storageStatePath, type PersonaKey } from "./personas";
import { waitForCredentialsForm, submitCredentials, identifierField, passwordField } from "./login-helper";

// Signs each persona in through the real /login UI (SCR-PUB-010) and captures
// storage state so specs start authenticated. Landing is decided by role via
// /launch, never by URL — asserting the role home is itself a persona-tour check.
for (const key of Object.keys(PERSONAS) as PersonaKey[]) {
  const p = PERSONAS[key];
  setup(`authenticate ${key}`, async ({ page }) => {
    page.on("pageerror", error => console.error(`[browser:${key}] ${error.message}`));
    page.on("console", message => { if (message.type() === "error") console.error(`[browser:${key}] ${message.text()}`); });
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await identifierField(page).fill(p.email);
    await passwordField(page).fill(p.password);
    await submitCredentials(page);
    // /launch verifies identity and reads the user's live role grants before it
    // redirects. Keep one deterministic attempt, but allow the remote identity
    // and role lookups enough time under release-suite load.
    await page.waitForURL((url) => (
      url.pathname.startsWith(p.home) ||
      (key === "inspector" && url.pathname.startsWith("/dashboard"))
    ), { timeout: 40_000 });
    // The controlled Inspector is deliberately multi-role, so /launch may
    // choose Dashboard first. Prove the Inspector workspace is authorized
    // before persisting that same authenticated session.
    if (key === "inspector" && !new URL(page.url()).pathname.startsWith(p.home)) {
      await page.goto(p.home);
      await page.waitForURL((url) => url.pathname.startsWith(p.home));
    }
    await expect(page.locator("body")).not.toContainText("ERR-AUTH");
    // The product correctly defaults a fresh session to Arabic (covered by the
    // CD-001 locale test). The older journey specs intentionally assert their
    // operational labels in English, so persist that explicit user preference
    // in the reusable authenticated fixture instead of weakening Arabic-first.
    const origin = new URL(page.url()).origin;
    await page.context().addCookies([
      { name: "locale", value: "en", url: origin },
      { name: "login_locale", value: "en", url: origin },
    ]);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.context().storageState({ path: storageStatePath(key) });
  });
}
