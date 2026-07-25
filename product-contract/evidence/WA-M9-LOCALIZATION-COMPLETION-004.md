# WA-M9 Admin Localization — implementation completion evidence

## Identity and scope

- Sponsor-issued bounded implementation completion lease, 2026-07-25
- Existing task: `TASK-WEB-ADMIN-PHASE1-M9-LOCALIZATION-001`
- Route: `/admin/localization`
- Process / screen / engine: `G2-P00` / `SCR-ADM-100` / `SB19`
- Requirements: `MVP1-FND-001`, `MVP1-FND-003`, `MVP1-FND-010`,
  `MVP1-FND-011`
- Acceptance: `WA-M9-AC-001..006`
- Registered design: `WA-DES-010` (`WA-DES-009` identical alias), SHA-256
  `11867bb534b7c318d7689b0300e6b59c485db8a5daab009a3c904851d222d91d`
- Branch / draft PR: `codex/admin-localization-lookups` /
  `https://github.com/Vikram-Indla/Inspection/pull/63`

Only the owned Localization route, its focused Playwright specification and
this route evidence changed. No shared shell, Operations, database migration,
provider, policy, schema, unrelated Admin capability, `main`,
`setup/Inspection` or stash was changed.

## Completed route behavior

The real registry now:

- loads the complete stable key-ordered dictionary in bounded pages and
  presents an explicit bilingual loading, empty, filtered-empty, degraded,
  unexpected-error and unauthorized state;
- explicitly revalidates the approved Config Admin role family inside every
  server action and history read, in addition to the existing RLS boundary;
- preserves the established Save → Review → History → Restore workflow;
- rejects stale Save, Review and Restore submissions with the row's
  `updated_at` version, preventing silent concurrent overwrite;
- revalidates placeholder integrity on the server and prevents review of
  empty, orphaned, invalid or no-longer-draft values;
- refreshes the server-rendered row/version after successful Save, Review and
  Restore and refreshes immutable history after Restore;
- exposes the revision actor, localized source and localized state in the
  history panel without deleting or hiding audit records;
- keeps the English source and technical key intentionally visible while
  localizing route chrome and the narrow-layout warning;
- switches language through a full document navigation so the persistent
  shared shell, document `lang` and document `dir` change together;
- remains keyboard operable, Axe-clean and free of horizontal overflow in the
  exercised desktop, tablet, 390px and 320px layouts.

The full-document language switch closes a real runtime defect found during
visible-browser verification: the prior plain route link could be intercepted
by the persistent client shell, changing only the route content while leaving
the document and shell English/LTR.

## Real data and permission truth

No database write occurred during this completion pass.

The previously authorized isolated data proof remains the real behavioral
evidence:

- key: `admin.items.form.guidancePlaceholder`;
- final Arabic: `ما يتحقق منه المفتش`;
- final status: `draft`;
- exactly one current row, non-orphaned;
- four immutable revisions: one original sync revision and three truthful
  Save/Review/Restore journey revisions;
- no temporary value in the current registry;
- actor and time retained in append-only audit evidence;
- reviewer persona denied before localization data loads.

The complete collision preflight, UI journey and semantic restoration proof
remain in `WA-M9-LOCALIZATION-DATA-PROOF-003.md`.

Current visible-browser read-only proof:

- Config Admin: 2,844 total keys, 2,790 with Arabic, 0 reviewed, 98% coverage;
- governed key: exact restored Arabic and draft status, version token, four
  history entries, actor evidence and available Restore controls;
- denied reviewer: fail-closed state with no registry;
- English/LTR/light and Arabic/RTL/dark switch correctly at document and route;
- 320px and 820px Arabic layouts: no horizontal document overflow;
- browser console warnings/errors: zero.

## Verification

- `npm --prefix apps/web run typecheck` — PASS
- environment-backed `npm --prefix apps/web run build` — PASS
- focused `apps/web/e2e/web-admin-m9-localization.spec.ts` — PASS, 8/8
- focused coverage includes source/governance, complete registry loading,
  explicit states, desktop accessibility, restored live key/history,
  Arabic/RTL/dark/tablet/320px and denied reviewer
- `node scripts/validate_web_admin_phase1.mjs` — PASS, 478/478 rows
- `git diff --check` — PASS

External screenshots:

`/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/web-admin-phase1/M9/localization-001`

- English/light/1440x900:
  `550ae1b84c720d293d488e9e97735f0aeb42e52395b253b6479648756f98047f`
- Arabic/dark/390x844:
  `78a2a975de3fc2c611d136cbb3f2966d8294d878542b62ead5682ced3c288707`

## Protected dependency and acceptance position

The current branch's two shared-shell protected files produced 9/17 because
their unchanged expectations still use the old Admin catalogue, old
`.sq-*` selectors and pre-helper search-source location. All eight failures
match the already-isolated test-only correction held separately in draft PR
#64. The real authorized/denied/collapse/drawer/account/Arabic/theme shell
behaviors were previously demonstrated in the browser. This Localization
lease did not authorize copying PR #64's shared-test changes into PR #63.

Remaining P0: **0**.

Remaining P1 acceptance dependencies: **2**.

1. Independent acceptance of separate draft PR #64's protected shell
   assertion correction.
2. Signed review by a qualified native-Arabic reviewer; automation and the
   implementer cannot self-certify linguistic meaning, grammar or Ministry
   register.

## SAQEEL v2 accounting

- Built canonical requirement rows newly adjudicated by this task: `0/478`
- Independently verified canonical requirement rows newly adjudicated by this
  task: `0/478`
- Fully accepted canonical requirement rows newly adjudicated by this task:
  `0/478`
- Route implementation result: built and focused-runtime verified for
  `WA-M9-AC-001..006`
- Overall acceptance result: **RETURN pending two external P1 dependencies**;
  no self-approval, merge or deployment
