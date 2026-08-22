import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test.beforeEach(async ({ page }) => {
  await page.goto("/locale?set=en");
});

test("field-card lockup carries the shield, Latin and Arabic wordmarks", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator(".fl-shield")).toHaveCount(1);
  await expect(page.locator(".fl-brand-latin")).toHaveText("Inspection Platform");
  await expect(page.locator('.fl-brand-ar[lang="ar"]')).toHaveText("منصة التفتيش");

  const css = source("src/app/login/login.css");
  expect(css).not.toContain("--sq-color-prism-magenta");
});

test("SLR-AC-002/004/009 protected motion and recovery authentication contracts", () => {
  const atlas = source("src/app/login/SaudiIndustrialAtlas.tsx");
  const motion = source("src/app/login/saudi-atlas-motion.ts");
  const story = source("src/app/login/StoryPanel.tsx");
  const css = source("src/app/login/login.css");
  const auth = source("src/app/login/field/FieldLoginClient.tsx");
  const reset = source("src/app/reset/ResetClient.tsx");

  for (const path of [
    "M180 150 L250 65 L480 55 L610 120 L600 220 L385 185 Z",
    "M610 120 L730 180 L870 300 L760 410 L590 370 L600 220 Z",
    "M385 185 L600 220 L590 370 L400 350 Z",
    "M400 350 L590 370 L760 410 L560 515 L350 500 Z",
    "M180 150 L385 185 L400 350 L350 500 L250 430 L140 290 Z",
    "M508 265 C573 249 663 211 737 183",
    "M508 265 C429 247 321 224 220 236",
    "M440 442 C371 429 274 404 205 383",
  ]) expect(atlas).toContain(path);

  expect(atlas).toContain('dur="6s" begin={`${index * 2.5}s`}');
  expect(atlas).toContain('keySplines="0.32 0.05 0.2 1"');
  expect(atlas).toContain('onPointerEnter={() => onHover(zone.id)}');
  expect(atlas).toContain('onPointerLeave={() => onHover(null)}');
  expect(atlas).toContain('if (e.key === "Escape")');
  expect(motion).toContain("const STAGE_END_S = [3.0, 14.0, 19.0, 24.0, 30.0]");
  expect(story).toContain("if (on) tlRef.current?.pause()");
  expect(story).toContain("tlRef.current?.pause();\n    setStage(id)");

  expect(css).toContain("transition: transform 900ms cubic-bezier(.16,.84,.25,1), opacity 680ms ease, filter 820ms ease");
  expect(css).toContain("translateY(-33px) scale(1.012)");
  expect(css).toContain("translateY(-16px) scale(1.004)");
  expect(css).toContain("translateY(3px) scale(.985)");
  expect(css).toContain("perspective(1300px) rotateX(8deg) rotateZ(-.7deg) scale(1.035)");
  expect(css).toContain("transition: transform 1050ms cubic-bezier(.16,.84,.25,1)");
  expect(css).toContain("animation: lg-zone-readout-in 540ms 420ms cubic-bezier(.16,.84,.25,1)");

  expect(auth).toContain("auth.signInWithPassword({");
  expect(auth).toContain('window.location.assign("/launch")');
  expect(auth).not.toContain("redirectTo:");
  expect(auth).not.toContain("auth.onAuthStateChange");
  expect(reset).toContain("auth.updateUser({ password: pw })");
  expect(reset).toContain("RECOVERY_OTP_USER_KEY");
  expect(reset).toContain('logAuthEvent("password_reset_completed", data.user.email)');
  expect(reset).not.toContain('event === "PASSWORD_RECOVERY"');
  expect(reset).not.toContain("auth.onAuthStateChange");
  expect(reset).not.toContain("redirectTo:");
});

test("SLR-AC-008 vehicle dimensions are exactly baseline times 1.5 with centered anchors", () => {
  const atlas = source("src/app/login/SaudiIndustrialAtlas.tsx");
  const css = source("src/app/login/login.css");

  expect(atlas).toContain('x="-13.5" y="-27" width="27" height="54"');
  expect(Number(27 / 18)).toBe(1.5);
  expect(Number(54 / 36)).toBe(1.5);
  expect(-13.5).toBe(-27 / 2);
  expect(-27).toBe(-54 / 2);
  expect(css).toContain("inline-size: 42px; block-size: 30px");
  expect(Number(42 / 28)).toBe(1.5);
  expect(Number(30 / 20)).toBe(1.5);
});

