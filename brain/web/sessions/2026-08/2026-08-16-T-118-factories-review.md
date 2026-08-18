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

---

## Addendum — re-examined on challenge: does *any* chart fit?

Owner pushed back on the "no chart" verdict. Re-examined, and the honest answer
is **two real candidates, both blocked on something specific and fixable** — not
"nothing fits".

### 1 · Risk score as a meter — the best fit on this screen, blocked on config

The score is the screen's headline number and renders today as a bare numeral
(`٨١٫٥`) plus a band pill (`High`). A reader cannot see **how far into the band**
it sits — 81.5 could be a hair over the boundary or near the ceiling. `Gauge`
exists for exactly this.

**Why it is not built:** the scale is not guaranteed. The banding function reads
its cutoffs from the risk-model **configuration**, not from constants —

```sql
low_max    := (cfg.settings#>>'{bands,low,1}')::numeric;
medium_max := (cfg.settings#>>'{bands,medium,1}')::numeric;
band_value := case when score_value <= low_max then 'low' … end;
```

— the score is a weighted sum (`weights must sum to 1.00`), and the column is
`risk_score numeric(5,2)`, which permits far more than 100. Drawing an arc
against an assumed 0–100 would **invent a ceiling the platform does not
guarantee** (WEB-002 §9).

**Unblock:** load the active risk-model config into the route and draw the meter
against the governed band scale. Small and concrete — the config is already read
server-side by the banding function and surfaced under `/admin/risk/models`.

### 2 · Risk-driver contributions — blocked on labels and data (unchanged)

### 3 · Violations by severity — marginal

`ComplianceViolation.level` carries a governed severity, so a per-factory
severity split is a real shape. But per-factory counts are small (**0** here),
so it would need the same self-gating as `stateSlices` and would rarely render.
Worth doing only alongside candidate 1.

### What is genuinely not chart material

`FactoryCompliance` holds **record lists** (reports, violations, penalties), not
compliant/non-compliant answer counts — so there is no per-factory compliance
ratio to meter, which was the other thing worth checking. Employees, products,
licence facts and source trust are single values or two-item status lists.

---

## Addendum 2 — the meter is built, and **not yet verified in a render**

Owner approved the unblock. Built:

| File | Action |
| --- | --- |
| `features/factories/risk-bands.ts` | created — `queryRiskBands` |
| `components/sections/factories/factory-risk-meter/` | created — `FactoryRiskMeter` |
| `app/(app)/factories/page.tsx` | loads bands into the existing `Promise.all` |
| `app/(app)/factories/Factory360Portfolio.tsx` | renders the meter above the trend |
| `i18n/locales/{en,ar}/factories.json` | `riskMeter` block, both locales |

**The scale is read, never assumed.** `engine_settings` where `engine = 'risk'`
is the same row `recalculate_factory_risk` bands against:

```json
"bands": {"low":[0,39], "medium":[40,69], "high":[70,100]}
```

`queryRiskBands` returns `null` on any missing or malformed part, and
`FactoryRiskMeter` returns `null` without bands — so a screen that cannot read
the config shows the plain numeral and no arc, rather than an invented ceiling.

### Status: unverified, and that is a real gap

`npm run typecheck` is clean and the route returns **HTTP 200 with no syntax
error in the response**. But the meter has **not been seen to render**: an
intermediate malformed edit put the dev server's SWC cache into a bad state, and
the tab now hangs on the route's loading skeleton with stale `Expected '</',
got 'series'` errors quoting line numbers that no longer match the file. Touching
the file and hard-navigating did not clear it. **The dev server needs a restart,
which belongs to the human.**

**Two things to check the moment it is back up**, neither of which I could
settle:

1. **Does the meter appear at all?** `engine_settings` may be readable only by
   `risk_owner` / `compliance_admin`, in which case `queryRiskBands` correctly
   returns `null` under a Planner and the meter renders nothing — designed
   behaviour, but it would mean this persona never sees it and the check has to
   run under an admin role.
2. **Arabic, RTL and axe on the gauge** — the caption interpolates two numbers
   through `formatDecimal`, so `٨١٫٥ من ١٠٠` is expected; unconfirmed.

Until both are answered this addendum is **code complete, not done**.
