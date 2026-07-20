import { test, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

async function renderTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate(value => localStorage.setItem("saqeel-theme", value), theme);
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");
  if (await page.locator("html").getAttribute("data-theme") !== theme) {
    await page.locator(".lg-iconbtn:visible").first().click();
  }
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/locale?set=en");
});

test("protected Saqeel prism and Arabic wordmark remain the sole unchanged lockup", async ({ page }) => {
  const mark = readFileSync(join(process.cwd(), "src/app/login/SaqeelMark.tsx"));
  expect(createHash("sha256").update(mark).digest("hex")).toBe("a9f61abfbb4b1614b55811abf7c8d903239f68511a4636cba23c684c89bb6cea");

  await page.goto("/login");
  await expect(page.locator(".lg-lockup__mark")).toHaveCount(1);
  await expect(page.locator('.lg-lockup__wordmark[lang="ar"]')).toHaveText("صقيل | صناعي");
  await expect(page.locator('.lg-lockup__mark[aria-label="Saqeel"]')).toHaveCount(1);

  const css = source("src/app/login/login.css");
  expect(css).not.toContain("--ax-color-prism-magenta");
});

test("SLR-AC-002/004/009 protected motion and authentication source contracts are unchanged", () => {
  const atlas = source("src/app/login/SaudiIndustrialAtlas.tsx");
  const motion = source("src/app/login/saudi-atlas-motion.ts");
  const story = source("src/app/login/StoryPanel.tsx");
  const css = source("src/app/login/login.css");
  const auth = source("src/app/login/LoginClient.tsx");

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
  expect(atlas).toContain('else if (e.key === "Escape")');
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

  expect(auth).toContain("auth.signInWithPassword({ email, password })");
  expect(auth).toContain("auth.resetPasswordForEmail(email");
  expect(auth).toContain('window.location.assign("/launch")');
  expect(auth).toContain('logAuthEvent("password_reset_requested", email)');
});

test("SLR-AC-008 vehicle dimensions are exactly baseline times 1.5 with centered anchors", () => {
  const atlas = source("src/app/login/SaudiIndustrialAtlas.tsx");
  const css = source("src/app/login/login.css");

  expect(atlas).toContain('x="-13.5" y="-27" width="27" height="54"');
  expect(Number(27 / 18)).toBe(1.5);
  expect(Number(54 / 36)).toBe(1.5);
  expect(-13.5).toBe(-27 / 2);
  expect(-27).toBe(-54 / 2);
  expect(atlas).toContain('width="27" height="18" fill="currentColor"');
  expect(css).toContain("inline-size: 42px; block-size: 30px");
  expect(Number(42 / 28)).toBe(1.5);
  expect(Number(30 / 20)).toBe(1.5);
});

test("SLR-AC-005/006 dedicated light and native dark rasters switch without filters", async ({ page }) => {
  const srcByTheme: string[] = [];
  for (const theme of ["dark", "light"] as const) {
    await renderTheme(page, theme);
    const media = page.locator(`.lg-atlas-image__media--${theme}`);
    await expect(media).toBeVisible();
    srcByTheme.push(await media.getAttribute("src") ?? "");
    await expect(media).toHaveCSS("filter", "none");
    await expect(page.locator(".lg-atlas-image__plane")).toHaveCSS("filter", "none");
    await expect(page.locator(".lg-atlas-image__rasters")).toHaveCSS("filter", "none");
    const opposite = theme === "light" ? "dark" : "light";
    await expect(page.locator(`.lg-atlas-image__media--${opposite}`)).toHaveCSS("opacity", "0");

    const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
    await east.focus();
    await expect(page.locator(`.lg-zone-lift__terrain .lg-atlas-theme-raster--${theme}`).first()).toHaveCSS("display", "inline");
    await expect(page.locator(`.lg-zone-lift__wall .lg-atlas-theme-raster--${theme}`).first()).toHaveCSS("display", "inline");
  }
  expect(srcByTheme).toEqual([
    "/brand/saudi-atlas/inspection-atlas-scene-base-v2.png",
    "/brand/saudi-atlas/inspection-atlas-scene-base-v2-light.png",
  ]);
});

