# HANDOFF — 2026-07-26 — pwa-visits build (`/field/visits`)

- **Task:** `SAQEEL-BOARD-DELIVERY-001`
- **Card:** `pwa-visits`
- **Requirements:** CR-100 (View Assigned Visits), CR-101 (Calendar/List/Map), CR-102 (Search, Filter & Sort)
- **Design authority:** `designs/pwa/pwa/SAQEEL PWA-Field Visits.dc.html` (verified current against DesignSync project `2d5d7422` this session)
- **Branch:** `feat/pwa-field-channel`
- **Lane:** codex, worktree `/Users/jahanarakhan/dc-pwa-visits`, branch `dc/pwa-visits`

## What this was

**A build, not a design-parity pass.** `SAQEEL PWA-Field Visits.dc.html` had never
been implemented: no `/field/visits` route, no "My Visits" surface anywhere.
`PHASE2_IPAD_DEFERRED_REGISTER.md` already names `/field/visits` as an
Inspector-iPad-owned Phase 2 route, so the path is contractual, not invented.

The board card `pwa-visits` previously read design 85 / code 92 / wiring 88. Those
numbers described the Travel and Map screens bundled onto the same card. The card
was misreporting a screen that did not exist.

Product Owner direction: replicate the built web `/visits` behaviour in the PWA,
front end per the new design, **List and Calendar** both in scope.

## Delivered

New route `/field/visits` (List) and `/field/visits/calendar` (Day/Week/Month),
with `/field/map` linked as CR-101's third view.

- CR-100 scope enforced server-side via `assignments.inspector_id` + existing RLS.
- Clean-factory allow-list (F-1101..F-6602) and golden-journey fixture exclusion.
- Search across visit reference, establishment, factory code, CR, licence (CR-102).
- Sort, risk filter, 25-row incremental pagination.
- Calendar ported from web `visits/calendar/CalendarBoard.tsx` — Sunday-first KSA
  week, `window_start` placement, `+n more` drill-into-Day.
- Negative paths: loading, empty, neutral read error (provider text logged
  server-side only), unauthorized redirect, offline via `FieldHeaderSync`.
- EN/LTR and AR/RTL both verified in-browser.

## Gate record

| Check | Result |
|---|---|
| Lease boundary | **1 breach, reverted** — see below |
| Bare colours / banned defaults / mocks | Clean |
| `tsc --noEmit` (orchestrator's own run) | No errors found |
| Runtime EN/LTR | Verified — counts match DB exactly |
| Runtime AR/RTL | Verified — true mirror, Arabic strings |
| Measured pixel diff | **NOT RUN** — see blockers |

**Lease breach.** The lane was allowed one link in `field/page.tsx`. It rewrote the
file (+283/−344), dropping `FieldScopeProvider` and `DailyBriefingCard`, and broke
typecheck with 3 errors. The file was reverted; the orchestrator later added the
single allowed link by hand (+7/−0).

**Two defects found by the orchestrator and fixed:**
1. `visits.visit_reference` (populated on all rows: `V-1518`…) was not selected;
   the card rendered a uuid fragment where the design shows `VS-40219`.
2. The `enum.*` string map listed `bulk`/`single`/`immediate`, which exist in no
   column, and omitted six real values. `periodic`, `complaint`, `follow_up`,
   `draft`, `validated`, `under_review`, and the execution modes fell through to
   the raw key in both locales. Replaced with the DB-verified domains.

Both re-verified in-browser after fix (`V-1526`, `التزام دوري`).

## Findings carried forward

- 🚩 **Seed dates are corrupt.** 1,057 of 1,491 visits are dated more than five
  years out; latest `2381-08-10`. The inspector's 10 assignments fall in 2039–2091,
  so the design's default *Today* tab is legitimately empty and everything lands in
  *Upcoming*. Not a build defect. Needs a seed fix as separate work.
- **`visits.priority` is `high` (13) / `normal` (5) / `null` (1,473).** There is no
  `medium` and no `low`. `normal` is outside the canonical lookup; it renders no
  badge and joins no risk chip, which is correct under zero-assumption but means
  5 rows are invisible to the risk filter. Lookup drift worth reconciling.
- **`enum.new` and `enum.submitted` have no Arabic** in `ui_strings`, and those are
  the only two operational states the inspector's visits carry. The AR badge falls
  back to English. Governed content for `/admin/localization` — not to be invented.
- **CR-101 "New visits appear only in Assignment Pool"** is implemented by excluding
  `operational_state = new` from the Calendar while the List shows all assigned
  visits. This is a judgment call, recorded as such.
- **No PWA `.dc.html` exists for the Calendar.** Its behaviour follows the web
  reference; its appearance reuses the PWA segmented-control, card and badge
  vocabulary. Recorded as judgment, not transcription.

## Blockers

- **Measured pixel diff not run.** The `inspector.test@mim.gov.sa` blank-password
  fixture had been rotated, so the pixel harness could not authenticate — this is
  the real cause of the historical all-null pixel evidence previously attributed to
  a cold dev server. The fixture was restored this session with Product Owner
  approval (`crypt('', gen_salt('bf'))` direct on `auth.users`), and sign-in is
  verified working, but the harness itself has not been re-run.
- **No lease existed for `pwa-visits`.** It appears in neither the granted nor the
  queued lease list in `CURRENT_SLICE.yaml`. Work proceeded on explicit Product
  Owner instruction; the lease record should be reconciled.

## Next action

Run the pixel harness against `/field/visits` in both locales now that
authentication works, and reconcile the `pwa-visits` lease record.
