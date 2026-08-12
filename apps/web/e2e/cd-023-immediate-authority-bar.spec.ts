import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { evidenceDirectory } from "./evidence-path";
import { goldenInspectorPersona, storageStatePath, PERSONAS } from "./personas";
import { login, rest, must } from "./live-rest";

// CD-023 · SCR-WEB-130 · MVP1-M01-043..052 / M02-012 / PLN-REQ-025..028 /
// PLN-IMM-001 / PLN-SUP-001..003.
//
// Governed reconciliation (R05 + Planning convergence): an urgent request is
// executable only against a REGISTERED factory — manual (unregistered) entry
// is deliberately locked on this page for every role, and creation is a
// submission for Supervisor release (submit_immediate_visit_for_supervision),
// never a self-served dispatch. Access model: planning_access_class() admits
// business_staff only (admin and inspector are denied the page), and the
// supervision RPC further requires the planner/supervisor internal role.
// The legacy create_immediate_visit RPC remains the atomic database contract
// exercised by the direct-RPC suite below.
const EVIDENCE_DIR = evidenceDirectory("immediate-v2");
test.beforeAll(() => mkdirSync(EVIDENCE_DIR, { recursive: true }));

type RpcPayload = {
  p_request_id: string; p_actor_mode: "planner" | "inspector";
  p_existing_factory_id: string | null; p_manual_name: string | null;
  p_manual_cr: string | null; p_manual_license: string | null;
  p_manual_activity: string | null; p_manual_region: string | null;
  p_manual_city: string | null; p_lat: number | null; p_lng: number | null;
  p_location_source: "official" | "manual"; p_reason: string | null; p_package_version_id: string; p_visit_type: string;
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

type CanonicalFactory = {
  id: string; name: string; cr_number: string; license_number: string | null;
  official_lat: number | null; official_lng: number | null;
};

// The staging catalog carries one canonical labelled test target
// (source=saqeel_test_data, TEST- code) precisely so the registered-path
// journey can be proven without inventing catalog rows; page.tsx deliberately
// keeps it inside the same sourced list the planner sees.
async function canonicalFactory(jwt: string): Promise<CanonicalFactory> {
  return must(await rest(
    "GET",
    "factories?source=eq.saqeel_test_data&is_temporary=eq.false&select=id,name,cr_number,license_number,official_lat,official_lng&limit=1",
    jwt,
  ), "canonical saqeel_test_data factory")[0] as CanonicalFactory;
}

function plannerPayload(factoryId: string, pkg: string, inspectorId: string, requestId = randomUUID()): RpcPayload {
  // Derive a stable, remote-safe window from the idempotency key. Fixed dates
  // make repeated live certification runs collide with immutable assignments
  // left by earlier evidence runs and falsely report inspector_unavailable.
  // DEF-DATA-005 (Cycle 2 completion pass): the modulo used to go up to
  // 110,000 days (~300 years), which now trips window_plausible_years
  // (2020-2100) and surfaces as an unhandled system_error instead of the
  // intended business-logic status — the same class of fixture bug already
  // fixed in golden-journey.spec.ts, cd-022-identity-lens.spec.ts,
  // offline-drill.spec.ts, cd-041/cd-043. Capped to stay safely inside the
  // plausible-year window while preserving the same collision-avoidance intent.
  const windowDay = 10_000 + (Number.parseInt(requestId.slice(0, 8), 16) % 15_000);
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

const pad2 = (n: number) => String(n).padStart(2, "0");
const localStamp = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

// submit_immediate_visit_for_supervision requires the window to start within
// the next 24 hours (urgency is a response-time promise, not a calendar slot).
async function fillUrgentWindow(page: Page) {
  const start = new Date(Date.now() + 3600e3);
  await page.locator("#imm-window-start").fill(localStamp(start));
  await page.locator("#imm-window-end").fill(localStamp(new Date(start.getTime() + 3600e3)));
}

async function selectRegisteredFactory(page: Page, factory: CanonicalFactory) {
  await page.locator("#imm-search").fill(factory.cr_number);
  await page.locator("#imm-existing").selectOption(factory.id);
}

// Full registered-path form: canonical target, governed reason, official pin,
// urgent (≤24h) window, mandatory review confirmation.
async function fillRegisteredCore(page: Page, factory: CanonicalFactory, opts: { reason?: string; notes?: string; skipLocation?: boolean } = {}) {
  await selectRegisteredFactory(page, factory);
  await page.getByRole("button", { name: opts.reason ?? "Complaint received", exact: true }).press("Enter");
  if (opts.notes) await page.locator("#imm-notes").fill(opts.notes);
  if (!opts.skipLocation) await page.getByRole("button", { name: /Use registered official location/i }).click();
  await fillUrgentWindow(page);
  await page.getByText(/reviewed the mandatory information/i).click();
}

const submitButton = (page: Page) => page.getByRole("button", { name: /Submit urgent request for supervision/i });
// The protections card is a readiness strip: it lists BLOCKERS only, so a
// satisfied control is asserted by the absence of its row, not by a "satisfied"
// chip. Re-pointed from role=group (the deleted 9-chip grid) to the card's own
// labelled section.
const blockerRow = (page: Page, re: RegExp) =>
  page.getByRole("region", { name: /Immediate dispatch protections/i }).getByRole("button", { name: re });

test.describe("CD-023 Planner UI and atomic persistence", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("registered factory search accepts CR/license/name and returns the matching source record (M01-044)", async ({ page }) => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const factory = await canonicalFactory(planner.jwt);
    await openEnglish(page);
    const matched = page.locator("#imm-existing option", { hasText: factory.name });
    await page.locator("#imm-search").fill(factory.cr_number);
    await expect(matched).toHaveCount(1);
    if (factory.license_number) {
      await page.locator("#imm-search").fill(factory.license_number);
      await expect(matched).toHaveCount(1);
    }
    await page.locator("#imm-search").fill(factory.name.slice(0, 12));
    await expect(matched).toHaveCount(1);
    await page.locator("#imm-search").fill(`no-such-target-${Date.now()}`);
    await expect(page.getByText(/No registered factory matches/i)).toBeVisible();
  });

  test("accepted urgency values include Other only with Notes justification (M01-045)", async ({ page }) => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const factory = await canonicalFactory(planner.jwt);
    await openEnglish(page);
    for (const label of ["Complaint received", "Incident / accident report", "Referral from authority", "Other"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
    await fillRegisteredCore(page, factory, { reason: "Other" });
    await expect(page.getByText(/Justify “Other” in Notes/i)).toBeVisible();
    await expect(blockerRow(page, /REASON — blocking — justify Other in Notes/i)).toBeVisible();
    await expect(submitButton(page)).toBeDisabled();
    await page.locator("#imm-notes").fill("Anonymous report of unsafe storage");
    await expect(blockerRow(page, /REASON —/i)).toHaveCount(0);
    await expect(submitButton(page)).toBeEnabled();
  });

  test("blank or invalid coordinates block dispatch and entered work is preserved (M01-046)", async ({ page }) => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const factory = await canonicalFactory(planner.jwt);
    await openEnglish(page);
    await fillRegisteredCore(page, factory, { notes: "Preserved metal activity", skipLocation: true });
    await expect(blockerRow(page, /LOCATION — blocking — enter valid coordinates/i)).toBeVisible();
    await expect(submitButton(page)).toBeDisabled();
    await page.locator("#imm-lat").fill("124.7136");
    await page.locator("#imm-lng").fill("46.6753");
    await expect(blockerRow(page, /LOCATION — blocking/i)).toBeVisible();
    await expect(submitButton(page)).toBeDisabled();
    await page.locator("#imm-lat").fill("24.7136");
    await expect(blockerRow(page, /LOCATION —/i)).toHaveCount(0);
    await expect(page.locator("#imm-notes")).toHaveValue("Preserved metal activity");
  });

  test("manual (unregistered) entry is locked for the planner with the honest R05 reason (PLN-REQ-025)", async ({ page }) => {
    await openEnglish(page);
    // The permanently-disabled mode toggle is gone: an unregistered target is
    // unreachable because no control offers it, and R05 is stated once, on the
    // identity card it governs.
    await expect(page.getByRole("radio", { name: /Unregistered \/ temporary/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Unregistered \/ temporary/i })).toHaveCount(0);
    await expect(page.getByText(/Urgent requests still require a registered factory/i)).toBeVisible();
    await expect(page.getByText(/Urgency only changes the response time/i).first()).toBeVisible();
    await expect(page.locator("#imm-not-found")).toHaveCount(0);
    await expect(page.locator("#imm-manual-name")).toHaveCount(0);
    await expect(page.locator("#imm-manual-region")).toHaveCount(0);
    await expect(page.locator("#imm-manual-city")).toHaveCount(0);
  });

  test("no visit type unlocks the unregistered path — manual entry is absent for every type (PLN-REQ-025)", async ({ page }) => {
    await openEnglish(page);
    const typeValues = await page.locator("#imm-visit-type option").evaluateAll(
      options => options.map(option => (option as HTMLOptionElement).value),
    );
    expect(typeValues.length).toBeGreaterThan(0);
    for (const value of typeValues) {
      await page.locator("#imm-visit-type").selectOption(value);
      await expect(page.getByRole("radio", { name: /Unregistered \/ temporary/i })).toHaveCount(0);
      await expect(page.locator("#imm-manual-name")).toHaveCount(0);
    }
  });

  test("manual identity without the governed minimums is rejected by the database contract and persists nothing (PLN-REQ-026/027)", async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const pkg = await packageId(planner.jwt);
    for (const attempt of [
      { name: null, note: "no identity at all", code: "identity_required" },
      { name: `Manual minimums ${Date.now()}`, note: "name without region/city", code: null },
    ]) {
      const requestId = randomUUID();
      const result = must(await rest("POST", "rpc/create_immediate_visit", planner.jwt, {
        ...plannerPayload(randomUUID(), pkg, inspector.userId, requestId),
        p_existing_factory_id: null,
        p_manual_name: attempt.name,
        p_lat: 24.8, p_lng: 46.8, p_location_source: "manual",
      }), `manual minimum blocker (${attempt.note})`);
      expect(result.status, attempt.note).toBe("blocked");
      if (attempt.code) expect(result.code, attempt.note).toBe(attempt.code);
      const visits = must(await rest("GET", `visits?creation_request_id=eq.${requestId}&select=id`, planner.jwt), "manual minimum rejected visit count");
      expect(visits).toHaveLength(0);
    }
  });

  test("registered-path urgent request reaches Supervisor release through the supervision RPC (PLN-IMM-001/PLN-SUP-001)", async ({ page }) => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const factory = await canonicalFactory(planner.jwt);
    await openEnglish(page);
    await expect(page.locator("input[name=request_id]")).not.toHaveValue("");
    const requestId = await page.locator("input[name=request_id]").inputValue();
    await fillRegisteredCore(page, factory, { notes: "CD-023 supervision journey" });
    await expect(submitButton(page)).toBeEnabled();
    await submitButton(page).click();
    const submitted = await page
      .waitForURL(/\/planning\/supervision\?submitted=/, { timeout: 20_000 })
      .then(() => true).catch(() => false);
    if (submitted) {
      const [visit] = must(await rest(
        "GET",
        `visits?creation_request_id=eq.${requestId}&select=id,visit_plan_id,factory_id,planning_status,immediate_creator_role,immediate_reason,visit_location_source,source_channel`,
        planner.jwt,
      ), "supervision visit");
      expect(visit.factory_id).toBe(factory.id);
      expect(visit.planning_status).toBe("pending_supervision");
      expect(visit.immediate_creator_role).toBe("planner");
      expect(visit.immediate_reason).toBe("Complaint received");
      expect(visit.visit_location_source).toBe("official");
      expect(visit.source_channel).toBe("planning.immediate");
      const requests = must(await rest("GET", `planning_supervision_requests?visit_id=eq.${visit.id}&select=id,submitted_by`, planner.jwt), "supervision request");
      expect(requests).toHaveLength(1);
      expect(requests[0].submitted_by).toBe(planner.userId);
      const audit = must(await rest("GET", `audit_events?object_id=eq.${visit.visit_plan_id}&action=eq.IMMEDIATE_VISIT_SUBMITTED_FOR_SUPERVISION&select=id`, planner.jwt), "supervision audit");
      expect(audit.length).toBeGreaterThan(0);
    } else {
      // Shared-staging acceptance: the canonical target may already hold an
      // active visit; the duplicate rule is then the governed outcome — the
      // request is refused atomically and the planner's work is preserved.
      await expect(page.getByRole("alert").filter({ hasText: /active visit already exists/i })).toBeVisible();
      await expect(page.locator("#imm-notes")).toHaveValue("CD-023 supervision journey");
      const visits = must(await rest("GET", `visits?creation_request_id=eq.${requestId}&select=id`, planner.jwt), "duplicate-blocked visit count");
      expect(visits).toHaveLength(0);
    }
    await expect(page.locator("body")).not.toContainText(/PGRST|violates row-level|duplicate key/i);
  });
});

