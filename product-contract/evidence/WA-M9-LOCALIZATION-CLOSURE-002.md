# WA-M9 Admin Lookups and Localization — closure evidence

## Identity and verdict

- Task: `CODEX-ADMIN-LOCALIZATION-CLOSURE-002`
- Route: `/admin/localization`
- Process / screen / engine: `G2-P00` / `SCR-ADM-100` / `SB19`
- Requirements directly exercised: `MVP1-FND-001`, `MVP1-FND-003`,
  `MVP1-FND-010`, `MVP1-FND-011`
- Acceptance: `WA-M9-AC-001..006`; protected shell checks
  `WA-SHELL-AC-002`, `WA-SHELL-AC-015`, `WA-SHELL-AC-016`,
  `WA-SHELL-AC-018`
- Registered design: `WA-DES-010` (`WA-DES-009` identical alias), SHA-256
  `11867bb534b7c318d7689b0300e6b59c485db8a5daab009a3c904851d222d91d`
- Branch / draft PR: `codex/admin-localization-lookups` /
  `https://github.com/Vikram-Indla/Inspection/pull/63`
- Closure verdict: **not fully accepted**. The bounded frontend is built and
  independently exercised, but three P1 stops remain. No self-approval, merge
  or deployment is authorized.

## Product defect found and closed

The production registry contains 2,844 rows, but the existing server read
returned exactly 1,000 because one unbounded PostgREST response was capped.
That made coverage totals and every key after the first 1,000 incomplete.

The owned route now reads stable key-ordered 1,000-row pages until the final
partial page. Any page failure produces the existing critical load state
instead of presenting a partial dictionary as complete. The focused browser
test asserts both the pagination contract and a live total greater than 1,000.

Real production-browser result after the fix:

- 2,844 total keys;
- 2,790 with Arabic;
- 0 reviewed;
- 98% coverage;
- 12 visible records per UI page, page 1 of 237;
- Arabic/RTL narrow view has no document horizontal overflow;
- browser console has no warning or error entries.

No API, database schema, provider, migration, shared shell source, shared
Supabase row or unrelated function changed.

## Stop 1 — protected shell/navigation regression

**Classification: existing dependency protected-test defect, not a
localization runtime product defect.**

- `apps/web/src/lib/shell-navigation.ts` and
  `apps/web/e2e/shell-navigation.spec.ts` are byte-identical between this
  branch and dependency base `2f795773`; they are also unchanged between that
  base and `main`.
- The exact protected selection was reproduced in a temporary detached
  worktree at dependency base `2f795773`: 11 passed and the same one failed.
- The stale assertion expects seven `admin-advanced` IDs. The unchanged
  navigation now correctly includes six additional registered Admin routes:
  `execution`, `admin-home`, `inspection-items`,
  `enforcement-recommendations`, `bulk-violations`, and `localization`.
- Git history shows those routes were added by dependency commits while the
  exact-list assertion was not brought forward. Web/Admin route authority
  confirms the routes are real capabilities, not unexpected leakage.

This still blocks a green protected regression and `WA-M9-AC-005`.

Exact lease needed:

- Lease ID: `LEASE-WA-SHELL-NAV-ASSERTION-003`
- Owner: shared Web/Admin shell test owner
- File: `apps/web/e2e/shell-navigation.spec.ts` only
- Permitted change: align the `admin-advanced` expected ID list with the
  authoritative navigation inventory and add an assertion that continues to
  reject unknown routes.
- Prohibited: any change to `shell-navigation.ts`, shell rendering, role
  policy, route ownership or this localization route.
- Exit: the same protected selection passes at the PR dependency base and at
  PR head.

## Stop 2 — real save/review/history/restore proof

**Verdict: safely prepared; not executed because no exclusive shared-data
lease exists.**

The live action and RLS contracts are present. Config Admin roles may update
`ui_strings`; the database trigger appends old values to
`ui_string_revisions`; history is readable; restore writes the chosen Arabic
value and returns status to `draft`. There is no application delete path and
the actions do not provide compare-and-swap version guards. An exclusive
record lease is therefore the required collision control.

Read-only candidate baseline captured on 2026-07-25:

- table/key: `ui_strings` /
  `admin.items.form.guidancePlaceholder`;
- English: `What the inspector verifies`;
- Arabic: `ما يتحقق منه المفتش`;
- status / orphaned: `draft` / `false`;
- context / updated_by: `null` / `null`;
- updated_at: `2026-07-11T23:01:19.069404+00:00`;
- latest revision ID:
  `b60eba67-eee9-4185-9cd5-7da52407cac3`.

An orphaned key was considered first, but the real UI correctly prevents
review promotion for orphaned records; it cannot prove the complete workflow.

Exact lease needed:

- Lease ID: `DATA-LEASE-CODEX-ADMIN-LOCALIZATION-003`
- Exclusive target:
  `ui_strings.key = 'admin.items.form.guidancePlaceholder'` and its matching
  `ui_string_revisions` history, in the approved verification project only.
