import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectionDocsRoot } from "./evidence-path";
import { storageStatePath } from "./personas";
import { extractAcceptedCalls, planSync, scanCodeForKeys } from "../src/lib/i18n-sync";

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
  test("INSP-720 scanner admits accepted keys and rejects local bilingual prose", () => {
    const fixture = mkdtempSync(join(tmpdir(), "insp-720-scanner-"));
    const governed = [
      { key: "governed.key", en: "Catalogue English" },
      { key: "governed.copy", en: "Catalogue copy" },
      { key: "catalogue.only", en: "Catalogue only" },
    ];
    try {
      const calls = `
        t("governed.key", "Governed English");
        t("governed.copy", copy("Governed copy", "نسخة معتمدة"));
        t("planned.but.unregistered", "Not accepted yet");
        const t = (en: string, ar: string) => en;
        t("NoDotEnglish", "نص محلي");
        t("A new version is ready", "يتوفر إصدار جديد");
        query.select("governed.key", "must not suffix-match");
        state.set("governed.copy", "must not suffix-match");
        value.format("catalogue.only", "must not suffix-match");
      `;
      writeFileSync(join(fixture, "calls.tsx"), calls);
      expect(extractAcceptedCalls(calls, new Set(governed.map(row => row.key)))).toEqual([
        { key: "governed.key", en: "Governed English" },
        { key: "governed.copy", en: "Governed copy" },
      ]);
      expect(scanCodeForKeys(governed, fixture)).toEqual([
        { key: "governed.key", en: "Catalogue English" },
        { key: "governed.copy", en: "Catalogue copy" },
        { key: "catalogue.only", en: "Catalogue only" },
      ]);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  test("INSP-720 second scan plans zero writes and preserves reviewed values", () => {
    const rows = [
      { key: "governed.key", en: "Governed English", ar: "ترجمة مراجعة", status: "reviewed", orphaned: false },
      { key: "decision.required", en: "Decision required", ar: null, status: "draft", orphaned: false },
    ];
    const code = rows.map(({ key, en }) => ({ key, en }));
    const first = planSync(code, rows);
    const second = planSync(code, rows);
    for (const plan of [first, second]) {
      expect(plan.inserts).toEqual([]);
      expect(plan.enUpdates).toEqual([]);
      expect(plan.orphanKeys).toEqual([]);
      expect(plan.reviveKeys).toEqual([]);
    }
    expect(rows[0].ar).toBe("ترجمة مراجعة");
    expect(rows[1].ar).toBeNull();
  });

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
    expect(actions).toContain("requireLocalizationManager");
    expect(actions.split('.eq("updated_at", expectedUpdatedAt)').length - 1).toBe(3);
    expect(actions).toContain("missingPlaceholders");
    expect(actions).toContain("changed_by");
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

  test("the registry pages through the complete governed dictionary", () => {
    const pageSource = source("src/app/(app)/admin/localization/page.tsx");
    expect(pageSource).toContain("UI_STRINGS_PAGE_SIZE = 1000");
    expect(pageSource).toContain(".range(from, from + UI_STRINGS_PAGE_SIZE - 1)");
    expect(pageSource).toContain("if (page.length < UI_STRINGS_PAGE_SIZE) break");
    expect(pageSource).toContain("updated_at");
  });

  test("loading, empty, degraded and unexpected-error states remain explicit and bilingual", () => {
    const pageSource = source("src/app/(app)/admin/localization/page.tsx");
    const manager = source("src/app/(app)/admin/localization/Manager.tsx");
    const loading = source("src/app/(app)/admin/localization/loading.tsx");
    const unexpectedError = source("src/app/(app)/admin/localization/error.tsx");

    expect(pageSource).toContain("loadFailed");
    expect(pageSource).toContain("Nothing was changed");
    expect(manager).toContain("rows.length === 0");
    expect(manager).toContain("filtered.length === 0");
    expect(loading).toContain("Loading localization registry");
    expect(loading).toContain("جارٍ تحميل سجل الترجمات");
    expect(unexpectedError).toContain("Identity, permission, or registry data could not be verified");
    expect(unexpectedError).toContain("تعذّر التحقق من الهوية أو الصلاحيات أو تحميل البيانات");
  });
});

test.describe("WA-M9-AC-001/002/003/006 admin runtime", () => {
  test.use({ storageState: storageStatePath("admin") });

  test("the shared Admin account disclosure has an accessible name", async ({ page }) => {
    await setPresentation(page, "en", "light");
    const accountDisclosure = page.locator("summary").filter({ has: page.locator("strong") });
    await expect(accountDisclosure).toHaveAccessibleName(/admin1.*Admin/i);
    const a11y = await new AxeBuilder({ page }).include("summary").analyze();
    expect(a11y.violations).toEqual([]);
  });

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
    const resultSummary = await registry.locator(".t-caption")
      .filter({ hasText: /^Showing / })
      .textContent();
    const totalKeys = Number(resultSummary?.match(/\/(\d+)/)?.[1]);
    expect(totalKeys).toBeGreaterThan(1000);

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

    await page.getByRole("button", { name: "التبديل إلى العربية", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "سجل الترجمات", exact: true })).toBeVisible();
  });

  test("the restored governed key exposes persisted business state, version guard and immutable history", async ({ page }) => {
    const expectHealthyBrowser = watchBrowserHealth(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await setPresentation(page, "en", "light");

    const search = page.getByRole("textbox", { name: /Search key, English or Arabic/ });
    await search.fill("admin.reg.r1.detail.auditNote");
    const row = page.locator('[data-saqeel-design="WA-DES-010"] article').filter({
      hasText: "admin.reg.r1.detail.auditNote",
    });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("textbox", { name: /Arabic: admin.reg.r1.detail.auditNote/ }))
      .not.toHaveValue("");
    await expect(row.getByText("draft", { exact: true }).first()).toBeVisible();

    const versionInputs = row.locator('input[name="expected_updated_at"]');
    await expect(versionInputs.first()).toHaveValue(/^\d{4}-\d{2}-\d{2}T/);
    await row.getByRole("button", { name: "history", exact: true }).click();
    await expect(row.locator('[id^="localization-history-"]')).toBeVisible();
    await expect(row.getByRole("button", { name: "Restore", exact: true }).first()).toBeVisible();
    expect(await row.locator('form:has(input[name="revision_id"])').count())
      .toBeGreaterThanOrEqual(4);
    await expect(row.getByText(/Changed by:/).first()).toBeVisible();

    expectHealthyBrowser();
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

    await page.setViewportSize({ width: 320, height: 800 });
    await setPresentation(page, "ar", "light");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByText("النص العربي طويل — تحقّق من عرضه في الشاشات الضيقة").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const a11y = await new AxeBuilder({ page }).analyze();
    expect(a11y.violations).toEqual([]);
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
