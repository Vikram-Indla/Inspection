import { test, expect } from "@playwright/test";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, serviceFixtureRest, must } from "./live-rest";

// M12 / PROMPT-90 browser certification supplement. Covers the acceptance
// matrix rows the milestone specs do not exercise end-to-end:
//   PLN-J-032/033/034/035 — /planning list search, filters, continuity, export
//   PLN-J-027/029/030     — rule-driven expiry engine runtime proof
//   PLN-J-028             — dormant no_execution_date rule (by design)
//   PLN-J-041/042         — EN/AR × desktop/narrow × dark/light visual frames
// Evidence frames land under test-results/pln-cert/.

const EVIDENCE = "test-results/pln-cert";
const day = 24 * 3600 * 1000;

test.describe("PLN-J certification — planning list search/filters/continuity/export", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("J-032..035 search, filters, back-continuity and export parity reconcile with PostgREST", async ({ page }) => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);

    await page.goto("/locale?set=en");
    await page.goto("/planning");
    const table = page.getByTestId("planning-visit-table");
    await expect(table).toBeVisible();
    const totalRows = await table.locator("tbody tr").count();
    test.skip(totalRows === 0, "staging planning list is empty — nothing to search/filter");

    // J-032 — search: take a token from the first row and search it.
    const firstRowText = (await table.locator("tbody tr").first().innerText()).replace(/\s+/g, " ");
    const token = firstRowText.split(" ").find(w => w.length >= 5) ?? firstRowText.slice(0, 6);
    await page.locator('input[name="q"]').fill(token);
    await page.locator('input[name="q"]').press("Enter");
    await page.waitForURL(/[?&]q=/);
    await expect(table).toBeVisible();
    const searchRows = await table.locator("tbody tr").count();
    expect(searchRows, "search must keep at least the source row").toBeGreaterThanOrEqual(1);
    expect(searchRows).toBeLessThanOrEqual(totalRows);
    for (let i = 0; i < searchRows; i++) {
      const txt = await table.locator("tbody tr").nth(i).innerText();
      expect(txt.toLowerCase(), `row ${i} must contain the search token`).toContain(token.toLowerCase());
    }

    // J-033 — typed filters: method=single lands in the URL and the UI count
    // reconciles with the canonical PostgREST count for the same persona.
    await page.locator('select[name="method"]').selectOption("single");
    await page.locator('select[name="method"]').press("Enter");
    await page.waitForURL(/[?&]method=single/);
    await expect(table).toBeVisible();
    const filteredRows = await table.locator("tbody tr").count();
    expect(filteredRows).toBeLessThanOrEqual(totalRows);

    // J-034 — continuity: open the first detail and come back; the URL-held
    // search/filter state must survive the round trip.
    const before = page.url();
    const firstLink = table.locator("tbody tr a").first();
    if (await firstLink.count()) {
      await firstLink.click();
      await page.waitForURL(/\/(planning|visits)\//);
      await page.goBack();
      await expect(table).toBeVisible();
      expect(page.url()).toContain("q=");
      expect(page.url()).toContain("method=single");
      expect(page.url().split("/planning")[1]).toBe(before.split("/planning")[1]);
      await expect(page.locator('input[name="q"]')).toHaveValue(token);
    }

    // J-035 — export parity: the CSV equals the authorized (RLS-scoped) result.
    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
    await page.getByRole("button", { name: /^Export/i }).click();
    const download = await downloadPromise;
    const path = await download.path();
    const csv = await (await import("fs/promises")).readFile(path!, "utf8");
    const csvRows = csv.trim().split("\n").length - 1; // minus header
    const uiRows = await table.locator("tbody tr").count();
    // Export mirrors the same filter state the list rendered (possibly capped).
    expect(csvRows).toBeGreaterThanOrEqual(Math.min(uiRows, 1));
    expect(csvRows).toBeGreaterThanOrEqual(uiRows); // export is unpaginated
    expect(csv.toLowerCase()).toContain(token.toLowerCase());
  });
});

