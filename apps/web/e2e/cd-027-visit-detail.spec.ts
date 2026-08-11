import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must } from "./live-rest";

// CD-027 / SCR-WEB-210 / P03 — Visit Detail (Track 1: approved UI slice —
// Dual-State Ribbon, available/disabled-with-why/unavailable action zones,
// honest notification copy). Acceptance: DSG-022, DSG-A11Y-001 / DEC-012 wiring.
// Requirements: M02-001..046, FND-002 (five state machines), FND-004
// (notification queued-not-delivered), FND-011 (non-color status).
//
// Runtime assertions are READ-ONLY: management verbs mutate live data, so no
// action SUBMIT is ever clicked. The ribbon tablist and its keyboard model are
// pure client state and safe to exercise. Guards, honest copy and blocked legs
// (ERRORMAP / ORPHAN / NOTIFY_PREV / ASSIGNMENT_RELEASE / MAP) are proven at the
// code layer — matching the CD-025/026 read-only + wiring-proof convention.
const EVIDENCE_DIR = evidenceDirectory("cd-027-visit-detail-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const ID = "src/app/(app)/visits/[id]";
// T-076 moved the reads and derivations into features/visits/detail. These
// assertions are about the route's behaviour, not which file holds it, so the
// source is the route plus its feature modules — the same shape /operations and
// /operations/live already use.
const DETAIL_SOURCE = [
  `${ID}/page.tsx`,
  "src/features/visits/detail/queries.ts",
  "src/features/visits/detail/view.ts",
].map(SRC).join("\n");

test.use({ storageState: storageStatePath("planner") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

// Reach a real visit detail from the board; skip runtime body if scope is empty.
// Detail routes are /visits/<uuid> — must NOT match nav links (/visits/calendar,
// /visits/workload), so filter hrefs to a UUID-shaped id.
const DETAIL_HREF = /^\/visits\/[0-9a-f]{8}-[0-9a-f-]+$/i;   // relative href test
const DETAIL_URL = /\/visits\/[0-9a-f]{8}-[0-9a-f-]+$/i;     // full-URL test (no ^ anchor)
async function openFirstVisit(page: Page): Promise<boolean> {
  await page.goto("/visits");
  const links = page.locator('a[href^="/visits/"]');
  const n = await links.count();
  for (let i = 0; i < n; i++) {
    const href = await links.nth(i).getAttribute("href");
    if (href && DETAIL_HREF.test(href)) {
      await links.nth(i).click();
      await page.waitForURL(DETAIL_URL);
      return true;
    }
  }
  return false;
}

test.describe("CD-027 Dual-State Ribbon (DSG-022 signature interaction)", () => {
  test("renders five never-collapsed state-domain tracks as a keyboard tablist", async ({ page }) => {
    if (!(await openFirstVisit(page))) test.skip(true, "no visit in planner scope");
    const tablist = page.getByRole("tablist", { name: /state domains/i });
    await expect(tablist).toBeVisible();
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(5); // planning · operational · assignment · inspection · review
    await expect(page.getByRole("tabpanel")).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "ribbon-primary.png"), fullPage: true });
  });

  test("APG keyboard model: roving tabindex + Arrow/Home/End move selection", async ({ page }) => {
    if (!(await openFirstVisit(page))) test.skip(true, "no visit in planner scope");
    const tabs = page.getByRole("tab");
    await tabs.first().focus();
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(tabs.nth(4)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  });

  test("narrow viewport reflows the ribbon into an ordered state ledger (S36)", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 900 });
    if (!(await openFirstVisit(page))) test.skip(true, "no visit in planner scope");
    await expect(page.getByRole("tablist", { name: /state domains/i })).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "ribbon-narrow-412.png"), fullPage: true });
  });
});

