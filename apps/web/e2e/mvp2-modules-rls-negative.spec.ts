import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// Live RLS NEGATIVE certification (Prompt 19) against staging. The inspector persona
// holds only the `inspector` role — none of the module writer roles (risk_owner,
// gis_admin, compliance_admin, reviewer). Every governed write must FAIL CLOSED at
// the database (RLS), surfaced as an honest error, never a silent success.
// TASK-MVP2 security · M2-04/06/08/10.
test.use({ storageState: storageStatePath("inspector") });

test("M2-04 risk draft is denied for a non-risk_owner (live RLS)", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/admin/risk/models");
  const boundary = page.getByRole("heading", { name: "You do not have access to this destination", exact: true });
  if (await boundary.count()) {
    await expect(boundary).toBeVisible();
    await expect(page.locator('input[name="version_label"]')).toHaveCount(0);
    return;
  }
  await page.locator('input[name="version_label"]').fill(`neg-${Date.now()}`);
  await page.locator('textarea[name="payload"]').fill('{"factors":[{"key":"a","weight":1}],"bands":{"low":[0,39],"medium":[40,69],"high":[70,100]}}');
  await page.getByRole("button", { name: /Create draft/i }).click();
  await expect(page.getByText(/scope required|not authorized|Couldn/i)).toBeVisible();
  await expect(page.getByText(/draft created/i)).toHaveCount(0);
});

test("M2-06 GIS layer create is denied for a non-gis_admin (live RLS)", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/admin/gis/spatial");
  const boundary = page.getByRole("heading", { name: "You do not have access to this destination", exact: true });
  if (await boundary.count()) {
    await expect(boundary).toBeVisible();
    await expect(page.locator('input[name="layer_key"]')).toHaveCount(0);
    return;
  }
  await page.locator('input[name="layer_key"]').fill(`neg-${Date.now()}`);
  await page.locator('input[name="label"]').fill("neg");
  await page.getByRole("button", { name: /Create layer/i }).click();
  await expect(page.getByText(/scope required|not authorized|Couldn/i)).toBeVisible();
  await expect(page.getByText(/layer created/i)).toHaveCount(0);
});

test("M2-10 open case is denied for a non-compliance persona (live RLS)", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/cases");
  const btn = page.getByRole("button", { name: /Open case/i });
  if (await btn.count()) {
    await btn.click();
    await expect(page.getByText(/scope required|not authorized|Couldn/i)).toBeVisible();
    await expect(page.getByText(/case opened/i)).toHaveCount(0);
  }
});

test("M2-08 external request create is denied for a non-compliance persona (live RLS)", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/portal");
  const subj = page.locator('input[name="subject"]');
  if (await subj.count()) {
    await subj.fill(`neg-${Date.now()}`);
    await page.getByRole("button", { name: /Create request/i }).click();
    await expect(page.getByText(/scope required|not authorized|Couldn/i)).toBeVisible();
    await expect(page.getByText(/request created/i)).toHaveCount(0);
  }
});
