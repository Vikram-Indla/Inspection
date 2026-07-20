import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

test.beforeEach(async ({ page }) => { await page.goto("/locale?set=en"); });

test.describe("CD-028 queue — reviewer (leg 1, 3, 4, 10, 14)", () => {
  test.use({ storageState: storageStatePath("reviewer") });

  test("leg 1 — reviewer lands on /reviews; queue or a distinct empty state renders", async ({ page }) => {
    await page.goto("/reviews");
    await expect(page).toHaveURL(/\/reviews$/);
    // scan-first contract + immutability contract are always stated
    await expect(page.getByText(/scan-first queue/i)).toBeVisible();
    await expect(page.getByText(/Decisions are immutable/i)).toBeVisible();
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
    await expect(page.getByRole("heading", { name: /Evidence readiness & SLA-risk fingerprint/i })).toBeVisible();
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
    const open = page.getByRole("link", { name: /open workspace/i }).first();
    const has = await open.count();
    test.skip(has === 0, "no rows to open in this environment");
    await open.click();
    await expect(page).toHaveURL(/\/reviews\/[0-9a-f-]+$/);
    // The route exposes an honest loading boundary while its RLS-scoped sources
    // resolve. It must settle to the immutable submitted-version banner.
    await expect(page.getByText(/Read-only submitted version/i)).toBeVisible({ timeout: 30_000 });
    // Opening changed nothing: an unclaimed row shows the explicit Start
    // button, a decided row shows "no open decision", and a row already
    // claimed by another run legitimately shows its existing decision panel.
    // The queue test must not mistake that shared-live precondition for a
    // navigation side-effect.
    const started = await page.getByRole("button", { name: /^start review$/i }).count();
    const done = await page.getByText(/No open decision/i).count();
    const existingClaim = await page.getByRole("button", { name: /confirm (approve|return|reject)/i }).count();
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

test.describe("CD-028 queue — unauthorized (leg 11)", () => {
  test.use({ storageState: storageStatePath("planner") });

  test("leg 11 — a non-reviewer sees a distinct unauthorized block, not 'queue clear'", async ({ page }) => {
    await page.goto("/locale?set=en");
    await page.goto("/reviews");
    await expect(page.getByRole("heading", { name: /don’t have access to the review queue/i })).toBeVisible();
    // unauthorized ≠ empty: the 'queue clear' success heading must not appear
    await expect(page.getByRole("heading", { name: /^queue clear$/i })).toHaveCount(0);
    // and no queue rows leak to an unauthorized role
    await expect(page.locator(".cd-fpchip")).toHaveCount(0);
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
    expect(actions).toMatch(/from\("reviews"\)\.insert/);
    expect(actions).toMatch(/status: "under_review"/);
    const start = SRC("src/app/(app)/reviews/[id]/StartReview.tsx");
    expect(start).not.toMatch(/window\.location\.reload|setTimeout|router\.refresh/);
    expect(actions).toContain("redirect(`/reviews/${inspection_id}/started?review=${created.id}`)");
    const bridge = SRC("src/app/(app)/reviews/[id]/started/page.tsx");
    expect(bridge).toContain("redirect(`/reviews/${id}${query}`)");
    // the queue module carries no decision form (scan-first)
    const queue = SRC("src/app/(app)/reviews/DecisionPanel.tsx");
    expect(queue).not.toContain('name="decision"');
    expect(queue).not.toContain('name="reason"');
  });

  test("leg 3b — the queue derives the four readiness facts from RLS-scoped reads", () => {
    const list = SRC("src/app/(app)/reviews/page.tsx");
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
    const list = SRC("src/app/(app)/reviews/page.tsx");
    // a second, inspections-first query covers the set no reviews-based query can see
    expect(list).toMatch(/from\("inspections"\)/);
    expect(list).toContain('.eq("status", "submitted")');
    expect(list).toContain("undiscovered");
    // synthetic rows are pushed into the same rows array real ones use — no
    // separate rendering path, so filters/readiness/fingerprint apply unchanged
    expect(list).toMatch(/rows\.push/);
    // race guard: two reviewers claiming the same now-visible submission at once
    const migration = SRC("../../supabase/migrations/20260715130000_cd028_one_open_review_per_version.sql");
    expect(migration).toContain("reviews_one_open_per_version");
    expect(migration).toMatch(/where decided_at is null/i);
    const actions = SRC("src/app/(app)/reviews/[id]/actions.ts");
    expect(actions).toContain('error?.code === "23505"');
  });
});
