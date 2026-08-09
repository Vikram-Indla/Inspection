import { test, expect, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { storageStatePath } from "./personas";

// CD-028 / SCR-WEB-300 / P03 — Level 2 Review Queue (scan-first).
// Acceptance: WIRING_MAP_CD-028 legs 1–14. Requirements: M06-005/006/009/013/
// 014/016/030/031, M04-190, FND-003/011, RBAC-011.
// READ-ONLY: this spec never clicks "Start review" or a decision control — both
// mutate live data. Scan-first behaviour, the fingerprint contract, negative
// states, and the two resolved HANDOFF_BLOCKED legs (scan-only-open, readiness
// derivation) are proven by rendered behaviour + deterministic source truth
// (.claude/rules/tests.md — a screenshot alone is not evidence).
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
// Repo-root files (supabase/migrations) resolve by walking up from cwd so the
// spec also works from a scratch certification copy outside the repo tree.
const REPO_FILE = (rel: string) => {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const p = join(dir, rel);
    if (existsSync(p)) return readFileSync(p, "utf8");
    dir = dirname(dir);
  }
  throw new Error(`${rel} not found above ${process.cwd()}`);
};

test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-028 queue — reviewer (leg 1, 3, 4, 10, 14)", () => {
  test.use({ storageState: storageStatePath("reviewer") });

  test("leg 1 — reviewer lands on /reviews; queue or a distinct empty state renders", async ({ page }) => {
    await page.goto("/reviews");
    await expect(page).toHaveURL(/\/reviews$/);
    // scan-first contract + immutability contract are always stated
    // (terminology consolidation: the governed lead is now "Read-only queue";
    // the immutability banner reads "Decisions cannot be changed" — same
    // contract, plain-language copy per the UI-copy engineering-prose pass).
    await expect(page.getByText(/Read-only queue/i)).toBeVisible();
    await expect(page.getByText(/Decisions cannot be changed/i)).toBeVisible();
    // NOT the unauthorized block (reviewer is authorized) — distinct from leg-11
    await expect(page.getByText(/don’t have access to the review queue/i)).toHaveCount(0);
  });

  test("leg 10 — the queue renders NO decision controls (scan-first)", async ({ page }) => {
    await page.goto("/reviews");
    // no approve/return/reject radios, no reason box, no 'record decision' on the list
    await expect(page.locator('input[name="decision"]')).toHaveCount(0);
    await expect(page.locator('textarea[name="reason"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: /record decision|confirm (approve|return|reject)/i })).toHaveCount(0);
  });

  test("leg 3 — fingerprint shows labelled facts, never colour-only (FND-011)", async ({ page }) => {
    await page.goto("/reviews");
    const empty = await page.getByRole("heading", { name: /queue clear/i }).count();
    test.skip(empty > 0, "queue empty in this environment — fingerprint has no rows to assert");
    // labelled facts: the fingerprint legend + per-row fact labels carry meaning
    // (terminology consolidation: the governed heading is now "Review readiness").
    await expect(page.getByRole("heading", { name: /Review readiness/i })).toBeVisible();
    await expect(page.locator(".cd-fpchip").first()).toBeVisible();
    // each fact chip reads "Label: value" — text, not colour alone
    await expect(page.locator(".cd-fpchip", { hasText: /Checklist:|Evidence:|Acknowledgement:|Factory verify:|SLA:/ }).first()).toBeVisible();
  });

  test("leg 4 — search + no-match empty state (M06-014/030)", async ({ page }) => {
    await page.goto("/reviews");
    const empty = await page.getByRole("heading", { name: /queue clear/i }).count();
    test.skip(empty > 0, "queue empty — no rows to filter");
    const search = page.getByRole("textbox", { name: /search the review queue/i });
    await search.fill("zzz-nonexistent-factory-xyz");
    await expect(page.getByRole("heading", { name: /No reviews match the filters/i })).toBeVisible();
  });

  test("leg 5 — opening a review is read-only: no decision panel appears on open", async ({ page }) => {
    await page.goto("/reviews");
    const open = page.getByRole("link", { name: /open review/i }).first();
    const has = await open.count();
    test.skip(has === 0, "no rows to open in this environment");
    await open.click();
    await expect(page).toHaveURL(/\/reviews\/[0-9a-f-]+$/);
    // The route exposes an honest loading boundary while its RLS-scoped sources
    // resolve. It must settle to the immutable submitted-version banner.
    await expect(page.getByText(/Read-only submitted version/i)).toBeVisible({ timeout: 30_000 });
    // Opening changed nothing: an unclaimed row shows the explicit Start
    // button, a decided row shows "no open decision", and a row already
    // claimed by another run legitimately shows its existing decision panel
    // (the radiogroup renders immediately; the confirm button only appears
    // after a decision is chosen, so the panel is detected by its inputs).
    // The queue test must not mistake that shared-live precondition for a
    // navigation side-effect.
    const started = await page.getByRole("button", { name: /^start review$/i }).count();
    const done = await page.getByText(/No open decision/i).count();
    const existingClaim = await page.locator('input[name="decision"]').count();
    expect(started + done + existingClaim).toBeGreaterThan(0);
    if (existingClaim > 0) await expect(page.getByText(/under review/i).first()).toBeVisible();
  });

  test("leg 14 — Arabic/RTL parity: the queue renders under dir=rtl", async ({ page }) => {
    await page.goto("/locale?set=ar");
    await page.goto("/reviews");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    // scan-first contract still present (string falls back to EN until seeded)
    await expect(page.locator("body")).toContainText(/reviews|مراجعة/i);
  });
});

