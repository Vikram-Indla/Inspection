# TASK-REUSABLE-INSPECTOR-CONCURRENT-SCHEDULING-010

## Verdict

`SPEC_LANDED_LIVE_RUN_BLOCKED_NO_TEST_CREDENTIALS`

Static verification (typecheck, production build) passed. The headed Playwright
positive path could not be executed in this environment — no `apps/web/.env.local`
(no `NEXT_PUBLIC_SUPABASE_URL`/anon key) and no `SAQEEL_TEST_PASSWORD` /
`SAQEEL_UAT_PASSWORD` / `SAQEEL_CROSS_ROLE_PASSWORD` are present. Credentials
are never committed to this repository (see `apps/web/e2e/personas.ts`); this
matches the previously recorded pattern of UAT runs being blocked on
credential provisioning until the user supplies them locally.

## Scope

Base: accepted `main` `d624df216fcccd9440a7f06e91595f03d5550b82`, isolated
worktree `reusable-inspector-concurrent-scheduling-d98ddd`, branch
`catalyst/reusable-inspector-concurrent-scheduling-d98ddd`. Dataset:
`TASK10-REUSABLE-INSPECTOR-CONCURRENT-SCHEDULING` (factory codes prefixed
`T10-<run-salt>-*`, created fresh per run, no reuse of another task's fixtures).

New file only: `apps/web/e2e/reusable-inspector-concurrent-scheduling.spec.ts`.
No application source, migration, or shared test-infra file (`personas.ts`,
`live-rest.ts`, `evidence-path.ts`) was modified.

## Reuse-rule finding (governs the whole approach)

There is **no blanket "an Inspector may be used only once" rule** anywhere in
this codebase. The only concurrency control is the overlap-window guard:

- `supabase/migrations/0031_cd023_assignment_overlap_guard.sql` — trigger
  `trg_guard_assignment_window_overlap` blocks assigning an Inspector to a
  visit whose window overlaps another `draft|published|returned` visit
  already holding that Inspector. Non-overlapping reuse is explicitly allowed
  by this predicate.
- Mirrored for the reschedule path in
  `supabase/migrations/20260802120000_planning_reschedule_inspector_overlap.sql`,
  and enforced again at the RPC layer for immediate-create
  (`rpc/create_immediate_visit`, code `inspector_unavailable`) and reassignment
  (`reassign_published_visits_atomic`, `23505`).

Given this, the brief's "if the current reuse rule is overly broad, implement
a test-only default-off relaxation" branch does not apply — the rule is
already correctly scoped. **No feature flag was added.** No production
business rule needs relaxing or a Jira reinstatement story; this journey
instead proves the existing rule end-to-end (Product Owner decision
2026-08-03, "prove existing rule").

## Persona mapping (Product Owner decision 2026-08-03, "map to closest real personas")

The brief's `planner2`, `supervisor5`, `inspector9`, `inspector10`
`@mim.gov.sa` do not all exist as seeded identities:

| Brief identity | Mapped to (real seed) | Why |
|---|---|---|
| `planner2@mim.gov.sa` | `planner2@mim.gov.sa` (unchanged) | Already seeded (`supabase/seeds/demo/07-platform-admin.sql`). |
| `supervisor5@mim.gov.sa` | `supervisor2@mim.gov.sa` | Only `supervisor1`/`supervisor2` exist; no `supervisor5` seed row. |
| `inspector9@mim.gov.sa` | `inspector4@mim.gov.sa` ("Inspector A") | Only `inspector1..5` exist; no `inspector9` seed row. |
| `inspector10@mim.gov.sa` | `inspector5@mim.gov.sa` ("Inspector B") | Only `inspector1..5` exist; no `inspector10` seed row. |

No new identities were invented or seeded; the spec fails closed (throws
naming the missing env var) rather than substituting a default credential.

## Journey coverage (`reusable-inspector-concurrent-scheduling.spec.ts`)

| Step | Test | Mechanism |
|---|---|---|
| Reuse across non-overlapping visits | `T10-01` | `rpc/create_immediate_visit` ×2, same Inspector A, non-overlapping windows → both `ok`, server-truth checked. |
| Concurrent schedule creation, different Inspectors | `T10-02` | `Promise.all` of two `create_immediate_visit` calls, same window, Inspector A + Inspector B → both `ok`. |
| Concurrent schedule creation, same Inspector, overlapping window | `T10-03` | `Promise.all` of two calls, same window, both Inspector B → exactly one `ok`, one `blocked` (`inspector_unavailable`/`concurrent_conflict`). |
| Workload indicator | `T10-04` | UI: `/visits/workload` as Supervisor; asserts Inspector A's "Active total" grew by exactly the 3 new fixtures over a captured baseline. |
| Reassignment | `T10-05` | UI: `/visits/[id]` reassign form moves V2 from Inspector A → Inspector B; server-truth confirms `assignments.inspector_id`. |
| Overlap handling on reassignment | `T10-06` | Stages a colliding fixture on Inspector B, then attempts reassigning V1 onto Inspector B via the same UI form → exact blocked-copy text `"The selected Inspector already has an overlapping visit. Nothing was changed."`; server-truth confirms V1's assignment did not change. |
| Completion | `T10-07` | UI: Inspector A drives `/field/[visitId]` startup (download → journey → geofence check-in → start inspection) then `/field/inspection/[id]` — generically answers every enum checklist item "compliant" section-by-section (package-agnostic, no item codes hardcoded), final review, submit, and signature dialog if the package requires one (`sign-helper.ts`). |
| Dashboard totals | `T10-07` (same test) | Server-truth check that the completed visit satisfies the exact `todayCompleted` predicate used by `apps/web/src/app/(app)/dashboard/metrics.ts` (`planning_status=published`, `operational_state=submitted`); dashboard page loaded and asserted free of `ERR-` banners. |

## Verification run

- `npm run typecheck` (non-incremental `tsc --noEmit`, whole `apps/web` project): **PASS**, no errors.
- `npm run build` (production Next.js build): **PASS**, all routes compiled (`/dashboard`, `/visits/workload`, `/visits/[id]`, `/field/[visitId]`, `/field/inspection/[id]` included).
- Headed positive-path run: **NOT EXECUTED** — blocked on missing `apps/web/.env.local` (Supabase URL/anon key) and missing `SAQEEL_TEST_PASSWORD` / `SAQEEL_UAT_PASSWORD` / `SAQEEL_CROSS_ROLE_PASSWORD`. No trace/screenshots exist because Playwright never launched a browser against a live session. This is an environment gap, not a code defect — the same credentials gap has blocked headed runs in prior recorded sessions.

## To complete verification (requires the user)

1. Provide `apps/web/.env.local` with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the governed non-production project.
2. Provide `SAQEEL_TEST_PASSWORD` (Inspector A/B shared password) and `SAQEEL_UAT_PASSWORD` or `SAQEEL_CROSS_ROLE_PASSWORD` (Planner/Supervisor cohort password) in the same file or the process environment.
3. Run: `cd apps/web && npx playwright test e2e/reusable-inspector-concurrent-scheduling.spec.ts --headed --project=e2e`.

## UI/UX vs Figma

No new UI was built or changed — every screen driven (`/visits/workload`,
`/visits/[id]`, `/planning/*`, `/field/*`, `/dashboard`) is existing, shipped
UI exercised as-is. No Figma comparison or before/after screenshots apply.

## Cleanup

All fixtures use a run-scoped factory-code prefix (`T10-<8-char-salt>-*`) and
windows anchored 30–66 years in the future (except the one near-now
completion fixture), so they are trivially identifiable and do not collide
with or require touching any other task's data. No cleanup was run in this
session since the journey never executed live; the RPC/UI-driven fixtures
this spec creates on a real run are visible via `factories.factory_code like
'T10-%'` for later removal if desired.
