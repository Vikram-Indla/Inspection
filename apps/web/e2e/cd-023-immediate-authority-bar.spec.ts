import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { storageStatePath, PERSONAS } from "./personas";
import { login, rest, must } from "./live-rest";

// CD-023 · SCR-WEB-130 · MVP1-M01-043..052 / M02-012.
// Runtime contract: migration 0027 must be present on the linked development
// project. Every direct write uses the acting persona JWT, so RLS and immutable
// audit triggers are exercised rather than bypassed.
const EVIDENCE_DIR = join(process.cwd(), "../../product-contract/evidence/screens/immediate-v2");
test.beforeAll(() => mkdirSync(EVIDENCE_DIR, { recursive: true }));

type RpcPayload = {
  p_request_id: string; p_actor_mode: "planner" | "inspector";
  p_existing_factory_id: string | null; p_manual_name: string | null;
  p_manual_cr: string | null; p_manual_license: string | null;
  p_manual_activity: string | null; p_manual_region: string | null;
  p_manual_city: string | null; p_lat: number | null; p_lng: number | null;
  p_location_source: "official" | "manual"; p_reason: string; p_package_version_id: string; p_visit_type: string;
  p_priority: string | null; p_notes: string | null;
  p_window_start: string | null; p_window_end: string | null;
  p_inspector_id: string | null; p_review_confirmed: boolean;
};

async function packageId(jwt: string) {
  return must(await rest("GET", "package_versions?select=id&status=in.(published,locked)&limit=1", jwt), "published package")[0].id as string;
}

async function createRegisteredFactory(jwt: string, suffix: string) {
  return must(await rest("POST", "factories", jwt, {
    factory_code: `CD023-${suffix}`, name: `CD-023 ${suffix}`,
    cr_number: `CR-${suffix}`, license_number: `LIC-${suffix}`,
    region: "Riyadh", city: "Riyadh", is_temporary: false,
    official_lat: 24.7136, official_lng: 46.6753,
  }), "registered factory")[0] as { id: string };
}

function plannerPayload(factoryId: string, pkg: string, inspectorId: string, requestId = randomUUID()): RpcPayload {
  // Derive a stable, remote-safe window from the idempotency key. Fixed dates
  // make repeated live certification runs collide with immutable assignments
  // left by earlier evidence runs and falsely report inspector_unavailable.
  const windowDay = 10_000 + (Number.parseInt(requestId.slice(0, 8), 16) % 100_000);
  const start = new Date(Date.now() + windowDay * 86400e3);
  const end = new Date(start.getTime() + 3600e3);
  return {
    p_request_id: requestId, p_actor_mode: "planner", p_existing_factory_id: factoryId,
    p_manual_name: null, p_manual_cr: null, p_manual_license: null,
    p_manual_activity: null, p_manual_region: null, p_manual_city: null,
    p_lat: 24.7136, p_lng: 46.6753, p_location_source: "official", p_reason: "Complaint received",
    p_package_version_id: pkg, p_visit_type: "complaint", p_priority: null,
    p_notes: "CD-023 runtime contract", p_window_start: start.toISOString(),
    p_window_end: end.toISOString(), p_inspector_id: inspectorId,
    p_review_confirmed: true,
  };
}

async function openEnglish(page: Page) {
  await page.goto("/locale?set=en");
  await page.goto("/planning/immediate");
}

async function fillManualCore(page: Page, activity: string) {
  await page.getByRole("button", { name: /Unregistered \/ temporary/i }).click();
  await page.locator("#imm-manual-activity").fill(activity);
  await page.getByRole("button", { name: /Complaint received/i }).click();
  await page.locator("#imm-lat").fill("24.7136");
  await page.locator("#imm-lng").fill("46.6753");
}

