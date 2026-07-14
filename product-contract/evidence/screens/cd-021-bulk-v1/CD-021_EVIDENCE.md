# CD-021 Bulk Targeting (SCR-WEB-110 · /planning/bulk) — evidence

Branch `feat/cd-021-bulk-targeting` · uncommitted · nothing merged. Sponsor
directed implementation (this session); Codex/backend wiring review NOT yet
recorded (open). Increments 1–6 done. Increment 5: visit configuration and
manual inspector assignment (M01-029) relocated to a dedicated P02 review route
`/planning/bulk/review` (SCR-WEB-120); the targeting screen (110) hands off the
sessionStorage-held selection via a gated "Review & continue" link; review
publishes via the same atomic publishBulkPlan.

## Requirements / acceptance touched
- M01-003/012/022 nested AND/OR criteria · M01-004 all-matching returned
- M02-012 duplicate flag · FND-011 non-color-only status · FND-013 freshness
- P03 partial-publish-prohibited (atomic publish) · DSG-016 · DSG-A11Y-001

## Functional evidence (not screenshots alone)

### Playwright — apps/web/e2e/cd-021-bulk-targeting.spec.ts
15/15 PASS against a fresh local production build (port 3999, no server reuse),
planner storageState. Covers: criteria tree render + ALL/ANY controls;
criteria narrowing (risk_band=high → exactly 10 eligible of 59, ledger
eligible/excluded); legacy cf/co/cv backward-compat; provenance + data-quality
columns; glyph-bearing status lozenges (FND-011); select-all-results vs
select-this-page distinct + Review CTA gated on selection (disabled button →
enabled link to /planning/bulk/review); selection persistence across
pagination; selection-invalidation confirm dialog (never silent); P02 review
route renders configuration + assignment + atomic publish; empty selection
routes back to targeting; aria-live status regions; Arabic document-level RTL;
420px no horizontal overflow. Read-only — publish not clicked (avoids live-data
mutation).

### Criteria model unit checks (tsx runtime)
8/8 PASS: nested ALL/ANY, is-not, serialize→parse round-trip, flat-link
backward-compat, garbage `ct` → null (defensive), empty group → match-all.

### Atomic publish proof (P03) — live DB, non-polluting
`publish_bulk_plan` (migration 0026, SECURITY INVOKER) called with a bogus
package_version_id. The plan row inserts first, the visits insert then hits the
package FK, and the WHOLE function rolls back: `visit_plans where method='bulk'`
count 8 → 8 (no orphan plan). This is the exact partial-publish the previous
non-transactional 6-write sequence would have left behind.

Function verified live: 8 args, prosecdef=false (INVOKER → RLS enforced).

## Screenshots (supplementary)
- primary.png — EN desktop, criteria tree + ledger + distributions + table
- ar-rtl.png — Arabic document RTL
- narrow.png — 420px, no horizontal overflow

## Verification gates
typecheck PASS · production build PASS (/planning/bulk) · color-law clean.

## Open / not done
- No governed stale-freshness threshold exists → freshness shows factual
  timestamp/age only; amber-stale classification deferred (not invented).
- Codex wiring review + full regression rerun + AC ledger recompute pending.
- Sponsor runtime acceptance of the two-screen flow pending.