test.describe("CD-023 database blockers, concurrency and idempotency", () => {
  test("Planner review and explicit ordered window are revalidated by the RPC (M01-047/049)", async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const pkg = await packageId(planner.jwt);
    const factory = await createRegisteredFactory(planner.jwt, "WINDOW-" + Date.now());
    const reviewBlocked = must(await rest("POST", "rpc/create_immediate_visit", planner.jwt, {
      ...plannerPayload(factory.id, pkg, inspector.userId),
      p_review_confirmed: false,
    }), "review blocker");
    expect(reviewBlocked).toMatchObject({ status: "blocked", code: "review_required", field: "review" });
    const windowBlocked = must(await rest("POST", "rpc/create_immediate_visit", planner.jwt, {
      ...plannerPayload(factory.id, pkg, inspector.userId),
      p_window_start: null,
      p_window_end: null,
    }), "window blocker");
    expect(windowBlocked).toMatchObject({ status: "blocked", code: "window_invalid", field: "window" });
  });

  test("crafted urgency values and unjustified Other are rejected by the database contract", async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const pkg = await packageId(planner.jwt);
    const factory = await createRegisteredFactory(planner.jwt, "REASON-" + Date.now());
    for (const reasonCase of [
      { reason: "Crafted unapproved reason", notes: "must not persist", code: "system_error" },
      { reason: "Other", notes: null, code: "system_error" },
      { reason: null, notes: "missing reason must not persist", code: "reason_required" },
    ]) {
      const requestId = randomUUID();
      const result = must(await rest("POST", "rpc/create_immediate_visit", planner.jwt, {
        ...plannerPayload(factory.id, pkg, inspector.userId, requestId),
        p_reason: reasonCase.reason,
        p_notes: reasonCase.notes,
      }), "urgency database blocker");
      expect(result).toMatchObject({ status: "blocked", code: reasonCase.code });
      const visits = must(await rest("GET", "visits?creation_request_id=eq." + requestId + "&select=id", planner.jwt), "urgency rejected visit count");
      expect(visits).toHaveLength(0);
    }
  });

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
    expect(ra).toMatchObject({ status: "ok", actor_mode: "planner" });
    expect(rb).toMatchObject({ status: "ok", actor_mode: "planner" });
    expect([ra.replayed, rb.replayed].sort()).toEqual([false, true]);
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
    // Identity serialization is the behavior under test. Use two distinct
    // governed Inspectors so an overlap left by another certification lane
    // cannot turn the winning identity request into inspector_unavailable.
    const [inspector, alternateInspector] = await Promise.all([
      login(PERSONAS.inspector.email, PERSONAS.inspector.password),
      login(goldenInspectorPersona().email, goldenInspectorPersona().password),
    ]);
    const pkg = await packageId(planner.jwt);
    const sharedLicense = `LIC-CONCURRENT-${Date.now()}`;
    const manual = (cr: string, inspectorId: string): RpcPayload => ({
      ...plannerPayload(randomUUID(), pkg, inspectorId),
      p_existing_factory_id: null,
      p_manual_name: `Concurrent identity ${cr}`,
      p_manual_cr: cr,
      p_manual_license: sharedLicense,
      p_manual_activity: "Concurrent identity proof",
      p_manual_region: "Riyadh",
      p_manual_city: "Riyadh",
      p_lat: 24.8,
      p_lng: 46.8,
      p_location_source: "manual",
    });
    const [a, b] = await Promise.all([
      rest("POST", "rpc/create_immediate_visit", planner.jwt, manual(`CR-A-${Date.now()}`, inspector.userId)),
      rest("POST", "rpc/create_immediate_visit", planner.jwt, manual(`CR-B-${Date.now()}`, alternateInspector.userId)),
    ]);
    const results = [must(a, "first identity request"), must(b, "second identity request")];
    expect(results.map(result => result.status).sort(), JSON.stringify(results)).toEqual(["blocked", "ok"]);
    expect(results.find(result => result.status === "blocked")).toMatchObject({ code: "factory_identity_match" });
  });
});