test.describe("CD-023 Planner UI and atomic persistence", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("blank coordinates are rejected server-side and entered work is preserved (M01-046)", async ({ page }) => {
    await openEnglish(page);
    await page.getByRole("button", { name: /Unregistered \/ temporary/i }).click();
    await page.locator("#imm-manual-activity").fill("Preserved metal activity");
    await page.getByRole("button", { name: /Complaint received/i }).click();
    const start = new Date(Date.now() + 200 * 86400e3);
    await page.locator("#imm-window-start").fill(start.toISOString().slice(0, 16));
    await page.locator("#imm-window-end").fill(new Date(start.getTime() + 3600e3).toISOString().slice(0, 16));
    await page.getByText(/reviewed the mandatory information/i).click();
    await page.getByRole("button", { name: /Create & dispatch/i }).click();
    await expect(page.getByRole("alert").filter({ hasText: /valid visit location/i })).toBeVisible();
    await expect(page.locator("#imm-manual-activity")).toHaveValue("Preserved metal activity");
    await expect(page.locator("#imm-lat")).toHaveValue("");
    await expect(page.locator("body")).not.toContainText(/PGRST|violates row-level|duplicate key/i);
  });

  test("minimum manual identity may omit name/CR/license; location stays on Visit and every write is audited", async ({ page }) => {
    await openEnglish(page);
    const activity = `Activity-only ${Date.now()}`;
    await fillManualCore(page, activity);
    const start = new Date(Date.now() + (500 + Math.floor(Math.random() * 5000)) * 86400e3);
    await page.locator("#imm-window-start").fill(start.toISOString().slice(0, 16));
    await page.locator("#imm-window-end").fill(new Date(start.getTime() + 3600e3).toISOString().slice(0, 16));
    await page.getByText(/reviewed the mandatory information/i).click();
    await page.getByRole("button", { name: /Create & dispatch/i }).click();
    await page.waitForURL(/\/visits\/[0-9a-f-]+/, { timeout: 15_000 });

    const visitId = page.url().split("/visits/")[1];
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const [visit] = must(await rest("GET", `visits?id=eq.${visitId}&select=id,visit_plan_id,factory_id,planner_lat,planner_lng,visit_location_source,immediate_creator_role,creation_request_id`, planner.jwt), "visit");
    expect(visit.visit_plan_id).toBeNull();
    expect(visit.planner_lat).toBe(24.7136);
    expect(visit.planner_lng).toBe(46.6753);
    expect(visit.visit_location_source).toBe("manual");
    expect(visit.immediate_creator_role).toBe("planner");
    const [factory] = must(await rest("GET", `factories?id=eq.${visit.factory_id}&select=id,name,name_is_system_generated,activity_class,official_lat,official_lng,is_temporary`, planner.jwt), "factory");
    expect(factory.name).toMatch(/^Unregistered factory /);
    expect(factory.name_is_system_generated).toBe(true);
    expect(factory.activity_class).toBe(activity);
    expect(factory.official_lat).toBeNull();
    expect(factory.official_lng).toBeNull();
    const [assignment] = must(await rest("GET", `assignments?visit_id=eq.${visitId}&select=id,inspector_id,method,candidates`, planner.jwt), "assignment");
    expect(assignment.inspector_id).toBeTruthy();
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const [notification] = must(await rest("GET", `notifications?payload->>visit_id=eq.${visitId}&select=id,delivery_state`, inspector.jwt), "notification");
    expect(notification.delivery_state).toBe("not_configured");

    const audit = must(await rest("GET", `audit_events?or=(object_id.eq.${visitId},object_id.eq.${visit.factory_id},object_id.eq.${assignment.id},object_id.eq.${notification.id},object_id.eq.${visit.creation_request_id})&select=object_type,action`, planner.jwt), "audit events");
    const keys = new Set(audit.map((e: { object_type: string; action: string }) => `${e.object_type}:${e.action}`));
    for (const expected of ["factories:INSERT", "visits:INSERT", "assignments:INSERT", "notifications:INSERT", "immediate_visit_request:CREATED"]) {
      expect(keys.has(expected), `missing audit ${expected}`).toBe(true);
    }
  });
});

