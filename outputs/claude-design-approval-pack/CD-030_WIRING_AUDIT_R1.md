# CD-030 Wiring Audit R1 — SCR-WEB-320 Version Comparison

**Scope:** `/reviews/:id` route-neutral compare mode · P11 · Reviewer/Auditor.
**Slice:** `apps/web/src/app/reviews/[id]/VersionCompare.tsx` (new),
`page.tsx` (compare data + strings; dead inline-diff removed),
`apps/web/e2e/cd-030-version-comparison.spec.ts` (new).

## DEC-012 status
This is the **implementer's self-verification**, not the independent audit.
DEC-012 requires an **independent recorded wiring audit** per implemented CD
slice; implementation/self-review is not a substitute. The independent Codex
audit across all 17 legs is **PENDING** and must run before this slice is marked
contract-complete. Legs below carry the self-verified evidence to be checked.

## Verification performed
- `tsc --noEmit` — clean.
- `next build` (production) — clean; `/reviews/[id]` compiled.
- Color-law scan on both changed files — CLEAN (tokens/glyphs only; no bare colors).
- Playwright `cd-030-version-comparison.spec.ts` — 11 passed, 0 failed, 2 skipped.
  Skips are the multi-version / tampered-diff cases the seeded environment cannot
  drive (all seeded review inspections are single-version, no-prior). Those legs
  are instead pinned deterministically by the source-truth tests (classification
  authority, unavailable≠unchanged, no accept/merge).

## Per-leg self-verification (WIRING_MAP_CD-030.csv)

| leg | intent | status | self-verified evidence |
|-----|--------|--------|------------------------|
| 1 | Open compare | PASS | route-neutral inside `/reviews/:id`; e2e leg 1/11 |
| 2 | Version from/to selection | PASS | `#cmp-from`/`#cmp-to` selectors; default latest vs prior; e2e leg 3/17 (skips no-prior) |
| 3 | Stored-answer diff | PASS | union-of-keys over `snapshot.answers`; `VersionCompare` `rows` memo |
| 4 | Returned-scope read | PASS | `reviews.returned_sections` from last decided return; authority stated always; e2e leg 4 |
| 5 | Scope classification | PASS | `returnedScope.includes(sect.key) ? expected : unexpected`; e2e source-truth |
| 6 | Unexpected locked change | PASS | out-of-scope change → `unexpected` + role=alert tamper banner |
| 7 | Evidence/media comparison | HANDOFF_BLOCKED_MEDIADIFF | UnavailablePanel; e2e legs 7/8/9 |
| 8 | Package semantics | HANDOFF_BLOCKED_PKGSEMANTIC | UnavailablePanel |
| 9 | Metadata/section order | HANDOFF_BLOCKED_METADIFF | UnavailablePanel |
| 10 | Audit read | PASS | existing `audit_events` timeline (unchanged) |
| 11 | Route reconciliation | PASS (pending CC) | consolidated; **CC-CD030-ROUTE-001** required for contract |
| 12 | Navigate to changed answer | PASS | rail row → `scrollIntoView` + focus; navigation-only |
| 13 | No prior version | PASS | `fromN===undefined` → no-prior banner (role=status); not fabricated |
| 14 | Empty diff | PASS | identical snapshots → computed-empty banner, not a failure |
| 15 | Degraded source | HANDOFF_BLOCKED_LINKED | unknown/unscoped change → `unavailable`, never `unchanged` |
| 16 | Stale / unauth / auditor | PARTIAL | RLS + read-only navigation covers auditor/unauthorized; **stale is not independently detectable without a freshness signal — not invented** |
| 17 | Arabic/theme/responsive/keyboard/SR | PASS | disclosure buttons (aria-expanded), role=status/alert, RTL; e2e RTL |

## Held / not implemented (need separate decisions)
- `HANDOFF_BLOCKED_ACCEPT` — no accept/merge control shipped (see CC-CD030-ROUTE-001).
- `HANDOFF_BLOCKED_START_REVIEW_ATOMIC` / `HANDOFF_BLOCKED_ATOMIC` — inherited from
  CD-029; neither hidden nor resolved here.
- Leg 16 **stale** — a freshness threshold would be invented policy; left to the
  independent audit / a decision, surfaced honestly as not-detected rather than
  claimed on-time.

## Baseline
BASELINE_REVERIFY_REQUIRED honored: `/reviews/[id]` sources were re-read this
session on `feat/cd-026-visit-management`; no exact-baseline equivalence claimed.
No commit/push/merge/main/migration/data mutation performed by this slice.
