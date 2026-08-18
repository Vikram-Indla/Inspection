# 2026-08-16 · T-118 — `/factories` is CR-centred, so portfolio charts do not belong on it

`task: T-118` · `status: partial — review complete with evidence, numeral defects fixed; no chart built, and that is the finding` · `duration: ~1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-011, WEB-013`

---

## Goal

Owner: review `/factories` for chart candidates on the same terms as T-111/112/113
— build what the data honestly supports, keep out what would be forced — and
check responsiveness in LTR and RTL, Arabic first.

## The review, item by item

| Item | Verdict | Reasoning |
| --- | --- | --- |
| Portfolio distributions (risk band, region, sector) | **Never here** | The route is **CR-centred by contract**. |
| Risk trend over time | **Already charted** | `view.trendSeries` → `FactoryTrends` → `TrendBars`. Reads *Not recorded* only because this factory has no history. |
| Risk drivers (`value × weight = contribution`) | **Real candidate, blocked** | See below. |
| Portfolio strip (Factories · High risk · Violations · Penalties) | Keep | Four scalars for **one** CR. |
| Compliance records (reports, violations, penalties) | Keep | The records are the payload; the tables already carry them. |
| Employees · Products · Risk score | Keep | Single values. |

### Why a portfolio chart cannot belong here

`page.tsx` selects exactly one commercial registration and queries

```
portfolioQuery.eq("cr_number", selectedCr)
```

documented in the file as *CR-410/411/412 · WA-M4-AC-001 — the portfolio is
CR-centred*. The route **never holds a population to distribute**; on this
workstation the visible scope is **1 of 1 factories**. A risk-band or region
chart over one row is a single bar.

Those distributions are real and worth building — on `/analytics` or
`/dashboard`, which hold national scope. Putting them here would be forcing a
chart onto a screen whose contract forbids the data.

### The one candidate that is genuinely blocked

`toDriverLines` renders each risk driver as a **raw string**:

```ts
{ key, text: `${key.replaceAll("_", " ")}: ${value} × ${weight} = ${contribution}` }
```

`contribution` per driver is exactly a ranked-bar shape, and charting it would
also fix a defect — a reader currently has to parse arithmetic in prose to see
which driver dominates. **Blocked twice, and neither is stylistic:**

1. The driver **key is a raw database identifier** with no governed label set
   (WEB-008 §2). `humaniseEnum` would only format the identifier, not translate it.
2. **There is no driver data on this workstation** — the factory renders *Why
   this risk · Not recorded* — so a chart could not be verified against a render,
   which is the standard every other chart in this programme was held to.

Build it when a factory with `risk_drivers` is reachable **and** the driver keys
have governed labels in both locales.

## What changed — the Arabic numeral defects

The audit the owner asked for surfaced the T-114 defect class alive on this route.

```
before   من أصل 1 مصنع · strip 1 · 1 · 0 · 1 · risk 81.5 · media 0/0 · violations 0
after    من أصل ١ مصنع · strip ١ · ١ · ٠ · ١ · risk ٨١٫٥ · media ٠/٠ · violations ٠
```

| File | Action |
| --- | --- |
| `i18n/numbers.ts` | `formatDecimal` added |
| `features/factories/view.ts` | snapshot metrics + `riskCurrent` |
| `features/factories/portfolio.ts` | `toLicence` takes `locale`; `openViolations` formatted |
| `app/(app)/factories/Factory360Portfolio.tsx` | portfolio strip |
| `components/sections/factories/factories-scope-bar` | shown + total |
| `components/sections/factories/factory-profile` | media counts, takes `locale` |
| `components/sections/factories/factories-portfolio` | value types now formatted strings |

**`formatDecimal` exists because `formatCount` rounded the risk score.** Routing
the snapshot metric through the count formatter turned **81.5 into ٨٢** — caught
by re-rendering, not by the diff. `formatDecimal` keeps a fraction where there is
one and leaves whole numbers whole, so a scale of integers is never dressed up as
precise.

## Responsiveness and RTL

```
320px  ar/rtl   page overflow 0   overflowing elements 0
768px  ar/rtl   page overflow 0   overflowing elements 0   axe 0 violations
static          physical left/right or text-align in factories CSS: 0 matches
```

Remaining Latin digits in Arabic are **8 machine identifiers** — `CR 4030-201101`,
`F-1101`, `PN-F-1101-001`, `senaei-mirror-v1`, an English address string from the
registry — all correctly code, not copy (WEB-013 §3).

axe reports one **incomplete**, `aria-valid-attr-value`, on the scope picker's
`aria-controls` — the lazy-popup pattern already adjudicated in T-106 and
re-proved on `/analytics` this session.

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates` — typography **passes, none new**; v5 **63**, none in a file this task touched
- [ ] `npm run lint` — script does not exist
- [ ] `npm run test:e2e` — not run

## Parked

- **Risk-driver contribution bars** — the strongest unbuilt chart on this route.
- **Portfolio-wide distributions belong on `/analytics` or `/dashboard`.**
- **`toDriverLines` renders a raw DB key** — a WEB-008 §2 defect independent of
  any chart.

## Proposed commit

```
fix(factories): render every number in the reader's numbering system
```

## Next

Governed labels for risk-driver keys, then the contribution chart. Tracker T-119.
