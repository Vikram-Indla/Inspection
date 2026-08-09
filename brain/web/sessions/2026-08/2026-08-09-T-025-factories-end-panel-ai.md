# 2026-08-09 · T-025 — `/factories` end panel: risk explanation and AI advisory

`task: T-025` · `status: done (static verification only)` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011`

---

## Goal

Second `/factories` slice: rebuild the **end (right) panel** with the sections
the vendor mock's `buildAiSide` shows — using only data the platform actually
records, and the governed AI path that already exists.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `features/factories/risk-context.ts` | created | 97 |
| `components/sections/factories/factory-ai-advisory/**` | created | 67 + 44 |
| `components/sections/factories/factory-context/factory-context.tsx` | rebuilt | 64 → 93 |
| `components/sections/factories/factory-context/factory-context.module.css` | extended | +30 |
| `components/sections/factories/factories-skeleton/factories-skeleton.tsx` | mirrors the taller panel | +2 |
| `app/(app)/factories/RevampFactory360Portfolio.tsx` | modified | +55 |
| `app/(app)/factories/page.tsx` | modified — risk columns + snapshot query | +5 |
| `features/factories/portfolio.ts` | `FactoryRow` gains the three risk columns | +3 |
| `i18n/locales/{en,ar}/factories.json` | `context.*` added, orphaned `ai.*` removed | 84 keys, parity |

## Mapping the mock's AI panel onto real data

| Mock section | Our data | Shipped |
| --- | --- | --- |
| AI Assistant · Factory Summary | the **existing** `factory_risk_explanation` surface, which re-reads persisted risk and snapshots under the caller's RLS | **AI advisory**, generated on demand |
| Why High Risk (weights and contributions) | `factories.risk_drivers` — the recorded breakdown, exactly what the mock invents | **real** — reuses `FactoryRisk` |
| Latest Changes | the two most recent `factory_risk_snapshots` | **real** — "Risk moved from X to Y on <date>" |
| Last Synchronization | `factories.source_synced_at` | **real** — already in the source card |
| Data Sources (✓ list) | Senaei sync recorded? · risk calculation recorded? | **real** — two honest states, not three ticks |
| **Predicted Risk** ("projected 87–90 next cycle") | **no forecasting model exists** | **"Not available"**, with the reason stated |
| Top Risks ("fire alarm overdue by 41 days") | mock-invented specifics we do not hold | **replaced** by the recorded driver breakdown |
| Recommended / Next Best Action | a recommendation | folded into the AI advisory, never asserted as fact |

## Decisions

1. **`FactoryRisk` is reused, not rebuilt.** It already existed for
   `/factories/[id]` — score, band pill, model-version facts, driver lines and
   an explicit "no driver snapshot" state. That *is* the mock's "Why High Risk"
   section, so the end panel composes it rather than growing a second one
   (WEB-002 §9, never build what exists).
2. **The AI advisory reuses `generateContextualInsight`.** `factory_risk_explanation`
   is an existing surface whose prompt is already constrained to *"Explain the
   recorded score, band, model version and stored driver values… Do not
   recalculate risk, infer a cause, assign a priority, or recommend an
   enforcement, licensing or inspection action."* `factory-ai-advisory` is
   presentation only — a client island with `accent="ai"`, the advisory pill,
   and the standing note that the provider supplies no calibrated confidence.
   Fail-closed without a key: the action's neutral message renders in a
   `role="alert"` and nothing is generated or stored.
3. **Predicted risk is a stated absence, not a hidden one.** The mock's forecast
   is the single most tempting thing to fabricate. There is no forecasting model,
   so the panel says so and explains that only recorded calculations are shown.
4. **Two snapshots, not a trend.** `queryFactoryRiskMovement` keeps the two most
   recent per factory — a movement needs a before and an after, and anything
   further would be a trend line the risk engine has not published.
5. **Data sources are two real states, not three green ticks.** The mock shows
   Inspection Platform / Senaei / Risk Engine all ✓ unconditionally. We show
   Senaei (synced / not synced from `source_synced_at`) and the risk engine
   (calculated / not calculated from the snapshot presence). A tick that is
   always green tells the reader nothing.
6. **`toDriverLines` reconstructs nothing.** A driver missing `value`, `weight`
   or `contribution` prints the missing marker for that part; the line is not
   dropped and no figure is inferred.

The `factories.ai.*` strings ("Contextual AI · Provider output withheld") became
unreachable when the placeholder card was replaced, and are deleted rather than
left to rot.

## Inventory taken before writing code

- **Client islands:** +1 (`factory-ai-advisory`). `factory-context` stays
  presentational and takes `risk` / `advisory` as slots, so the server/client
  boundary is at the leaf.
- **Literals:** none in either new module.
- **`<svg>`:** none — the advisory heading uses `Icon name="ai"`.
- **Accessibility:** every section is a `Card as="section"` with
  `aria-labelledby` on an `h2`; data-source states are `StatusPill`s (text plus
  shape); the advisory error is `role="alert"`. Dates go through
  `formatDate(iso, locale)`.
- **No `any`, no `as`:** the snapshot read narrows through `isRecord` predicates;
  `risk_drivers` is typed `unknown` on `FactoryRow` and narrowed inside
  `toDriverLines`.

## Numbers

```
Route: /factories
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
client islands  1 → 2 on this screen (portfolio, ai-advisory)
new queries     1 (factory_risk_snapshots over the portfolio ids, skipped when
                empty), run in parallel with the portfolio counts
```

## Accessibility

- axe: **NOT RUN.**
- Manual checklist (WEB-003 §10): **not performed.** The end panel is now five
  cards deep and wants a pass in both themes and RTL — particularly the
  `accent="ai"` stroke, whose token resolves differently per theme.

## Verification

- [x] `npm run typecheck` — zero errors, whole repo.
- [x] `npm run check:design-system-v5` — zero findings in changed files.
- [x] i18n parity — 84 keys, `en` + `ar`; orphaned `ai.*` group removed.
- [ ] `npm run lint` / `npm run gates` — no such scripts (T-000).
- [ ] `npm run test:e2e` — not run.
- [ ] **The advisory has never called the provider from this screen.** The
      surface and action are proven elsewhere, but this call site is unexercised.

## Parked

- **The risk snapshot query loads every portfolio factory** to serve one selected
  card. Portfolios are a single CR so the set is small, but a per-selection fetch
  would be leaner if a CR ever holds many factories.
- **`FactoryRisk` is now used by two screens** (`/factories/[id]` and the end
  panel). By the Rule of Two it has earned promotion out of
  `sections/factories/`, but its copy is still Factory-360-specific.
- **The mock's "Top Risks" list has no source.** Overdue checklist items, repeat
  violations within 12 months and inspection-cycle breaches would each need a
  governed definition and a query. The driver breakdown is the honest stand-in.
- **`e2e/factory360-provenance-contract.spec.ts` asserts against raw source
  text** and was already flagged as fragile. The end panel changed
  substantially; it very likely needs updating.
- **The middle column is still largely mock-shaped**, and `/factories/cr/[id]`
  is untouched legacy.

## Blocked / open questions

None.

## Proposed commit

```
feat(factories): risk explanation and AI advisory in the end panel
```

## Next

The `/factories` **middle column**, or promoting `FactoryRisk` now that it has a
second consumer.
