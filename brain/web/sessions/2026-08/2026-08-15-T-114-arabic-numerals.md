# 2026-08-15 · T-114 — Latin numerals were leaking into Arabic everywhere a number skipped a formatter

`task: T-114` · `status: partial — code complete, static gates green, measured clean on /analytics and /dashboard; e2e and a native Arabic review are owed` · `duration: ~2h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-011, WEB-013`

---

## Goal

Owner-reported: the unread-notification badge renders Latin digits under Arabic.
Audit the same defect across the shell and the two chart routes, and give the
application one place where a number becomes text.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `i18n/numbers.ts` | created | — → 27 |
| `components/notifications/notification-bell.tsx` | fixed (3 sites) | 262 → 268 |
| `components/app-shell/shell-topbar/shell-admin-palette.tsx` | fixed | 121 → 122 |
| `lib/analytics/metric-registry.ts` | locale-aware formatters + `isRateMetric` | 34 → 56 |
| `features/analytics/view.ts` | passes locale, uses explicit kind | 118 → 118 |
| `components/sections/analytics/analytics-counts/*.tsx` | fixed | 61 → 62 |
| `components/sections/analytics/analytics-breakdowns/*.tsx` | fixed | 57 → 58 |
| `components/sections/analytics/analytics-rates/*.tsx` | fixed, takes `locale` | 71 → 74 |
| `components/sections/analytics/analytics-blocked/*.tsx` | fixed (5 sites) | 128 → 130 |
| `components/sections/analytics/analytics-screen/*.tsx` | passes locale, formats period | 92 → 93 |
| `components/saqeel/charts/donut/donut.tsx` | `DonutSlice.display` added | 78 → 85 |
| `app/(app)/dashboard/dashboard-format.ts` | delegates to `i18n/numbers` | 244 → 236 |
| `components/dashboard/*` (5 files) | import repointed | — |
| `components/dashboard/operational-view/operational-view.tsx` | responsive fix | 194 → 193 |
| `i18n/locales/{en,ar}/analytics.json` | +3 unit keys each | — |

## Decisions

**`toLocaleString("ar")` returns `58`. Only `"ar-SA"` returns `٥٨`.** This is the
whole defect in one line, and it is why two of the leaks looked already-fixed:
`analytics-counts.tsx` and `analytics-breakdowns.tsx` both called
`value.toLocaleString(locale)` with `locale === "ar"`, which reads as
locale-aware code and silently emits Latin digits. The bare `ar` tag defaults to
`latn` numbering; `ar-SA` defaults to `arab`.

```
(58).toLocaleString("ar")     "58"
(58).toLocaleString("ar-SA")  "٥٨"
```

**The formatter lives in `i18n/`, not in a dashboard route folder.** T-112 put
`formatCount`/`formatPercent` in `app/(app)/dashboard/dashboard-format.ts`, which
the shell cannot import without depending on a route module. Moved to
`i18n/numbers.ts` — the parallel of `lib/dates.ts` — and every consumer repointed.

**`٪٥٠` (prefix) is kept, deliberately.** ICU's `style: "percent"` for `ar-SA`
gives `٥٠٪؜` — sign trailing, plus an invisible ALM (U+061C). Every existing
surface renders the prefix form, so moving the sign is a copy decision for the
owner, not something to slip into a numerals fix. Written into the TSDoc so the
next session does not "correct" it.

**A rate was classified by sniffing its rendered string.** `view.ts` did
`kind: display.endsWith("%") ? "rate" : "count"`. Localising the percent sign
would have made that false for every Arabic rate and **silently moved all ten
rates into the counts band**. Replaced with `isRateMetric(key)`, derived from the
formatter each registry entry already declares, so it cannot drift from what is
rendered. **This was the most dangerous thing in the task and it was two lines.**

**`Donut` took a `display` slot rather than a locale.** The primitive rendered
`{slice.value}` — a raw number inside a design-system component, which has no
locale and must not acquire one. `BarPoint` already had `display`; `DonutSlice`
now matches.

**English unit words came out of code.** `format:(v)=>\`${count(v)} factories\``
put *"factories"*, *"inspectors"* and *"h"* in `metric-registry.ts`, so they
rendered English on the Arabic page. Now `analytics.units.*` in both locales,
interpolated with `fill()`.

## Numbers

```
Latin-digit leaf nodes in <main>, Arabic locale, measured

/analytics    49 → 0     (10 remaining are AN-AC-* trace codes — machine
                          identifiers, correctly Latin per WEB-013 §3)
/dashboard     0 → 0     (closed by T-112; re-verified)
shell badge   "55" → "٥٥"

Bonus: /analytics subtitle rendered raw ISO dates —
  "من 2026-07-17 إلى 2026-08-15" → "من ١٧ يوليو ٢٠٢٦ إلى ١٥ أغسطس ٢٠٢٦"
```

## Accessibility

- **axe: 0 violations, 0 incomplete** on `/dashboard` both views, both themes,
  LTR and RTL (carried from T-112 and re-run).
- **Responsiveness swept at 320 px** — `/analytics` and `/dashboard`, EN and AR,
  plus `/dashboard` AR at 768 px. Page horizontal overflow **0 px** in every
  combination.
- **One real responsive defect found and fixed.** The inspector-capacity card
  passed a 60-character sentence to `CardHeader trailing` as a `StatusPill`,
  which measured **328 px against a 320 px viewport** and clipped. A pill is for
  a short label; WEB-014 §5 puts a sentence in `description`. Moved there, which
  fixes the overflow and uses the correct slot.

## Verification

- [x] `npm run typecheck` — 0 errors (also proves en/ar key parity)
- [ ] `npm run lint` — script still does not exist
- [x] `npm run gates` — exits 1 at **77** `check:design-system-v5` findings;
      77 before this task, 77 after, **none in any file touched**
- [ ] `npm run test:e2e` — not run

## Parked

- **`/operations` map layer leaks English landmark names into Arabic** —
  `region` names *"Operations map"* and *"Map"* render English under `dir="rtl"`,
  from `t("ops.map.workspaceLabel", "Operations map")` and Mapbox's own canvas
  label.
- **`/operations` has a duplicate landmark.** Two regions are both named
  *"المملكة العربية السعودية"* — a `<section>` and a `<div>` — which is an axe
  `landmark-unique` violation (moderate). Pre-existing, in the map layer.
- **`toLocaleString(locale)` is a repo-wide trap.** Two more call sites survive
  outside the routes audited here — `features/execution/labels.ts:35` and
  `features/factories/portfolio.ts:122` — and both use the `ar-SA` form, so they
  are correct today. Any new `toLocaleString(locale)` with a bare `ar` is a
  silent defect; a gate rule matching it is cheap.
- **The `٪` prefix is non-standard per ICU.** Recorded above; needs an owner
  ruling, not a code change.

## Blocked / open questions

The Arabic for the three new unit strings is mine, not a native reviewer's.

## Proposed commit

```
fix(i18n): render every number in the reader's numbering system
```

## Next

Decide the `٪` placement question, and sweep `/operations` and `/field` for the
same defect. Tracker item T-115.
