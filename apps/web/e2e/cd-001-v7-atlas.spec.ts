import { test, expect, type Browser, type Page } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { waitForCredentialsForm, identifierField } from "./login-helper";

test.beforeEach(async ({ page }) => {
  await page.goto("/locale?set=en");
});

async function arabicLoginPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();
  await page.goto("/login");
  return page;
}

function loginSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) loginSourceFiles(path, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(path);
  }
  return out;
}

test("login source carries no committed demo or persona passwords", () => {
  for (const file of loginSourceFiles(join(process.cwd(), "src/app/login"))) {
    const source = readFileSync(file, "utf8");
    expect(source, file).not.toMatch(/Mim(?:Admin|Plan|Field|Rev|Ops)!2026/);
    expect(source, file).not.toMatch(/SAQEEL_TEST_PASSWORD\s*=\s*["'][^"']+["']/);
  }
});

test("an Arabic reader gets Arabic-first RTL sign-in end to end", async ({ browser }) => {
  const page = await arabicLoginPage(browser);

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".lg-page")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: "تسجيل الدخول" })).toBeVisible();
  await expect(page.locator(".lg-atlas-image__hotspot-label")).toHaveCount(9);
  await expect(page.locator(".lg-atlas-image__zones > span")).toHaveCount(5);

  const panel = await page.locator("main.fl-root").boundingBox();
  const story = await page.locator(".lg-story").boundingBox();
  expect(panel && story && panel.x > story.x, "credential panel should occupy the physical right side in RTL").toBeTruthy();

  const zonesTab = page.getByRole("tab", { name: /المناطق/ });
  await expect(zonesTab).toHaveAttribute("aria-selected", "true");
  await zonesTab.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: /الخريطة/ })).toHaveAttribute("aria-selected", "true");

  await page.context().close();
});

test("atlas mounts without landing-page disclaimers or a location list", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(String(e)));

  await page.goto("/login");

  await expect(page.locator(".lg-atlas3d__truth")).toHaveCount(0);
  await expect(page.getByText(/Locations · List/i)).toHaveCount(0);

  await waitForCredentialsForm(page);
  await expect(identifierField(page)).toBeEnabled();
  await expect(page.getByRole("button", { name: /Sign In/i })).toBeEnabled();

  await expect(page.locator('.lg-atlas-image.is-ready[data-atlas-mode="public-safe-image"]')).toBeVisible();
  await expect(page.locator('.lg-atlas-image__media[src$="inspection-atlas-scene-base-v2.png"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-image__hotspot")).toHaveCount(9);
  await expect(page.locator(".lg-story__step")).toHaveCount(0);
  await expect(page.locator('link[rel="icon"][href="/saqeel-favicon.svg"]')).toHaveCount(1);

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
  await expect(page.locator(".lg-atlas-image")).toHaveAttribute("data-active-zone", "east");
  await expect(page.locator("p[role='status']")).toContainText(/reaches an illustrated outcome/i);

  await page.getByRole("tab", { name: /Zones/i }).click();
  await expect(page.locator(".lg-atlas-image")).toHaveAttribute("data-active-zone", "central");
  await expect(page.locator("p[role='status']")).toContainText(/lift it from the landmass/i);
});

