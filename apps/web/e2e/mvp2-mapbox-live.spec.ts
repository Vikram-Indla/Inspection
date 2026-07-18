import { test, expect } from "@playwright/test";
import { storageStatePath } from "./personas";

// Live Mapbox provider certification (token now configured). Proves the provider
// flips from held/unavailable to real: server Directions returns a route, and the
// browser map renderer no longer shows the "not configured" state.
// TASK-IPAD-MAPBOX-RUNTIME-004.
test.use({ storageState: storageStatePath("admin") });

test("server Mapbox Directions returns a real route (MAPBOX_ACCESS_TOKEN live)", async ({ page }) => {
  const res = await page.request.post("/api/routing/eta", {
    data: { origin: { lat: 24.7136, lng: 46.6753 }, destination: { lat: 24.7743, lng: 46.7386 } },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.provider).toBe("mapbox_directions");
  expect(Number.isFinite(body.etaMinutes)).toBe(true);
  expect(body.etaMinutes).toBeGreaterThan(0);
  expect(Number.isFinite(body.distanceMeters)).toBe(true);
});

test("browser map renderer is configured (no 'Mapbox not configured' unavailable state)", async ({ page }) => {
  await page.goto("/locale?set=en");
  await page.goto("/operations/live");
  // Give mapbox-gl a moment to init against the live token.
  await page.waitForTimeout(4000);
  // With NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN set, the renderer is no longer in the
  // token-absent unavailable branch. (WebGL init in CI still resolves via swiftshader.)
  await expect(page.locator('[data-map-provider="mapbox-unavailable"]')).toHaveCount(0);
});
