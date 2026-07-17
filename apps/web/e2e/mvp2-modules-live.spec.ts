import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// Live module journeys against staging. Each route consumes its real RLS-scoped
// MVP2 tables and must render (heading + banner + a hard state), flag ON.
// TASK-MVP2 M2-04/06/08/09/10/12. Requires FEATURE_* flags on in the server env.
test.use({ storageState: storageStatePath("admin") });

const ROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: "/admin/risk/models",     heading: /Risk model workbench/i },
  { path: "/cases",                 heading: /Cases/i },
  { path: "/portal",                heading: /External portal/i },
  { path: "/operations/exceptions", heading: /Exception board/i },
  { path: "/committee",             heading: /Committee & signatures/i },
  { path: "/admin/gis/spatial",     heading: /Spatial canvas/i },
];

for (const r of ROUTES) {
  test(`module route renders live: ${r.path}`, async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto(r.path);
    // Heading proves the flag is ON and the server component read its tables
    // without crashing (RLS-scoped). Not the flag-off NotYetBoundary.
    await expect(page.getByRole("heading", { name: r.heading }).first()).toBeVisible();
    await expect(page.getByText(/Not available yet/i)).toHaveCount(0);
    // A hard state is always present (banner or empty state) — never a blank page.
    await expect(page.locator(".ax-banner, .ax-state").first()).toBeVisible();
    // No horizontal overflow at desktop width.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBeFalsy();
  });
}

// Governed WRITE journey — proves live persistence + RLS (admin holds risk_owner).
// A rejected weights-sum is refused; a valid draft persists.
test("M2-04 governed write: invalid weights refused, valid draft persists (live RLS)", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/admin/risk/models");
  const label = `e2e-${Date.now()}`;
  // invalid: weights sum != 1.00 → server rule refuses, nothing persisted
  await page.locator('input[name="version_label"]').fill(label);
  await page.locator('textarea[name="payload"]').fill('{"factors":[{"key":"a","weight":0.5}],"bands":{"low":[0,39],"medium":[40,69],"high":[70,100]}}');
  await page.getByRole("button", { name: /Create draft/i }).click();
  await expect(page.getByText(/sum to 1\.00/i)).toBeVisible();
  // valid draft persists — fresh form (avoid uncontrolled-input reset across submits)
  await page.goto("/admin/risk/models");
  await page.locator('input[name="version_label"]').fill(label);
  await page.locator('textarea[name="payload"]').fill('{"factors":[{"key":"a","weight":1}],"bands":{"low":[0,39],"medium":[40,69],"high":[70,100]}}');
  await page.getByRole("button", { name: /Create draft/i }).click();
  await expect(page.getByText(/draft created/i)).toBeVisible();
  await page.reload();
  await expect(page.getByText(label)).toBeVisible(); // persisted in staging DB
});

test("M2-06 governed write: create a GIS layer (live RLS gis_admin)", async ({ page }) => {
  const key = `e2e-layer-${Date.now()}`;
  await page.goto("/locale?set=en");
  await page.goto("/admin/gis/spatial");
  await page.locator('input[name="layer_key"]').fill(key);
  await page.locator('input[name="label"]').fill(key);
  await page.getByRole("button", { name: /Create layer/i }).click();
  await expect(page.getByText(/layer created/i)).toBeVisible();
  await page.reload();
  await expect(page.getByText(key)).toBeVisible();
});

test("M2-10 governed write: open a case (live RLS compliance)", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/cases");
  await page.getByRole("button", { name: /Open case/i }).click();
  await expect(page.getByText(/case opened/i)).toBeVisible();
});

test("M2-12 governed write: record a signature act, verification unavailable (PKI held)", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/committee");
  await page.getByRole("button", { name: /Record signature act/i }).click();
  await expect(page.getByText(/recorded/i)).toBeVisible();
  await page.reload();
  // PKI/EBDA held → verification is 'unavailable', never fabricated 'verified'.
  await expect(page.getByText("unavailable").first()).toBeVisible();
});

test("M2-08 governed write: create an external request (live RLS compliance)", async ({ page }) => {
  const subject = `e2e-req-${Date.now()}`;
  await page.goto("/locale?set=en");
  await page.goto("/portal");
  await page.locator('input[name="subject"]').fill(subject);
  await page.getByRole("button", { name: /Create request/i }).click();
  await expect(page.getByText(/request created/i)).toBeVisible();
});
