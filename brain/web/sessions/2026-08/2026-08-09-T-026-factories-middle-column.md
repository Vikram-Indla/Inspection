# 2026-08-09 · T-026 — `/factories` middle column: header facts and snapshot

`task: T-026` · `status: done (static verification only)` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011`

---

## Goal

Third `/factories` slice: the **middle column**. Add the reference's header fact
row and snapshot hero, and cut what the screen was showing twice or could never
fill.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/sections/factories/factory-snapshot/**` | created | 46 + 88 |
| `components/sections/factories/factory-overview/factory-overview.tsx` | rebuilt | 159 → 104 |
| `components/sections/factories/factory-overview/factory-overview.module.css` | trimmed | −14 |
| `features/factories/portfolio-counts.ts` | extended — products, last inspection | 75 → 109 |
| `features/factories/portfolio.ts` | `FactoryRow` gains `employees_total` | +1 |
| `app/(app)/factories/page.tsx` | `employees_total` added to the select | +0 |
| `app/(app)/factories/RevampFactory360Portfolio.tsx` | modified | +50 |
| `i18n/locales/{en,ar}/factories.json` | 16 added, 9 orphans removed | 95 keys, parity |

## What the reference's snapshot asked for, and what exists

| Metric | Source | Shipped |
| --- | --- | --- |
| Risk score | `factories.risk_score` | **real**, toned by condition |
| Latest inspection | `inspections.submitted_at ?? started_at` via `visits.factory_id` | **real** — a new read |
| Open violations | already computed in T-024 | **real** |
| Active penalties | already computed in T-024 | **real** |
| Employees | `factories.employees_total` | **real** |
| Products | `factory_products` row count | **real** — a new read |
| **Compliance rate** | **no column exists anywhere** | **dropped** |
| **Machines** | **no table exists** | **dropped** |

Compliance and machines are removed rather than stubbed, on the precedent the
owner set for Compliance % on the start panel: a slot that can only ever read
"Not available" is noise, not honesty. Six real metrics instead of eight, two of
them fabricated.

### The condition reasons are derived, not written

