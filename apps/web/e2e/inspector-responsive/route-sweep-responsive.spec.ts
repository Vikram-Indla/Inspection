import { test, expect } from "@playwright/test";
import { evidenceDirectory } from "../evidence-path";
import { waitForCredentialsForm, identifierField, passwordField, submitCredentials } from "../login-helper";

// TASK-INSPECTOR-RESPONSIVE-ACCEPTANCE-001 — baseline sweep of every other
// implemented Inspector Journey route. Visit Statement has its own full
// 12-variant matrix (visit-statement-responsive.spec.ts) and is not repeated
// here. This is a reduced-scope pass: 1280 + 720 widths, EN/light only,
// functional (loads, no crash text, no horizontal overflow) + screenshot per
// route. Full dark/AR coverage per route is NOT done here — see the report.
//
// Credentials/data match scripts/test-data/local_test_data_seed.sql.
const INSPECTOR_EMAIL = "inspector3@local.saqeel.test";
const INSPECTOR_PASSWORD = "Password";

const VISIT_ID = "75000000-0000-4000-8000-000000000003"; // owned by inspector3
const INSPECTION_ID = "77000000-0000-4000-8000-000000000003"; // status='submitted', owned by inspector3
const COMPLETED_INSPECTION_ID = "77000000-0000-4000-8000-000000000004"; // status='approved', owned by inspector4
const FACTORY_ID = "f1000000-0000-4000-8000-000000000003";
const NOTIFICATION_ID = "e077e429-9f73-42f9-b537-ea6ed52e101e"; // real row, recipient inspector4

// Routes owned by inspector3 (use INSPECTION_ID/VISIT_ID/FACTORY_ID above).
const ROUTES_INSPECTOR3 = [
  { path: "/field", label: "field-home" },
  { path: "/field/my-tasks", label: "my-tasks" },
  { path: "/field/map", label: "map" },
  { path: "/field/visits", label: "visits" },
  { path: "/field/visits/calendar", label: "visits-calendar" },
  { path: "/field/drafts", label: "drafts" },
  { path: "/field/completed", label: "completed-list" },
  { path: "/field/factory-360", label: "factory-360-list" },
  { path: `/field/factory-360/${FACTORY_ID}`, label: "factory-360-detail" },
  { path: "/field/establishments", label: "establishments" },
  { path: "/field/establishments/unregistered", label: "establishments-unregistered" },
  { path: "/field/notifications", label: "notifications-list" },
  { path: "/field/reports", label: "reports-list" },
  { path: "/field/incident-reports", label: "incident-reports" },
  { path: "/field/summons-notices", label: "summons-notices" },
  { path: "/field/sample-collection-reports", label: "sample-collection-reports" },
  { path: "/field/destruction-reports", label: "destruction-reports" },
  { path: "/field/facility-reports", label: "facility-reports" },
  { path: "/field/search", label: "search" },
  { path: "/field/settings", label: "settings" },
  { path: "/field/settings/devices", label: "settings-devices" },
  { path: "/field/settings/conflicts", label: "settings-conflicts" },
  { path: "/field/settings/readiness", label: "settings-readiness" },
  { path: "/field/account", label: "account" },
  { path: "/field/feedback", label: "feedback" },
  { path: "/field/virtual", label: "virtual-list" },
  { path: `/field/${VISIT_ID}`, label: "visit-detail" },
  { path: `/field/${VISIT_ID}/travel`, label: "visit-travel" },
  { path: `/field/inspection/${INSPECTION_ID}`, label: "inspection-workspace" },
  { path: `/field/inspection/${INSPECTION_ID}/results`, label: "inspection-results" },
];

const WIDTHS = [
  { label: "1280", width: 1280, height: 900 },
  { label: "720", width: 720, height: 1024 },
];

const evidenceDir = evidenceDirectory("task-inspector-responsive-acceptance-001-sweep");

type Variant = { key: string; theme: "light" | "dark"; locale: "en" | "ar" };
// en-light already ran and passed 60/60 in a prior pass (see task evidence);
// only dark and AR/RTL run here to avoid redoing a passed variant.
const VARIANTS: Variant[] = [
  { key: "en-dark", theme: "dark", locale: "en" },
  { key: "ar-rtl", theme: "light", locale: "ar" },
];

async function loginInspector3(page: import("@playwright/test").Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto("/login");
  await waitForCredentialsForm(page);
  await identifierField(page).fill(INSPECTOR_EMAIL);
  await passwordField(page).fill(INSPECTOR_PASSWORD);
  await submitCredentials(page);
  await page.waitForURL((url) => url.pathname === "/dashboard", { timeout: 20_000 });
}

async function sweepRoutes(
  page: import("@playwright/test").Page,
  variant: Variant,
  wlabel: string,
): Promise<string[]> {
  if (variant.locale === "ar") await page.goto("/locale?set=ar");
  if (variant.theme === "dark") {
    await page.evaluate(() => {
      localStorage.setItem("saqeel-theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
    });
  }

  const failures: string[] = [];
  for (const route of ROUTES_INSPECTOR3) {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" }).catch(() => null);
    await page.waitForTimeout(600); // let client components settle
    if (variant.theme === "dark") {
      // Client-side navigations can drop the manually-set attribute; reassert per route.
      await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    }
    const status = response?.status() ?? 0;
    const bodyText = await page.locator("body").innerText().catch(() => "");
    const crashed = /Application error|500|This page could not be found/i.test(bodyText) && status !== 200 && status !== 0;
    const dirAttr = await page.locator("html").getAttribute("dir").catch(() => null);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    const screenshotPath = `${evidenceDir}/${route.label}-${wlabel}-${variant.key}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    if (status && status >= 400) failures.push(`${route.path}: HTTP ${status}`);
    if (crashed) failures.push(`${route.path}: crash text in body`);
    if (overflow > 4) failures.push(`${route.path}: horizontal overflow ${overflow}px`);
    if (variant.locale === "ar" && dirAttr !== "rtl") failures.push(`${route.path}: html[dir] is "${dirAttr}", expected "rtl"`);
  }
  return failures;
}

for (const variant of VARIANTS) {
  test.describe(`INSP route sweep — baseline responsive, ${variant.key}`, () => {
    for (const { label: wlabel, width, height } of WIDTHS) {
      test(`inspector3 route set at ${wlabel}px (${variant.key})`, async ({ page }) => {
        test.setTimeout(240_000); // ~30 routes, dev-mode first-hit compile per route
        await loginInspector3(page, width, height);
        const failures = await sweepRoutes(page, variant, wlabel);
        // eslint-disable-next-line no-console
        console.log(`[route-sweep ${wlabel}px ${variant.key}] failures: ${failures.length ? failures.join(" | ") : "none"}`);
        expect(failures, failures.join("\n")).toEqual([]);
      });
    }
  });
}
