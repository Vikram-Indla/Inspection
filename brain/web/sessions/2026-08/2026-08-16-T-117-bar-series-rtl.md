# 2026-08-16 · T-117 — The bar charts read left-to-right in Arabic

`task: T-117` · `status: partial — code complete, measured in both directions, axe clean; e2e owed` · `duration: ~1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-011`

---

## Goal

Owner: the bar graphs on `/dashboard` and `/analytics` must be RTL in Arabic.

T-112 fixed the *label collision* (`direction: ltr` on the tick text) but left the
plot itself laid out left-to-right — category labels on the left, bars growing
rightwards. Correct geometry, backwards reading order.

## What a mirrored horizontal bar chart actually needs

Four separate Recharts props, all flipping together. There is **no CSS route**:
the library has no writing-mode support, so `dir` on an ancestor does nothing to
the plot.

```
YAxis      orientation  "left"  → "right"     category labels move to the right
XAxis      reversed     false   → true        bars grow leftwards from that edge
BarChart   margin       swap right/left       room for the value on the correct side
tick       textAnchor   "end"   → "start"     labels read outward from the axis
LabelList  →  a custom renderer, see below
```

## Two things that had to be measured, not reasoned about

**1 · `LabelList position` is useless under a reversed axis.** Both `"left"` and
`"right"` resolved to the bar's **base**, dropping the value on top of the axis
labels:

```
bar 292→393   position="left"  put the value at 398–429   label starts at 401   COLLISION
```

**2 · Under `reversed`, Recharts keeps `x` at the base and makes `width`
negative.** Two wrong guesses before measuring settled it — `x - GAP` landed the
value inside the bar, `x - width - GAP` overshot past the labels. `x + width` is
the growing tip in **both** directions, so `ValueLabel` needs no branch for the
position at all — only the gap sign and the text anchor flip.

## What changed

| File | Action |
| --- | --- |
| `i18n/direction.ts` | created — `isRtl(locale)` |
| `components/saqeel/charts/bar-series/bar-series.tsx` | `rtl` prop; `ValueLabel` replaces `LabelList position` |
| 5 call sites | `rtl={isRtl(locale)}` |

**`isRtl` cannot live in `lib/i18n`.** That module imports `next/headers`, so a
client component reaching for it fails the build outright — which is exactly what
happened, and the dev server went to a 500 until it moved. `i18n/direction.ts`
holds a pure function over a type-only import, so a client bundle can carry it.

## Verification

Measured, both directions, `/analytics` and `/dashboard`:

```
ar   labels start 401 · bars grow 393 → 292 · values sit left of every tip
     allValuesLeftOfTip true · allValuesClearOfLabels true · 3 charts on /dashboard
en   labels end 154 · bars grow 161 → 262 · values start 268
     unchanged from before the task
```

- [x] `npm run typecheck` — 0 errors
- [x] **axe 0 violations** — `/dashboard` RTL, `/analytics` RTL
- [x] `npm run gates` — 77 v5 findings, unchanged
- [ ] `npm run test:e2e` — not run

## Decisions

**`direction: ltr` on `.tick` stays.** It looks redundant now that the anchor
flips, and it is not: SVG resolves `text-anchor` against the inline base
direction, so without it `"start"` in an RTL context extends the label leftwards
into the bars — the T-112 defect, re-created. The two work together.

## Parked

- **`Donut` and `Gauge` were not touched.** They are radial and symmetric, and
  their legends are flex rows that mirror through logical properties already.
  Verified visually, not measured.
- **`BarCell`** (the inline table bars) mirrors via flex direction; also verified
  visually only.

## Proposed commit

```
fix(charts): mirror horizontal bar charts for right-to-left readers
```

## Next

Measure `Donut`, `Gauge` and `BarCell` in RTL rather than eyeballing them.