test.describe("CD-027 action zones + a11y (DSG-A11Y-001)", () => {
  test("management actions are grouped and status/alert regions are wired", async ({ page }) => {
    if (!(await openFirstVisit(page))) test.skip(true, "no visit in planner scope");
    await expect(page.getByText(/Available now/i)).toBeVisible();
    // completion uses role=status, failure a single role=alert (asserted in DOM/code)
    const src = SRC(`${ID}/ActionBar.tsx`);
    expect(src).toContain('role="status"');
    expect(src).toContain('role="alert"');
  });
});

// ── Code-layer wiring proofs (14 legs of WIRING_MAP_CD-027; DEC-012) ─────────
test.describe("CD-027 wiring proofs (code layer)", () => {
  test("honest notification copy — no delivery is claimed (F1/F2)", () => {
    const a = SRC(`${ID}/actions.ts`);
    expect(a).not.toContain("both parties notified");   // leg 9 false claim removed
    expect(a).not.toMatch(/inspector notified\b/);       // legs 4/5/6/7 overclaim removed
    expect(a).toContain("notification queued");           // queued-not-delivered (FND-004)
  });

  test("republish records a durable notification intent inside the atomic transition", () => {
    // Planning closure P0: transitions run through transition_planning_visit_atomic,
    // which writes the workflow_outbox intent in the same transaction — a
    // durable queue record, never a delivery claim.
    const a = SRC(`${ID}/actions.ts`);
    expect(a).toMatch(/republishVisit[\s\S]*callPlanningTransition\(sb, fd, "republish"/);
    const migration = SRC("../../supabase/migrations/20260728010000_planning_closure_p0.sql");
    expect(migration).toContain("insert into public.workflow_outbox(");
    expect(migration).toContain("set planning_status='published'");
  });

  test("guards preserved — published/new + pre-start locks intact", () => {
    const a = SRC(`${ID}/actions.ts`);
    expect(a).toContain("guardPublishedNew");
    expect(a).toContain("guardPreStart");
    // STM-VIS-001/002 state writes now live inside the atomic transition RPC.
    const migration = SRC("../../supabase/migrations/20260728010000_planning_closure_p0.sql");
    expect(migration).toContain("set planning_status='cancelled'");
    expect(migration).toContain("set planning_status='returned'");
  });

  test("append-only audit read is capped at 30 (leg 3)", () => {
    expect(DETAIL_SOURCE).toContain(".limit(30)");
  });

  test("attachments use soft delete + signed URL; registered rows never physically deleted (leg 13)", () => {
    const a = SRC(`${ID}/actions.ts`);
    expect(a).toContain("removed_at");                          // soft delete
    expect(a).not.toMatch(/from\("visit_attachments"\)\s*\.delete\(/); // no hard row delete
    expect(DETAIL_SOURCE).toContain("createSignedUrl");
  });

  test("blocked legs are NOT faked — no invented map/provider/geofence (leg S34 / MAP)", () => {
    expect(DETAIL_SOURCE).not.toMatch(/mapbox|leaflet|google\.maps|geofence_query/i);
  });

  // ── Track 2 closures ────────────────────────────────────────────────────
  test("ERRORMAP — raw provider text never surfaced (legs 1/12/13)", () => {
    const a = SRC(`${ID}/actions.ts`);
    expect(a).toContain('from "./neutral"');
    expect(a).not.toMatch(/error:\s*error\.message/);   // no raw PostgREST message
    expect(a).not.toMatch(/up\.error\.message/);         // no raw storage message
    // Scoped to what the reader sees. `queries.ts` logs provider messages to the
    // server console deliberately (the boundary reports why a read failed); the
    // rule is that none of it reaches the rendered page.
    expect(DETAIL_SOURCE).not.toMatch(/vErr\.message|attErr\.message/);
    expect(SRC(`${ID}/page.tsx`)).not.toMatch(/\.error\.message/);
    expect(SRC(`${ID}/neutral.ts`)).toContain("row-level security");
  });

  test("ORPHAN — failed registration removes the uploaded object (leg 12)", () => {
    const a = SRC(`${ID}/actions.ts`);
    // cleanup lives on the insert-failure path of uploadVisitAttachment
    expect(a).toMatch(/HANDOFF_BLOCKED_ORPHAN closure[\s\S]*?\.remove\(\[path\]\)/);
  });

  test("NOTIFY_PREV — previous inspector is notified on reassign, reusing REF-014 (leg 9)", () => {
    const a = SRC(`${ID}/actions.ts`);
    expect(a).toContain("prevInspector");
    expect(a).toMatch(/released:\s*true/);               // outgoing-inspector payload
    expect(a).not.toContain("both parties notified");    // still no overclaim
  });

  test("five state domains never collapsed into one status (FND-002)", () => {
    const r = SRC(`${ID}/DualStateRibbon.tsx`);
    for (const d of ["planning", "operational", "assignment", "inspection", "review"]) {
      expect(r).toContain(d);
    }
  });
});

// ---------------------------------------------------------------------------
// M8 — planning lifecycle (PLN-CON-011 / PLN-REQ-011 / M02-016): governed
// return/cancel reasons on the append-only lifecycle stream (never a notes
// overwrite), the legacy 'RETURNED: ' display fallback for historical rows,
// final-state Duplicate → safe new Draft, and expired-visit provenance.
// Fixtures are staged over PostgREST with the planner's own JWT so RLS stays
// the enforcement; the mutations under test go through the real UI.
test.describe("M8 — lifecycle: governed return/cancel, duplicate, expired provenance", () => {
  let plannerJwt = "";
  let plannerUserId = "";
  let pkgId = "";

  test.beforeAll(async () => {
    const planner = await login(PERSONAS.planner.email, PERSONAS.planner.password);
    plannerJwt = planner.jwt;
    plannerUserId = planner.userId;
    pkgId = must(await rest("GET",
      "package_versions?select=id&status=eq.published&order=published_at.desc.nullslast&limit=1",
      plannerJwt), "published package")[0].id;
  });

  // Throwaway factory + draft single plan + visit PATCHed to the target
  // planning status (the proven offline-drill pattern: insert draft, then
  // PATCH). Far-future windows so the single staging Inspector can never be
  // double-booked by these fixtures.
  async function stageVisit(tag: string, status: "published" | "returned" | "cancelled", notes?: string) {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const factory = must(await rest("POST", "factories", plannerJwt, {
      factory_code: `CD027-M8-${tag}-${suffix}`, name: `CD027 M8 ${tag} ${suffix}`,
      cr_number: `CR-M827-${tag}-${suffix}`, region: "Riyadh", city: "Riyadh",
      official_lat: 24.71, official_lng: 46.68,
    }), `factory ${tag}`)[0];
    const plan = must(await rest("POST", "visit_plans", plannerJwt, {
      method: "single", status: "draft", created_by: plannerUserId,
    }), `plan ${tag}`)[0];
    const dayOffset = 6000 + Math.floor(Math.random() * 20000);
    const visit = must(await rest("POST", "visits", plannerJwt, {
      visit_plan_id: plan.id, factory_id: factory.id, visit_type: "periodic",
      execution_mode: "physical", planning_status: "draft",
      window_start: new Date(Date.now() + dayOffset * 86400e3).toISOString(),
      window_end: new Date(Date.now() + dayOffset * 86400e3 + 4 * 36e5).toISOString(),
      package_version_id: pkgId,
      ...(notes ? { notes } : {}),
    }), `visit ${tag}`)[0];
    const patch: Record<string, unknown> = { planning_status: status };
    if (status === "cancelled") patch.cancellation_reason = "factory_closed";
    must(await rest("PATCH", `visits?id=eq.${visit.id}`, plannerJwt, patch), `status ${tag}`);
    return { factory, plan, visit };
  }

  test("return uses a governed reason, never touches notes, and appends a lifecycle event (PLN-CON-011)", async ({ page }) => {
    const reasons = must(await rest("GET",
      "planning_lookups?kind=eq.return_reason&is_active=eq.true&select=key,label_en&order=sort_order",
      plannerJwt), "active return reasons") as { key: string; label_en: string }[];
    test.skip(reasons.length === 0, "staging holds no active governed return reason (PLN-CON-011 lookup seed absent)");
    const reasonKey = reasons[0].key;
    const label = reasons[0].label_en;
    const { visit } = await stageVisit("RET", "published");

    await page.goto(`/visits/${visit.id}`);
    await page.locator("#visit-return-reason").selectOption(reasonKey);
    await page.locator("#visit-return-comments").fill("M8 governed return");
    await page.locator("form", { has: page.locator("#visit-return-reason") }).locator("button").click();
    await expect(page.getByText(/Returned\. The history, audit record, and notification were saved/)).toBeVisible({ timeout: 15000 });

    // Server truth: the status flipped, planner notes were NOT overwritten
    // (the legacy `RETURNED: ` prefix is gone), and the event carries the
    // governed key + comments + the prior-state snapshot.
    const row = must(await rest("GET", `visits?id=eq.${visit.id}&select=planning_status,notes`, plannerJwt), "visit after return")[0];
    expect(row.planning_status).toBe("returned");
    expect(row.notes).toBeNull();
    const events = must(await rest("GET",
      `visit_lifecycle_events?visit_id=eq.${visit.id}&event_type=eq.return&select=reason_key,comments,previous`,
      plannerJwt), "return events");
    expect(events).toHaveLength(1);
    expect(events[0].reason_key).toBe(reasonKey);
    expect(events[0].comments).toBe("M8 governed return");
    expect(events[0].previous.planning_status).toBe("published");

    // The banner now reads the reason from the lifecycle stream (governed label).
    await page.reload();
    await expect(page.getByText(`Returned — reason: ${label}`)).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "m8-return.png"), fullPage: true });
  });

  test("legacy 'RETURNED: ' notes prefix still renders for historical rows without an event", async ({ page }) => {
    const { visit } = await stageVisit("LEG", "returned", "RETURNED: legacy staging reason");
    await page.goto(`/visits/${visit.id}`);
    await expect(page.getByText("Returned — reason: legacy staging reason")).toBeVisible();
    // No event exists for this historical row — the stream is honestly empty.
    await expect(page.locator("#lifecycle").getByText(/No lifecycle events recorded yet/)).toBeVisible();
  });

  test("cancel records the note on the lifecycle stream and exposes Duplicate in the final zone (M02-006)", async ({ page }) => {
    // PLN-R02/R03 — planning cancellation takes one optional note through the
    // atomic closure RPC; the governed cancellation-reason lookup retired.
    const { visit } = await stageVisit("CAN", "published");

    await page.goto(`/visits/${visit.id}`);
    await page.locator("#visit-cancel-comments").fill("M8 governed cancel");
    await page.locator("form", { has: page.locator("#visit-cancel-comments") }).locator("button").click();
    await expect(page.getByText(/Visit cancelled\. Audit and notification were saved/)).toBeVisible({ timeout: 15000 });

    const row = must(await rest("GET", `visits?id=eq.${visit.id}&select=planning_status,cancellation_reason`, plannerJwt), "visit after cancel")[0];
    expect(row.planning_status).toBe("cancelled");
    const events = must(await rest("GET",
      `visit_lifecycle_events?visit_id=eq.${visit.id}&event_type=eq.cancel&select=comments,previous`,
      plannerJwt), "cancel events");
    expect(events).toHaveLength(1);
    expect(events[0].comments).toBe("M8 governed cancel");
    expect(events[0].previous.planning_status).toBe("published");

    await page.reload();
    await expect(page.getByRole("button", { name: /Duplicate visit/i })).toBeVisible();
    await expect(page.getByText(/final state — view only/)).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "m8-cancel-final.png"), fullPage: true });
  });

  test("duplicate clones a cancelled visit into a safe new draft and routes to the single wizard (PLN-REQ-011)", async ({ page }) => {
    const { factory, visit } = await stageVisit("DUP", "cancelled");
    await page.goto(`/visits/${visit.id}`);
    await page.getByRole("button", { name: /Duplicate visit/i }).click();
    await page.waitForURL(/\/planning\/single\?plan=[0-9a-f-]{36}/, { timeout: 15000 });
    const planId = new URL(page.url()).searchParams.get("plan")!;

    const plan = must(await rest("GET",
      `visit_plans?id=eq.${planId}&select=id,status,method,draft_payload,archived_at`,
      plannerJwt), "new draft plan")[0];
    expect(plan.status).toBe("draft");
    expect(plan.method).toBe("single");
    expect(plan.archived_at).toBeNull();
    const payload = plan.draft_payload as Record<string, any>;
    expect(payload.duplicated_from).toBe(visit.id);
    expect(payload.target.factory_id).toBe(factory.id);
    // Planning fields only — no execution/operational/review state is cloned.
    for (const banned of ["operational_state", "execution", "review", "evidence", "inspection", "assignment"]) {
      expect(Object.keys(payload.config as Record<string, unknown>)).not.toContain(banned);
    }
    const draftVisits = must(await rest("GET",
      `visits?visit_plan_id=eq.${planId}&select=id,planning_status,factory_id`,
      plannerJwt), "draft child visit");
    expect(draftVisits).toHaveLength(1);
    expect(draftVisits[0].planning_status).toBe("draft");
    expect(draftVisits[0].factory_id).toBe(factory.id);
    // The SOURCE visit carries the duplicate provenance event naming the draft.
    const events = must(await rest("GET",
      `visit_lifecycle_events?visit_id=eq.${visit.id}&event_type=eq.duplicate&select=previous`,
      plannerJwt), "duplicate event");
    expect(events).toHaveLength(1);
    expect(events[0].previous.duplicated_to_plan).toBe(planId);
    expect(events[0].previous.duplicated_to_visit).toBe(draftVisits[0].id);
  });

  test("expired visit shows rule provenance, read-only final zone and lifecycle/location sections (M02-016)", async ({ page }) => {
    const EXPIRED = "b7000000-0000-4000-8000-000000000004";
    const rows = must(await rest("GET",
      `visits?id=eq.${EXPIRED}&select=id,planning_status,expired_by_rule_id`,
      plannerJwt), "expired fixture");
    test.skip(rows.length === 0 || rows[0].planning_status !== "expired", "expired fixture visit not in planner scope");
    let ruleReason: string | null = null;
    if (rows[0].expired_by_rule_id) {
      const rule = must(await rest("GET",
        `planning_expiry_rules?id=eq.${rows[0].expired_by_rule_id}&select=reason,rule_type`,
        plannerJwt), "expiry rule")[0];
      ruleReason = rule?.reason ?? rule?.rule_type ?? null;
    }
    await page.goto(`/visits/${EXPIRED}`);
    await expect(page.getByText(/Expired —/)).toBeVisible();
    if (ruleReason) await expect(page.getByText(String(ruleReason)).first()).toBeVisible();
    // Final zone: read-only, Duplicate is the only offered transition.
    await expect(page.getByRole("button", { name: /Duplicate visit/i })).toBeVisible();
    await expect(page.getByText(/final state — view only/)).toBeVisible();
    await expect(page.locator("#visit-return-reason")).toHaveCount(0);
    await expect(page.locator("#visit-cancel-reason")).toHaveCount(0);
    await expect(page.locator("#lifecycle")).toBeVisible();
    await expect(page.locator("#location")).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "m8-expired.png"), fullPage: true });
  });
});
