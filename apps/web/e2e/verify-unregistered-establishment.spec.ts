import { expect, test } from "@playwright/test";
import { storageStatePath } from "./personas";

// Jira INSP-605 — real functional verification against the live dev server +
// Supabase, logged in as the seeded inspector persona.
test.use({ storageState: storageStatePath("inspector") });

test("INSP-605 unregistered establishment — real submit via create_immediate_visit", async ({ page }) => {
  await page.goto("/field/establishments/unregistered");
  await expect(page.getByRole("button", { name: /Capture current location/i })).toBeVisible();

  // Geolocation isn't available headless by default; grant + seed a fixed
  // coordinate through the browser context instead of relying on the button.
  await page.context().setGeolocation({ latitude: 24.7136, longitude: 46.6753 });
  await page.context().grantPermissions(["geolocation"]);
  await page.getByRole("button", { name: /Capture current location/i }).click();
  await expect(page.locator('input[readonly]').first()).toHaveValue(/24\.71/, { timeout: 10_000 });

  // Report type — the package selector renders a radiogroup labelled by its
  // "Report type" heading; pick the first inspection package.
  await page.getByRole("radiogroup", { name: /Report type/i }).getByRole("radio").first().check();

  await page.getByRole("radio", { name: "Complaint received", exact: true }).check();
  await page.fill("#ue-notes", "E2E verification — unregistered facility discovered in the field");
  await page.getByRole("button", { name: /Create visit/i }).click();

  // On success the action redirects to /field/{visitId}.
  await page.waitForURL(/\/field\/[0-9a-f-]{36}/, { timeout: 15_000 });
  expect(page.url()).toMatch(/\/field\/[0-9a-f-]{36}/);
});
