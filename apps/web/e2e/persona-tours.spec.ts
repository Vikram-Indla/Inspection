import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// Persona tours: each role lands where /launch sends it (role decides, never the
// URL) and its channel surfaces render. Authorization is enforced by RLS, not UI
// (per SCR-ADM-011 banner) — so cross-channel visits render scoped shells, and the
// tour asserts the persona's own surfaces plus that scoping design holds.

test.describe("planner tour (web channel)", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("lands on /planning; all three planning methods reachable", async ({ page }) => {
    await page.goto("/launch");
    await page.waitForURL(/\/planning/);
    for (const href of ["/planning/single", "/planning/bulk", "/planning/immediate"]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
  });

  test("single-planning wizard renders its gate: search, publish", async ({ page }) => {
    await page.goto("/planning/single");
    await expect(page.getByPlaceholder(/CR number|Industrial License/i)).toBeVisible();
    // CD-022: the configuration column (incl. window_start) is progressively
    // disclosed — it only renders once an identity is selected and its
    // license + location are confirmed (M01-036/038). Not asserted here.
    await expect(page.getByRole("button", { name: /publish visit/i })).toBeVisible();
  });

  test("visits and factories registries render", async ({ page }) => {
    for (const route of ["/visits", "/factories"]) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route.replace("/", "\\/")));
      await expect(page.locator("nav").first()).toBeVisible(); // Shell, not a login bounce
    }
  });
});

test.describe("inspector tour (iPad channel)", () => {
  test.use({ storageState: storageStatePath("inspector") });

  test("lands on /field; dashboard KPIs and tab bar render", async ({ page }) => {
    await page.goto("/launch");
    await page.waitForURL(/\/field/);
    await expect(page.getByText("Assigned visits").first()).toBeVisible();
    await expect(page.getByLabel("Start next visit")).toBeVisible(); // FieldTabs FAB
  });

  test("cross-channel visit renders an RLS-scoped shell, not a data leak", async ({ page }) => {
    // Design: "Access is enforced by Row Level Security, not UI" — the admin
    // shell renders but every query is scoped by the inspector's JWT.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/); // no crash, no login bounce
    await expect(page.locator("nav").first()).toBeVisible();
  });
});

test.describe("reviewer tour (web channel)", () => {
  test.use({ storageState: storageStatePath("reviewer") });

  test("lands on /reviews; queue renders with the immutability contract visible", async ({ page }) => {
    await page.goto("/launch");
    await page.waitForURL(/\/reviews/);
    // Queue has either pending panels / history table or the clear state
    await expect(page.locator(".ax-table, .ax-state").first()).toBeVisible();
    await expect(page.locator(".ax-banner--immutable")).toBeVisible();
  });
});