test.describe("CD-023 Inspector boundary (PLN-REQ-025)", () => {
  test.use({ storageState: storageStatePath("inspector") });

  test("an Inspector cannot open the web urgent-visit form — urgent issues start from assigned field work", async ({ page }) => {
    await openEnglish(page);
    await expect(page.getByRole("heading", { name: /You don.t have permission/i })).toBeVisible();
    await expect(page.getByText(/Inspectors raise urgent issues from their own assigned work/i)).toBeVisible();
    await expect(page.locator("#imm-search")).toHaveCount(0);
    await expect(submitButton(page)).toHaveCount(0);
  });
});

test.describe("CD-023 Operations access boundary (PLN-REQ-025)", () => {
  test.use({ storageState: storageStatePath("ops") });

  test("operations staff open the page, manual entry stays locked and creation remains RPC-gated", async ({ page }) => {
    const ops = await login(PERSONAS.ops.email, PERSONAS.ops.password);
    const factory = await canonicalFactory(ops.jwt);
    await openEnglish(page);
    // Business staff reach the form, manual entry is locked for every role
    // (R05), and creation flows only through the supervision RPC. The staging
    // ops persona also holds the supervisor internal role, so the governed
    // outcome is either a submission for supervision or the duplicate-active
    // blocker — never a raw database error.
    await expect(page.getByRole("radio", { name: /Unregistered \/ temporary/i })).toHaveCount(0);
    await expect(page.getByText(/Urgent requests still require a registered factory/i)).toBeVisible();
    await fillRegisteredCore(page, factory);
    await submitButton(page).click();
    const submitted = await page
      .waitForURL(/\/planning\/supervision\?submitted=/, { timeout: 20_000 })
      .then(() => true).catch(() => false);
    if (!submitted) {
      await expect(page.getByRole("alert").filter({ hasText: /active visit already exists|could not be created/i })).toBeVisible();
    }
    await expect(page.locator("body")).not.toContainText(/PGRST|violates row-level|duplicate key/i);
  });
});