- Actor: the seeded Config Admin persona used by PR #63 browser evidence.
- Window: one uninterrupted 15-minute verification window.
- Collision rule: immediately before the first save, re-read all baseline
  fields and the latest revision ID. Abort on any drift. No other actor, sync
  job or localization write may touch this key during the window.
- Allowed UI sequence only:
  1. save a clearly marked temporary Arabic proof value;
  2. refresh and prove the draft value persisted;
  3. mark reviewed and refresh to prove reviewed persistence;
  4. open history and prove trigger source, actor, timestamp and before-state;
  5. restore the revision containing the exact baseline Arabic value;
  6. refresh and prove Arabic and status are back to the baseline
     `ما يتحقق منه المفتش` / `draft`.
- Required negative proof: a non-Config Admin remains denied before the
  registry read; if any baseline or revision collision is observed, abort
  without a write.
- Prohibited: Add key, Sync from code, direct SQL write, service-role bypass,
  schema/provider change, any other record, or accepting a partial rollback.
- Accepted residual effect: trigger history rows, final `updated_by`, and final
  `updated_at` are append-only audit/revision evidence and cannot be restored
  to their original metadata through the governed UI. The lease owner must
  explicitly accept that residue before execution.

Until that lease is granted, service-wiring proof remains `AMBER`; static
wiring and read behavior do not substitute for this real mutation cycle.

## Stop 3 — native-Arabic certification

**Verdict: layout and RTL automation passed; native linguistic acceptance is
open.**

The real Arabic route at 390x844 in dark mode proves RTL order, responsive
stacking, keyboard-reachable controls and lack of horizontal overflow. It
does not prove that the Arabic is natural, correct or suitable for Ministry
users. The captured route also exposes a concrete gap: the repeated
route-owned warning `Arabic runs long — check narrow layouts` remains English
in Arabic mode. English source strings and technical key identifiers are
intentional in this bilingual editing surface; the warning is UI chrome and
must not be treated as intentional source content.

Required external gate:

- reviewer: named, qualified native-Arabic reviewer independent of the
  implementer;
- evidence identity: current commit, route, design hash, date and Config Admin
  persona;
- surfaces: desktop 1440, tablet 820, narrow 390/412 and minimum 320 widths,
  covering light and dark themes;
- scenarios: normal, loading/degraded, empty/no-match, validation, denied,
  save, review, history and restore states;
- checks: meaning, naturalness, Ministry register, terminology consistency,
  grammar, punctuation, abbreviations and technical terms, action labels,
  error recovery, wrapping and truncation;
- explicit distinction between intentional English source/key columns and
  untranslated Arabic interface chrome;
- outcome: signed `PASS` or `RETURN` with an exact issue list. Automation and
  an implementer self-review cannot satisfy this gate.

The English narrow-layout warning needs approved Arabic copy and a permitted
update before the native reviewer can issue `PASS`.

## Verification

- `npm --prefix apps/web run typecheck` — PASS
- environment-backed `npm --prefix apps/web run build` — PASS
- focused production
  `apps/web/e2e/web-admin-m9-localization.spec.ts` — PASS, 6/6
- `node scripts/validate_web_admin_phase1.mjs` — PASS, 478 rows
- `git diff --check` — PASS
- protected F0/shell selection — 11/12 PASS; only the reproduced stale
  shared-shell expected-list assertion failed
- same shell selection at dependency base `2f795773` — 11/12 PASS, same
  failure

External screenshots:

`/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/web-admin-phase1/M9/localization-001`

- Arabic/dark/narrow:
  `92ef66d693a78c0432c53e595e5657e3ca9baa8a9ef474604bddc5ebc23bda56`
- English/light/desktop:
  `91aba8c5ecbd5bcb33618e966c4c394ffaf904badd73ef22c9995ff295c3a679`
- English/dark/desktop:
  `723becf50df81cca8e67d4561cc5048ed4a727231660167be43535a531b114ac`
- Before English/dark:
  `b9c42244da62ce71aa0dfecdcda829f7b0db8e943c51f5f58eeb0cb6c354fd2e`

## SAQEEL v2 requirement accounting

- Built source-requirement rows out of 478: `0` newly adjudicated in the
  canonical scorecard by this task.
- Independently verified source-requirement rows out of 478: `0` newly
  adjudicated in the canonical scorecard by this task.
- Fully accepted source-requirement rows out of 478: `0`.
- Route-level result: the frontend implementation and focused runtime evidence
  exist for `WA-M9-AC-001..006`, but `WA-M9-AC-005` and the data/Arabic
  evidence gates above prevent full acceptance.

## Queued safe follow-on

`CODEX-ADMIN-LOCALIZATION-DATA-PROOF-003` is queued as
`READY_AFTER_DATA_LEASE`. It owns only the exact leased key and the real
save/refresh/review/history/restore/rollback evidence described above. It
must not begin a write until `DATA-LEASE-CODEX-ADMIN-LOCALIZATION-003` is
recorded and collision preflight passes.
