import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { PERSONAS, storageStatePath } from "./personas";
import { login, rest, must } from "./live-rest";

// CD-026 / SCR-WEB-200 / P03 — Visit Management Workspace (Track 1: approved
// visual/UI; blocked legs represented as unavailable, never faked).
// Acceptance: DSG-021, DSG-A11Y-001, DSG-CODE-001 / DEC-012 wiring.
// Requirements: M02-002/003/004/006/007/008/011/016/020/021/031/032/033/034,
// FND-002 (dual state machines), FND-004 (notification queued-not-delivered).
//
// Runtime assertions are READ-ONLY: bulk verbs mutate live data, so no bulk
// SUBMIT is ever clicked. Row selection and the continuity spine are pure
// client state and safe to exercise. The per-item outcome ledger, neutralised
// errors and preserved guards are proven at the code layer (matches the
// CD-025 read-only + wiring-proof convention, .claude/rules/tests.md).
const EVIDENCE_DIR = evidenceDirectory("cd-026-visit-management-v1");
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.use({ storageState: storageStatePath("planner") });

test.beforeAll(() => { mkdirSync(EVIDENCE_DIR, { recursive: true }); });
test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

// Reveal the bulk bar by selecting the first visible row checkbox (client-only,
// no server mutation). Returns false when the scope is empty.
async function selectFirstRow(page: Page): Promise<boolean> {
  const rowCheckbox = page.locator('table.sq-table tbody tr td input[type="checkbox"]').first();
  if (await rowCheckbox.count() === 0) return false;
  await rowCheckbox.check();
  return true;
}

test.describe("CD-026 workspace shell + continuity spine (DSG-021)", () => {
  test("mounts the selected-visit spine, KPI status tiles, lens switcher and RLS scope", async ({ page }) => {
    await page.goto("/visits");
    // Signature pattern present and honest about its empty state.
    await expect(page.getByText(/Select a visit to see its identity/i)).toBeVisible();
    // KPI status tiles (M02-002) and both independent state columns exist.
    await expect(page.getByRole("group", { name: /Status counts/i })).toBeVisible();
    // Lens switcher — List/Calendar/Workload/Map are governed routes.
    await expect(page.getByRole("link", { name: /^Calendar$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Workload$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Map$/i })).toHaveAttribute("href", "/visits/map");
    // Scope truth: RLS-scoped loaded-vs-total.
    await expect(page.getByText(/RLS-scoped — showing \d+ of \d+/i)).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "primary.png"), fullPage: true });
  });

  test("selecting a visit populates the continuity spine with its identity + allowed-action context", async ({ page }) => {
    await page.goto("/visits");
    const preview = page.locator('table.sq-table tbody tr td button[aria-label^="Show visit"]').first();
    test.skip(await preview.count() === 0, "no visits in planner scope to preview");
    await preview.click();
    await expect(preview).toHaveAttribute("aria-pressed", "true");
    const spine = page.getByRole("region", { name: /Selected visit/i });
    // Allowed-action boundary is one of the four truthful states (FND-002).
    await expect(spine.getByText(/Editable — published|Locked — inspection started|Final — no further changes|Expired — read-only/i)).toBeVisible();
    await expect(spine.getByText(/Window:/i)).toBeVisible();
    await expect(spine.getByRole("link", { name: /Open full detail/i })).toBeVisible();
  });
});

test.describe("CD-026 bulk eligibility preview (M02-006/007/008)", () => {
  test("selecting rows shows verified-now eligibility that is re-checked at submit", async ({ page }) => {
    await page.goto("/visits");
    const selected = await selectFirstRow(page);
    test.skip(!selected, "no visits in planner scope to select");
    await expect(page.getByText(/Eligibility preview/i)).toBeVisible();
    await expect(page.getByText(/Verified now — each item is re-checked on the server at submit/i)).toBeVisible();
    await expect(page.getByText(/\d+ of \d+ eligible/i).first()).toBeVisible();
    await page.screenshot({ path: join(EVIDENCE_DIR, "eligibility-preview.png"), fullPage: true });
  });
});

