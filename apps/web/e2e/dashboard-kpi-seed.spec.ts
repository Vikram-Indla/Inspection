import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { login, rest, must, assertOk } from "./live-rest";
import { waitForCredentialsForm, submitCredentials } from "./login-helper";

const OPS = { email: "ops@mim.gov.sa", password: "MimOps!2026" };
const VISIT_IDS = Array.from({ length: 6 }, (_, i) => `b7000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
const GEO_IDS = Array.from({ length: 3 }, (_, i) => `e7000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
const NOTIFICATION_IDS = ["84000000-0000-4000-8000-000000000001", "84000000-0000-4000-8000-000000000002"];
const STATES = ["new", "prepared", "on_the_way", "arrived", "executing", "submitted"];
const EVIDENCE_DIR = join(process.cwd(), "../../product-contract/evidence/screens/dashboard-kpi-seed");

test.describe("TASK-DASH-KPI-SEED-001", () => {
  test("Operations keeps active journeys visible after planning expiry", () => {
    const source = readFileSync(join(process.cwd(), "src/app/operations/page.tsx"), "utf8");
    expect(source).toContain('v.planning_status === "published" || ["on_the_way", "arrived", "executing"].includes(v.operational_state)');
    expect(source).toContain("planning_status and operational_state are separate");
    const refreshSource = readFileSync(join(process.cwd(), "src/app/operations/actions.ts"), "utf8");
    expect(refreshSource).toContain('select("id, planning_status, operational_state');
    expect(refreshSource).toContain('v.planning_status === "published" || ["on_the_way", "arrived", "executing"].includes(v.operational_state)');
  });

  // Operations' Notifications panel is "latest 20 by created_at" against the
  // shared live project (operations/page.tsx) — a real, intentional product
  // limit, not something to relax for tests. Across a 90+ test full-suite run,
  // enough other notifications get created that this fixture's row ages out of
  // the top 20 by the time this test runs, regardless of suite position. Refresh
  // its timestamp to "now" immediately before checking, same upsert semantics
  // scripts/seed-dashboard-kpis.mjs already uses (see its own comment on why
  // visits/notifications must be upsertable, not insert-once).
  test.beforeAll(async () => {
    const ops = await login(OPS.email, OPS.password);
    const now = new Date().toISOString();
    const refresh = NOTIFICATION_IDS.map((id, i) => ({
      id, event_key: i === 0 ? "assignment" : "review_decision", recipient: ops.userId,
      payload: { fixture: "TASK-DASH-KPI-SEED-001" }, channel: "inapp",
      delivery_state: "delivered", delivered_at: now, created_at: now,
    }));
    assertOk(await rest("POST", "notifications", ops.jwt, refresh, "resolution=merge-duplicates,return=minimal"), "refresh KPI notification fixtures");
  });

  test("record truth exposes exactly one labelled fixture for every operational state without freezing planning lifecycle", async () => {
    const ops = await login(OPS.email, OPS.password);
    const rows = must(await rest(
      "GET",
      `visits?select=id,operational_state,planning_status,factories(factory_code,source)&id=in.(${VISIT_IDS.join(",")})`,
      ops.jwt,
    ), "KPI fixture visits");
    expect(rows).toHaveLength(6);
    expect(rows.map((row: { operational_state: string }) => row.operational_state).sort()).toEqual([...STATES].sort());
    for (const row of rows) {
      // The canonical expiry job may move a time-lapsed verification visit from
      // published to expired. Operational state is deliberately independent
      // (FND-002), so the fixture must not bypass that lifecycle to stay green.
      expect(["published", "expired"]).toContain(row.planning_status);
      expect(row.factories.factory_code).toMatch(/^KPI-VERIFY-0[1-6]$/);
      expect(row.factories.source).toBe("verification_fixture");
    }

    const [geo, actions, notifications] = await Promise.all([
      rest("GET", `geo_events?select=id&id=in.(${GEO_IDS.join(",")})`, ops.jwt),
      rest("GET", "action_forms?select=id,status,is_blocking&id=in.(85000000-0000-4000-8000-000000000001,85000000-0000-4000-8000-000000000002)", ops.jwt),
      rest("GET", "notifications?select=id,event_key,delivery_state&id=in.(84000000-0000-4000-8000-000000000001,84000000-0000-4000-8000-000000000002)", ops.jwt),
    ]);
    expect(must(geo, "fixture geo events")).toHaveLength(3);
    expect(must(actions, "fixture actions")).toHaveLength(2);
    expect(must(notifications, "fixture notifications")).toHaveLength(2);
  });

  test("operations persona can verify KPI cards and every scoped dashboard panel", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await page.locator("#email").fill(OPS.email);
    await page.locator("#pw").fill(OPS.password);
    await submitCredentials(page);
    await page.waitForURL(/\/dashboard/);
    await page.goto("/operations?region=Verification%20Fixtures&city=Dashboard%20KPI");

    await expect(page.getByRole("heading", { name: "Operations Center", exact: true })).toBeVisible();
    await expect(page.locator(".ax-kpi").first()).toBeVisible({ timeout: 20_000 });
    for (const state of STATES) {
      const label = state.replace(/_/g, " ");
      const card = page.locator(".ax-kpi").filter({ hasText: new RegExp(`^${label}`, "i") });
      await expect(card).toBeVisible();
      const value = Number.parseInt(await card.locator(".ax-kpi__value").innerText(), 10);
      expect(value, `${state} KPI includes its fixture`).toBeGreaterThanOrEqual(1);
    }

    const monitoring = page.locator(".ax-surface").filter({ has: page.getByRole("heading", { name: /Live visit monitoring/ }) });
    const ops = await login(OPS.email, OPS.password);
    const fixtureVisits = must(await rest(
      "GET",
      `visits?select=planning_status,factories(name)&id=in.(${VISIT_IDS.join(",")})`,
      ops.jwt,
    ), "KPI fixture lifecycle");
    const publishedNames = fixtureVisits
      .filter((row: { planning_status: string }) => row.planning_status === "published")
      .map((row: { factories: { name: string } }) => row.factories.name);
    if (publishedNames.length > 0) {
      for (const name of publishedNames.filter((value: string) => /En route|Executing overdue/.test(value))) {
        await expect(monitoring.getByText(name)).toBeVisible();
      }
    } else {
      await expect(monitoring.getByText(/No published visits to monitor/i)).toBeVisible();
    }

    const sla = page.locator(".ax-surface").filter({ has: page.getByRole("heading", { name: /SLA watch/ }) });
    if (publishedNames.length > 0) {
      for (const name of publishedNames.filter((value: string) => /Prepared overdue|Executing overdue/.test(value))) {
        await expect(sla.getByText(name)).toBeVisible();
      }
    }

    const risk = page.locator(".ax-surface").filter({ has: page.getByRole("heading", { name: /High-risk factories/ }) });
    await expect(risk.getByText("KPI Verify — Submitted")).toBeVisible();

    const action = page.locator(".ax-surface").filter({ has: page.getByRole("heading", { name: /Corrective actions queue/ }) });
    await expect(action.getByText("KPI Verify — Executing overdue").first()).toBeVisible();
    await expect(action.locator(".ax-lozenge").filter({ hasText: /^blocking$/ }).first()).toBeVisible();

    const geo = page.locator(".ax-surface").filter({ has: page.getByRole("heading", { name: /Location events/ }) });
    await expect(geo.getByText("checkin").first()).toBeVisible();
    await expect(geo.getByText("inside").first()).toBeVisible();

    const notifications = page.locator(".ax-surface").filter({ has: page.getByRole("heading", { name: /^Notifications/ }) });
    await expect(notifications.getByText("assignment").first()).toBeVisible();
    await expect(notifications.getByText("review_decision").first()).toBeVisible();

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: join(EVIDENCE_DIR, "operations-scoped-en-light.png"), fullPage: true });
  });

  test("live operations consumes the same seeded factories and active visits", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await page.locator("#email").fill(OPS.email);
    await page.locator("#pw").fill(OPS.password);
    await submitCredentials(page);
    await page.waitForURL(/\/dashboard/);
    await page.goto("/operations/live");
    await expect(page.getByText(/Verification Fixtures/i).first()).toBeVisible({ timeout: 20_000 });

    const enRoute = page.locator(".lv-counter").filter({ hasText: "Inspectors en route" });
    const onSite = page.locator(".lv-counter").filter({ hasText: "On site now" });
    expect(Number.parseInt(await enRoute.locator("strong").innerText(), 10)).toBeGreaterThanOrEqual(1);
    expect(Number.parseInt(await onSite.locator("strong").innerText(), 10)).toBeGreaterThanOrEqual(2);

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: join(EVIDENCE_DIR, "live-operations-en-light.png"), fullPage: true });
  });
});