test.describe("CD-028 queue — access boundary (leg 11)", () => {
  test.use({ storageState: storageStatePath("inspector") });

  // Governed gate (RBAC-011, unchanged from the pre-rebuild baseline):
  // supervisor/admin/planner see the coordinated queue and inspectors pass the
  // gate but remain limited by RLS to their own assignments. Every seeded
  // persona holds an allowed role, so the unauthorized branch is proven by
  // deterministic source truth while the inspector run proves the gate's
  // runtime shape for the most-restricted allowed role.
  test("leg 11 — inspector passes the governed gate RLS-limited; no decision controls leak", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/reviews");
    await expect(page.getByText(/Read-only queue/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /don’t have access to the review queue/i })).toHaveCount(0);
    await expect(page.locator('input[name="decision"]')).toHaveCount(0);
    await expect(page.locator('textarea[name="reason"]')).toHaveCount(0);
  });

  test("leg 11b — a role outside the gate gets the distinct unauthorized block, never 'queue clear' (source truth)", () => {
    const access = SRC("src/features/reviews/access.ts");
    // the allow-list is exactly the governed set — no extra role can slip in
    expect(access).toContain('const QUEUE_ROLES = ["supervisor", "admin", "planner", "inspector"]');
    expect(access).toContain("export function hasQueueAccess");
    const route = SRC("src/app/(app)/reviews/page.tsx");
    // fail-closed ordering: the unauthorized branch returns before any queue
    // data is loaded, so nothing can leak to a denied role
    expect(route).toContain("if (!hasQueueAccess(roleRows))");
    expect(route.indexOf("QueueUnauthorized")).toBeGreaterThan(-1);
    expect(route.indexOf("<QueueUnauthorized />")).toBeLessThan(route.indexOf("loadReviewQueue(sb)"));
    const unauth = SRC("src/app/(app)/reviews/QueueUnauthorized.tsx");
    // unauthorized ≠ empty: the block is a distinct alert, not 'queue clear',
    // and renders no queue rows or fingerprint chips
    expect(unauth).toContain("don’t have access to the review queue");
    expect(unauth).toContain('role="alert"');
    expect(unauth).not.toMatch(/queue clear/i);
    expect(unauth).not.toContain("ReviewQueue");
    expect(unauth).not.toContain("cd-fpchip");
  });
});

