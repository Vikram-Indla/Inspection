import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// Unified responsive browser delivery: no automatic app-shell worker. Offline
// business state remains in IndexedDB and a loaded workspace responds honestly
// to the browser's network signal; offline-drill.spec.ts proves queued replay.
test.use({
  storageState: storageStatePath("inspector"),
  screenshot: "off",
  trace: "off",
});

test("the unified field route does not automatically register or control a service worker", async ({ page }) => {
  await page.goto("/field", { waitUntil: "domcontentloaded" });
  const worker = await page.evaluate(async () => ({
    registrations: (await navigator.serviceWorker.getRegistrations()).length,
    controlled: Boolean(navigator.serviceWorker.controller),
  }));

  expect(worker.registrations, "ordinary responsive navigation must not install a worker").toBe(0);
  expect(worker.controlled, "the field route must remain a browser page, not an app-shell client").toBe(false);
});

test("a loaded field browser page reports network interruption without claiming cold-shell navigation", async ({ page, context }) => {
  await page.goto("/field/settings/readiness", { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page.locator("[data-readiness-ready=ready]")).toBeVisible();

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.getByText("Offline", { exact: true }).first()).toHaveClass(/badge-warning/);

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("Online", { exact: true }).first()).toBeVisible();
});