test.describe("CD-023 database blockers, concurrency and idempotency", () => {
  test("package status is revalidated, duplicate active visits are blocked and both attempts are audited", async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const factory = await createRegisteredFactory(planner.jwt, suffix);
    const pkg = await packageId(planner.jwt);

    const unavailableRequest = randomUUID();
    const invalidPackage = plannerPayload(factory.id, randomUUID(), inspector.userId, unavailableRequest);
    const unavailable = must(await rest("POST", "rpc/create_immediate_visit", planner.jwt, invalidPackage), "unavailable package blocker");
    expect(unavailable).toMatchObject({ status: "blocked", code: "package_unavailable" });

    const first = must(await rest("POST", "rpc/create_immediate_visit", planner.jwt, plannerPayload(factory.id, pkg, inspector.userId)), "first factory visit");
    expect(first.status).toBe("ok");
    const duplicateRequest = randomUUID();
    const duplicate = must(await rest("POST", "rpc/create_immediate_visit", planner.jwt, plannerPayload(factory.id, pkg, inspector.userId, duplicateRequest)), "duplicate blocker");
    expect(duplicate).toMatchObject({ status: "blocked", code: "duplicate_active_visit" });
    const blockedAudits = must(await rest("GET", `audit_events?object_id=in.(${unavailableRequest},${duplicateRequest})&object_type=eq.immediate_visit_request&action=eq.BLOCKED&select=object_id,after_state`, planner.jwt), "blocked attempt audits");
    expect(blockedAudits).toHaveLength(2);
  });

  test("concurrent double-submit with one request id creates exactly one visit/assignment/notification", async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const factory = await createRegisteredFactory(planner.jwt, `IDEM-${Date.now()}`);
    const pkg = await packageId(planner.jwt);
    const requestId = randomUUID();
    const payload = plannerPayload(factory.id, pkg, inspector.userId, requestId);
    const [a, b] = await Promise.all([
      rest("POST", "rpc/create_immediate_visit", planner.jwt, payload),
      rest("POST", "rpc/create_immediate_visit", planner.jwt, payload),
    ]);
    const ra = must(a, "first concurrent request");
    const rb = must(b, "second concurrent request");
    expect(ra).toMatchObject({ status: "ok", actor_mode: "planner", replayed: false });
    expect(rb).toMatchObject({ status: "ok", actor_mode: "planner" });
    expect(ra.visit_id).toBe(rb.visit_id);
    const crossModeReplay = must(await rest("POST", "rpc/create_immediate_visit", planner.jwt, {
      ...payload,
      p_actor_mode: "inspector",
    }), "stored-role replay");
    expect(crossModeReplay).toMatchObject({ visit_id: ra.visit_id, actor_mode: "planner", replayed: true });
    const visits = must(await rest("GET", `visits?creation_request_id=eq.${requestId}&select=id`, planner.jwt), "idempotent visit count");
    const assignments = must(await rest("GET", `assignments?visit_id=eq.${ra.visit_id}&select=id`, planner.jwt), "idempotent assignment count");
    const notifications = must(await rest("GET", `notifications?payload->>visit_id=eq.${ra.visit_id}&select=id`, inspector.jwt), "idempotent notification count");
    expect(visits).toHaveLength(1);
    expect(assignments).toHaveLength(1);
    expect(notifications).toHaveLength(1);
    const replays = must(await rest("GET", `audit_events?object_id=eq.${requestId}&action=eq.IDEMPOTENT_REPLAY&select=id`, planner.jwt), "idempotent replay audit");
    expect(replays).toHaveLength(2);
  });

  test("concurrent requests cannot claim the same inspector window", async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const pkg = await packageId(planner.jwt);
    const run = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const [factoryA, factoryB] = await Promise.all([
      createRegisteredFactory(planner.jwt, `SLOT-A-${run}`),
      createRegisteredFactory(planner.jwt, `SLOT-B-${run}`),
    ]);
    const requestA = randomUUID();
    const requestB = randomUUID();
    const payloadA = plannerPayload(factoryA.id, pkg, inspector.userId, requestA);
    const payloadB = {
      ...plannerPayload(factoryB.id, pkg, inspector.userId, requestB),
      p_window_start: payloadA.p_window_start,
      p_window_end: payloadA.p_window_end,
    };

    const [a, b] = await Promise.all([
      rest("POST", "rpc/create_immediate_visit", planner.jwt, payloadA),
      rest("POST", "rpc/create_immediate_visit", planner.jwt, payloadB),
    ]);
    const results = [must(a, "first inspector-window request"), must(b, "second inspector-window request")];
    expect(results.map(result => result.status).sort()).toEqual(["blocked", "ok"]);
    expect(["concurrent_conflict", "inspector_unavailable"]).toContain(
      results.find(result => result.status === "blocked")?.code,
    );
    const visits = must(await rest(
      "GET",
      `visits?creation_request_id=in.(${requestA},${requestB})&select=id`,
      planner.jwt,
    ), "inspector-window visit count");
    expect(visits).toHaveLength(1);
  });

  test("concurrent manual identities sharing one licence cannot create two factories", async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const pkg = await packageId(planner.jwt);
    const sharedLicense = `LIC-CONCURRENT-${Date.now()}`;
    const manual = (cr: string): RpcPayload => ({
      ...plannerPayload(randomUUID(), pkg, inspector.userId),
      p_existing_factory_id: null,
      p_manual_name: `Concurrent identity ${cr}`,
      p_manual_cr: cr,
      p_manual_license: sharedLicense,
      p_manual_activity: "Concurrent identity proof",
      p_lat: 24.8,
      p_lng: 46.8,
      p_location_source: "manual",
    });
    const [a, b] = await Promise.all([
      rest("POST", "rpc/create_immediate_visit", planner.jwt, manual(`CR-A-${Date.now()}`)),
      rest("POST", "rpc/create_immediate_visit", planner.jwt, manual(`CR-B-${Date.now()}`)),
    ]);
    const results = [must(a, "first identity request"), must(b, "second identity request")];
    expect(results.map(result => result.status).sort()).toEqual(["blocked", "ok"]);
    expect(results.find(result => result.status === "blocked")).toMatchObject({ code: "factory_identity_match" });
  });
});

