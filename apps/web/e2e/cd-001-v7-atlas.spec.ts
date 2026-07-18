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
  // RTL: ArrowLeft advances forward (Map → Dispatch).
  await plan.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: /الإرسال/ })).toHaveAttribute("aria-selected", "true");

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

  await page.getByRole("tab", { name: /Inspection/i }).click();
  await expect(page.getByRole("tab", { name: /Inspection/i })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".lg-atlas-image__hotspot.is-active")).toHaveAttribute("aria-label", /JUBAIL/i);
  await expect(page.locator(".lg-atlas3d__event")).toContainText(/reaches an illustrated outcome/i);

  await page.getByRole("tab", { name: /Zones/i }).click();
  await expect(page.locator(".lg-atlas-image__hotspot.is-active")).toHaveAttribute("aria-label", /RIYADH/i);
  await expect(page.locator(".lg-atlas3d__event")).toContainText(/lift it from the landmass/i);
});

test("five scenes reveal map, dispatch, arrival, inspection and zones sequentially", async ({ page }) => {
  await page.goto("/login");

  // 01 Map — resting: no vehicles, actors hidden, zone labels present.
  await page.getByRole("tab", { name: /Map/i }).click();
  await expect(page.locator('.lg-atlas-image[data-active-stage="plan"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-motion__inspector").first()).toHaveCSS("opacity", "0");
  await expect(page.locator(".lg-atlas-motion__route-vehicle")).toHaveCount(0);
  await expect(page.locator(".lg-atlas-image__zones span")).toHaveCount(5);

  // 02 Dispatch — three real vehicles on three routes, staggered SMIL starts.
  await page.getByRole("tab", { name: /Dispatch/i }).click();
  await expect(page.locator('.lg-atlas-motion[data-stage="travel"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-motion__route-vehicle")).toHaveCount(3);
  await expect(page.locator(".lg-atlas-motion__route-line")).toHaveCount(3);
  await expect(page.locator(".lg-atlas-motion__route-stops")).toHaveCount(3);
  // Two vehicles depart Riyadh, the third departs Jazan (staggered begins).
  const begins = await page.locator(".lg-atlas-motion__route-vehicle animateMotion").evaluateAll(
    els => els.map(e => e.getAttribute("begin")));
  expect(begins).toEqual(["0s", "2.5s", "5s"]);

  // 03 Arrival — inspectors resolve on site (geofenced attendance).
  await page.getByRole("tab", { name: /Arrival/i }).click();
  await expect(page.locator('.lg-atlas-motion[data-stage="arrive"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-motion__inspector")).toHaveCount(5);
  await expect(page.locator('.lg-atlas-motion__inspector img[src*="inspector-character-v2-"]')).toHaveCount(5);
  await expect.poll(async () =>
    Number(await page.locator(".lg-atlas-motion__inspector").first().evaluate(e => getComputedStyle(e).opacity))
  ).toBeGreaterThan(0.5);

  // 04 Inspection — two compliant outcomes, one follow-up (illustrative).
  await page.getByRole("tab", { name: /Inspection/i }).click();
  await expect(page.locator('.lg-atlas-motion[data-stage="inspect"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-motion__outcome--passed")).toHaveCount(2);
  await expect(page.locator(".lg-atlas-motion__outcome--failed")).toHaveCount(1);
  await expect(page.locator(".lg-atlas-motion__outcome").first()).toContainText("Failed");

  // 05 Zones — illustrative-sample summary appears with the disclosure.
  await page.getByRole("tab", { name: /Zones/i }).click();
  await expect(page.locator('.lg-atlas-motion[data-stage="decide"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-image__zones span").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".lg-story__summary")).toContainText("Illustrative sample · not live data");
  await expect(page.locator(".lg-story__summary")).toContainText("318");
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

  // Motion layer holds its dispatch state without animating.
  await expect(page.locator(".lg-atlas-motion__route-vehicle").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator('.lg-atlas-motion__zones path[data-zone="east"]')).toHaveCSS("animation-name", "none");
  await expect(page.locator(".lg-atlas-motion__route-line").first()).toHaveCSS("opacity", "0.52");

  // Terrain lift retains its full extracted state but snaps rather than animates.
  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"] .lg-zone-lift__terrain'))
    .toHaveCSS("transition-duration", "0s");
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

// The defining interaction: hovering a zone must physically extract a slab of
// real terrain and leave a recessed cavity, pause the passive story, and tether
// the regional readout; click locks, Escape restores.
test("zone lift: hover extracts a terrain slab with cavity, click locks, Escape restores", async ({ page }) => {
  await page.goto("/login");
  const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
  const slab = page.locator('.lg-zone-lift__slab[data-zone="east"]');
  const image = page.locator(".lg-atlas-image");

  // Hover interrupts the passive story and lifts the whole-map camera + slab.
  await east.hover({ force: true });
  await expect(slab).toHaveClass(/is-lifted/);
  await expect(image).toHaveClass(/is-zone-engaged/);
  await expect(page.locator(".lg-story")).toHaveClass(/is-motion-paused/);
  // Lifted terrain, exposed earth sidewall and the recessed cavity all render.
  await expect(slab.locator(".lg-zone-lift__terrain")).toHaveCSS("opacity", "1");
  await expect(slab.locator(".lg-zone-lift__wall")).toHaveCSS("opacity", "1");
  await expect(slab.locator(".lg-zone-lift__cavity")).toHaveCSS("opacity", "1");
  // Readout is tethered with that zone's illustrative intelligence.
  const readout = page.locator(".lg-zone-lift__readout");
  await expect(readout).toContainText("Eastern zone");
  await expect(readout).toContainText("318 inspections");

  // Leaving without locking lowers the slab and restores the resting camera.
  await page.mouse.move(4, 4);
  await expect(slab).not.toHaveClass(/is-lifted/);
  await expect(image).not.toHaveClass(/is-zone-engaged/);

  // Click locks the terrain open; it stays lifted after the pointer leaves.
  await east.click({ force: true });
  await expect(east).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(4, 4);
  await expect(slab).toHaveClass(/is-lifted/);

  // Escape restores the resting map.
  await east.press("Escape");
  await expect(slab).not.toHaveClass(/is-lifted/);
  await expect(image).not.toHaveClass(/is-zone-engaged/);
});

test("zone lift is keyboard reachable and carries the same information", async ({ page }) => {
  await page.goto("/login");
  const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
  await expect(east).toHaveAttribute("role", "button");
  await expect(east).toHaveAttribute("aria-label", /Eastern zone.*318.*90%.*21 follow-ups/i);

  // Focus lifts the slab (same state as hover); Enter locks; Escape restores.
  await east.focus();
  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).toHaveClass(/is-lifted/);
  await east.press("Enter");
  await expect(east).toHaveAttribute("aria-pressed", "true");
  await east.press("Escape");
  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).not.toHaveClass(/is-lifted/);
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
