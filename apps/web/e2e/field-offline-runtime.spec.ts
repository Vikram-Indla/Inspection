import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// BS-7 / BS-9 runtime verification for MVP1-FND-005/006 and STM-SYNC-001/002.
// These are deliberately independent tests: a missing worker must not silently
// turn the cold-shell assertion into an unreported pass.
test.use({
  storageState: storageStatePath("inspector"),
  screenshot: "off",
  trace: "off",
});

async function waitForControlledFieldShell(page: import("@playwright/test").Page) {
  await page.goto("/field");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
    });
  });
  // Exercise one controlled online navigation so the exact authenticated
  // response is present before the network is removed.
  await page.reload({ waitUntil: "domcontentloaded" });
}

test("MVP1-FND-005 — the field shell automatically registers and is controlled by the service worker", async ({ page }) => {
  await waitForControlledFieldShell(page);
  const worker = await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return {
      registrations: registrations.map(registration => ({
        scope: registration.scope,
        active: Boolean(registration.active),
      })),
      controlled: Boolean(navigator.serviceWorker.controller),
    };
  });

  expect(worker.registrations, "automatic /login -> /field runtime must install a service worker").not.toHaveLength(0);
  expect(worker.registrations.some(registration => registration.active), "the installed worker must be active").toBe(true);
  expect(worker.controlled, "the loaded field shell must be controlled before offline verification").toBe(true);
});

test("MVP1-FND-005 — a previously loaded field shell reloads with the network cut", async ({ page, context }) => {
  await waitForControlledFieldShell(page);
  await expect(page.locator("body")).not.toBeEmpty();

  await context.setOffline(true);
  let reloadError: string | null = null;
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
  } catch (error) {
    reloadError = error instanceof Error ? error.message : String(error);
  } finally {
    await context.setOffline(false);
  }

  expect(reloadError, "a controlled field navigation must resolve from the app-shell cache while offline").toBeNull();
  expect(new URL(page.url()).pathname.startsWith("/field"), "offline reload must remain inside the field channel").toBe(true);
  await expect(page.locator("body")).not.toBeEmpty();
});