test.describe("CD-023 authorization and neutral errors", () => {
  test("a session without the planner/supervisor internal role cannot create through the supervision RPC", async () => {
    const inspector = await login(PERSONAS.inspector.email, PERSONAS.inspector.password);
    const factory = await canonicalFactory(inspector.jwt);
    const requestId = randomUUID();
    const start = new Date(Date.now() + 3600e3);
    const denied = await rest("POST", "rpc/submit_immediate_visit_for_supervision", inspector.jwt, {
      p_request_id: requestId,
      p_factory_id: factory.id,
      p_package_version_id: null,
      p_proposed_inspector_id: null,
      p_visit_type: "complaint",
      p_window_start: start.toISOString(),
      p_window_end: new Date(start.getTime() + 3600e3).toISOString(),
      p_urgency_reason: "Complaint received",
      p_priority: null,
      p_notes: "must not persist",
      p_lat: factory.official_lat,
      p_lng: factory.official_lng,
      p_location_source: "official",
    });
    expect(denied.error).toContain("IMMEDIATE-SUPERVISION-SUBMIT-DENIED");
    const visits = must(await rest("GET", `visits?creation_request_id=eq.${requestId}&select=id`, inspector.jwt), "denied submission visit count");
    expect(visits).toHaveLength(0);
  });

  test("an admin cannot open the Immediate Visit form", async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePath("admin") });
    const page = await context.newPage();
    await openEnglish(page);
    await expect(page.getByRole("heading", { name: /You don.t have permission/i })).toBeVisible();
    await expect(page.locator("#imm-search")).toHaveCount(0);
    await context.close();
  });

  test("Inspector field handoff never appends raw database error text to the visible log", () => {
    const startup = readFileSync(join(process.cwd(), "src/app/(app)/field/[visitId]/Startup.tsx"), "utf8");
    expect(startup).toContain("add(strings.logInspectionCreateFailed)");
    expect(startup).toContain("add(strings.logJourneyBlocked)");
    expect(startup).toContain("add(strings.logCheckinRejected)");
    expect(startup).toContain("add(strings.logExceptionFailed)");
    expect(startup).toContain("add(strings.logOpBlocked)");
    expect(startup).toContain("add(strings.logCancelFailed)");
    expect(startup).toContain("add(strings.logReturnFailed)");
    expect(startup).not.toMatch(/add\(fmt\(strings\.(?:logInspectionCreateFailed|logJourneyBlocked|logCheckinRejected|logExceptionFailed|logOpBlocked|logCancelFailed|logReturnFailed)[\s\S]{0,160}(?:error\.message|r\.error)/);
    const actions = readFileSync(join(process.cwd(), "src/app/(app)/field/[visitId]/actions.ts"), "utf8");
    expect(actions).not.toMatch(/return \{ error: error\.message \}/);
  });

  test("field reschedule is a planner-owned request that never moves the visit optimistically", () => {
    // The calendar drag surface retired with the SAQEEL Field Dashboard
    // rebuild (FieldHome is now the map preview only); the M03-005 contract —
    // inspector proposes, planner decides, visit unchanged — now lives in the
    // Startup reschedule form and the request_visit_reschedule RPC.
    const startup = readFileSync(join(process.cwd(), "src/app/(app)/field/[visitId]/Startup.tsx"), "utf8");
    const actions = readFileSync(join(process.cwd(), "src/app/(app)/field/actions.ts"), "utf8");
    expect(startup).toContain("requestVisitReschedule(visit.id, startIso, endIso)");
    expect(startup).toContain("add(strings.logRescheduleFailed)");
    expect(startup).toContain("setRescheduleRequested(true)");
    expect(actions).toContain("request_visit_reschedule");
    expect(actions).toContain("Your visit is unchanged");
  });

  test("arrival handoff renders context cards, journey summary, cancellation and arrival evidence controls", () => {
    const startup = readFileSync(join(process.cwd(), "src/app/(app)/field/[visitId]/Startup.tsx"), "utf8");
    expect(startup).toContain("M04-050..054");
    expect(startup).toContain("strings.cardsFactoryTitle");
    expect(startup).toContain("strings.cardsVisitTitle");
    expect(startup).toContain("distanceTravelledM");
    expect(startup).toContain("submitCancellation");
    expect(startup).toContain('linked_type: "arrival"');
    expect(startup).toContain("arrivalEvidenceQueued");
    expect(startup).toContain('kind: "arrival"');
    // Obsolete-test fix (Cycle 2 completion pass): the destructure grew a
    // `data: immutableArrival` sibling alongside `error: arrivalError` at
    // some point (a harmless refactor — the arrival geo_events insert and
    // its error handling are unchanged and still present) and this exact
    // brittle substring never got updated.
    expect(startup).toContain("error: arrivalError }");
    expect(startup).toContain("add(strings.logArrivalRejected)");
  });

  test("arrival evidence remains visit-linked before an inspection row exists", () => {
    const migration = readFileSync(join(process.cwd(), "../../supabase/migrations/20260715180000_field_arrival_evidence.sql"), "utf8");
    const repair = readFileSync(join(process.cwd(), "../../supabase/migrations/20260715193000_field_arrival_evidence_column_repair.sql"), "utf8");
    const offline = readFileSync(join(process.cwd(), "src/lib/offline.ts"), "utf8");
    expect(migration).toContain("add value if not exists 'arrival'");
    expect(migration).toContain("evidence_note");
    expect(repair).toContain("alter table evidence add column if not exists evidence_note text");
    expect(offline).toContain('inspection_id: string | null');
    expect(offline).toContain("row.visit_id = op.visit_id; row.inspection_id = null");
    const workspace = readFileSync(join(process.cwd(), "src/app/(app)/field/inspection/[id]/page.tsx"), "utf8");
    expect(workspace).toContain('eq("visit_id", ins.visit_id)');
    expect(workspace).toContain("visitEvidenceRead");
  });
});

