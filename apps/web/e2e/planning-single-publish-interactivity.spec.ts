import { test, expect } from "@playwright/test";
import { PERSONAS, goldenInspectorPersona } from "./personas";
import { login, rest, must } from "./live-rest";
import { identifierField, passwordField, submitCredentials, waitForCredentialsForm } from "./login-helper";

test("Planning Single keeps Publish interactive while Mapbox remains opt-in", async ({ page }) => {
  const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
  const inspector = await login(goldenInspectorPersona().email, goldenInspectorPersona().password);
  const factory = must(await rest("GET",
    "factories?select=id,factory_code,license_number&factory_code=like.R3-QA-CERT-*&official_lat=not.is.null&official_lng=not.is.null&order=created_at.desc&limit=1",
    planner.jwt), "read one governed golden factory")[0];
  const packageVersion = must(await rest("GET",
    `package_versions?select=id&status=eq.published&effective_from=lte.${new Date().toISOString().slice(0, 10)}&or=(effective_to.is.null,effective_to.gte.${new Date().toISOString().slice(0, 10)})&order=published_at.desc.nullslast&limit=1`,
    planner.jwt), "read current published package")[0];

  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(PERSONAS.planner.email);
  await passwordField(page).fill(PERSONAS.planner.password);
  await submitCredentials(page);
  await page.waitForURL(url => url.pathname.replace(/^\/(en|ar)(?=\/|$)/, "") === "/dashboard");
  await page.goto("/planning/single");

  await page.getByPlaceholder(/CR number|Industrial License/i).fill(factory.factory_code);
  const startedAt = Date.now();
  await page.locator(`input[name="factory_id"][value="${factory.id}"]`).check();
  const locationHeading = page.getByText(/3 · Confirm location/);
  await locationHeading.waitFor();
  const locationPanel = locationHeading.locator("..");
  const license = page.locator('input[name="license_number"]');
  if (await license.count()) await license.check();
  await locationPanel.locator('input[name="location_confirmed"]').check();
  await page.locator(`input[name="package_version_id"][value="${packageVersion.id}"]`).check();
  const start = new Date();
  start.setUTCSeconds(0, 0);
  start.setUTCMinutes(start.getUTCMinutes() - 1);
  const end = new Date(start.getTime() + 90 * 60_000);
  await page.locator('input[name="window_start"]').fill(start.toISOString().slice(0, 16));
  await page.locator('input[name="window_end"]').fill(end.toISOString().slice(0, 16));
  await page.locator('select[name="inspector_id"]').selectOption(inspector.userId);
  const publish = page.getByRole("button", { name: /submit for supervision/i });
  await expect(publish).toBeEnabled({ timeout: 20_000 });
  expect(Date.now() - startedAt, "Publish must become interactive inside the named 20s smoke-step timeout").toBeLessThan(20_000);
  await expect(page.getByRole("button", { name: "Map", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Text", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-map-provider="mapbox"]')).toHaveCount(0);
});
