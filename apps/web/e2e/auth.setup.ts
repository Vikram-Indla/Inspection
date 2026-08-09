import { test as setup, expect } from "@playwright/test";
import { existsSync, statSync } from "node:fs";
import { PERSONAS, storageStatePath, type PersonaKey } from "./personas";
import { waitForCredentialsForm, submitCredentials, identifierField, passwordField } from "./login-helper";

const withoutLocale = (pathname: string) => pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";

// Supabase throttles repeated password grants from one IP. Re-authenticating
// all six personas on every spec invocation trips that limit and fails setup
// spuriously, so a storage state captured within the last 30 minutes is
// reused instead of re-earned. Delete playwright/.auth to force fresh logins.
const REUSE_WINDOW_MS = 30 * 60 * 1000;
const hasFreshState = (key: PersonaKey) => {
  const path = storageStatePath(key);
  return existsSync(path) && Date.now() - statSync(path).mtimeMs < REUSE_WINDOW_MS;
};

// Signs each persona in through the real /login UI (SCR-PUB-010) and captures
// storage state so specs start authenticated. Every governed role now lands on
// the shared Dashboard; each role's operational home remains the useful-content
// authorization check before its authenticated state is persisted.
for (const key of Object.keys(PERSONAS) as PersonaKey[]) {
  const p = PERSONAS[key];
  setup(`authenticate ${key}`, async ({ page }) => {
    setup.setTimeout(180_000);
    setup.skip(hasFreshState(key), "reusing storage state captured within the last 30 minutes");
    page.on("pageerror", error => console.error(`[browser:${key}] ${error.message}`));
    page.on("console", message => { if (message.type() === "error") console.error(`[browser:${key}] ${message.text()}`); });
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await identifierField(page).fill(p.email);
    await passwordField(page).fill(p.password);
    await submitCredentials(page);
    // /launch verifies identity and reads the user's live role grants before it
    // redirects. Allow the remote identity and role lookups enough time under
    // release-suite load and dev-server on-demand compilation, and retry the
    // redirect wait once from /launch before failing.
    const arrived = (url: URL) => (
      withoutLocale(url.pathname).startsWith(p.home) ||
      withoutLocale(url.pathname).startsWith("/dashboard")
    );
    await page.waitForURL(arrived, { timeout: 60_000 }).catch(async () => {
      await page.goto("/launch");
      await page.waitForURL(arrived, { timeout: 60_000 });
    });
    // Dashboard arrival proves the shared post-login route, not the role's
    // operational content. Prove that content remains authorized before
    // persisting the same authenticated session.
    if (!withoutLocale(new URL(page.url()).pathname).startsWith(p.home)) {
      await page.goto(p.home);
      await page.waitForURL((url) => withoutLocale(url.pathname).startsWith(p.home));
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
