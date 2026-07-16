# Independent Codex Wiring Audit — CD-023

- reviewer: OpenAI Codex `/root` (independent audit session; no CD-023 implementation edits)
- date: 2026-07-13
- branch: `feat/cd-023-immediate-authority-bar`
- base commit: `ea22b20`
- verdict: **FAIL — remediation implemented locally; live re-verification and fresh independent re-audit pending**
- gate effect: This report does **not** satisfy the DEC-012 closure precondition. CD-023 remains blocked from completion, closure, and sponsor runtime acceptance.

## Remediation trace — 2026-07-13

The sponsor directed correction of all findings. The implementation author cannot
self-convert this report to PASS; DEC-012 still requires a fresh independent
review after the live runtime evidence exists. Current correction evidence:

| Finding | Remediation now in the branch | Verification available now |
|---|---|---|
| FAIL-01 | Raw coordinate presence is checked before conversion in `actions.ts`; the RPC independently rejects null/out-of-range coordinates. | Typecheck/build PASS; focused test includes blank-coordinate server round trip. |
| FAIL-02 | `visits.planner_lat/planner_lng` and `visit_location_source` persist the selected Visit location; field startup consumes the Visit coordinates and preserves the official/manual provenance without changing factory master coordinates. | Fresh local PostgreSQL contract proved a modified registered pin persisted as `manual` while official coordinates remained unchanged, plus the Inspector manual path; browser assertions prepared. |
| FAIL-03 | `create_immediate_visit` re-reads `package_versions` and accepts only `published`/`locked` immediately before writes. | Local SQL/RPC contract and Playwright package-unavailable assertion prepared. |
| FAIL-04 | Migration 0027 adds factory and notification audit triggers plus a constrained request-attempt audit helper; UI claim is now true. | Local PostgreSQL found factory/assignment audit rows; focused test asserts all five exact audit legs. |
| FAIL-05 | Stable UUID request key, advisory request lock, unique Visit request index and unique assignment-per-Visit index replace client resume IDs. Replays return the stored creator role, and CR/licence identity locks are acquired in stable lexical order. | Local replay with a conflicting submitted actor mode returned the original Visit and stored Planner role; focused suite includes concurrent request and shared-licence proofs. |
| FAIL-06 | All validation and reads execute inside one PostgreSQL function; database/read faults fail closed into `system_error`, with raw detail suppressed. | Repeatable SQL contract forced both notification-write denial and package-read denial; both returned only `system_error`, retained no Visit and wrote a governed blocked-attempt audit. |
| FAIL-07 | Sequential writes and the misleading partial ledger were removed. The function is atomic; failed writes roll back. | Forced failure left zero Visits and zero assignments and retained one blocked-attempt audit. |
| FAIL-08 | Nine chip labels and live-announcement phrases are localized, including explicit Arabic values and RTL assertions. | Typecheck/build PASS; Arabic Playwright assertion prepared. |
| FAIL-09 | Focused suite expanded to direct blank, package, duplicate, exact audit, Inspector, concurrent request idempotency, concurrent source-identity collision, stored-role replay, AR/RTL and 8-frame matrix checks. A repeatable transaction-wrapped SQL contract covers RLS and forced read/write failures. | Playwright discovery PASS for 8 product tests plus 3 auth setup tests; auth setup restored at 3/3 PASS; clean local database contract PASS. Migration-dependent focused/full suites remain unrun. |

Additional source reconciliation corrected the former slice definition: it now
covers MVP1-M01-043..052, restores the Inspector-created path, requires Planner
review, removes the invented `now → +8h` default, makes manual name/CR/license
individually optional, and preserves official-versus-Visit location provenance.

Remaining gate facts:

1. Migration `0027_cd023_immediate_visit_atomic.sql` has passed isolated local
   PostgreSQL syntax, clean application, RLS, atomicity, idempotency, location
   provenance and audit tests but is **not applied to the linked Supabase
   development project**.
2. Focused CD-023 and full Playwright regression therefore cannot truthfully run.
3. The required `outputs/cd-023/*` export, including the wiring-map CSV, is still
   absent from both supplied pack locations.
4. After live verification, a different independent reviewer/session must issue
   the final DEC-012 verdict.

## Audit input status

The required design claims were not available in the repository or supplied attachments:

