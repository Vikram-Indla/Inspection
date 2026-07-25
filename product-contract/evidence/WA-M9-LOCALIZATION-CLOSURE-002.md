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
- Closure verdict: **not fully accepted**. The bounded frontend and real
  single-key data journey are built and browser-verified, but independent
  review plus the separate shell and native-Arabic P1s remain. No
  self-approval, merge or deployment is authorized.

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

No API, database schema, provider, migration, shared shell source or unrelated
function changed. One explicitly leased Supabase row completed a real
save/review/restore journey and returned to its exact original semantic state;
the required actor/time and append-only history evidence remain.

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

## Data proof — real save/review/history/restore

**Verdict: executed under the exclusive lease; exact semantic state restored;
awaiting independent review.**

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

Executed lease controls:

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

The sponsor granted the lease and later clarified that audit metadata/history
must remain while the semantic business state is restored exactly.

### Lease result — 2026-07-25

The sponsor issued `DATA-LEASE-CODEX-ADMIN-LOCALIZATION-003`. Its first
preflight stopped before writing because complete-row restoration would have
required falsifying actor/time and deleting required history. The sponsor then
clarified that restoration means exact semantic business state while
`updated_by`, `updated_at` and append-only revision rows must remain as truthful
audit evidence.

A fresh collision preflight matched the original row-plus-history SHA-256.
The real Config Admin UI then completed Save → refresh → Review → refresh →
History → Restore → refresh on the one leased key. The final Arabic and
`draft` status exactly match the original semantic state; the temporary value
exists in zero current rows; the key remains unique and non-orphaned; and the
three new revision rows truthfully preserve original-draft, temporary-draft and
temporary-reviewed before-states for one Admin actor. The focused production
suite passed 6/6 after restoration, including the denied reviewer boundary.

All three writes currently use `change_source = 'panel'`; restore does not
carry a distinct source label. This audit-label observation is disclosed for
independent review. The complete preflight, journey, hashes, revision IDs,
denied-user result and final residue check are recorded in
`product-contract/evidence/WA-M9-LOCALIZATION-DATA-PROOF-003.md`.

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
- Route-level result: the frontend implementation, real data journey and
  focused runtime evidence exist for `WA-M9-AC-001..006`. Independent review,
  the protected-shell `WA-M9-AC-005` dependency and native-Arabic certification
  still prevent full acceptance.

## Data-proof follow-on position

`CODEX-ADMIN-LOCALIZATION-DATA-PROOF-003` has completed its bounded execution
and is `AWAITING_INDEPENDENT_REVIEW`. No further write is authorized.