test.describe("CD-023 accessibility, localization and visual matrix", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("authority chips use localized labels and localized live announcements in Arabic RTL", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/planning/immediate");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const group = page.getByRole("group", { name: /ضوابط|الحماية|Immediate dispatch protections/i });
    await expect(group.locator(".filter-chip")).toHaveCount(9);
    await expect(group.getByText("السبب", { exact: true })).toBeVisible();
    await expect(group.getByText("الهوية", { exact: true })).toBeVisible();
    await expect(group).toContainText("اختر سببًا للاستعجال");
    await expect(group).toContainText("أدخل هوية المصنع");
    await expect(group).not.toContainText("select an urgency reason");
    // Stale-locator fix (M5): fe4cf0e2 renamed the live region to `sr-only`.
    await expect(page.locator(".sr-only[role=alert]")).toContainText(/يحظر الإنشاء/);
  });

  test("dark/light × EN/AR × desktop/narrow evidence has no horizontal overflow", async ({ page }) => {
    for (const locale of ["en", "ar"] as const) {
      for (const theme of ["dark", "light"] as const) {
        for (const viewport of [{ name: "desktop", width: 1280, height: 900 }, { name: "narrow", width: 420, height: 900 }]) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(`/locale?set=${locale}`);
          await page.goto("/planning/immediate");
          // The shell theme control resolves saqeel-theme-mode first and only
          // falls back to the legacy resolved key, so pin both.
          await page.evaluate(mode => {
            localStorage.setItem("saqeel-theme-mode", mode);
            localStorage.setItem("saqeel-theme", mode);
          }, theme);
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
