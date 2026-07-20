import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evidenceDirectory } from "./evidence-path";
import { storageStatePath } from "./personas";

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

  test("republish queues the assigned-inspector notification and surfaces queue failure", () => {
    const a = SRC(`${ID}/actions.ts`);
    expect(a).toMatch(/republishVisit[\s\S]*notifyAssignedInspector\(sb, id, "visit_republished"/);
    expect(a).toMatch(/republishVisit[\s\S]*notification could not be queued/);
  });

  test("guards preserved — published/new + pre-start locks intact", () => {
    const a = SRC(`${ID}/actions.ts`);
    expect(a).toContain("guardPublishedNew");
    expect(a).toContain("guardPreStart");
    expect(a).toContain('planning_status: "cancelled"'); // STM-VIS-002
    expect(a).toContain('planning_status: "returned"');  // STM-VIS-001
  });

  test("append-only audit read is capped at 30 (leg 3)", () => {
    expect(SRC(`${ID}/page.tsx`)).toContain(".limit(30)");
  });

  test("attachments use soft delete + signed URL; registered rows never physically deleted (leg 13)", () => {
    const a = SRC(`${ID}/actions.ts`);
    expect(a).toContain("removed_at");                          // soft delete
    expect(a).not.toMatch(/from\("visit_attachments"\)\s*\.delete\(/); // no hard row delete
    expect(SRC(`${ID}/page.tsx`)).toContain("createSignedUrl");
  });

  test("blocked legs are NOT faked — no invented map/provider/geofence (leg S34 / MAP)", () => {
    const p = SRC(`${ID}/page.tsx`);
    expect(p).not.toMatch(/mapbox|leaflet|google\.maps|geofence_query/i);
  });

  // ── Track 2 closures ────────────────────────────────────────────────────
  test("ERRORMAP — raw provider text never surfaced (legs 1/12/13)", () => {
    const a = SRC(`${ID}/actions.ts`);
    const p = SRC(`${ID}/page.tsx`);
    expect(a).toContain('from "./neutral"');
    expect(a).not.toMatch(/error:\s*error\.message/);   // no raw PostgREST message
    expect(a).not.toMatch(/up\.error\.message/);         // no raw storage message
    expect(p).not.toMatch(/vErr\.message|attErr\.message/);
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
