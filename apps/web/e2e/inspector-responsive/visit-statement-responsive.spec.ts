import { test, expect } from "@playwright/test";
import { evidenceDirectory } from "../evidence-path";
import { waitForCredentialsForm, identifierField, passwordField, submitCredentials } from "../login-helper";

// TASK-INSPECTOR-RESPONSIVE-ACCEPTANCE-001 — Visit Statement, positive path.
//
// Credentials match scripts/test-data/local_test_data_seed.sql and are loaded
// only from the governed local environment reference. Inspection 77000000-0000-4000-8000-000000000003 was pushed to
// status='submitted' via a one-off public.submit_inspection() call that
// deliberately skips start_review(), because in normal flow a reviewer picks
// up the review almost immediately and status advances past 'submitted' —
// the exact state /field/inspection/[id]/statement requires (page.tsx:25).
const INSPECTOR_EMAIL = "inspector3@mim.gov.sa";
const requireUatSecret = (): string => {
  const value = process.env.SAQEEL_UAT_PASSWORD?.trim() || process.env.SAQEEL_CROSS_ROLE_PASSWORD?.trim();
  if (!value) throw new Error("The governed primary-cohort secret reference is required for the UAT Inspector");
  return value;
};
const SUBMITTED_INSPECTION_ID = "77000000-0000-4000-8000-000000000003";

const WIDTHS = [
  { label: "1280", width: 1280, height: 900 },
  { label: "1024", width: 1024, height: 900 },
  { label: "768", width: 768, height: 1024 },
  { label: "720", width: 720, height: 1024 },
];

const evidenceDir = evidenceDirectory("task-inspector-responsive-acceptance-001");

async function loginAsInspector3(page: import("@playwright/test").Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(INSPECTOR_EMAIL);
  await passwordField(page).fill(requireUatSecret());
  await submitCredentials(page);
  await page.waitForURL((url) => url.pathname === "/dashboard", { timeout: 20_000 });
}

test.describe("INSP visit statement — responsive positive path — EN · Light", () => {
  for (const { label, width, height } of WIDTHS) {
    test(`renders Visit Statement at ${label}px with no overflow (EN light)`, async ({ page }) => {
      await loginAsInspector3(page, width, height);

      await page.goto(`/field/inspection/${SUBMITTED_INSPECTION_ID}/statement`);
      await expect(page).toHaveURL(new RegExp(`/field/inspection/${SUBMITTED_INSPECTION_ID}/statement$`));
      await expect(page.locator('[data-screen-id="EXE-S17"]')).toBeVisible();

      // Functional check, not just a screenshot (per tests.md): the immutable
      // banner, the real data rows, and the locked-submission badge must all
      // be present, and the layout must not overflow the viewport at this width.
      await expect(page.locator("text=Final version — not editable.")).toBeVisible();
      await expect(page.locator("dt", { hasText: "Visitor name" })).toBeVisible();
      await expect(page.locator("dd", { hasText: "زياد الحارثي" })).toBeVisible();
      await expect(page.locator("text=Submitted (locked)")).toBeVisible();

      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(horizontalOverflow).toBeLessThanOrEqual(1);

      await page.screenshot({ path: `${evidenceDir}/visit-statement-${label}-en-light.png`, fullPage: true });
    });
  }
});

test.describe("INSP visit statement — responsive positive path — EN · Dark", () => {
  for (const { label, width, height } of WIDTHS) {
    test(`renders Visit Statement at ${label}px with no overflow (EN dark)`, async ({ page }) => {
      await loginAsInspector3(page, width, height);

      await page.goto(`/field/inspection/${SUBMITTED_INSPECTION_ID}/statement`);
      await expect(page).toHaveURL(new RegExp(`/field/inspection/${SUBMITTED_INSPECTION_ID}/statement$`));
      await page.evaluate(() => {
        localStorage.setItem("saqeel-theme", "dark");
        document.documentElement.setAttribute("data-theme", "dark");
      });
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(page.locator('[data-screen-id="EXE-S17"]')).toBeVisible();

      await expect(page.locator("text=Final version — not editable.")).toBeVisible();
      await expect(page.locator("dt", { hasText: "Visitor name" })).toBeVisible();
      await expect(page.locator("dd", { hasText: "زياد الحارثي" })).toBeVisible();
      await expect(page.locator("text=Submitted (locked)")).toBeVisible();

      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(horizontalOverflow).toBeLessThanOrEqual(1);

      await page.screenshot({ path: `${evidenceDir}/visit-statement-${label}-en-dark.png`, fullPage: true });
    });
  }
});

test.describe("INSP visit statement — responsive positive path — AR · RTL", () => {
  for (const { label, width, height } of WIDTHS) {
    test(`renders Visit Statement at ${label}px with no overflow (AR RTL)`, async ({ page }) => {
      await loginAsInspector3(page, width, height);

      await page.goto("/locale?set=ar");
      await page.goto(`/field/inspection/${SUBMITTED_INSPECTION_ID}/statement`);
      await expect(page).toHaveURL(new RegExp(`/field/inspection/${SUBMITTED_INSPECTION_ID}/statement$`));
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.locator('[data-screen-id="EXE-S17"]')).toBeVisible();

      // Arabic strings from page.tsx tr() calls — real translated text, not transliteration.
      await expect(page.locator("text=النسخة النهائية غير قابلة للتعديل.")).toBeVisible();
      await expect(page.locator("dt", { hasText: "اسم الزائر" })).toBeVisible();
      await expect(page.locator("dd", { hasText: "زياد الحارثي" })).toBeVisible();
      await expect(page.locator("text=مُرسَل (مقفل)")).toBeVisible();

      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(horizontalOverflow).toBeLessThanOrEqual(1);

      await page.screenshot({ path: `${evidenceDir}/visit-statement-${label}-ar-rtl.png`, fullPage: true });
    });
  }
});
