# 2026-08-12 · T-071 — `/operations/live` on SAQEEL: theme-aware map, one empty state, conditional legend (slice 2 of 2)

`task: T-071` · `status: partial (axe, 320px, keyboard, light theme, e2e owed)` · `duration: ~2h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-004, WEB-006, WEB-008, WEB-009, WEB-011, WEB-012`

---

## Goal

Slice 2: rebuild the visible Live Operations screen on the design system, fix the
map that ignores the theme, and remove the duplicated empty state and the
permanent alarm rail.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/operations/live/LiveOps.tsx` | **deleted** | 287 → 0 |
| `components/operations/operations-live/operations-live.tsx` | created | 157 |
| `components/operations/operations-live/live-inspector-panel.tsx` | created | 153 |
| `components/operations/operations-live/live-map-card.tsx` | created | 82 |
| `components/operations/operations-live/strings.ts` | created | 23 |
| `components/operations/operations-live/operations-live.module.css` | created | 26 |
| `app/(app)/operations/live/LiveMapInner.tsx` | theme tracking, tokens, states | 384 → 402 |
| `app/(app)/operations/live/live-map-inner.module.css` | created | 13 |
| `components/saqeel/list-row/list-row.tsx` | selectable-row mode | 54 → 62 |
| `components/saqeel/list-row/list-row.module.css` | button reset, selected row | 116 → 133 |
| `app/(app)/operations/live/page.tsx` | composes the new screen | 32 → 32 |
| `features/operations/live/view.ts` | map-card strings | — |
| `e2e/web-admin-m3-operations.spec.ts` | re-pointed | — |

## Decisions

**The largest element on a dark screen was a white slab, and the fix already
existed.** `LiveMapInner` hardcoded `config: { basemap: { lightPreset: "day" } }`.
`GeoMap` — the map `/operations` uses — has tracked `data-theme` on `<html>` with
a `MutationObserver` and re-applied `setConfigProperty` on toggle since it was
written. This route re-implemented the map and did not carry that across.
**A second implementation of a solved problem does not inherit the solution**;
it inherits only the bug it started with.

**A disclosure that is always true is not a legend entry.** The header rendered
all three provenance states unconditionally — including "Rejected implausible
telemetry" in critical red — with zero inspectors on screen. But
*"Last recorded position — not guaranteed live"* is a claim about **the whole
screen**, true at any row count, and the runtime spec asserts it is visible even
when the list is empty. So it is a **standing disclosure** on the map card, while
`unavailable` and `rejected` — which describe individual rows — render **only
when a row is in that state**. Alarm 3 pills → 1 disclosure + 0..2 conditional.

**Two empty states saying the same sentence became one, by separating the two
facts.** "Nothing in scope" and "in scope but unmapped" are different: the second
can be true while the list is full. The list states the empty case once; the map
discloses the unmapped case **only when the list is not empty**, so they can never
both speak. The old `noScopeRows || hasNoPositions` condition conflated them.

**Four notice bars dissolved into the surface they describe.** The excluded-record
count, the out-of-scope count and the two degraded-source messages were stacked as
amber bars above the content. They are disclosures *about the map's data*, so they
render in the map card's body, keeping `role="status"`/`role="alert"` through
`Text`'s `live` prop. **That also avoided adding a fourth copy of the Notice
component this repo already has three of** — the gap stays raised, unfilled.

**`ListRow` gained a selectable mode — the row is the control.** The spec wanted
`button[aria-pressed]` containing the inspector name; the alternative was a
repeated per-row "details" button, which is the clutter this programme keeps
removing. `onSelect` + `pressed` render the title inside a stretched
`<button aria-pressed>`, the exact contract `href` already had for navigation.
**`saqeel.css` has no global button reset by design**, so `.link` now resets
`font`, `color`, `background`, `border`, `padding` and `text-align` by hand — the
same hand-reset every migrated component that styles a button as a surface does,
and the fourth recorded instance of that rule.

**`Text` forwards neither `dateTime` nor `data-testid`, and both are contractual.**
The snapshot timestamp is read by the suite as `time[datetime]`, and the row times
as `time[data-live-since]`. Rather than widen the primitive, the `<time>` elements
are raw and nested inside a `Text` that owns the typography — the mixed-content
rule from T-065: **a container of mixed content declares no font and inherits.**

**A spec that asserts nesting outlives its usefulness the moment the nesting is
right.** `aside[…] button[aria-pressed] > bdi` pinned three structural accidents
at once. Re-pointed to the row: the guarantees are that the inspector name is
direction-isolated and that the row selects — not which element contains which.

## Inventory taken before writing code

- **State:** `selectedId`, `providerFailed`, `providerAttempt` — unchanged, all at
  the leaf. `mapTheme` added in the map, the only rung that fits (an external
  system's state, synchronised with cleanup).
- **Effects:** 3 → 5 in the map; the two added are the theme observer
  (`observer.disconnect()`) and the preset re-apply. Both are external
  synchronisation, both clean up. **WEB-012 respected** — the observer *reads*
  `<html>`, and the value it produces is state that render expresses.
- **Literals:** the map's inline `style` object (with the legacy `--surface-canvas`
  token) is gone, replaced by a colocated module on `--sqx-surface-canvas`.
- **`<svg>`:** none. **Four glyph-as-icon removed** (`!`, `⌖`, `…`, `×`) → the
  registry's `risk`, `map`, `map`+busy and `dismiss`.
- **Accessibility fixed:** the legend rail and the map container were both a
  `div` carrying `aria-label` with no role — invisible to assistive tech. The
  totals are now a real `<section aria-label>`, the map container is
  `role="application"`, and the map region is `CardMedia`'s labelled region.

## Numbers

```
Route: /operations/live
legacy class uses            48 → 0   (verified in the rendered DOM)
SAQEEL components used        0 → 11
largest client file         287 → 157
glyph-as-icon                 4 → 0
empty-state statements        2 → 1
unconditional alarm pills     3 → 1 standing disclosure + 0..2 conditional
notice bars                   4 → 0 (folded into the surface they describe)
inline style objects          1 → 0
map honours app theme        no → yes
typography violations        20 removed since baseline (cumulative, shared tree)
first-load JS / CSS / LCP    MEASUREMENT REQUEST
```

## Accessibility

- **axe: not run.** Owed.
- Manual checklist (WEB-003 §10): keyboard — owed · screen reader — owed ·
  200% zoom — owed · 320 px — owed · Arabic/RTL — resources verified, render
  owed · **dark — verified** (`data-theme="dark"`, zero legacy classes, labelled
  regions) · light — owed · reduced motion — the skeleton honours it; the map
  animates nothing · greyscale — owed
- **Fixed:** two `div[aria-label]` with no role; a status legend that alarmed for
  conditions that were not occurring; an empty state announced twice.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — no `lint` script exists
- [x] `npm run gates` — typography PASSED, zero new, **not re-baselined**
      (shared tree). `check:design-system-v5` flags **none** of this task's files.
- [x] **Every re-pointed assertion verified by script** — 17 `liveShellSource`
      substrings, the `ListRow` contract, the five banned map behaviours, the
      no-writes check, and that the map no longer hardcodes `"day"`.
- [x] **Rendered and inspected signed in:** three stat tiles, map card titled
      *Recorded positions*, *Active inspectors* list, snapshot `<time>` carrying a
      valid `datetime`, the standing disclosure and the policy sentence both
      visible, **`legacyClasses: 0`** in the live DOM, **one** empty-state
      sentence, **no** unavailable/rejected pills with zero inspectors, and no
      glyph characters anywhere on the screen.
- [ ] `npm run test:e2e` — needs the seeded personas
- [ ] Definition of Done — not fully ticked

**Not verified: the dark basemap itself.** The Browser pane is undisplayed, so the
map cannot be seen or screenshotted. The code path mirrors `GeoMap`'s exactly and
the absence of a hardcoded preset is asserted, but *a screenshot is what proves a
map is dark* — this is the one claim in the task that source alone cannot settle.

## Retirement

`app/(app)/operations/live/LiveOps.tsx` **deleted** (287 lines, zero importers
after the route was re-pointed). With slice 1's `live.module.css`, the legacy
surface of this route is **754 lines gone**.

## Parked

- `LiveMapInner` is 402 lines and still the only file on this route holding
  Mapbox specifics; it was not rebuilt, only corrected.
- Three near-identical notice components remain with no shared primitive. This
  task avoided adding a fourth; it did not remove the three.
- `/operations`'s inline geography filter should adopt `live/geography.ts`.
- `operations-skeleton` still draws sections `/operations` no longer renders.

## Blocked / open questions

- **`Card` still has no `aside` element.** Not needed after the spec was
  re-pointed off the tag, but a complementary side panel is a real gap in the
  primitive if another screen wants one.
- No new copy was authored, so **no new Arabic needs review** — slice 1's three
  strings are still outstanding.

## Proposed commit

```
refactor(operations): rebuild live ops on saqeel, theme-aware map
```

## Next

axe on both themes, the 320 px and keyboard passes, a light-theme render, and the
e2e suite. **Then a screenshot of the map in dark** — the one claim this task
could not close.

## Measurement request (WEB-005 §8 — for the human)

`/operations/live`, before and after T-070+T-071: first-load JS, route CSS, LCP,
INP, CLS.