// Deterministic source truth for the two resolved HANDOFF_BLOCKED legs. These
// are wiring facts the runtime cannot mutate away, asserted without touching
// live data.
test.describe("CD-028 resolved backend legs — source truth", () => {
  test("leg 5/10 — opening /reviews/:id no longer mutates on render; start is explicit", () => {
    const ws = SRC("src/app/(app)/reviews/[id]/page.tsx");
    // render no longer inserts a review or transitions the inspection
    expect(ws).not.toMatch(/from\("reviews"\)\s*\.insert/);
    expect(ws).toContain("opening is read-only");
    expect(ws).toContain("StartReview");
    const actions = SRC("src/app/(app)/reviews/[id]/actions.ts");
    expect(actions).toContain("export async function startReview");
    // the review-create + under_review transition now lives in one canonical
    // maker-checked transaction: the start_review RPC. The server action never
    // inserts directly — it calls the RPC that owns the locks and rollback.
    expect(actions).not.toMatch(/from\("reviews"\)\s*\.insert/);
    expect(actions).toContain('sb.rpc("start_review"');
    const rpc = REPO_FILE("supabase/migrations/20260729004841_execution_supervisor_review_authority.sql");
    expect(rpc).toContain("create or replace function public.start_review(");
    expect(rpc).toContain("insert into public.reviews(");
    expect(rpc).toMatch(/set status = 'under_review'/);
    const start = SRC("src/app/(app)/reviews/[id]/StartReview.tsx");
    expect(start).not.toMatch(/window\.location\.reload|setTimeout|router\.refresh/);
    expect(actions).toContain("redirect(`/reviews/${inspection_id}/started?review=${created}`)");
    const bridge = SRC("src/app/(app)/reviews/[id]/started/page.tsx");
    expect(bridge).toContain("redirect(`/reviews/${id}${query}`)");
    // the queue modules carry no decision form (scan-first)
    for (const file of ["src/app/(app)/reviews/QueueScreen.tsx", "src/app/(app)/reviews/ReviewQueue.tsx"]) {
      const queue = SRC(file);
      expect(queue).not.toContain('name="decision"');
      expect(queue).not.toContain('name="reason"');
    }
  });

  test("leg 3b — the queue derives the four readiness facts from RLS-scoped reads", () => {
    const list = SRC("src/features/reviews/queries.ts");
    // readiness sources are actually joined / queried
    expect(list).toContain("acknowledgement");
    expect(list).toContain("evidence(id)");
    expect(list).toContain("snapshot");
    expect(list).toContain("inspection_factory_checks");
    // and each fact can be "unavailable" — never a fabricated ready result
    expect(list).toMatch(/unavailable/);
    expect(list).toContain("readinessFor");
  });

  test("discoverability fix — the queue surfaces submitted inspections with no reviews row yet", () => {
    const list = SRC("src/features/reviews/queries.ts");
    // a second, inspections-first query covers the set no reviews-based query can see
    expect(list).toMatch(/from\("inspections"\)/);
    expect(list).toContain('.eq("status", "submitted")');
    expect(list).toContain("undiscovered");
    // synthetic rows are pushed into the same rows array real ones use — no
    // separate rendering path, so filters/readiness/fingerprint apply unchanged
    expect(list).toMatch(/rows\.push/);
    // race guard: two reviewers claiming the same now-visible submission at once
    const migration = REPO_FILE("supabase/migrations/20260715130000_cd028_one_open_review_per_version.sql");
    expect(migration).toContain("reviews_one_open_per_version");
    expect(migration).toMatch(/where decided_at is null/i);
    const actions = SRC("src/app/(app)/reviews/[id]/actions.ts");
    expect(actions).toContain('error?.code === "23505"');
  });
});
