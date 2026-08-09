# 2026-08-09 · T-021d — Shared date presets, visit-status pill, ping geometry

`task: T-021d` · `status: done (static verification only)` · `duration: ~1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011`

---

## Goal

Three owner-reported issues: the Visit Management range filter had no presets,
visit status rendered as bare text, and the ping dot was not reliably circular
or concentric.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/saqeel/date-range-picker/date-range-presets.ts` | created | 28 |
| `components/app-shell/shell-topbar/shell-scope-controls.tsx` | modified | 94 → 85 |
| `components/app-shell/shell-topbar/shell-topbar.tsx` | modified | +3 |
| `components/sections/visits/visit-management-screen/visit-management-screen.tsx` | modified | 150 → 151 |
| `app/(app)/planning/page.tsx` | modified — 5 lines of inline presets → 1 | −4 |
| `features/visits/rows.ts` | modified — operational tone map | 107 → 119 |
| `components/sections/visits/visit-board/visit-table.tsx` | modified | 97 → 101 |
| `components/sections/visits/visit-board/visit-spine.tsx` | modified | 46 → 46 |
| `components/saqeel/ping-dot/ping-dot.module.css` | modified | 67 → 80 |
| `i18n/locales/{en,ar}/common.json` | extended — 9 keys each | 39 keys, parity |
| `i18n/locales/{en,ar}/planning.json` | trimmed — 2 orphaned keys | 261 keys, parity |

## The three fixes

### 1 · One preset set, defined once — and the "common header" was broken

The Visit Management picker was passing `datePresets={[]}`. `/planning` built
its own three future-only presets inline. The shell built seven inline. Three
call sites, three vocabularies.

They now all read `date-range-presets.ts`, beside the primitive that consumes
them: `pastDateRangePresets` (Today · Last 7 days · Last 30 days · Last 90 days
· Last year), `upcomingDateRangePresets` (Next 7/30 days) and
`windowDateRangePresets` (both). Labels live once in `common.scope`, `en` + `ar`.

**The shell's picker was not working.** `ShellScopeControls` declared 16 required
string keys; `shell-topbar` passed 8 — and never passed `locale` at all. That was
the long-standing `shell-topbar.tsx:81` typecheck error I had been reporting as
pre-existing for two sessions. It was masking a real defect: five of the seven
presets rendered with `undefined` labels, and the picker formatted its range and
calendar with an undefined locale, so Arabic-Indic digits never appeared in the
topbar. Both are fixed. **`npm run typecheck` is now clean across the whole
repository** — the first time on this branch.

Two of the shell's old presets were also **mislabelled**: `yesterday` was
`days: 2` (a span *ending today*, so "today and yesterday"), and `thisMonth` /
`thisQuarter` / `thisYear` were plain 30/90/365-day spans, not calendar periods.
The picker only expresses "N days ending/starting today", so those labels
promised behaviour it cannot deliver. They are renamed to what they actually do
(Last 30/90 days, Last year) rather than kept as a lie — WEB-008 §1: never
present a value the system does not really produce. Calendar-period presets
would need month-boundary maths the primitive does not have; that is a change
request, not a relabel.

`/planning` keeps its forward-looking presets — it filters a visit **window**
that spans past and future, so `windowDateRangePresets` gives it both. Dropping
"next 7/30 days" in the name of consistency would have removed the planner's
primary filter.

### 2 · Visit status is a pill, not text

`operationalState` rendered as bare text in the table while planning status
beside it was a `StatusPill`. It is now a pinging `StatusPill` in both the table
and the selected-visit spine, via a new `VISIT_OPERATIONAL_TONE` map over the
governed `operational_state` enum (`new` · `prepared` · `on_the_way` · `arrived`
· `executing` · `submitted` · `under_review` · `closed`, from
`0001_foundation.sql` plus two later `add value` migrations).

The tones are **presentation, not governed values**: progress reads `info`,
active work `accent`, `under_review` `warning` (a human decision is owed),
`closed` `success`, `new` `neutral`. Unknown values fall back to `neutral`
rather than throwing or inventing.

### 3 · Ping dot — circular and concentric by construction

- `aspect-ratio: 1` on the root. The explicit sizes were never the guarantee: a
  flex or grid parent that stretches its children left the box taller than it was
  wide, and the "circle" rendered as an ellipse. Now it cannot.
- `vertical-align: middle`. The root is `inline-flex`, so it sat on the text
  baseline — which is what read as the dot being off-centre inside the pill.
- `transform-origin: center` stated explicitly on the wave. It is already the
  default, so this changes nothing today; it means a future transform on an
  ancestor cannot quietly move the origin and make the expansion eccentric.
- `will-change: transform, opacity` — the animation is already compositor-only
  (WEB-010 §2); this keeps it on its own layer so the scaled edge is not
  re-rasterised each frame, which is the other thing that makes a small circle
  look ragged.

No token added, no literal introduced.

## Inventory taken before writing code

- **Literals:** none. Every value in the touched CSS is `var(--sqx-*)`, verified
  by extracting the full token list from `ping-dot.module.css`.
- **Governed values:** the `operational_state` enum was read from the migrations
  rather than guessed; only the tone mapping is authored, and it is presentation.
- **Orphans:** `planning.filter.presetNext7` / `presetNext30` became unreachable
  and are deleted from both locales. `presetToday` is **kept** — it still labels
  the `DatePicker`'s today action, which is not a range preset.

## Numbers

```
Route: /visits · /planning/visits · /planning · every route (shell topbar)
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
client islands  unchanged
inline preset definitions  3 call sites → 1 module
```

## Accessibility

- axe: **NOT RUN.**
- Manual checklist (WEB-003 §10): **not performed.** All three are visual.
- Worth noting for the browser pass: visit status becoming a pill adds a second
  pinging element per row. On a dense board that is up to two animations × 100
  rows. `prefers-reduced-motion` hides the wave entirely, but the motion budget
  at full row count wants a real look (see Parked).

## Verification

- [x] `npm run typecheck` — **zero errors, whole repo.** The `shell-topbar`
      error reported as pre-existing in T-021a and T-021c is fixed here.
- [x] `npm run check:design-system-v5` — zero findings in changed files.
- [x] i18n parity — `common` 39 keys, `planning` 261 keys, both locales, no drift.
- [ ] `npm run lint` / `npm run gates` — still no such scripts (T-000).
- [ ] `npm run test:e2e` — not run.

## Retirement

Nothing newly marked.

## Parked

- **Calendar-period presets** ("this month", "this quarter", "this year") do not
  exist, because `DateRangePreset` only expresses "N days from today".
  Reintroducing them needs month-boundary maths in the primitive and a decision
  on whether periods are Gregorian or Hijri — a Saudi ministry platform should
  not assume (WEB-011).
- **Two pinging pills per visit row.** Planning status and visit status now both
  ping. At 100 rows that is 200 infinite animations. They are compositor-only and
  reduced-motion-safe, but if the board feels busy the answer is a rule about
  *which* pill pings, not switching one back to text.
- **`ShellScopeControls` had a 16-key strings contract that no call site
  satisfied.** It typechecked as an error for at least two sessions and was
  carried as "pre-existing". A type error in a shared component is a live defect
  until proven otherwise — this one was hiding two.

## Blocked / open questions

None.

## Proposed commit

```
fix(saqeel): share date presets, pill visit status, true-circle ping
```

## Next

**T-021b** — bulk-action forms still hold native `<select>` and
`datetime-local`; the four sibling visit views are untouched legacy.