The reference hard-codes its bullets ("Fire Alarm test expired", "104 days since
last visit"). Ours are computed from records that exist:

- `{n} open violations recorded` — when the count is above zero
- `Last inspection {n} days ago`, or `No inspection has been recorded`
- `Industrial licence has expired` / `expires within {n} days`

When nothing is raising the condition the panel says so, rather than padding the
list. The band itself still comes from `conditionOf(risk_band)` — unchanged.

## What was removed as duplicated or dead

The owner's ask was as much about subtraction as addition:

1. **The standalone provenance card** in the middle column — the end panel
   already carries provenance in its own card (T-025). It was the same three
   lines twice on one screen.
2. **The condition card** — its four facts were the risk score and band
   (now the snapshot's first metric and its condition band) plus
   `Approved compliance: Not available` and `Open violations: Not available`,
   both of which are now either real in the snapshot or gone.
3. **The snapshot facts card** — factory code, CR, region and city were already
   in the hero's sub-line, and licence state moved into the new header fact row.
4. **Create Inspection / View on Map are not repeated.** They stay in the hero,
   once, as the owner asked. `Export PDF` from the reference is **not** added —
   there is no PDF export to call.

`factory-overview` fell from 159 lines to 104, and nine orphaned string keys plus
two dead CSS classes went with it.

## Corrected after owner review — snapshot layout, and a global type-scale change

### The metric grid was broken

Two faults compounded:

1. **The columns were sized from a spacing token.** `repeat(auto-fit,
   minmax(var(--sqx-space-13), 1fr))` — 6 rem tracks — produced a six-column row
   in the middle column, far narrower than any label needed, so labels wrapped
   and the row left a ragged gap after wrapping.
2. **Every value used the display-size `--sqx-text-metric` role.** At 28 px,
   "Never inspected" and "Not available" were physically wider than their track
   and spilled across their neighbours — the overlap in the screenshot.

Fixed by a **fixed column count** (`repeat(4, minmax(0, 1fr))`, two at narrow),
which needs no length token at all, plus a `kind` on `FactoryMetric`:
`number` keeps the metric role, `text` drops to `--sqx-text-body-strong` in the
secondary colour. That is also the honest hierarchy — at display size, "Not
available" was the loudest thing in the card, which is the opposite of what an
absent value should do. A `null` metric now renders as `text`, so absence never
shouts.

### Type scale reduced by 2 px across every role (owner request)

| Role | Was | Now |
| --- | --- | --- |
| display | 40 px | 38 px |
| title | 30 px | 28 px |
| heading | 22 px | 20 px |
| subheading | 17 px | 15 px |
| body-lg | 16 px | 14 px |
| body / body-strong | 15 px | 13 px |
| label | 13 px | 11 px |
| caption / code | 12.5 px | 10.5 px |
| overline | 11 px | **9 px** |
| metric | 28 px | 26 px |

One uniform `-0.125rem` step, applied only to the `-size` tokens in the
primitives block — line heights, weights and tracking are untouched, so every
role keeps its proportions.

**Two concerns recorded, not resolved** (the owner asked for a uniform step and
got one):

- **Overline is now 9 px and caption 10.5 px.** Overline is also uppercase with
  `0.12em` tracking, which is the hardest combination to read at small sizes.
  This is a Saudi ministry platform targeting WCAG 2.2 AA; nothing in WCAG sets
  a minimum size, but 9 px is below what most public-sector guidance accepts.
- **Body dropping to 13 px moves text across the WCAG "large text" boundary.**
  Contrast ratios recorded against the old scale assumed some roles qualified as
  large text (≥ 24 px, or ≥ 18.66 px bold), where 3:1 suffices. `heading` at
  20 px bold still clears it; `subheading` at 15 px semibold no longer does, so
  any pair relying on 3:1 there now needs 4.5:1. **The recorded ratios in
  `saqeel.css` should be re-checked against the new sizes.**

A floor on the two smallest roles (say 10 px overline, 11 px caption) would keep
the reduction everywhere it reads well. That is the owner's call, not mine.

## Inventory taken before writing code

- **Client islands:** unchanged. `factory-snapshot` is presentational and
  composed through a `snapshot` slot, so the client boundary stays where it was.
- **Literals:** none. The one raw value is `@media (max-width: 75rem)`, matched
  deliberately to `DataTable`'s breakpoint so the snapshot collapses with the
  rest of the screen.
- **Accessibility:** the condition band tints only the panel's inline-start
  border — a filled critical block behind the reason list made the text the
  least readable thing in the card. Metric tone is redundancy: the label always
  names the figure. Metrics are a `<dl>` with `column-reverse` so the value reads
  above its label while the DOM keeps `<dt>` before `<dd>`.
- **No `any`, no `as`:** the two new reads narrow through the existing
  `isRecord` predicates in `portfolio-counts.ts`.

## Numbers

```
Route: /factories
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
cards in the middle column  5 → 2 (hero, snapshot) + the four disclosures
new queries     2 (factory_products, inspections via visits), both batched into
                the existing portfolio-counts round trip
```

## Accessibility

- axe: **NOT RUN.**
- Manual checklist (WEB-003 §10): **not performed.** Both themes and RTL, and
  the snapshot's two-column split at `75rem`.

## Verification

- [x] `npm run typecheck` — zero errors, whole repo.
- [x] `npm run check:design-system-v5` — zero findings in changed files.
- [x] i18n parity — 95 keys, `en` + `ar`, nine orphans removed.
- [ ] `npm run lint` / `npm run gates` — no such scripts (T-000).
- [ ] `npm run test:e2e` — not run.
- [ ] **The two new reads have never executed.** `inspections` filtered through
      `visits!inner(factory_id)` is the same shape as T-024's violations join,
      which is also still unproven.

## Parked

- **"Latest inspection" is the most recent inspection of any state.** A started
  but unsubmitted inspection counts. If the product means *completed*, the read
  should filter on `submitted_at` alone — a one-line change once ruled.
- **Machines has no table and compliance has no column.** Both are absent from
  the schema entirely, so neither is a UI gap.
- **`factory-overview` still owns the four disclosure sections**, which only
  link into the dossier. They are the next thing to either fill or remove.
- **`e2e/factory360-provenance-contract.spec.ts`** asserted against the
  provenance block that this task deleted from the middle column. It was already
  flagged fragile; it is now very likely red.

## Blocked / open questions

None.

## Proposed commit

```
feat(factories): snapshot hero and header facts in the middle column
```

## Next

The four disclosure sections, or `/factories/cr/[id]`, which is untouched legacy.