- `outputs/cd-023/WIRING_MAP_CD-023.csv` — missing
- `outputs/cd-023/IMPLEMENTATION_MANIFEST_CD-023.yaml` — missing
- `outputs/cd-023/COMPONENT_MAP_CD-023.csv` — missing
- `outputs/cd-023/ACCEPTANCE_CHECKLIST_CD-023.md` — missing
- `outputs/cd-023/CLAUDE_CODE_HANDOFF_CD-023.md` — missing
- `outputs/cd-023/CLAUDE_CODE_MCP_PROMPT_CD-023.md` — missing

Because the canonical wiring rows are absent, their 13 columns cannot receive the required per-row verdicts. Do not treat this companion report as a substitute for importing those files and completing the row-by-row audit.

## Findings

### FAIL-01 — M01-046 is not enforced server-side for blank coordinates

- verdict: FAIL
- evidence: `apps/web/src/app/planning/immediate/actions.ts:59,82-86`
- check: `Number("")` and `Number(null)` evaluate to `0`; the action converts the fields before checking presence. A direct or stale client submission with blank/missing latitude and longitude therefore passes the finite/range guard as `0,0`.
- required correction: validate trimmed raw strings for presence before numeric conversion, then range-check the parsed values. Add a direct server-action/HTTP negative test; browser `required` is not a server guard.

### FAIL-02 — accepted registered-factory location is discarded

- verdict: FAIL
- evidence: `apps/web/src/app/planning/immediate/actions.ts:153-159`; `supabase/migrations/0001_foundation.sql:150-164`
- check: the visit insert does not write `planner_lat` or `planner_lng`. For a registered factory, the mandatory entered/confirmed location is used only for validation and then lost. The schema already provides `visits.planner_lat` and `visits.planner_lng` for the planner pin.
- required correction: persist the confirmed visit location with the visit and prove it on both registered-official and manual-location success paths.

### FAIL-03 — ERR-PUB-001 package status is only a page-time filter

- verdict: FAIL
- evidence: `apps/web/src/app/planning/immediate/page.tsx:41-45`; `apps/web/src/app/planning/immediate/actions.ts:62,88,153-159`
- check: the page lists published/locked package versions, but the action checks only that an ID is non-empty. It never re-reads the package version or verifies its authoritative state immediately before mutation. A stale or crafted request can submit another existing package-version ID.
- required correction: revalidate the package version server-side and return the catalogued publish blocker without creating any row.

### FAIL-04 — “every step” audit truth is false

- verdict: FAIL
- evidence: `apps/web/src/app/planning/immediate/page.tsx:104-108,146-147`; `apps/web/src/app/planning/immediate/ImmediateForm.tsx:173-174,313-320`; `supabase/migrations/0002_rbac_audit.sql:141-157`
- check: the UI says every step is recorded in the append-only audit log. The generic audit trigger list includes `visits` and `assignments`, but excludes `factories` and `notifications`. Temporary-factory creation and assignment-notification insertion therefore have no demonstrated `audit_events` row.
- automated-test mismatch: `apps/web/e2e/cd-023-immediate-authority-bar.spec.ts:124-148` names ENG-12 in the success case but never queries `audit_events`; it checks only the assignment row's `candidates` JSON and notification persistence.
- required correction: either add governed append-only audit coverage for the missing steps or narrow the UI claim to the steps actually audited. The success test must assert the exact audit rows.

### FAIL-05 — retry IDs are not bound and idempotency is not proven

- verdict: FAIL
- evidence: `apps/web/src/app/planning/immediate/actions.ts:69-70,131-150,164-194`; `supabase/migrations/0001_foundation.sql:166-174`
- check: `resume_factory_id` and `resume_visit_id` are trusted as client inputs and reloaded only by ID. The action does not bind them to the original immediate attempt, selected factory, actor, visit state, or submitted window/package. A planner can resume any RLS-visible visit and continue assignment/notification logic using unrelated form values. `assignments.visit_id` also has no unique constraint, so an ignored/missed existing-assignment read can create another assignment. No uniqueness contract was found for the assignment notification either.
- required correction: use a server-owned idempotency key or a guarded RPC/attempt record. At minimum, bind every resumed object to the same immediate attempt and enforce database uniqueness for one assignment/notification leg where the contract requires it.

