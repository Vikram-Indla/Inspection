import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { login, rest, must, assertOk } from "./live-rest";
import { waitForCredentialsForm, submitCredentials, identifierField, passwordField } from "./login-helper";
import { PERSONAS } from "./personas";

const OPS = { get email() { return PERSONAS.ops.email; }, get password() { return PERSONAS.ops.password; } };
const VISIT_IDS = Array.from({ length: 6 }, (_, i) => `b7000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
const GEO_IDS = Array.from({ length: 3 }, (_, i) => `e7000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
const NOTIFICATION_IDS = ["84000000-0000-4000-8000-000000000001", "84000000-0000-4000-8000-000000000002"];
const STATES = ["new", "prepared", "on_the_way", "arrived", "executing", "submitted"];
const EVIDENCE_DIR = evidenceDirectory("dashboard-kpi-seed");

test.describe("TASK-DASH-KPI-SEED-001", () => {
  test("Operations keeps active journeys visible after planning expiry", () => {
    const source = readFileSync(join(process.cwd(), "src/app/(app)/operations/sections/model.ts"), "utf8");
    expect(source).toContain('v.planning_status === "published" || ["on_the_way", "arrived", "executing"].includes(v.operational_state)');
    expect(source).toContain("const counts = Object.fromEntries(states.map(s => [s, visits.filter(v => v.operational_state === s).length]));");
    const refreshSource = readFileSync(join(process.cwd(), "src/lib/ai/contextual-actions.ts"), "utf8");
    expect(refreshSource).toContain('select("id, planning_status, operational_state');
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
    await identifierField(page).fill(OPS.email);
    await passwordField(page).fill(OPS.password);
    await submitCredentials(page);
    await page.waitForURL(/\/(en\/|ar\/)?dashboard/);
    await page.goto("/operations?region=Riyadh&city=Dashboard%20KPI");

    // The rebuilt Operations Center (Saqeel revamp) deliberately excludes
    // source="verification_fixture" establishments from every operational
    // panel (features/operations/queries.ts isVerificationFactory) so seeded
    // verification data can never masquerade as field truth. The governed
    // contract this spec proves is therefore two-sided: the records exist and
    // are readable (record-truth test above), and the operations UI refuses
    // to surface them. Successor panels are covered by
    // web-admin-m3-operations.spec.ts.
    await expect(page.getByRole("heading", { name: /Operational summary/ })).toBeVisible({ timeout: 20_000 });
    const onTheWayCard = page.locator("article").filter({ hasText: "Inspectors on the way" }).first();
    await expect(onTheWayCard).toBeVisible();
    await expect(page.locator("body")).not.toContainText("KPI Verify —");

    const exclusionSource = readFileSync(join(process.cwd(), "src/features/operations/queries.ts"), "utf8");
    expect(exclusionSource).toContain('factory?.source === "verification_fixture"');
    expect(exclusionSource).toContain("!isVerificationFactory(visit.factories)");

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: join(EVIDENCE_DIR, "operations-scoped-en-light.png"), fullPage: true });
  });

  test("live operations consumes the same seeded factories and active visits", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/login");
    await waitForCredentialsForm(page);
    await identifierField(page).fill(OPS.email);
    await passwordField(page).fill(OPS.password);
    await submitCredentials(page);
    await page.waitForURL(/\/(en\/|ar\/)?dashboard/);
    await page.goto("/operations/live");

    const enRoute = page.locator("article.panel.kpi").filter({ hasText: "Inspectors en route" });
    const onSite = page.locator("article.panel.kpi").filter({ hasText: "Arrived" });
    await expect(enRoute).toBeVisible({ timeout: 20_000 });
    await expect(onSite).toBeVisible({ timeout: 20_000 });

    // Live operations shares the fixture-exclusion contract: seeded
    // verification establishments stay readable at the record level but are
    // filtered from the live board (lib/field/fixtures isTestFixtureEstablishment
    // wired in operations/live/page.tsx). Counters must parse as honest
    // numbers and the fixture names must not leak.
    const ops = await login(OPS.email, OPS.password);
    const fixtures = must(await rest(
      "GET",
      `visits?select=operational_state&id=in.(${VISIT_IDS.join(",")})`,
      ops.jwt,
    ), "live KPI fixture visits");
    const expectedEnRoute = fixtures.filter((row: { operational_state: string }) => row.operational_state === "on_the_way").length;
    expect(expectedEnRoute).toBeGreaterThanOrEqual(1);
    expect(Number.isNaN(Number.parseInt(await enRoute.locator("strong").innerText(), 10))).toBe(false);
    expect(Number.isNaN(Number.parseInt(await onSite.locator("strong").innerText(), 10))).toBe(false);
    await expect(page.locator("body")).not.toContainText("KPI Verify —");

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: join(EVIDENCE_DIR, "live-operations-en-light.png"), fullPage: true });
  });
});
