import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

// CD-020 · SCR-WEB-100 · MVP1-M01-001/011. The planning home is a real
// Planner-only routing surface. Package readiness accepts the same immutable
// published/locked states as the three destination workflows, and failed
// reads never masquerade as an empty/disabled workspace.

test.describe("CD-020 planning home", () => {
  test("Planner sees all three governed planning methods", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("planner") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    for (const href of ["/planning/bulk", "/planning/single", "/planning/immediate"]) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
    await context.close();
  });

  test("non-Planner direct access renders no planning method links", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("reviewer") });
    const page = await context.newPage();
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await expect(page.getByRole("heading", { name: /Authorized role required/i })).toBeVisible();
    await expect(page.locator('a[href^="/planning/"]')).toHaveCount(0);
    await context.close();
  });

  test("source contract uses locked packages, fail-closed reads and neutral errors", () => {
    const home = readFileSync(join(process.cwd(), "src/app/(app)/planning/page.tsx"), "utf8");
    expect(home).toContain('.in("status", ["published", "locked"])');
    expect(home).toContain("packageError || draftsError");
    expect(home).toContain('aria-disabled="true"');
    const register = readFileSync(join(process.cwd(), "src/app/(app)/planning/plans/page.tsx"), "utf8");
    const drill = readFileSync(join(process.cwd(), "src/app/(app)/planning/plans/[id]/page.tsx"), "utf8");
    expect(register).not.toContain("{error.message}");
    expect(drill).not.toContain("pErr?.message ?? kErr?.message");
  });
});
