# WA-P1-M2-BATCH-001 approval evidence

- Task: `TASK-WEB-ADMIN-PHASE1-PLAN-001-M2-BATCH-001`
- Change control: `CC-WEB-ADMIN-PHASE1-001`
- Screens: Planning landing, Visits list, Visit details
- Review routes: `/planning?wa_preview=1`, `/visits?wa_preview=1`, `/visits/:id?wa_preview=1`
- Designs: `WA-DES-036` (`SAQEEL Planning.dc.html`), `WA-DES-045` (`SAQEEL Visits.dc.html`)
- Requirements: `CR-001..CR-098`; acceptance: `WA-M2-AC-001..006`, `WA-AC-0001..0098`
- Migration rows: `WA-MIG-050`, `WA-MIG-067`, `WA-MIG-068`

## Implementation and rollback

The replacement is available only when the server has `SAQEEL_M2_PREVIEW=enabled`
and the request carries `wa_preview=1`. The canonical route without both gates
continues to render the retained implementation. Rollback is immediate: disable
the server flag or omit the preview query. No route, current component, backend
workflow, database object, RLS policy, audit path, or submitted version was
deleted or changed.

The preview reads the existing effective package, drafts, visits, assignments,
inspections, package versions, lifecycle and append-only audit records. Existing
state-guarded planning and visit actions remain the only mutation paths.

## Verification on 2026-07-23

- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- Post-correction focused run: 10/10 PASS (`web-admin-m2-batch-001.spec.ts`
  6/6 plus shared-shell responsive, account, mobile focus-trap and Arabic/theme
  checks 4/4), read-only.
- Covered: server gate, planner capability/RLS, three governed planning methods,
  real draft and visit reads, dual planning/operational states, filters/sorting,
  detail navigation, five-domain lifecycle ribbon, audit/version preservation,
  administrator denial, Arabic RTL, 390-pixel reflow, keyboard semantics, and
  axe accessibility with zero violations.
- Pre-implementation protected baseline (`cd-020`, `cd-026`, `cd-027`): 29/38
  PASS. Nine failures predated the batch: six macOS evidence-directory `EPERM`
  screenshot writes and three live mutation/shared-state assertions. The batch
  did not modify those tests or mutation paths; these are not represented as
  passing.

## Live review

The visible Codex browser was opened with the planner persona and real safe data.
The walkthrough showed the Planning entry and initial load, effective package,
three planning paths, persisted drafts, Visits KPI filters and RLS count, visit
drill-down, independent lifecycle domains, immutable version/report linkage,
append-only audit provenance, and state-guarded action availability. Arabic RTL,
responsive reflow, and administrator denial are covered by the focused runtime
suite and remain available for correction review.

## Visual status and known deviations

The target layouts use the supplied 1440x900 SAQEEL Planning and Visits designs.
Real RLS-scoped values replace design fixtures. The Visits list omits the current
AI summary and continuity spine only in preview because they are absent from the
target reference; both remain in the retained current screen. The detail screen
reuses the already-proven five-domain lifecycle, action and audit surface rather
than replacing it with fixture-only markup. These are declared real-data and
behavior-preservation adaptations and await Product Owner visual approval. No
pixel difference is self-approved.

Product Owner correction during the live review identified the shared left
navigation as a blocking mismatch. The scoped F0 follow-up now follows the
supplied `saqeel web.html` authority: 264-pixel navy rail, 74-pixel collapsed
rail, green square SAQEEL mark, stacked bilingual lockup, compact section labels
and items, emerald active inset, Inspection hierarchy and bottom-pinned collapsed
Administration group. Existing destinations, disabled permission disclosure,
keyboard/drawer behavior and route/RLS enforcement are preserved.
The external authority file is 104,507 bytes with SHA-256
`b870e06820feb5784687dcb62289aa24a0070635cbc7b606157ec2128bab9bc2` and remains
outside Git at the Product Owner-supplied path.

The first broad shell run after the visual correction was 15/18: two failures
were correction-introduced (collapsed Administration visibility expectation and
mobile close-button focus order) and were fixed before the final 10/10 run. The
remaining broad-suite role-matrix expectation predates this correction and
expects seven advanced admin IDs while the current contract supplies thirteen;
neither the navigation definitions nor that baseline assertion was changed.

## Boundaries

No `/field/**`, Inspector iPad, Field PWA, offline execution, provider, migration,
remote DDL, shared data, deployment, push, merge, or canonical cutover work was
performed. The next batch is blocked pending an explicit Product Owner decision.
