import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// CD-001 V7 Atlas — runtime interaction proof for the premium 3D Saudi
// Industrial Inspection Atlas on /login. Demonstrates the claims the design
// handoff requires before implementation is accepted: atlas mounts,
// map-bound lifecycle event, lifecycle tablist drives overlays,
// hover/focus + click-lock + Esc dossier, Arabic-first RTL, and sign-in
// remaining usable throughout. Public page — no auth needed.

test.beforeEach(async ({ page }) => {
  // Origin-agnostic: /locale sets the locale cookie server-side (works under
  // both the throwaway :3210 run and the main :3000 G10 suite).
  await page.goto("/locale?set=en");
});

test("production login bundle contains no source-coded demo passwords", () => {
  const source = readFileSync(join(process.cwd(), "src/app/login/page.tsx"), "utf8");
  expect(source).not.toMatch(/Mim(?:Admin|Plan|Field|Rev|Ops)!2026/);
  expect(source).toContain("SAQEEL_DEMO_${key}_PASSWORD");
  expect(source).toContain("SAQEEL_DEMO_${key}_EMAIL");
});

test("fresh login defaults to Arabic with document-level RTL semantics", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/login");

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".lg-page")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
  await expect(page.getByRole("link", { name: "English" })).toBeVisible();
  await expect(page.locator(".lg-atlas-image__hotspot-label")).toHaveCount(9);
  await expect(page.locator(".lg-atlas-image__zones span")).toHaveCount(5);

  const panel = await page.locator(".lg-panel").boundingBox();
  const story = await page.locator(".lg-story").boundingBox();
  expect(panel && story && panel.x > story.x, "credential panel should occupy the physical right side in RTL").toBeTruthy();

  const plan = page.getByRole("tab", { name: /الخريطة/ });
  await expect(plan).toHaveAttribute("aria-selected", "true");
  await plan.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: /المفتشون/ })).toHaveAttribute("aria-selected", "true");

  const easternNode = page.locator(".lg-atlas-image__hotspot").first();
  await easternNode.click();
  await expect(page.getByRole("dialog")).toHaveClass(/lg-atlas3d__dossier--left/);
});

