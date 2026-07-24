# F0 Web/Admin Shell Correction — Runtime Evidence

## Candidate

- Task: `TASK-WEB-ADMIN-PHASE1-F0-CORR-002`
- Branch: `codex/f0-shell-authority-correction`
- Baseline: `3323a8ef3d788c1c157a9bf0d63e32a3d9334e42`
- Runtime: `http://127.0.0.1:3002/operations`
- Evidence date: 2026-07-24

## Material implementation

- Restored the fixed Web/Admin rail hierarchy and ordering from
  `WA-SHELL-SRC-001`.
- Restored the approved bilingual SAQEEL wordmark and removed the
  hard-coded Arabic-only shell mark.
- Corrected Compliance labels and destinations.
- Reduced Administration to the six governed hubs in the required order.
- Removed stale `ax-*` shell class consumers and bound the live shell to the
  native SAQEEL component layer already imported by the application.
- Preserved role-aware navigation, Field isolation, RLS-scoped search,
  notifications, theme, locale/RTL, account, and sign-out behavior.

## Validation results

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript typecheck | PASS | `npm run typecheck` |
| Production build | PASS | `npm run build` |
| Focused source and permission contract tests | PASS | 19/19 |
| Authenticated shell runtime checks | PASS | 4/4 |
| Requirements and route validator | PASS | 478/478 requirements; 71 Phase 1 routes; 18 shell acceptance rows |
| Aggregate protected sample | AMBER | 24/30; six bounded exclusions documented below |
| Diff whitespace validation | PASS | `git diff --check` |

Authenticated runtime coverage included desktop collapse/expand, tablet
notification/account behavior, mobile drawer focus and Escape handling, and
Arabic RTL with light/dark theme.

## Bounded exclusions from the aggregate run

The six aggregate failures are not introduced by this lease:

- Three Field-only `inspector-shell-uplift` checks encounter pre-existing
  merged Field/Astryx markup. `/field/**`, PWA, iPad, and offline execution are
  explicitly outside the F0 lease and were not modified.
- Three reference-renderer checks require
  `SAQEEL_F0_REFERENCE_RENDERER=enabled`. The sponsor-facing production runtime
  intentionally does not enable a test-only reference route. Its fail-closed
  source-gating checks pass.

These exclusions keep QA status AMBER until the separately owned Field work and
reference-only visual suite are reconciled. They do not invalidate the focused
F0 Web/Admin shell checks.

## Real-system browser evidence

- Screenshot:
  `/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/TASK-WEB-ADMIN-PHASE1-F0-CORR-002/F0-real-runtime-operations-shell-1440.jpeg`
- SHA-256:
  `720d85b531d7c7113dd171c4348ed75224f32359a792d428fcd5465bb9e87b7f`
- Size: 112167 bytes
- Content: authenticated real Operations Center at 1440px with the corrected
  Web/Admin shell. This is application runtime, not a Claude Design render or a
  static reference page.
- Administration evidence:
  `/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/TASK-WEB-ADMIN-PHASE1-F0-CORR-002/F0-real-runtime-admin-hubs-1440.png`
- Administration SHA-256:
  `78a66d43c32fe59212975a2cef167bf4fafe14c72f2f6bf3345e0e613c4c4060`
- Administration size: 106814 bytes
- Content: authenticated planner view showing all six governed Administration
  hubs in the required order and honestly locked for a non-administrator.

## Honest wiring state

- `Execution`: the authority target is
  `/planning/visits?view=execution`; the live item remains on the retained real
  `/visits` route until the M2 preview gate and explicit cutover approval.
- `Analytics`: the authority target is `/dashboard?view=analytics`; it is
  visibly disabled because the current dashboard does not implement that view.
  M1 must wire a real Analytics view before activation.
- No API, database, backend, workflow, Field, PWA, or iPad code changed.

## Reviewer disposition

`APPROVE FOR SPONSOR RUNTIME REVIEW` for the bounded F0 Web/Admin shell
candidate. Do not declare full platform or module completion. Do not cut over
Execution or enable Analytics under this lease.