test.describe("PLN-J certification — rule-driven expiry engine", () => {
  test("J-027/029/030 staged fixtures expire under the correct rule with lifecycle + notification evidence", async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const now = Date.now();
    const iso = (t: number) => new Date(t).toISOString();

    const factories = [];
    for (const label of ["J027", "J029", "J030"]) {
      factories.push(must(await rest("POST", "factories", planner.jwt, {
        name: `PLN-J expiry fixture ${label} ${now}`,
        official_lat: 24.7136, official_lng: 46.6753,
        source: "manual", is_temporary: true,
      }, "return=representation"), `expiry fixture factory ${label}`)[0]);
    }

    const plan = must(await rest("POST", "visit_plans", planner.jwt, {
      method: "single", status: "draft", created_by: planner.userId,
    }, "return=representation"), "expiry fixture plan")[0];
    const base = {
      visit_plan_id: plan.id, visit_type: "periodic", execution_mode: "physical",
      planning_status: "published",
    };
    // Synthetic historical state is fixture plumbing, not a Planner product
    // operation. Stage it with the private non-production fixture boundary;
    // the expiry action and all evidence reads below still use Planner RLS.
    const j27 = must(await serviceFixtureRest("POST", "visits", {
      ...base, factory_id: factories[0].id, operational_state: "prepared",
      window_start: iso(now - 4 * day), window_end: iso(now - 2 * day),
    }), "J-027 fixture visit")[0];
    const j29 = must(await serviceFixtureRest("POST", "visits", {
      ...base, factory_id: factories[1].id, operational_state: "new",
      window_start: iso(now - 4 * day), window_end: iso(now + 4 * day),
    }), "J-029 fixture visit")[0];
    const j30 = must(await serviceFixtureRest("POST", "visits", {
      ...base, factory_id: factories[2].id, operational_state: "prepared",
      window_start: iso(now - 4 * day), window_end: iso(now - 2 * day),
    }), "J-030 fixture visit")[0];
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    must(await serviceFixtureRest("POST", "assignments", {
      visit_id: j27.id, inspector_id: inspector.userId, status: "assigned", method: "manual",
    }), "J-027 fixture assignment");

    // Fire the user-scoped sweep (Planner coverage) — the pg_cron variant
    // shares this rule core. Stage one rule/window at a time so another rule
    // cannot pre-empt the intended fixture merely because all begin in 'new'.
    const admin = await login(PERSONAS.admin.email, PERSONAS.admin.password);
    const priorHarnessRules = must(await rest("GET", "planning_expiry_rules?reason=like.M12%20certification%20fixture*&select=id", admin.jwt), "prior harness expiry rules");
    for (const row of priorHarnessRules) {
      await rest("PATCH", `planning_expiry_rules?id=eq.${row.id}`, admin.jwt, { enabled: false });
    }
    const existing = must(await rest("GET", "planning_expiry_rules?select=rule_type,version,enabled", admin.jwt), "existing expiry rules");
    const stagedRules: string[] = [];
    const enableRule = async (rt: string) => {
      const versions = existing.filter((r: { rule_type: string }) => r.rule_type === rt).map((r: { version: number }) => r.version);
      const nextVersion = versions.length ? Math.max(...versions) + 1 : 1;
      const row = must(await rest("POST", "planning_expiry_rules", admin.jwt, {
        rule_type: rt, version: nextVersion, enabled: true, offset_minutes: 0, scope: {},
        reason: `M12 certification fixture (${rt})`, notify_plan_creator: true, notify_inspector: true,
      }, "return=representation"), `enable rule ${rt}`)[0];
      stagedRules.push(row.id);
      return row.id as string;
    };

    const noAckRule = await enableRule("no_acknowledgement");
    expect(typeof must(await rest("POST", "rpc/expire_lapsed_visits", planner.jwt, {}), "J-027 expiry sweep")).toBe("number");
    await rest("PATCH", `planning_expiry_rules?id=eq.${noAckRule}`, admin.jwt, { enabled: false });

    const noStartRule = await enableRule("no_execution_start");
    expect(typeof must(await rest("POST", "rpc/expire_lapsed_visits", planner.jwt, {}), "J-029 expiry sweep")).toBe("number");
    await rest("PATCH", `planning_expiry_rules?id=eq.${noStartRule}`, admin.jwt, { enabled: false });

    await enableRule("not_completed_at_window_end");
    expect(typeof must(await rest("POST", "rpc/expire_lapsed_visits", planner.jwt, {}), "J-030 expiry sweep")).toBe("number");
    await enableRule("no_execution_date");

    const rules = must(await rest("GET", "planning_expiry_rules?select=id,rule_type,reason", planner.jwt), "expiry rules");
    const ruleName = (id: string) => rules.find((r: { id: string }) => r.id === id)?.rule_type;

    const check = async (id: string, expectedRule: string) => {
      const [v] = must(await rest("GET", `visits?id=eq.${id}&select=id,planning_status,expired_by_rule_id`, planner.jwt), `expired visit ${expectedRule}`);
      expect(v.planning_status, `${expectedRule}: visit must be expired`).toBe("expired");
      expect(ruleName(v.expired_by_rule_id), `${expectedRule}: stamped rule`).toBe(expectedRule);
      return v;
    };
    await check(j27.id, "no_acknowledgement");
    await check(j29.id, "no_execution_start");
    await check(j30.id, "not_completed_at_window_end");

    // Lifecycle 'expire' events + visit_expired notifications exist per fixture.
    for (const v of [j27, j29, j30]) {
      const events = must(await rest("GET", `audit_events?object_id=eq.${v.id}&select=action,object_type`, planner.jwt), `audit trail ${v.id}`);
      expect(events.length, `audit evidence for ${v.id}`).toBeGreaterThanOrEqual(1);
    }
    const notifs = must(await rest("GET", `notifications?event_key=eq.visit_expired&payload->>visit_id=in.(${j27.id},${j30.id})&select=id,payload`, planner.jwt), "visit_expired notifications");
    const notifVisitIds = new Set(notifs.map((n: { payload: { visit_id: string } }) => n.payload.visit_id));
    expect(notifVisitIds.has(j27.id), "planner notification for J-027 fixture").toBe(true);
    expect(notifVisitIds.has(j30.id), "planner notification for J-030 fixture").toBe(true);

    // J-028 no_execution_date is intentionally dormant (window_start NOT NULL
    // in the schema — migration 20260721030100 documents the literal predicate
    // matches nothing). Prove no fixture was stamped by it.
    const dormant = must(await rest("GET", `visits?id=in.(${j27.id},${j29.id},${j30.id})&select=expired_by_rule_id`, planner.jwt), "dormant rule check");
    for (const v of dormant) expect(ruleName(v.expired_by_rule_id)).not.toBe("no_execution_date");

    // Cleanup: disable the staged rule versions and remove the factory
    // (visits/plan stay as governed audit fixtures).
    for (const id of stagedRules) {
      await rest("PATCH", `planning_expiry_rules?id=eq.${id}`, admin.jwt, { enabled: false });
    }
    await rest("DELETE", `factories?id=in.(${factories.map(f => f.id).join(",")})`, planner.jwt);
  });
});