test("five scenes reveal map, dispatch, arrival, inspection and zones sequentially", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("tab", { name: /Map/i }).click();
  await expect(page.locator('.lg-atlas-image[data-active-stage="plan"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-motion__inspector").first()).toHaveCSS("opacity", "0");
  await expect(page.locator(".lg-atlas-motion__suvs")).toHaveCSS("opacity", "0");
  await expect(page.locator(".lg-atlas-motion__route-line").first()).toHaveCSS("opacity", "0");
  await expect(page.locator(".lg-atlas-image__zones > span")).toHaveCount(5);

  await page.getByRole("tab", { name: /Dispatch/i }).click();
  await expect(page.locator('.lg-atlas-motion[data-stage="travel"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-motion__route-vehicle")).toHaveCount(3);
  await expect(page.locator(".lg-atlas-motion__route-line")).toHaveCount(3);
  await expect(page.locator(".lg-atlas-motion__route-stops")).toHaveCount(3);
  await expect(page.locator(".lg-atlas-motion__suvs")).toHaveCSS("opacity", "1");
  const begins = await page.locator(".lg-atlas-motion__route-vehicle animateMotion").evaluateAll(
    els => els.map(e => e.getAttribute("begin")));
  expect(begins).toEqual(["0s", "2.5s", "5s"]);

  await page.getByRole("tab", { name: /Arrival/i }).click();
  await expect(page.locator('.lg-atlas-motion[data-stage="arrive"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-motion__inspector")).toHaveCount(5);
  await expect(page.locator('.lg-atlas-motion__inspector img[src*="inspector-character-v2-"]')).toHaveCount(5);
  await expect.poll(async () =>
    Number(await page.locator(".lg-atlas-motion__inspector").first().evaluate(e => getComputedStyle(e).opacity))
  ).toBeGreaterThan(0.5);

  await page.getByRole("tab", { name: /Inspection/i }).click();
  await expect(page.locator('.lg-atlas-motion[data-stage="inspect"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-motion__outcome--passed")).toHaveCount(2);
  await expect(page.locator(".lg-atlas-motion__outcome--failed")).toHaveCount(1);
  await expect(page.locator(".lg-atlas-motion__outcome").first()).toContainText("Failed");

  await page.getByRole("tab", { name: /Zones/i }).click();
  await expect(page.locator('.lg-atlas-motion[data-stage="decide"]')).toBeVisible();
  await expect(page.locator(".lg-atlas-image__zones > span").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".lg-story__summary")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Illustrative sample · not live data");
});

test("credential focus never disturbs the Arabic story or document direction", async ({ browser }) => {
  const page = await arabicLoginPage(browser);

  await waitForCredentialsForm(page);
  const initialStage = await page.locator(".lg-atlas-image").getAttribute("data-active-stage");
  await identifierField(page).focus();
  await page.waitForTimeout(2800);
  await expect(page.locator(".lg-atlas-image")).toHaveAttribute("data-active-stage", initialStage ?? "decide");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(identifierField(page)).toBeFocused();
  await expect(page.getByRole("button", { name: "تسجيل الدخول" })).toBeVisible();

  await page.context().close();
});

test("reduced motion keeps the atlas understandable without route or zone animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  await page.getByRole("tab", { name: /Dispatch/i }).click();

  await expect(page.locator(".lg-atlas-motion__route-vehicle").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator('.lg-atlas-motion__zones path[data-zone="east"]')).toHaveCSS("animation-name", "none");
  await expect(page.locator(".lg-atlas-motion__route-line").first()).toHaveCSS("opacity", "0.52");

  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"] .lg-zone-lift__terrain'))
    .toHaveCSS("transition-duration", "0s");
  await waitForCredentialsForm(page);
  await expect(identifierField(page)).toBeEnabled();
});

test("sites are silent at rest, named on hover and focus, and never carry metrics", async ({ page }) => {
  await page.goto("/login");
  const node = page.locator(".lg-atlas-image__hotspot").first();
  await expect(node).toBeVisible({ timeout: 15000 });

  await node.hover();
  await expect(node.locator(".lg-atlas-image__hotspot-label")).toHaveText(/JUBAIL/i);
  await expect(node).toHaveAttribute("aria-label", /JUBAIL — Petrochemical/i);

  await node.focus();
  await expect(node).toBeFocused();

  const labels = await page.locator(".lg-atlas-image__hotspot").evaluateAll(
    els => els.map(e => e.getAttribute("aria-label") ?? ""));
  expect(labels).toHaveLength(9);
  for (const label of labels) {
    expect(label).not.toMatch(/%|complian|overdue|violation|risk|\bslo\b|\bsla\b/i);
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("public-safe image failure activates the generated atlas fallback", async ({ page }) => {
  await page.route("**/brand/saudi-atlas/inspection-atlas-scene-base-v2.*", route => route.abort());
  await page.goto("/login");
  await expect(page.locator(".lg-map")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".lg-atlas3d__node")).toHaveCount(9);
  await waitForCredentialsForm(page);
  await expect(identifierField(page)).toBeEnabled();
});

test("production mode does not expose demo identities", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /Demo access/i })).toHaveCount(0);
  await expect(page.locator("text=admin@mim.gov.sa")).toHaveCount(0);
});

test("zone lift: hover extracts a terrain slab whose own label becomes the readout", async ({ page }) => {
  await page.goto("/login");
  const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
  const slab = page.locator('.lg-zone-lift__slab[data-zone="east"]');
  const image = page.locator(".lg-atlas-image");

  await east.hover({ force: true });
  await expect(slab).toHaveClass(/is-lifted/);
  await expect(image).toHaveClass(/is-zone-engaged/);
  await expect(page.locator(".lg-story")).toHaveClass(/is-motion-paused/);
  await expect(slab.locator(".lg-zone-lift__terrain")).toHaveCSS("opacity", "1");
  await expect(slab.locator(".lg-zone-lift__wall")).toHaveCSS("opacity", "1");
  await expect(slab.locator(".lg-zone-lift__cavity")).toHaveCSS("opacity", "1");

  const readout = page.locator(".lg-atlas-image__zones > span.is-lifted");
  await expect(readout).toContainText("Eastern zone");
  await expect(readout).toContainText("318 inspections");
  await expect(page.locator(".lg-atlas-image__zones > span.is-dimmed")).toHaveCount(4);

  await page.mouse.move(4, 4);
  await expect(slab).not.toHaveClass(/is-lifted/);
  await expect(image).not.toHaveClass(/is-zone-engaged/);
});

test("zone lift is keyboard reachable and carries the same information", async ({ page }) => {
  await page.goto("/login");
  const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
  await expect(east).toHaveAttribute("role", "button");
  await expect(east).toHaveAttribute("aria-label", /Eastern zone.*318.*90%.*21 follow-ups/i);

  await east.focus();
  await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).toHaveClass(/is-lifted/);
  await expect(page.locator(".lg-atlas-image__zones > span.is-lifted")).toContainText("Eastern zone");

  await east.blur();
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
    await waitForCredentialsForm(page);
    await expect(identifierField(page)).toBeVisible();
  }
});
