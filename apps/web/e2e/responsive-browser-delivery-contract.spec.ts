import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONSTRAINED_FLOOR_BYTES,
  classifyConnectivity,
  classifyPersistence,
  classifyStorage,
  formatBytes,
} from "../src/lib/device-readiness";
import { storageStatePath } from "./personas";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const layout = read("src/app/layout.tsx");
const worker = read("public/sw.js");
const pushOptIn = read("src/app/push/PushOptIn.tsx");
const readiness = read("src/app/(app)/field/settings/readiness/DeviceReadinessClient.tsx");
const settings = read("src/app/(app)/field/settings/FieldSettingsClient.tsx");
const offline = read("src/lib/offline.ts");
const evidenceDir = process.env.PWA_DECOUPLING_EVIDENCE_DIR?.trim();
if (evidenceDir) mkdirSync(evidenceDir, { recursive: true });

test.describe("measured browser/device readiness", () => {
  test("storage remains honest and deterministic", () => {
    expect(classifyStorage(null).state).toBe("unknown");
    expect(classifyStorage({}).measured).toBe(false);
    expect(classifyStorage({ usage: 10, quota: 0 }).state).toBe("unknown");

    const quota = 4 * 1024 * 1024 * 1024;
    expect(classifyStorage({ usage: quota - CONSTRAINED_FLOOR_BYTES, quota }).state).toBe("ample");
    expect(classifyStorage({ usage: quota - (CONSTRAINED_FLOOR_BYTES - 1), quota }).state).toBe("constrained");
    expect(classifyStorage({ usage: 5_000, quota: 10_000 }).usedRatio).toBeCloseTo(0.5, 5);
    expect(classifyStorage({ usage: -1, quota: 10_000 }).usageBytes).toBeNull();
  });

  test("connectivity and persistence expose only measured states", () => {
    expect(classifyConnectivity(true)).toBe("online");
    expect(classifyConnectivity(false)).toBe("offline");
    expect(classifyConnectivity(null)).toBe("unknown");
    expect(classifyPersistence(true)).toBe("persisted");
    expect(classifyPersistence(false)).toBe("best_effort");
    expect(classifyPersistence(null)).toBe("unknown");
  });

  test("byte formatting remains stable", () => {
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(250 * 1024 * 1024)).toBe("250 MB");
    expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe("3.0 GB");
  });
});

test.describe("PWA delivery is retired", () => {
  test("root layout has no install metadata or global worker registration", () => {
    expect(layout).not.toContain("PwaRegister");
    expect(layout).not.toContain('manifest: "/manifest.json"');
    expect(layout).not.toContain("appleWebApp");
    expect(layout).not.toContain("mobile-web-app-capable");
    expect(existsSync(join(root, "public/manifest.json"))).toBe(false);
    expect(existsSync(join(root, "src/components/PwaRegister.tsx"))).toBe(false);
    expect(existsSync(join(root, "src/components/PwaUpdatePrompt.tsx"))).toBe(false);
    expect(existsSync(join(root, "src/lib/pwa/client.ts"))).toBe(false);
    expect(existsSync(join(root, "src/lib/pwa/readiness.ts"))).toBe(false);
  });

  test("remaining worker is push-only and safely retires legacy shell caches", () => {
    expect(worker).toContain('addEventListener("push"');
    expect(worker).toContain('addEventListener("notificationclick"');
    expect(worker).toContain('const LEGACY_SHELL_PREFIX = "saqeel-shell-"');
    expect(worker).toContain("key.startsWith(LEGACY_SHELL_PREFIX)");
    expect(worker).not.toContain('addEventListener("fetch"');
    expect(worker).not.toContain("caches.open");
    expect(worker).not.toContain("manifest.json");
    expect(worker).not.toContain("indexedDB");
    expect(worker).not.toContain("deleteDatabase");
  });

  test("Web Push registers only inside the explicit opt-in action", () => {
    const permissionIndex = pushOptIn.indexOf("Notification.requestPermission()");
    const registrationIndex = pushOptIn.indexOf('navigator.serviceWorker.register("/sw.js"');
    expect(permissionIndex).toBeGreaterThan(0);
    expect(registrationIndex).toBeGreaterThan(permissionIndex);
    expect(pushOptIn).toContain("subscribeToPush");
    expect(layout).not.toContain("serviceWorker.register");
  });
});

test.describe("offline business state is preserved without an offline shell claim", () => {
  test("readiness explains browser delivery and keeps protected storage read-only", () => {
    expect(readiness).toContain("Browser delivery");
    expect(readiness).toContain("A network connection is required to load a new page.");
    expect(readiness).toContain("Drafts and queue preserved");
    expect(readiness).not.toContain("Offline app shell");
    expect(readiness).not.toContain("Installed mode");
    expect(readiness).not.toContain("Add to Home Screen");
    expect(readiness).not.toContain("App version state");
    expect(readiness).not.toContain("indexedDB.deleteDatabase");
    expect(readiness).not.toContain("caches.delete");
    expect(readiness).not.toContain("local.remove(");
  });

  test("the user-scoped outbox, replay and conflict implementation remains active", () => {
    expect(settings).toContain('href="/field/settings/conflicts"');
    expect(settings).toContain("local.peekAll()");
    expect(settings).toContain("local.conflicts()");
    expect(offline).toContain('const LEGACY_DB = "mim-field-v1"');
    expect(offline).toContain('"outbox"');
    expect(offline).toContain('"conflicts"');
    expect(offline).toContain("createReplayGuard");
    expect(offline).toContain("await guard.assertLive()");
  });
});

test.describe("responsive browser readiness runtime", () => {
  test.use({ storageState: storageStatePath("inspector") });

  test("mandated widths, locales and themes reflow without overflow", async ({ page }) => {
    test.setTimeout(180_000);
    const widths = [320, 375, 390, 768, 1024, 1280, 1440, 1920];
    for (const locale of ["en", "ar"] as const) {
      await page.goto(`/locale?set=${locale}`);
      for (const theme of ["light", "dark"] as const) {
        await page.goto("/field/settings/readiness");
        await page.evaluate(value => localStorage.setItem("saqeel-theme", value), theme);
        await page.reload();
        await expect(page.locator("[data-readiness-ready=ready]")).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.getByText(locale === "ar" ? "التشغيل عبر المتصفح" : "Browser delivery", { exact: true })).toBeVisible();
        await expect(page.getByText(/Add to Home Screen|Installed mode|Offline app shell/)).toHaveCount(0);

        for (const width of widths) {
          await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow, `${locale}/${theme}/${width}px document overflow`).toBeLessThanOrEqual(1);
          if (evidenceDir) {
            await page.screenshot({
              path: join(evidenceDir, `readiness-${locale}-${theme}-${width}.png`),
              fullPage: true,
            });
          }
        }
      }
    }
  });

  test("English and Arabic readiness are keyboard reachable and axe-clean", async ({ page }) => {
    for (const locale of ["en", "ar"] as const) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/locale?set=${locale}`);
      await page.goto("/field/settings/readiness");
      await expect(page.locator("[data-readiness-ready=ready]")).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus-visible")).toHaveCount(1);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    }
  });
});
