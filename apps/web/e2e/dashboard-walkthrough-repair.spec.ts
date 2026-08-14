import { expect, test, type Page } from "@playwright/test";
import { storageStatePath } from "./personas";

type Locale = "en" | "ar";
type Theme = "light" | "dark";

async function openDashboard(page: Page, locale: Locale, theme: Theme, route: string, width = 1440) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.goto(`/locale?set=${locale}`);
  await page.goto(route);
  await page.evaluate(value => {
    localStorage.setItem("saqeel-theme", value);
  }, theme);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

async function expectTerminologyClean(page: Page) {
  await expect(page.locator("body")).not.toContainText(/dashboard\.xlsx|\bRLS\b|Governance blocked|Methodology|المنهجية|محجوب بالحوكمة/i);
}

test.describe("INSP-723/724/725 dashboard walkthrough repair", () => {
  test.use({ storageState: storageStatePath("supervisor") });

  test("Strategic lenses retain hierarchy, actions and clear disclosures in EN/AR light/dark", async ({ page }) => {
    test.setTimeout(180_000);
    const states: Array<{ locale: Locale; theme: Theme; width: number }> = [
      { locale: "en", theme: "light", width: 1440 },
      { locale: "en", theme: "dark", width: 1440 },
      { locale: "ar", theme: "light", width: 390 },
      { locale: "ar", theme: "dark", width: 1440 },
    ];
    const lenses = ["region", "city", "sector", "authority"] as const;

    for (const state of states) {
      for (const lens of lenses) {
        await openDashboard(page, state.locale, state.theme, `/dashboard?view=strategic&group=${lens}`, state.width);
        await expect(page.locator(`a[aria-current="page"][href*="group=${lens}"]`).first()).toBeVisible();
        await expect(page.getByRole("columnheader", { name: state.locale === "ar" ? "السجلات" : "Records" })).toBeVisible();
        await expect(page.getByRole("columnheader", { name: state.locale === "ar" ? "نسبة الامتثال" : "Compliance rate" })).toBeVisible();
        await expect(page.getByText(state.locale === "ar" ? "كيف يُحتسب هذا؟" : "How is this calculated?", { exact: true }).first()).toBeVisible();
        await expectTerminologyClean(page);

        const firstAction = page.getByRole("link", { name: state.locale === "ar" ? "فتح المصانع" : "Open factories" }).first();
        if (await firstAction.count()) {
          await expect(firstAction).toHaveAttribute("href", new RegExp(`/factories\\?${lens}=`));
        }
      }
    }
  });

  test("Operational and Your Work expose accepted disclosure and capacity wording", async ({ page }) => {
    test.setTimeout(120_000);
    for (const state of [
      { locale: "en" as const, theme: "light" as const },
      { locale: "ar" as const, theme: "dark" as const },
    ]) {
      await openDashboard(page, state.locale, state.theme, "/dashboard?view=operational", state.locale === "ar" ? 390 : 1440);
      await expect(page.getByText(state.locale === "ar" ? "عملك" : "Your work", { exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: state.locale === "ar" ? "عمليات اليوم" : "Today's operations" })).toBeVisible();
      await expect(page.getByText(state.locale === "ar" ? "فتح التنفيذ" : "Open Execution", { exact: true }).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/grouped by inspector|مجمّع حسب المفتش/i);
      await expect(page.getByText(state.locale === "ar" ? "كيف يُحتسب هذا؟" : "How is this calculated?", { exact: true }).first()).toBeVisible();
      await expectTerminologyClean(page);
    }
  });
});