test.describe("CD-026 a11y / RTL / responsive (DSG-A11Y-001)", () => {
  test("Arabic renders document-level RTL with localized copy from ui_strings (not the EN fallback)", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/visits");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // Localized copy proves the CD-026 AR ui_strings seed is live — not the
    // English fallback baked into page.tsx. The server dict is a 30s module
    // cache (src/lib/i18n.ts TTL_MS), so a just-warmed process can serve a
    // pre-seed snapshot briefly; reload across one full TTL window so the
    // assertion reflects the live seed deterministically, not cache timing.
    const heading = page.getByText("الزيارة المحددة"); // visit.spine.heading
    await expect(async () => {
      if (await heading.count() === 0) { await page.reload(); }
      await expect(heading).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 40_000 });
    await expect(page.getByText(/حدّد زيارة لعرض هويتها/)).toBeVisible(); // visit.spine.empty
    await expect(page.getByRole("link", { name: "خريطة" })).toHaveAttribute("href", "/visits/map");
    await page.screenshot({ path: join(EVIDENCE_DIR, "ar-rtl.png"), fullPage: true });
    await page.goto("/locale?set=en");
  });

  test("narrow viewport (412) has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 900 });
    await page.goto("/visits");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: join(EVIDENCE_DIR, "narrow-412.png"), fullPage: true });
  });
});

// DSG-CODE-001 / DEC-012 — code-layer proof of the Track 1 corrections that
// cannot be exercised read-only (they require mutating live data).
test.describe("CD-026 wiring proof (DSG-CODE-001)", () => {
  test("actions return a structured per-item ledger and never surface raw provider text", () => {
    const actions = SRC("src/app/(app)/visits/actions.ts");
    // Structured per-item outcome array (id + outcome enum), not a string banner.
    expect(actions).toContain("export type ItemResult = { id: string; outcome: OutcomeCode };");
    expect(actions).toContain("items: ItemResult[]");
    // Raw errors are logged server-side and mapped to a neutral code — never returned.
    expect(actions).toContain("function logProvider");
    expect(actions).toContain('items.push({ id, outcome: "error" })');
    expect(actions).not.toContain("lines.push(`${short(id)} — ${error.message}`)");
    // The distinct mutation-applied / notification-not-queued outcome (FND-004).
    expect(actions).toContain('outcome: "applied_no_notification"');
    // Per-item guards preserved verbatim (published+new; pre-start lock).
    expect(actions).toContain('.eq("planning_status", "published").eq("operational_state", "new")');
    expect(actions).toContain('ins.status !== "not_started"');
  });

  test("the board renders a per-item ledger, never a green banner for a mixed result", () => {
    const board = SRC("src/app/(app)/visits/VisitsBoard.tsx");
    // Partial/failed → single role=alert; all-applied → role=status. No blanket success banner.
    expect(board).toContain('role={anyProblem ? "alert" : "status"}');
    expect(board).toContain("const anyProblem = nBlocked > 0 || nNoNotif > 0");
    // Success is never signalled optimistically while the action is pending.
    expect(board).toContain("no optimistic success");
    // Focus moves to the outcome summary after a completed submit (S38).
    expect(board).toContain("summaryRef.current?.focus()");
    // Cross-Plan bulk edit is disabled (HANDOFF_BLOCKED_GUARD), not faked as safe.
    expect(board).toContain("disabled={busy || !elig.samePlan}");
    // The Selected Visit Continuity Spine signature pattern exists.
    expect(board).toContain("Selected Visit Continuity Spine");
  });

  test("no visits route leaks a raw provider error — load-error banners are neutralised (query-degraded)", () => {
    // DEC-012 CODEX_AUDIT_CD-026 F1/F2 regression guard: page/calendar/workload
    // load-error branches must NOT interpolate error.message into the DOM; the raw
    // provider text is logged server-side only.
    for (const p of ["src/app/(app)/visits/page.tsx", "src/app/(app)/visits/calendar/page.tsx", "src/app/(app)/visits/workload/page.tsx"]) {
      const src = SRC(p);
      // JSX `{error.message}` leaks to the DOM; template `${error.message}` (server-side
      // console.error) does not. Match the former only: `{error.message}` NOT preceded by `$`.
      expect(src, `${p} must not render error.message in JSX`).not.toMatch(/[^$]\{error\.message\}/);
      expect(src, `${p} must log the provider error server-side`).toContain("console.error");
      expect(src, `${p} must show neutral load-error copy`).toMatch(/loadErrorNeutral/);
    }
  });

  test("expiry is owned by the pg_cron sweep, not a per-request RPC (K-009)", () => {
    // Perf Phase 3 (K-009): the synchronous expire_lapsed_visits RPC ran on every
    // visits page load and serialised those loads behind a write. M02-016 expiry is
    // already owned by the pg_cron sweep expire_lapsed_visits_scheduled
    // (supabase/migrations/0025_scheduled_visit_expiry.sql, 15-min cadence), so the
    // per-request RPC was removed. This contract now proves the new ownership shape:
    // pages document the cron owner and must not re-introduce the inline RPC.
    for (const p of ["src/app/(app)/visits/page.tsx", "src/app/(app)/visits/calendar/page.tsx", "src/app/(app)/visits/workload/page.tsx"]) {
      const src = SRC(p);
      expect(src, `${p} must document the cron-owned expiry sweep`).toContain("expire_lapsed_visits_scheduled");
      expect(src, `${p} must not call the expiry RPC per request`).not.toContain('rpc("expire_lapsed_visits")');
    }
    // The sweep itself must exist, be scheduled, and not be callable by clients.
    const migration = readFileSync(join(process.cwd(), "..", "..", "supabase", "migrations", "0025_scheduled_visit_expiry.sql"), "utf8");
    expect(migration).toContain("create or replace function expire_lapsed_visits_scheduled()");
    expect(migration).toContain("revoke all on function expire_lapsed_visits_scheduled() from public, authenticated");
  });

  test("the Map lens uses the delivered governed route", () => {
    const page = SRC("src/app/(app)/visits/page.tsx");
    expect(page).toContain('href="/visits/map"');
    const mapRoute = readFileSync(join(process.cwd(), "src/app/(app)/visits/map/page.tsx"), "utf8");
    expect(mapRoute).toContain('from("geo_events")');
    expect(mapRoute).toContain("official_lat");
  });
});