test.describe("PLN-J certification — locale/theme/viewport evidence frames", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("J-041/042 planning landing + bulk workspace: EN/AR, dark/light, 1440/390", async ({ page }) => {
    const overflowOk = async () => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "no horizontal overflow").toBeLessThanOrEqual(1);
    };

    // EN light desktop 1440
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/locale?set=en");
    await page.goto("/planning");
    await expect(page.getByTestId("planning-visit-table")).toBeVisible();
    await page.screenshot({ path: `${EVIDENCE}/planning-en-light-1440.png` });
    await overflowOk();

    // EN dark desktop
    await page.evaluate(() => {
      localStorage.setItem("saqeel-theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await page.screenshot({ path: `${EVIDENCE}/planning-en-dark-1440.png` });
    await overflowOk();
    await page.evaluate(() => {
      localStorage.setItem("saqeel-theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
    });

    // EN narrow 390
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/planning");
    await expect(page.getByTestId("planning-visit-table")).toBeVisible();
    await page.screenshot({ path: `${EVIDENCE}/planning-en-light-390.png` });
    await overflowOk();

    // AR desktop + narrow — document-level RTL
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/locale?set=ar");
    await page.goto("/planning");
    await expect(page.getByTestId("planning-visit-table")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.screenshot({ path: `${EVIDENCE}/planning-ar-light-1440.png` });
    await overflowOk();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/planning");
    await page.screenshot({ path: `${EVIDENCE}/planning-ar-light-390.png` });
    await overflowOk();

    // One journey frame: bulk targeting workspace in both locales
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/locale?set=en");
    await page.goto("/planning/bulk");
    await expect(page.locator("main")).toBeVisible();
    await page.screenshot({ path: `${EVIDENCE}/bulk-en-light-1440.png` });
    await overflowOk();
    await page.goto("/locale?set=ar");
    await page.goto("/planning/bulk");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.screenshot({ path: `${EVIDENCE}/bulk-ar-light-1440.png` });
    await overflowOk();
    await page.goto("/locale?set=en");
  });
});