test.describe("CD-023 Inspector-created Immediate Visit", () => {
  test.use({ storageState: storageStatePath("inspector") });

  test("Inspector is authorized, self-assigns, starts now, receives no assignment notification and enters standard start flow", async ({ page }) => {
    await openEnglish(page);
    await expect(page.locator("#imm-window-start")).toHaveCount(0);
    await expect(page.locator("#imm-inspector")).toHaveCount(0);
    await fillManualCore(page, `Inspector activity ${Date.now()}`);
    await page.getByRole("button", { name: /Create & start inspection/i }).click();
    await page.waitForURL(/\/field\/[0-9a-f-]+/, { timeout: 15_000 });
    const visitId = page.url().split("/field/")[1];
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const [visit] = must(await rest("GET", `visits?id=eq.${visitId}&select=id,planning_status,window_start,window_end,planner_lat,planner_lng,visit_location_source,immediate_creator_role,creation_request_id`, inspector.jwt), "inspector visit");
    expect(visit.immediate_creator_role).toBe("inspector");
    expect(visit.visit_location_source).toBe("manual");
    expect(visit.planning_status).toBe("published");
    expect(visit.window_start).toBe(visit.window_end);
    const [assignment] = must(await rest("GET", `assignments?visit_id=eq.${visitId}&select=inspector_id`, inspector.jwt), "self assignment");
    expect(assignment.inspector_id).toBe(inspector.userId);
    const notifications = must(await rest("GET", `notifications?payload->>visit_id=eq.${visitId}&event_key=eq.assignment&select=id`, inspector.jwt), "inspector self assignment-notification absence");
    expect(notifications).toHaveLength(0);
    await expect(page.getByText(/location confirmed with the visit/i)).toBeVisible();
  });
});

test.describe("CD-023 accessibility, localization and visual matrix", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("authority chips use localized labels and localized live announcements in Arabic RTL", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/planning/immediate");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const group = page.getByRole("group", { name: /ضوابط|الحماية|Immediate dispatch protections/i });
    await expect(group.locator(".ax-authoritybar__chip")).toHaveCount(9);
    await expect(group.getByText("السبب", { exact: true })).toBeVisible();
    await expect(group.getByText("الهوية", { exact: true })).toBeVisible();
    await expect(group).toContainText("اختر سببًا للاستعجال");
    await expect(group).toContainText("أدخل هوية المصنع");
    await expect(group).not.toContainText("select an urgency reason");
    await expect(page.locator(".ax-sr-only[role=alert]")).toContainText(/يحظر الإنشاء/);
  });

  test("dark/light × EN/AR × desktop/narrow evidence has no horizontal overflow", async ({ page }) => {
    for (const locale of ["en", "ar"] as const) {
      for (const theme of ["dark", "light"] as const) {
        for (const viewport of [{ name: "desktop", width: 1280, height: 900 }, { name: "narrow", width: 420, height: 900 }]) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(`/locale?set=${locale}`);
          await page.goto("/planning/immediate");
          await page.evaluate(mode => localStorage.setItem("saqeel-theme", mode), theme);
          await page.reload();
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
          expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
          await page.screenshot({ path: join(EVIDENCE_DIR, `${locale}-${theme}-${viewport.name}.png`), fullPage: true });
        }
      }
    }
  });
});