test("SLR-AC-005/006 sign-in is dark-locked onto the native atlas raster", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("saqeel-theme", "light"));
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const media = page.locator(".lg-atlas-image__media");
  await expect(media).toHaveCount(1);
  await expect(media).toHaveAttribute("src", "/brand/saudi-atlas/inspection-atlas-scene-base-v2.png");
  await expect(page.locator(".lg-atlas-image__plane")).toHaveCSS("filter", "none");

  const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
  await east.focus();
  const slabRasters = await page.locator('.lg-zone-lift__slab[data-zone="east"] image').evaluateAll(
    els => els.map(e => e.getAttribute("href")));
  expect(slabRasters.length).toBeGreaterThan(0);
  for (const href of slabRasters) expect(href).toBe("/brand/saudi-atlas/inspection-atlas-scene-base-v2.png");

  await page.goto("/reset");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("unified atlas hero is a full-height scene with only positioned overlays", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator(".lg-atlas-image.is-ready")).toBeAttached();
  await expect(page.locator(".lg-story__frame")).toBeVisible();
  await expect(page.locator(".lg-story__summary")).toHaveCount(0);
  await expect(page.locator(".lg-zone-lift__readout")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Illustrative sample · not live data");

  const geometry = await page.evaluate(() => {
    const storyBox = document.querySelector(".lg-story")!.getBoundingClientRect();
    const frameBox = document.querySelector(".lg-story__frame")!.getBoundingClientRect();
    const planeBox = document.querySelector(".lg-atlas-image__plane")!.getBoundingClientRect();
    return {
      storyBox, frameBox, planeBox,
      headPosition: getComputedStyle(document.querySelector(".lg-story__head")!).position,
      framePosition: getComputedStyle(document.querySelector(".lg-story__frame")!).position,
      railPosition: getComputedStyle(document.querySelector(".lg-atlas3d__stages")!).position,
    };
  });
  expect(Math.max(
    geometry.planeBox.width / (geometry.planeBox.height || 1),
    geometry.planeBox.height / (geometry.planeBox.width || 1),
  )).toBeGreaterThan(1.7);
  expect(geometry.headPosition).toBe("absolute");
  expect(geometry.framePosition).toBe("absolute");
  expect(geometry.railPosition).toBe("absolute");
  expect(Math.abs(geometry.storyBox.width - geometry.frameBox.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.storyBox.height - geometry.frameBox.height)).toBeLessThanOrEqual(1);
  await expect(page.locator(".lg-atlas-image__plane")).toHaveCSS("aspect-ratio", "1672 / 941");

  const css = source("src/app/login/login.css");
  expect(css).toContain("inline-size: min(132cqw, calc(100cqh * 1.776833))");
  expect(css).toContain(".lg-story__frame::before, .lg-story__frame::after");
  expect(css).not.toContain(".lg-story__summary {");
  expect(css).not.toContain("--zone-tone: var(--sq-color-critical)");
  expect(css).not.toContain("--zone-tone: var(--sq-color-success)");
});

test("SLR-AC-010..013 form contract contains only the authorized authentication controls", async ({ page }) => {
  await page.goto("/login");
  const form = page.locator("form.fl-form");
  await expect(form.locator('input[type="text"][autocomplete="username"]')).toHaveCount(1);
  await expect(form.locator('input[type="password"]')).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toHaveCount(1);
  await expect(form.locator('a.fl-forgot[href="/reset"]')).toHaveCount(1);
  await expect(form.locator('input[type="checkbox"]')).toHaveCount(1);

  const toggle = page.getByRole("button", { name: /show password/i });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(form.locator("input.fl-pw-in")).toHaveAttribute("type", "text");
  await toggle.click();
  await expect(form.locator("input.fl-pw-in")).toHaveAttribute("type", "password");

  await expect(page.getByText(/National Single Sign-On|MIM Directory|or continue with/i)).toHaveCount(0);
  await expect(page.locator(".lg-auth-divider, .lg-sso")).toHaveCount(0);
});

test("SLR-AC-015 Arabic reverses shell composition without mirroring the atlas", async ({ page }) => {
  await page.goto("/locale?set=ar");
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const panel = await page.locator("main.fl-root").boundingBox();
  const story = await page.locator(".lg-story").boundingBox();
  expect(panel && story && panel.x > story.x).toBeTruthy();

  const css = source("src/app/login/login.css");
  expect(css).not.toMatch(/scaleX\s*\(\s*-1\s*\)|rotateY\s*\(\s*180deg\s*\)/);
  const media = page.locator(".lg-atlas-image__media");
  await expect(media).toHaveAttribute("src", "/brand/saudi-atlas/inspection-atlas-scene-base-v2.png");
  expect(await media.evaluate(e => getComputedStyle(e).transform)).toBe("none");
});

test("SLR-AC-016/017 wide canvases keep form, interactive hero and story rail without overflow", async ({ page }) => {
  const viewports = [
    { name: "desktop-wide", width: 1920, height: 1080 },
    { name: "desktop", width: 1440, height: 900 },
    { name: "laptop", width: 1366, height: 768 },
    { name: "ipad-landscape-wide", width: 1180, height: 820 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/login");
    await expect(page.locator(".lg-atlas-image.is-ready")).toBeAttached();
    await expect(page.getByRole("tab")).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), viewport.name).toBe(true);

    await expect(page.locator("form.fl-form input.fl-in").first()).toBeVisible();
    const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
    await east.focus();
    await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).toHaveClass(/is-lifted/);

    const targetHeights = await page.locator(".lg-atlas3d__stage").evaluateAll(elements =>
      elements.map(element => element.getBoundingClientRect().height));
    expect(targetHeights.every(height => height >= 24), `${viewport.name} rail target size`).toBe(true);
  }
});

test("SLR-AC-016/017 compact widths remove the atlas and keep the credential card whole", async ({ page }) => {
  const viewports = [
    { name: "ipad-landscape", width: 1024, height: 768 },
    { name: "ipad-portrait-wide", width: 820, height: 1180 },
    { name: "ipad-portrait", width: 768, height: 1024 },
    { name: "stage-manager", width: 744, height: 1133 },
    { name: "narrow-tablet", width: 600, height: 960 },
    { name: "mobile-wide", width: 430, height: 932 },
    { name: "mobile", width: 390, height: 844 },
    { name: "mobile-min", width: 320, height: 800 },
    { name: "zoom-200-equivalent", width: 720, height: 450 },
    { name: "zoom-400-equivalent", width: 360, height: 225 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/login");
    await expect(page.locator(".lg-story"), viewport.name).toBeHidden();
    await expect(page.getByRole("tab")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), viewport.name).toBe(true);
    await page.locator("form.fl-form input.fl-in").first().scrollIntoViewIfNeeded();
    await expect(page.locator("form.fl-form input.fl-in").first()).toBeVisible();
    await expect(page.locator("form.fl-form button.fl-submit")).toBeAttached();
  }
});