### FAIL-06 — guard and idempotency read errors are silently treated as data

- verdict: FAIL
- evidence: `apps/web/src/app/planning/immediate/actions.ts:103-106,110-125,131-133,147-150,164-165,189-190`
- check: the exact-CR lookup, inspector-pool query, overlap query, resume lookups, existing-assignment lookup, and existing-notification lookup all discard Supabase `error`. Failure can be interpreted as “no match,” “no overlap,” or “not yet created,” weakening duplicate, availability, and retry guards.
- required correction: fail closed with neutral catalogued copy and preserve the truthful ledger. Add forced read-failure/RLS-denial tests.

### FAIL-07 — the partial-failure ledger marks unattempted steps as failed

- verdict: FAIL
- evidence: `apps/web/src/app/planning/immediate/actions.ts:128-143`; `apps/web/src/app/planning/immediate/ImmediateForm.tsx:330-342`
- check: the ledger initializes visit, assignment, and notification as `failed`. If temporary-factory creation fails, none of those downstream steps ran, but the UI renders all three as failed. The same misstatement applies to later unattempted steps after a visit or assignment failure.
- required correction: add a truthful `not_attempted`/`pending` state (or use `skipped` with accurate copy) and test each forced failure boundary.

### FAIL-08 — Arabic accessibility behavior is only partially localized

- verdict: FAIL
- evidence: `apps/web/src/app/planning/immediate/ImmediateForm.tsx:141-175`; `apps/web/src/app/planning/immediate/AuthorityBar.tsx:30-35`; `apps/web/e2e/cd-023-immediate-authority-bar.spec.ts:196-201`
- check: all nine chip labels and the assertive live announcement are hard-coded English. The Arabic test checks only document direction and captures a screenshot; it does not assert localized accessible names or announcements.
- required correction: localize labels and live-region phrases and assert them in the Arabic/RTL test.

### FAIL-09 — required automated and runtime evidence is absent or did not execute

- verdict: FAIL
- evidence:
  - `apps/web/e2e/cd-023-immediate-authority-bar.spec.ts:15-23` explicitly defers the forced write-failure branches without a decision ID.
  - The claimed “availability race” is not exercised; `:150-180` creates a normal pre-existing overlap and checks the ordinary pre-write blocker.
  - No tests cover direct blank-coordinate submission, stale/unpublished package, retry binding/idempotency, read-query failure, each ledger boundary, or exact `audit_events` output.
  - Audit run `npx playwright test e2e/cd-023-immediate-authority-bar.spec.ts --project=e2e`: FAIL in shared authentication setup (planner/inspector/reviewer login returned HTTP 400 and timed out); 3 setup tests failed and 8 CD-023 tests did not run.
  - `${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/immediate-v2/`: no required dark/light × EN/AR × desktop/narrow evidence set was present at audit time.
- required correction: repair/restore the authenticated fixture, add the missing negative paths, run the focused suite, then run the full regression and record all required frames.

## Checks that passed

- `npm run typecheck` — PASS
- `npm run build` — PASS; `/planning/immediate` compiled in the production build
- `git diff --check` — PASS
- RLS remains on the normal authenticated Supabase client path; no service-role key or bypass was found in the CD-023 action.
- Visit and assignment mutations are covered by the existing append-only row-change audit trigger.
- Provider delivery is not falsely claimed as delivered; push persists with truthful unconfigured/delivery state through `insertNotification`.
- Superseded by exact-source reconciliation: the Planner-only state was not
  source-faithful. SCR-WEB-130 and M01-043/-047/-048/-051 authorize the existing
  Inspector role without inventing a new override role; remediation restores it.

## Next allowed action

1. Obtain explicit approval and apply migration 0027 to the linked development
   Supabase project.
2. Run the expanded focused suite, full regression and eight-frame visual matrix.
3. Import the complete `outputs/cd-023` package when it is actually supplied;
   do not fabricate the missing wiring map.
4. Request a fresh independent Codex audit against the corrected, stable branch
   snapshot. Every available wiring-map row must receive reviewer/date/verdict/
   evidence fields; otherwise record the missing-package blocker explicitly.

CD-024+ implementation remains blocked until a CD-0XX wiring audit actually passes as required by DEC-012.
