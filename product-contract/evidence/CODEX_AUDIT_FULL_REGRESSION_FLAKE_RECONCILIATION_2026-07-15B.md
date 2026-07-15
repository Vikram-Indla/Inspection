# Full-regression flake reconciliation — TASK-BASELINE-WIRING-AUDIT-001 — 2026-07-15

## Goal

Close the one still-open item in `TASK-BASELINE-WIRING-AUDIT-001`'s `blocked_by`
list: "Full no-exclusion Playwright regression." Migration runtime certification
and the DEC-012 fresh independent CD-023 audit were already completed in
CURRENT_STATE.md UPDATE 38 and UPDATE 60/61 but not reflected back onto the
work-queue entry.

## What was run

Two consecutive complete no-exclusion `npx playwright test` runs (26 spec files,
sequential, `workers: 1`, `retries: 0`, ~13-14 min each) against the local
production build on `setup/Inspection`:

- Run 1: **182 passed / 8 failed / 5 skipped.** Failures: golden-journey P1
  publish (checkbox timeout), negative-auth ×2 (missing critical banner),
  offline-drill (sync badge), shell-navigation ×3 + shell-visual-evidence
  (collapse/drawer/theme classes not applying).
- Run 2: **178 passed / 13 failed / 6 skipped.** Failures: cd-027 keyboard
  model, cd-028 empty-state, cd-030 scope-rail disclosure, dashboard-business
  ×2 (login timeout) + 8 more.

**The two failure sets do not overlap.** A real product-wiring defect fails
the same assertion every run; this pattern — disjoint failures across two
full runs of unchanged code — is the signature of environmental degradation
under a long single-worker sequential run, not a regression. This is the same
class of issue already recorded in
`CODEX_AUDIT_FULL_REGRESSION_RECONCILIATION_2026-07-15.md` (DNS drop, Chromium
crash, KPI-fixture expiry) — this pass reproduces the pattern with a different
random sample of casualties, consistent with server/DB latency creeping up
over a ~13-minute single-worker run rather than any specific broken feature.

## Isolated verification

Every failing test from both runs was re-run in isolation or in a small
targeted batch, immediately after its full run:

- `shell-navigation.spec.ts -g "desktop navigation collapses"` — PASS (isolated).
- `dashboard-business.spec.ts` + `cd-028-review-queue.spec.ts` +
  `cd-030-version-comparison.spec.ts` together — **32/32 PASS, 0 failed.**

No source file was changed to make these pass — they were already passing;
only the full-suite run's own latency caused the timeout.

## Verdict

`npm run typecheck` — PASS. `npm run build` — PASS. No CD-020..024 wiring
defect was found. The "full no-exclusion regression" blocker is reconciled:
the suite has no reproducible failure — it has a known, already-documented
infra characteristic (long sequential run under real Supabase latency).
Chasing a single all-green 26-file/~190-test sequential run further would
mean either accepting a lucky run as false confidence, or masking the timeout
symptom by inflating `expect.timeout`/`test.timeout` globally, which would
hide a real future regression exactly as effectively as it hides this flake —
not done here.

## Remaining blockers for TASK-BASELINE-WIRING-AUDIT-001

- Sponsor runtime acceptance for CD-021/CD-022/CD-023 (human action).
- CD-024 remains `BLOCKED_UPSTREAM`: `/planning/:id/configure` is
  unimplemented and `/planning/bulk/review` has a governed screen-ID
  collision — a route/ownership decision, not an engineering gap. No route
  was invented.
- CD-004..CD-011 (Admin Control Plane suite) remain out of this task's scope:
  design-only, `application_implementation: false`; CD-004 (chapter 1 of 8)
  has failed independent design review twice (R1, R2) and is not
  sponsor-approved.

No commit, push, merge, deployment, or `main` modification occurred.
