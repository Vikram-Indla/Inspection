import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

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
  const rowCheckbox = page.locator('table.ax-table tbody tr td input[type="checkbox"]').first();
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
    const preview = page.locator('table.ax-table tbody tr td button[aria-label^="Show visit"]').first();
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
    const actions = SRC("src/app/visits/actions.ts");
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
    const board = SRC("src/app/visits/VisitsBoard.tsx");
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
    for (const p of ["src/app/visits/page.tsx", "src/app/visits/calendar/page.tsx", "src/app/visits/workload/page.tsx"]) {
      const src = SRC(p);
      // JSX `{error.message}` leaks to the DOM; template `${error.message}` (server-side
      // console.error) does not. Match the former only: `{error.message}` NOT preceded by `$`.
      expect(src, `${p} must not render error.message in JSX`).not.toMatch(/[^$]\{error\.message\}/);
      expect(src, `${p} must log the provider error server-side`).toContain("console.error");
      expect(src, `${p} must show neutral load-error copy`).toMatch(/loadErrorNeutral/);
    }
  });

  test("expiry refresh failures are observable without changing the rendered state contract", () => {
    for (const p of ["src/app/visits/page.tsx", "src/app/visits/calendar/page.tsx", "src/app/visits/workload/page.tsx"]) {
      const src = SRC(p);
      expect(src, `${p} must inspect expiry RPC failures`).toContain("const { error: expiryError } = await sb.rpc(\"expire_lapsed_visits\")");
      expect(src, `${p} must log expiry failures server-side`).toContain("expiry refresh failed");
    }
  });

  test("the Map lens uses the delivered governed route", () => {
    const page = SRC("src/app/visits/page.tsx");
    expect(page).toContain('href="/visits/map"');
    const mapRoute = readFileSync(join(process.cwd(), "src/app/visits/map/page.tsx"), "utf8");
    expect(mapRoute).toContain('from("geo_events")');
    expect(mapRoute).toContain("official_lat");
  });
});
