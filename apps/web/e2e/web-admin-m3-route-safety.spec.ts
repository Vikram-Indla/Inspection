import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { storageStatePath } from "./personas";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const operationsPage = read("src/app/(app)/operations/page.tsx");
const operationsLivePage = read("src/app/(app)/operations/live/page.tsx");
const fieldVisitPage = read("src/app/(app)/field/[visitId]/page.tsx");
const operationsActions = read("src/app/(app)/operations/actions.ts");
const overrideMigration = read("../../supabase/migrations/20260716161605_ipad_geo_override_approval_workflow.sql");

test.describe("TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001 route safety", () => {
  test("the Operations GET is read-only and uses one request-start cutoff", () => {
    expect(operationsPage).not.toContain('sb.rpc("expire_stale_geo_override_requests")');
    expect(operationsPage.match(/const now = Date\.now\(\);/g)).toHaveLength(1);
    expect(operationsPage.match(/const nowIso = new Date\(now\)\.toISOString\(\);/g)).toHaveLength(1);
    expect(operationsPage).toContain('.eq("status", "pending")\n      .gt("expires_at", nowIso)');

    const cutoff = operationsPage.indexOf("const nowIso = new Date(now).toISOString();");
    const reads = operationsPage.indexOf("await Promise.all([");
    const queueFilter = operationsPage.indexOf('.gt("expires_at", nowIso)');
    expect(cutoff).toBeGreaterThan(-1);
    expect(reads).toBeGreaterThan(cutoff);
    expect(queueFilter).toBeGreaterThan(reads);
  });

  test("the atomic decision guard remains the only Operations expiry race authority", () => {
    expect(operationsActions).toContain('sb.rpc("decide_geo_override"');
    expect(overrideMigration).toContain("if now() >= v_request.expires_at");
    expect(overrideMigration).toContain("set status = 'expired', decided_at = now()");
    expect(overrideMigration).toContain("return v_request;");
    expect(overrideMigration).toContain("update journey_sessions set status = 'arrived'");

    const expiryGuard = overrideMigration.indexOf("if now() >= v_request.expires_at");
    const arrivalMutation = overrideMigration.indexOf("update journey_sessions set status = 'arrived'");
    expect(expiryGuard).toBeGreaterThan(-1);
    expect(arrivalMutation).toBeGreaterThan(expiryGuard);
  });

  // The field visit page is the other GET that used to call the expiry RPC.
  // That RPC is a security-definer UPDATE across every past-due row, so a single
  // inspector opening a visit decided unrelated pending requests. The page now
  // relabels a past-due row in memory only.
  test("the field visit GET is read-only and only relabels a past-due row in memory", () => {
    expect(fieldVisitPage).not.toContain('sb.rpc("expire_stale_geo_override_requests")');
    expect(fieldVisitPage).toContain("Number.isFinite(fieldOverrideExpiresAtMs)");
    expect(fieldVisitPage).toContain('status: "expired" as const');
  });
});

test.describe("DSG-CMD-020 Operations direct-route authorization", () => {
  // A business-visible shell item is enabled for every web-portal persona, so
  // nav visibility alone is not authorization: an admin-only role could reach
  // the Operations Center by typing the URL. Both routes must check the role
  // independently of the nav item.
  for (const [name, source] of [
    ["/operations", operationsPage],
    ["/operations/live", operationsLivePage],
  ] as const) {
    test(`${name} verifies an operational role independently of nav visibility`, () => {
      expect(source).toContain("BUSINESS_ROLE_KEYS");
      expect(source).toContain("FIELD_CHANNEL_ROLE_KEYS");
      expect(source).toContain("const hasOperationalRole = routeRoleKeys.some");
      expect(source).toContain(
        "const mayViewOperations = operationsDestination?.enabled === true && hasOperationalRole;"
      );
      // the nav flag must never be the sole condition again
      expect(source).not.toContain("const mayViewOperations = operationsDestination?.enabled === true;");
    });
  }
});

test.describe("TASK-WEB-ADMIN-PHASE1-M3-OPERATIONS-001 repeated GET", () => {
  test.use({ storageState: storageStatePath("ops") });

  test("shared Mapbox popup remains readable in light and dark themes", async ({ page }) => {
    const response = await page.goto("/operations");
    expect(response?.status()).toBe(200);

    const samples = await page.evaluate(() => {
      const popup = document.createElement("div");
      popup.className = "mapboxgl-popup mapboxgl-popup-anchor-bottom";
      popup.innerHTML = [
        '<div class="mapboxgl-popup-content">Saudi Dairy &amp; Foodstuff (SADAFCO)</div>',
        '<button class="mapboxgl-popup-close-button" type="button">×</button>',
        '<div class="mapboxgl-popup-tip"></div>',
      ].join("");
      document.body.append(popup);

      const read = (theme: "light" | "dark") => {
        document.documentElement.dataset.theme = theme;
        const root = getComputedStyle(document.documentElement);
        const content = getComputedStyle(popup.querySelector(".mapboxgl-popup-content")!);
        const close = getComputedStyle(popup.querySelector(".mapboxgl-popup-close-button")!);
        const tip = getComputedStyle(popup.querySelector(".mapboxgl-popup-tip")!);
        return {
          theme,
          background: content.backgroundColor,
          color: content.color,
          closeColor: close.color,
          tipColor: tip.borderTopColor,
          surfaceToken: root.getPropertyValue("--surface-primary").trim(),
          textToken: root.getPropertyValue("--text-primary").trim(),
        };
      };

      const result = [read("light"), read("dark")];
      popup.remove();
      return result;
    });

    for (const sample of samples) {
      expect(sample.background).not.toBe(sample.color);
      expect(sample.closeColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(sample.tipColor).toBe(sample.background);
      expect(sample.surfaceToken).not.toBe("");
      expect(sample.textToken).not.toBe("");
    }
    expect(samples[0].background).not.toBe(samples[1].background);
    expect(samples[0].color).not.toBe(samples[1].color);
  });

  test("two Operations renders remain successful without a write-triggering request", async ({ page }) => {
    const applicationRequests: { method: string; url: string }[] = [];
    page.on("request", request => {
      if (request.url().startsWith("http://127.0.0.1:")) {
        applicationRequests.push({ method: request.method(), url: request.url() });
      }
    });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await page.goto("/operations");
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: "Operations Center", exact: true })).toBeVisible();
    }

    expect(applicationRequests.filter(request =>
      request.url.includes("expire_stale_geo_override_requests"),
    )).toEqual([]);
    expect(applicationRequests.filter(request =>
      request.method !== "GET" && request.method !== "HEAD",
    )).toEqual([]);
  });
});
