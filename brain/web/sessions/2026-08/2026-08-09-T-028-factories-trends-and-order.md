# 2026-08-09 · T-028 — `/factories` risk trend, and the disclosures moved last

`task: T-028` · `status: done (static verification only)` · `duration: ~1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-011`

---

## Goal

Add the reference's **Trends** block under penalties, and move the four
disclosure sections to the very end of the middle column.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/sections/factories/factory-trends/**` | created | 71 + 79 |
| `components/sections/factories/factory-sections/**` | created (extracted) | 37 + 78 |
| `components/sections/factories/factory-compliance/factory-compliance.tsx` | `trends` slot | 137 → 143 |
| `components/sections/factories/factory-overview/factory-overview.tsx` | disclosures removed | 104 → 75 |
| `features/factories/risk-context.ts` | series of 6, oldest first | +8 |
| `app/(app)/factories/RevampFactory360Portfolio.tsx` | modified | 336 → 361 |
| `i18n/locales/{en,ar}/factories.json` | +12 keys each | 127 keys, parity |

**New middle-column order:** hero → snapshot → compliance (reports, violations,
penalties, **trends**) → the four disclosures, last.

## The risk trend is real; the compliance trend cannot be

| Reference | Source | Shipped |
| --- | --- | --- |
| Risk trend — `81 current · +19 pts`, four bars | `factory_risk_snapshots.score` history | **real** — up to six recorded calculations, oldest first, with the delta against the previous one |
| Compliance trend — `85% current · +6 pts` | **no compliance score exists for a factory** | **"Not available"**, with the reason stated |

The compliance trend is kept as a titled block rather than dropped, because the
absence is the useful information here: it tells a reader the series does not
exist rather than leaving them to wonder where it went. That differs from
Compliance % on the start panel — a **row in a fact list** reading "Not
available" is noise, but a **named section** that explains why is an answer.

### The chart is data, not decoration

- Bars are an `<ol>`; each carries a **visually-hidden label with its recorded
  score and date**, so the series is fully readable without seeing the chart
  (WEB-003 — a chart gets an accessible alternative).
- Height comes from `--sqx-trend-value`, a **bare number** consumed in
  `calc(var(--sqx-trend-value) * 1%)`. That is the same shape `SegmentedControl`
  uses for `--sqx-segment-index`: the component supplies **data**, never a
  length, so no visual literal enters a component (WEB-000 §7). A
  `max(var(--sqx-space-2), …)` floor keeps a very low score visible.
- The score is charted on its own governed 0–100 scale, not normalised to the
  series maximum — normalising would make a flat, low-risk history look dramatic.
- Direction tone is **derived**: rising → `danger`, falling → `success`, no
  change or a single calculation → `neutral`. A factory with one snapshot reads
  "First recorded calculation", not a fabricated delta.

## Decisions

1. **The disclosures moved to a component of their own.** They were embedded in
   `factory-overview`, which made ordering them after compliance impossible
   without passing compliance *into* the overview. `factory-sections` takes the
   styles with it; `factory-overview` drops to 75 lines and is now just hero +
   snapshot slot.
2. **Six snapshots, not four.** The reference draws four bars because it has
   four numbers. Ours takes what the engine recorded, up to six, and draws
   exactly that many — no padding, no interpolation.

## Inventory taken before writing code

- **Client islands:** unchanged.
- **Literals:** none in either new module.
- **`<svg>`:** none — the chart is CSS-sized list items, not a graphic.
- **Accessibility:** the chart's `<ol>` has an accessible name; every bar has a
  hidden text label; tone is redundancy (the delta text states the direction).

## Numbers

```
Route: /factories
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
new queries     0 — the trend reuses the existing snapshot read, widened from
                2 rows per factory to 6
```

## Accessibility

- axe: **NOT RUN.**
- Manual checklist (WEB-003 §10): **not performed.** The chart wants a check
  with `prefers-reduced-motion` (it has no animation, so it should be inert),
  at 200 % zoom, and in RTL — the series must read oldest-first from the
  inline-start edge in both directions.

## Verification

- [x] `npm run typecheck` — zero errors, whole repo.
- [x] `npm run check:design-system-v5` — zero findings in changed files.
- [x] i18n parity — 127 keys, `en` + `ar`.
- [ ] `npm run lint` / `npm run gates` — no such scripts (T-000).
- [ ] `npm run test:e2e` — not run.

## Parked

- **`RevampFactory360Portfolio.tsx` is 361 lines against a 200-line limit,
  ceiling 400.** It was 170 three slices ago and is now almost entirely view-model
  construction. **This is the last slice that can be added before it breaches**
  — the next `/factories` task must be the extraction into `features/factories/`.
- **The chart does not mirror its axis in RTL.** Flex order follows the writing
  direction, so oldest-first should already read from the inline-start edge, but
  this has not been seen rendered.
- **No compliance score exists**, so the compliance trend cannot be built at any
  point without a schema change — it is not a UI gap.

## Blocked / open questions

None.

## Proposed commit

```
feat(factories): risk trend chart and compliance section ordering
```

## Next

**Extract the `/factories` view models** — this is now blocking, not optional.