// ---------------------------------------------------------------------------
// M8 — governed bulk cancel (PLN-CON-011), Discard draft (PLN-CON-018) and
// the /visits ↔ /planning reconciliation links (canonical §5/§6). Fixtures
// are staged over PostgREST with the planner's own JWT so RLS stays the
// enforcement; the mutations under test go through the real UI.
test.describe("M8 — governed bulk cancel, discard draft, cross-links", () => {
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

  // Throwaway factory (one per visit — publish marks a factory forever) +
  // draft single plan + draft visit PATCHed to published (the proven
  // offline-drill pattern). The board pages window_start ASC capped at 1000;
  // staging already carries far-future leftovers out to year 2381, so a
  // +6000..18000d window (≈2042–2075) ranks comfortably inside the first
  // page while the single staging Inspector stays un-bookable.
  async function stagePublishedVisit(runTag: string, i: number) {
    const factory = must(await rest("POST", "factories", plannerJwt, {
      factory_code: `CD026-M8-${runTag}-${i}`, name: `CD026 M8 ${runTag} ${i}`,
      cr_number: `CR-M826-${runTag}-${i}`, region: "Riyadh", city: "Riyadh",
      official_lat: 24.72 + i / 100, official_lng: 46.69 + i / 100,
    }), `factory ${i}`)[0];
    const plan = must(await rest("POST", "visit_plans", plannerJwt, {
      method: "single", status: "draft", created_by: plannerUserId,
    }), `plan ${i}`)[0];
    const dayOffset = 6000 + Math.floor(Math.random() * 12000);
    const visit = must(await rest("POST", "visits", plannerJwt, {
      visit_plan_id: plan.id, factory_id: factory.id, visit_type: "periodic",
      execution_mode: "physical", planning_status: "draft",
      window_start: new Date(Date.now() + dayOffset * 86400e3).toISOString(),
      window_end: new Date(Date.now() + dayOffset * 86400e3 + 4 * 36e5).toISOString(),
      package_version_id: pkgId,
    }), `visit ${i}`)[0];
    must(await rest("PATCH", `visits?id=eq.${visit.id}`, plannerJwt, { planning_status: "published" }), `publish ${i}`);
    return { factory, plan, visit };
  }

  test("bulk cancel applies the governed reason per row and records one cancel event per visit (PLN-CON-011)", async ({ page }) => {
    // ?limit=1000 renders up to 1000 embedded rows server-side; on a cold dev
    // server the first render can exceed the default 60s test budget.
    test.setTimeout(180_000);
    const runTag = `${Date.now()}`;
    const a = await stagePublishedVisit(runTag, 0);
    const b = await stagePublishedVisit(runTag, 1);

    await page.goto("/visits?limit=1000", { waitUntil: "domcontentloaded" });
    await page.getByLabel(/Search visits/).fill(`CD026-M8-${runTag}`, { timeout: 120_000 });
    const cbA = page.getByRole("checkbox", { name: `Select visit ${a.visit.id.slice(0, 8)}` });
    const cbB = page.getByRole("checkbox", { name: `Select visit ${b.visit.id.slice(0, 8)}` });
    await expect(cbA).toBeVisible();
    await cbA.check();
    await cbB.check();
    await page.locator("#bulk-cancel-reason").selectOption("safety_risk");
    await page.locator("#bulk-cancel-comments").fill("M8 bulk cancel");
    await page.locator("form", { has: page.locator("#bulk-cancel-reason") }).locator("button").click();
    // Per-item ledger: both rows applied — never a single mixed banner.
    await expect(page.getByText("2 applied")).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: join(EVIDENCE_DIR, "m8-bulk-cancel-ledger.png"), fullPage: true });

    for (const v of [a.visit, b.visit]) {
      const row = must(await rest("GET", `visits?id=eq.${v.id}&select=planning_status,cancellation_reason`, plannerJwt), "cancelled row")[0];
      expect(row.planning_status).toBe("cancelled");
      expect(row.cancellation_reason).toBe("safety_risk");
      const ev = must(await rest("GET",
        `visit_lifecycle_events?visit_id=eq.${v.id}&event_type=eq.cancel&select=reason_key,comments`,
        plannerJwt), "cancel event");
      expect(ev).toHaveLength(1);
      expect(ev[0].reason_key).toBe("safety_risk");
      expect(ev[0].comments).toBe("M8 bulk cancel");
    }
  });

  test("discard retires an own draft plan and removes it from the drafts list (PLN-CON-018)", async ({ page }) => {
    const plan = must(await rest("POST", "visit_plans", plannerJwt, {
      method: "single", status: "draft", created_by: plannerUserId,
    }), "draft plan")[0];
    const ref = plan.plan_reference ?? plan.id.slice(0, 8);

    await page.goto("/planning");
    await page.getByRole("button", { name: `Discard draft ${ref}` }).click();
    // Success returns to /planning and the archived draft leaves the list.
    await expect(page.getByRole("button", { name: `Discard draft ${ref}` })).toHaveCount(0, { timeout: 15000 });
    const row = must(await rest("GET", `visit_plans?id=eq.${plan.id}&select=archived_at,status`, plannerJwt), "archived plan")[0];
    expect(row.status).toBe("draft"); // retired via archived_at — never a status rewrite
    expect(row.archived_at).not.toBeNull();
  });

  test("discard cancels the linked draft child visit with a discard_draft event (PLN-CON-018)", async ({ page }) => {
    const plan = must(await rest("POST", "visit_plans", plannerJwt, {
      method: "single", status: "draft", created_by: plannerUserId,
    }), "draft plan")[0];
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const factory = must(await rest("POST", "factories", plannerJwt, {
      factory_code: `CD026-M8-DSC-${suffix}`, name: `CD026 M8 DSC ${suffix}`,
      cr_number: `CR-M826-DSC-${suffix}`, region: "Riyadh", city: "Riyadh",
      official_lat: 24.73, official_lng: 46.70,
    }), "factory")[0];
    const dayOffset = 6000 + Math.floor(Math.random() * 20000);
    const child = must(await rest("POST", "visits", plannerJwt, {
      visit_plan_id: plan.id, factory_id: factory.id, visit_type: "periodic",
      execution_mode: "physical", planning_status: "draft",
      window_start: new Date(Date.now() + dayOffset * 86400e3).toISOString(),
      window_end: new Date(Date.now() + dayOffset * 86400e3 + 4 * 36e5).toISOString(),
      package_version_id: pkgId,
    }), "draft child")[0];
    const ref = plan.plan_reference ?? plan.id.slice(0, 8);

    await page.goto("/planning");
    await page.getByRole("button", { name: `Discard draft ${ref}` }).click();
    await expect(page.getByRole("button", { name: `Discard draft ${ref}` })).toHaveCount(0, { timeout: 15000 });

    // Canonical §15: Draft cancellation is allowed — the child is cancelled
    // (visits RLS grants no delete) and the provenance event names the plan.
    const row = must(await rest("GET", `visits?id=eq.${child.id}&select=planning_status`, plannerJwt), "child after discard")[0];
    expect(row.planning_status).toBe("cancelled");
    const ev = must(await rest("GET",
      `visit_lifecycle_events?visit_id=eq.${child.id}&event_type=eq.discard_draft&select=comments,previous`,
      plannerJwt), "discard_draft event");
    expect(ev).toHaveLength(1);
    expect(ev[0].previous.plan_id).toBe(plan.id);
    const archived = must(await rest("GET", `visit_plans?id=eq.${plan.id}&select=archived_at`, plannerJwt), "archived plan")[0];
    expect(archived.archived_at).not.toBeNull();
  });

  test("/visits and /planning cross-link in both directions (canonical §5/§6 reconciliation)", async ({ page }) => {
    test.setTimeout(120_000); // dev-server first render of both boards can be slow
    await page.goto("/planning", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /Visit management — bulk actions/i })).toHaveAttribute("href", "/visits", { timeout: 60_000 });
    await page.goto("/visits", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /Planning — drafts and plans/i })).toHaveAttribute("href", "/planning", { timeout: 60_000 });
  });
});