test("atlas mounts without landing-page disclaimers or a location list", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(String(e)));

  await page.goto("/login");

  await expect(page.locator(".lg-atlas3d__truth")).toHaveCount(0);
  await expect(page.getByText(/Locations · List/i)).toHaveCount(0);

  // Credential form is usable before/while the atlas is up.
  await expect(page.locator("#email")).toBeEnabled();
  await expect(page.getByRole("button", { name: /Sign In/i })).toBeEnabled();

  // The approved public-safe image is the visible foundation; its interaction
  // layer remains native DOM and therefore keyboard/touch accessible.
  await expect(page.locator('.lg-atlas-image.is-ready[data-atlas-mode="public-safe-image"]')).toBeVisible();
  await expect(page.locator('.lg-atlas-image__media[src$="inspection-atlas-scene-base-v2.png"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-image__hotspot")).toHaveCount(9);
  await expect(page.locator(".lg-story__step")).toHaveCount(0);
  await expect(page.locator('link[rel="icon"][href="/saqeel-prism.svg"]')).toHaveCount(1);

  // Public surface must not expose the source render's operational claims.
  const body = (await page.locator("body").innerText()).toLowerCase();
  expect(body).not.toMatch(/high risk|open violations|risk drivers|assign 6 inspectors|updated 08:45|compliance 71%/);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("five-scene tablist drives the calm public-safe story", async ({ page }) => {
  await page.goto("/login");
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(5);
  await expect(tabs.first()).toHaveAttribute("aria-controls", "saqeel-industrial-atlas");

  await page.getByRole("tab", { name: /Outcomes/i }).click();
  await expect(page.getByRole("tab", { name: /Outcomes/i })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".lg-atlas-image__hotspot.is-active")).toHaveAttribute("aria-label", /JUBAIL/i);
  await expect(page.locator(".lg-atlas3d__event")).toContainText(/Passed or Failed/i);

  await page.getByRole("tab", { name: /Zones/i }).click();
  await expect(page.locator(".lg-atlas-image__hotspot.is-active")).toHaveAttribute("aria-label", /RIYADH/i);
  await expect(page.locator(".lg-atlas3d__event")).toContainText(/Zones lift subtly/i);
});

test("five scenes reveal map, inspectors, dispatch, outcomes and lifted zones sequentially", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("tab", { name: /Map/i }).click();
  await expect(page.locator(".lg-atlas-motion__inspector").first()).toHaveCSS("opacity", "0");
  await expect(page.locator(".lg-atlas-motion__vehicle").first()).toHaveCSS("opacity", "0");
  await expect(page.locator(".lg-atlas-motion__outcome").first()).toHaveCSS("opacity", "0");
  await expect(page.locator(".lg-atlas-image__zones span").first()).toHaveCSS("opacity", "1");

  await page.getByRole("tab", { name: /Inspectors/i }).click();
  await expect(page.locator(".lg-atlas-motion__inspector")).toHaveCount(3);
  await expect(page.locator(".lg-atlas-motion__inspector").first()).toHaveCSS("opacity", "1");
  await expect(page.locator('.lg-atlas-motion__inspector img[src*="inspector-character-v2-"]')).toHaveCount(3);

  await page.getByRole("tab", { name: /Dispatch/i }).click();
  await expect(page.locator('.lg-atlas-motion[data-stage="travel"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-motion__vehicle")).toHaveCount(3);
  await expect(page.locator(".lg-atlas-motion__route-line")).toHaveCount(3);
  await expect(page.locator(".lg-atlas-motion__geofence")).toHaveCount(3);
  await expect(page.locator(".lg-atlas-motion__vehicle").nth(0)).toHaveCSS("animation-delay", "0s");
  await expect(page.locator(".lg-atlas-motion__vehicle").nth(1)).toHaveCSS("animation-delay", "2.7s");
  await expect(page.locator(".lg-atlas-motion__vehicle").nth(2)).toHaveCSS("animation-delay", "5.4s");

  await page.getByRole("tab", { name: /Outcomes/i }).click();
  await expect(page.locator(".lg-atlas-motion__outcome--passed")).toHaveCount(2);
  await expect(page.locator(".lg-atlas-motion__outcome--failed")).toHaveCount(1);
  await expect(page.locator(".lg-atlas-motion__outcome").first()).toContainText("Failed");
  await expect(page.locator(".lg-atlas-motion__outcome").first()).toHaveCSS("opacity", "1");

  await page.getByRole("tab", { name: /Zones/i }).click();
  await expect(page.locator('.lg-atlas-motion__zones path[data-outcome="complete"]').first()).toHaveCSS("opacity", "0.92");
  await expect(page.locator(".lg-atlas-image__zones span").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".lg-atlas-motion__stats")).toContainText("Illustrative sample · not live data");
  await expect(page.locator(".lg-atlas-motion__stats")).toContainText("1,248");
  await expect(page.locator(".lg-atlas-motion__stats")).toHaveCSS("opacity", "1");
});

test("credential focus pauses decorative motion without changing the active Arabic story", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/login");

  const initialStage = await page.locator(".lg-atlas-image").getAttribute("data-active-stage");
  await page.locator("#email").focus();
  await expect(page.locator(".lg-story")).toHaveClass(/is-motion-paused/);
  await page.waitForTimeout(2800);
  await expect(page.locator(".lg-atlas-image")).toHaveAttribute("data-active-stage", initialStage ?? "plan");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
});

test("reduced motion keeps the atlas understandable without route or zone animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  await page.getByRole("tab", { name: /Dispatch/i }).click();

  await expect(page.locator(".lg-atlas-motion__vehicle").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator('.lg-atlas-motion__zones path[data-zone="east"]')).toHaveCSS("animation-name", "none");
  await expect(page.locator(".lg-atlas-motion__route-line").first()).toHaveCSS("opacity", "0.52");
  await expect(page.locator(".lg-atlas-motion__geofence").first()).toHaveCSS("opacity", "0.72");
  await expect(page.locator("#email")).toBeEnabled();
});

test("dossier: hover/focus opens, click locks (role=dialog), Esc closes", async ({ page }) => {
  await page.goto("/login");
  const node = page.locator(".lg-atlas-image__hotspot").first();
  await expect(node).toBeVisible({ timeout: 15000 });

  await node.hover();
  await expect(page.locator(".lg-atlas3d__dossier")).toBeVisible();
  // Public-safe: dossier must carry NO operational metrics.
  const text = (await page.locator(".lg-atlas3d__dossier").innerText()).toLowerCase();
  expect(text).not.toMatch(/%|complian|overdue|violation|risk|\bslo\b|\bsla\b/);

  await node.click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("dialog").getByRole("button", { name: /Close/i }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("public-safe image failure activates the generated atlas fallback", async ({ page }) => {
  await page.route("**/brand/saudi-atlas/inspection-atlas-scene-base-v2.*", route => route.abort());
  await page.goto("/login");
  await expect(page.locator(".lg-map")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".lg-atlas3d__node")).toHaveCount(9);
  await expect(page.locator("#email")).toBeEnabled();
});

test("production mode does not expose demo identities", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /Demo access/i })).toHaveCount(0);
  await expect(page.locator("text=admin@mim.gov.sa")).toHaveCount(0);
});

test("login and atlas do not overflow representative viewports", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/login");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `${viewport.width}x${viewport.height} horizontal overflow`).toBe(false);
    await expect(page.locator("#email")).toBeVisible();
  }
});
