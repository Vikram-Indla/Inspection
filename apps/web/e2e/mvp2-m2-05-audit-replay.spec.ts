import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

test.describe("MVP2-CD-031-M2-05 audit replay UI", () => {
  test.use({ storageState: storageStatePath("admin") });

  test("renders the flight recorder and honest degraded semantic source", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/admin/audit");
    await expect(page.getByRole("heading", { name: "Inspection Flight Recorder" })).toBeVisible();
    await expect(page.getByText(/append-only/i)).toBeVisible();
    const degraded = page.getByText(/Semantic replay contracts are not applied|DEGRADED/i);
    if (await degraded.count()) await expect(degraded).toBeVisible();
    await expect(page.getByText(/Operational view only/i)).toBeVisible();
  });

  test("exposes reconstruction, comparison, completeness, custody and print modes", async ({ page }) => {
    await page.goto("/locale?set=en"); await page.goto("/admin/audit");
    for (const name of ["Point in time","Compare","Completeness","Custody","Print-safe"]) {
      await expect(page.getByRole("link", { name })).toBeVisible();
    }
    await page.getByRole("link", { name: "Completeness" }).click();
    await expect(page.getByRole("heading", { name: /Completeness/ })).toBeVisible();
    await expect(page.getByText("MVP2-REQ-0137")).toBeVisible();
    await expect(page.getByText("MVP2-REQ-0172")).toBeVisible();
  });

  test("reflows at 412 and mirrors Arabic without horizontal page overflow", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto("/locale?set=ar"); await page.goto("/admin/audit?view=ledger");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBeFalsy();
    await expect(page.getByText(/عرض تشغيلي فقط/)).toBeVisible();
  });
});

test.describe("MVP2-CD-031-M2-05 zero disclosure", () => {
  test.use({ storageState: storageStatePath("inspector") });
  test("inspector receives an unauthorized state with no event disclosure", async ({ page }) => {
    await page.goto("/locale?set=en"); await page.goto("/admin/audit");
    // Scope to the denial surface (Next's route-announcer is also role=alert).
    await expect(page.locator("section[role=alert].ar-denied")).toContainText("not authorized");
    await expect(page.locator(".ar-event")).toHaveCount(0);
  });
});
