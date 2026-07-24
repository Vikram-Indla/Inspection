# WA-M9 Admin Lookups and Localization — delivery evidence

## Identity and authority

- Task: `TASK-WEB-ADMIN-PHASE1-M9-LOCALIZATION-001`
- Business function: Admin Lookups and Localization
- Route: `/admin/localization`
- Process: `G2-P00`
- Screen: `SCR-ADM-100`
- Engine: `SB19`
- Migration/route mapping: `WA-MIG-020`; `WA-SR-013`
- Requirements directly exercised: `MVP1-FND-001`, `MVP1-FND-003`,
  `MVP1-FND-010`, `MVP1-FND-011`
- Route-map requirement authority: `CR-001..CR-478`; this bounded task does
  not claim that all 478 source rows were built or accepted.
- Acceptance: `WA-M9-AC-001..006`; shell checks `WA-SHELL-AC-002`,
  `WA-SHELL-AC-015`, `WA-SHELL-AC-016`, `WA-SHELL-AC-018`
- Registered design: `WA-DES-010` (`WA-DES-009` identical alias)
- Design SHA-256:
  `11867bb534b7c318d7689b0300e6b59c485db8a5daab009a3c904851d222d91d`
- Implementation commit: `0e81ba97`
- Branch: `codex/admin-localization-lookups`
- Dependency base: `codex/shared-brand-regression` at `2f795773`

## Design-to-code decision

The registered design is a generic reference-list fixture (Authorities,
Regions, ISIC, document types, violations and fuel). The real route is the
source-backed bilingual UI-string registry. Fixture lists and new APIs were
not introduced. The implementation applies the registered screen's hierarchy,
status navigation, bilingual table density, search pattern and never-delete
governance note while preserving all existing localization behavior:

- inline Arabic editing;
- placeholder validation and narrow-layout risk warnings;
- explicit review promotion;
- add-key and source-code sync;
- CSV export;
- trigger-written revision history and restore;
- orphan retention rather than deletion.

This is a documented design gap, not permission to remove real behavior.

## Owned implementation

- `apps/web/src/app/(app)/admin/localization/page.tsx`
- `apps/web/src/app/(app)/admin/localization/Manager.tsx`
- `apps/web/src/app/(app)/admin/localization/localization.module.css`
- `apps/web/e2e/web-admin-m9-localization.spec.ts`

No API, schema, provider, migration, shared Supabase data, shared shell source,
global CSS, other Admin function, Field/PWA function or orchestration file was
changed.

## Real behavior verified

- Authenticated admin: the real seeded `ui_strings` registry loaded 1,000
  keys, 991 Arabic translations, 0 reviewed keys and 99% coverage.
- Unauthorized reviewer: role verification completed before the
  `ui_strings` read; the reviewer received an explicit denied state and no
  registry data.
- Registry density: 12 rows per page instead of all 1,000 rows in one
  approximately 140,000-pixel document.
- Search, status filters, pagination and keyboard-open/close of Add key passed.
- English/LTR and Arabic/RTL passed in light/dark at 1440x900, 820x1180 and
  390x844, with no document horizontal overflow.
- Axe found no automatically detectable violations on the delivered route
  after heading-order and contrast corrections.
- No browser test changed shared Supabase data. Write buttons and server-action
  contracts remain present, but a save/refresh/restore mutation was
  intentionally not executed because this task explicitly prohibited shared
  Supabase-data changes.

## Verification results

- `npm --prefix apps/web run typecheck` — PASS
- environment-backed `npm --prefix apps/web run build` — PASS
- production standalone runtime, focused
  `web-admin-m9-localization.spec.ts` — PASS, 5/5
- `node scripts/validate_web_admin_phase1.mjs` — PASS, 478 rows validated
- protected F0/shell selection — 11/12 PASS
  - Existing blocker: `shell-navigation.spec.ts` expects seven exact
    `admin-advanced` entries, while the current unchanged navigation returns
    thirteen. Neither file is owned or changed by this task.
- repository-wide design-system guardrail — existing 98 findings; none
  reported in the four owned files.

## External binary evidence

Stored outside Git under:

`/Users/vikramindla/Desktop/Inspection Documentation/07_TEST_EVIDENCE_AND_SCREENSHOTS/web-admin-phase1/M9/localization-001`

- `before-admin-localization-en-dark-1440x900.png`
- `after-admin-localization-en-dark-1440x900.png`
- `after-admin-localization-en-light-1440x900.png`
- `after-admin-localization-ar-dark-390x844.png`

The English/light and Arabic/dark after screenshots were refreshed by the
focused suite against the environment-backed production build. The
English/dark after screenshot is the in-app-browser implementation comparison.
External binary evidence is not recommitted.

## SAQEEL Operating System v2 status

- Built requirement rows out of 478: `0` scorecard rows adjudicated by this
  independent task. The bounded implementation exists, but this task does not
  rewrite the canonical scorecard.
- Independently verified requirement rows out of 478: `0` scorecard rows
  adjudicated. Route-level acceptance evidence is present for
  `WA-M9-AC-001..006`, subject to the blockers below.
- Fully accepted requirement rows out of 478: `0`.
- Frontend: `GREEN` for the bounded route at implementation commit
  `0e81ba97`.
- Service wiring: `AMBER`; existing real reads and action wiring are preserved,
  but this task did not mutate shared data to re-prove save/refresh/restore.
- QA: `AMBER`; focused production suite passes, but the protected shell
  regression is not fully green.
- Sponsor: `AMBER`; bounded build authorization is recorded, final acceptance
  is not.
- P0/P1 stop conditions:
  1. Protected regression `shell-navigation.spec.ts` remains red outside the
     task's file lease.
  2. Save/refresh/revision/audit mutation proof is not current because the task
     prohibited shared Supabase-data changes.
  3. Native Arabic linguistic certification remains open; the implementation
     proves RTL and localized behavior, not linguistic sign-off.

This evidence supports a draft PR and independent review. It does not support
a completion, merge, deployment or sponsor-acceptance claim.