test("unified atlas hero is a full-height scene with only positioned overlays", async ({ page }) => {
  await renderTheme(page, "light");
  await expect(page.locator(".lg-atlas-image.is-ready")).toBeAttached();
  const frame = page.locator(".lg-story__frame");
  const plane = page.locator(".lg-atlas-image__plane");
  await expect(frame).toBeVisible();
  await expect(page.locator(".lg-story__summary")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("Illustrative sample · not live data");

  const geometry = await page.evaluate(() => {
    const storyBox = document.querySelector(".lg-story")!.getBoundingClientRect();
    const frameBox = document.querySelector(".lg-story__frame")!.getBoundingClientRect();
    const planeBox = document.querySelector(".lg-atlas-image__plane")!.getBoundingClientRect();
    const headPosition = getComputedStyle(document.querySelector(".lg-story__head")!).position;
    const framePosition = getComputedStyle(document.querySelector(".lg-story__frame")!).position;
    const eventPosition = getComputedStyle(document.querySelector(".lg-atlas3d__event")!).position;
    const event = getComputedStyle(document.querySelector(".lg-atlas3d__event")!);
    const railPosition = getComputedStyle(document.querySelector(".lg-atlas3d__stages")!).position;
    const rail = getComputedStyle(document.querySelector(".lg-atlas3d__stages")!);
    return { storyBox, frameBox, planeBox, headPosition, framePosition, eventPosition,
      eventBorder: event.borderTopWidth, eventShadow: event.boxShadow, eventBackground: event.backgroundColor,
      railPosition,
      railBorder: rail.borderTopWidth, railShadow: rail.boxShadow, railBackground: rail.backgroundColor };
  });
  // The frame's 1px border is included on both sides of its border box.
  expect(geometry.planeBox.width).toBeLessThanOrEqual(geometry.frameBox.width);
  expect(geometry.planeBox.height).toBeLessThanOrEqual(geometry.frameBox.height);
  expect(Math.max(
    geometry.planeBox.width / (geometry.planeBox.height || 1),
    geometry.planeBox.height / (geometry.planeBox.width || 1),
  )).toBeGreaterThan(1.7);
  expect(geometry.eventPosition).toBe("absolute");
  expect(geometry.eventBorder).toBe("0px");
  expect(geometry.eventShadow).toBe("none");
  expect(geometry.eventBackground).toBe("rgba(0, 0, 0, 0)");
  expect(geometry.railPosition).toBe("absolute");
  expect(geometry.headPosition).toBe("absolute");
  expect(geometry.framePosition).toBe("absolute");
  expect(Math.abs(geometry.storyBox.width - geometry.frameBox.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.storyBox.height - geometry.frameBox.height)).toBeLessThanOrEqual(1);
  expect(geometry.railBorder).toBe("0px");
  expect(geometry.railShadow).toBe("none");
  expect(geometry.railBackground).toBe("rgba(0, 0, 0, 0)");
  await expect(plane).toHaveCSS("aspect-ratio", "1672 / 941");

  const css = source("src/app/login/login.css");
  expect(css).toContain("inline-size: min(100cqw, calc(100cqh * 1.776833))");
  expect(css).toContain("#000 48px, #000 calc(100% - 48px)");
  expect(css).toContain(".lg-story__frame::before, .lg-story__frame::after");
  expect(css).not.toContain(".lg-story__summary {");
  expect(css).not.toContain("--zone-tone: var(--ax-color-critical)");
  expect(css).not.toContain("--zone-tone: var(--ax-color-success)");
});

test("SLR-AC-010..013 form contract contains only the authorized authentication controls", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[type="email"]')).toHaveCount(1);
  await expect(page.locator('input[type="password"]')).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Sign In", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Forgot your password?" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /show password/i })).toHaveCount(1);
  await expect(page.getByText(/National Single Sign-On|Remember me|MIM Directory|or continue with/i)).toHaveCount(0);
  await expect(page.locator(".lg-auth-divider, .lg-sso")).toHaveCount(0);
});

test("SLR-AC-015 Arabic reverses shell composition without mirroring the atlas", async ({ page }) => {
  await page.goto("/locale?set=ar");
  await renderTheme(page, "dark");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const panel = await page.locator(".lg-panel").boundingBox();
  const story = await page.locator(".lg-story").boundingBox();
  expect(panel && story && panel.x > story.x).toBeTruthy();

  const css = source("src/app/login/login.css");
  expect(css).not.toMatch(/scaleX\s*\(\s*-1\s*\)|rotateY\s*\(\s*180deg\s*\)/);
  const media = page.locator(".lg-atlas-image__media--dark");
  await expect(media).toHaveCSS("transform", "none");
  await expect(media).toHaveAttribute("src", "/brand/saudi-atlas/inspection-atlas-scene-base-v2.png");
});

test("SLR-AC-016/017 responsive matrix preserves form, interactive hero and story rail without page overflow", async ({ page }) => {
  const viewports = [
    { name: "desktop-wide", width: 1920, height: 1080 },
    { name: "desktop", width: 1440, height: 900 },
    { name: "laptop", width: 1366, height: 768 },
    { name: "ipad-landscape-wide", width: 1180, height: 820 },
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
    await expect(page.locator(".lg-atlas-image.is-ready")).toBeAttached();
    await expect(page.getByRole("tab")).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), viewport.name).toBe(true);

    await page.locator("#email").scrollIntoViewIfNeeded();
    await expect(page.locator("#email")).toBeVisible();
    await page.locator(".lg-story__frame").scrollIntoViewIfNeeded();
    await expect(page.locator(".lg-story__frame")).toBeVisible();
    const east = page.locator('.lg-zone-lift__edge[data-zone="east"]');
    await east.focus();
    await expect(page.locator('.lg-zone-lift__slab[data-zone="east"]')).toHaveClass(/is-lifted/);

    if (viewport.width >= 768 && viewport.width <= 1439) {
      const targetHeights = await page.locator(".lg-iconbtn, .lg-atlas3d__stage").evaluateAll(elements =>
        elements.filter(element => (element as HTMLElement).offsetParent !== null).map(element => element.getBoundingClientRect().height));
      expect(targetHeights.every(height => height >= 48), `${viewport.name} 48px touch targets`).toBe(true);
    }

    if (viewport.width < 768) {
      const formTop = await page.locator(".lg-panel").evaluate(element => element.getBoundingClientRect().top);
      const storyTop = await page.locator(".lg-story").evaluate(element => element.getBoundingClientRect().top);
      expect(formTop, `${viewport.name} form first`).toBeLessThan(storyTop);
    }
  }
});
