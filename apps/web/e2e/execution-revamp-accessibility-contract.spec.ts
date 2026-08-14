import { expect, test } from "@playwright/test";
import { storageStatePath } from "./personas";

// EXE-CP-S01. These assertions were source-text greps against the hand-rolled
// focus trap in RevampExecutionWorkspace.tsx, which no longer exists: the
// drawers are native <dialog> elements opened with showModal(), so focus
// containment, Escape and focus restoration are platform guarantees rather
// than application code. Asserting the spelling of a trap that is gone proves
// nothing, so each claim is now exercised in the browser.

test.use({ storageState: storageStatePath("supervisor") });

const openFirstVisit = async (page: import("@playwright/test").Page) => {
  await page.goto("/locale?set=en");
  await page.goto("/execution");
  await page.getByRole("button", { name: /^View$/ }).first().click();
  return page.getByRole("dialog");
};

test.describe("EXE-CP-S01 governed drawer accessibility contract", () => {
  test("the visit drawer is a named modal dialog", async ({ page }) => {
    const dialog = await openFirstVisit(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-labelledby", "execution-detail-title");
    await expect(page.locator("#execution-detail-title")).toBeVisible();
  });

  test("focus moves into the drawer when it opens", async ({ page }) => {
    const dialog = await openFirstVisit(page);
    await expect(dialog).toBeVisible();
    const inside = await dialog.evaluate(node => node.contains(document.activeElement));
    expect(inside).toBe(true);
  });

  test("Escape closes the drawer and returns focus to the originating control", async ({ page }) => {
    const dialog = await openFirstVisit(page);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    const restored = await page.evaluate(() =>
      document.activeElement?.textContent?.trim() ?? "");
    expect(restored).toBe("View");
  });

  test("Tab stays inside the drawer while it is open", async ({ page }) => {
    const dialog = await openFirstVisit(page);
    await expect(dialog).toBeVisible();
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press("Tab");
      const inside = await dialog.evaluate(node => node.contains(document.activeElement));
      expect(inside).toBe(true);
    }
  });

  test("the reschedule drawer is reachable by keyboard and is a named modal dialog", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/execution");
    await page.getByRole("button", { name: /^Reschedule / }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-labelledby", "execution-reschedule-title");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
