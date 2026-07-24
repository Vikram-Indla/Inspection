import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inspectionDocsRoot } from "./evidence-path";
import { storageStatePath } from "./personas";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");
const EVIDENCE_DIR = join(
  inspectionDocsRoot,
  "07_TEST_EVIDENCE_AND_SCREENSHOTS",
  "web-admin-phase1",
  "M9",
  "localization-001",
);
mkdirSync(EVIDENCE_DIR, { recursive: true });

async function setPresentation(page: Page, locale: "en" | "ar", theme: "light" | "dark") {
  await page.goto(`/locale?set=${locale}`);
  await page.evaluate(value => localStorage.setItem("saqeel-theme", value), theme);
  await page.goto("/admin/localization");
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

function watchBrowserHealth(page: Page) {
  const failures: string[] = [];
  page.on("pageerror", error => failures.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", request => {
    // Route/locale changes cancel the shell's in-flight notification-count
    // HEAD request. That browser navigation cancellation is not a provider
    // failure; any other failed request remains test-fatal.
    const errorText = request.failure()?.errorText ?? "";
    if (errorText === "net::ERR_ABORTED") return;
    failures.push(`requestfailed: ${request.method()} ${request.url()} ${errorText}`);
  });
  page.on("response", response => {
    if (response.status() >= 500) failures.push(`response: ${response.status()} ${response.url()}`);
  });
  return () => expect(failures, "browser console and network health").toEqual([]);
}

test.describe("WA-M9-AC-001/004/005 source and governance contracts", () => {
  test("the registered design is traceable and existing localization behavior remains wired", () => {
    const manager = source("src/app/(app)/admin/localization/Manager.tsx");
    const actions = source("src/app/(app)/admin/localization/actions.ts");

    expect(manager).toContain('data-saqeel-design="WA-DES-010"');
    expect(manager).toContain("11867bb534b7c318d7689b0300e6b59c485db8a5daab009a3c904851d222d91d");
    for (const behavior of [
      "saveTranslation",
      "markReviewed",
      "addKey",
      "syncFromCode",
      "getHistory",
      "restoreRevision",
      "exportCsv",
    ]) {
      expect(manager).toContain(behavior);
    }
    expect(actions).toContain('.from("ui_string_revisions")');
    expect(actions).toContain('status: "draft"');
    expect(actions).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE|bypassRls/i);
  });

  test("permission is checked before configuration rows are loaded", () => {
    const pageSource = source("src/app/(app)/admin/localization/page.tsx");
    const roleGuard = pageSource.indexOf("getUserRoles(user.id)");
    const dictionaryRead = pageSource.indexOf('.from("ui_strings")');
    expect(roleGuard).toBeGreaterThan(0);
    expect(dictionaryRead).toBeGreaterThan(roleGuard);
    expect(pageSource).toContain('"compliance_admin", "security_admin", "workflow_admin"');
    expect(pageSource).toContain("No localization data has been loaded");
  });
});

test.describe("WA-M9-AC-001/002/003/006 admin runtime", () => {
  test.use({ storageState: storageStatePath("admin") });

  test("desktop registry is bounded, searchable, keyboard operable and accessible", async ({ page }) => {
    const expectHealthyBrowser = watchBrowserHealth(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await setPresentation(page, "en", "light");

    const registry = page.locator('[data-saqeel-design="WA-DES-010"]');
    await expect(registry).toBeVisible();
    await expect(registry).toHaveAttribute(
      "data-design-hash",
      "11867bb534b7c318d7689b0300e6b59c485db8a5daab009a3c904851d222d91d",
    );
    await expect(page.getByRole("heading", { name: "Translation registry", exact: true })).toBeVisible();
    await expect(registry.locator("article")).toHaveCount(12);
    await expect(page.getByText(/Page 1 \//)).toBeVisible();

    const addKey = page.getByRole("button", { name: "Add key", exact: true });
    await addKey.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#localization-add-key")).toBeVisible();
    await page.locator("#localization-add-key").getByRole("button", { name: "Close", exact: true }).click();

    const search = page.getByRole("textbox", { name: /Search key, English or Arabic/ });
    await search.fill("no-such-localization-key-0982");
    await expect(page.getByRole("heading", { name: "No strings match" })).toBeVisible();
    await search.fill("");
    await expect(registry.locator("article")).toHaveCount(12);

    await page.getByRole("button", { name: /Missing Arabic/ }).click();
    await expect(page.getByRole("button", { name: /Missing Arabic/ })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /All keys/ }).click();
    await expectNoHorizontalOverflow(page);

    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
    expectHealthyBrowser();
    await page.screenshot({ path: join(EVIDENCE_DIR, "after-admin-localization-en-light-1440x900.png"), fullPage: true });
  });

  test("Arabic RTL, dark theme, tablet and narrow layouts preserve every control", async ({ page }) => {
    const expectHealthyBrowser = watchBrowserHealth(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await setPresentation(page, "ar", "dark");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('[data-saqeel-design="WA-DES-010"]')).toBeVisible();
    await expect(page.locator('[data-saqeel-design="WA-DES-010"] article').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('button[type="button"]').filter({ hasText: /إضافة مفتاح|Add key/ }).first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "after-admin-localization-ar-dark-390x844.png"), fullPage: true });

    await page.setViewportSize({ width: 820, height: 1180 });
    await page.reload();
    await expect(page.locator('[data-saqeel-design="WA-DES-010"]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expectHealthyBrowser();
  });
});

test.describe("WA-M9-AC-005 denied-user runtime", () => {
  test.use({ storageState: storageStatePath("reviewer") });

  test("a reviewer sees a fail-closed role boundary and no localization data", async ({ page }) => {
    const expectHealthyBrowser = watchBrowserHealth(page);
    await page.goto("/locale?set=en");
    await page.goto("/admin/localization");
    await expect(page.locator(".sq-state[role='alert']")).toContainText("No localization data has been loaded");
    await expect(page.locator('[data-saqeel-design="WA-DES-010"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Return to my workspace" })).toBeVisible();
    expectHealthyBrowser();
  });
});
