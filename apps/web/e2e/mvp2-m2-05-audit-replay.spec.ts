import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

test.describe("MVP2-CD-031-M2-05 audit replay UI", () => {
  test.use({ storageState: storageStatePath("admin") });

  test("renders the flight recorder with semantic contracts applied (not degraded)", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/admin/audit");
    await expect(page.getByRole("heading", { name: "Inspection Flight Recorder" }).first()).toBeVisible();
    await expect(page.getByText(/append-only/i).first()).toBeVisible();
    // Semantic replay contracts ARE applied on staging → the degraded banner must be absent.
    await expect(page.getByText(/Semantic replay contracts are not applied/i)).toHaveCount(0);
    // The policy-held boundary copy lives in the print-safe view (export/reveal/redaction held).
    await page.goto("/admin/audit?view=print");
    await expect(page.getByText(/Operational view only/i).first()).toBeVisible();
  });

  test("exposes reconstruction, comparison, completeness, custody and print modes", async ({ page }) => {
    await page.goto("/locale?set=en"); await page.goto("/admin/audit");
    for (const name of ["Point in time","Compare","Completeness","Custody","Print-safe"]) {
      await expect(page.getByRole("link", { name })).toBeVisible();
    }
    await page.getByRole("link", { name: "Completeness" }).click();
    await expect(page.getByRole("heading", { name: /Completeness/ })).toBeVisible();
    // Completeness is DERIVED from a selected case's ontology, never a universal fraction:
    // with no case selected the ledger honestly guards instead of inventing REQ rows.
    await expect(page.getByText(/Select one non-truncated case with a published ontology/i)).toBeVisible();
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
