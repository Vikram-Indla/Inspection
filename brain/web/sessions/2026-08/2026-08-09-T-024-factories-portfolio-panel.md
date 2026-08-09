# 2026-08-09 · T-024 — `/factories` start panel: real portfolio facts

`task: T-024` · `status: done (static verification only)` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011`

---

## Goal

First slice of replacing the vendor mock's content on `/factories`: the **start
(left) panel only**. Drop the repeated provenance pill, and add the portfolio
figures and licence facts the mock shows — where they exist.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `features/factories/portfolio-counts.ts` | created | 75 |
| `features/factories/portfolio.ts` | extended — expiry state, counts | 125 → 151 |
| `components/sections/factories/factories-portfolio/factories-portfolio.tsx` | rebuilt | 145 → 175 |
| `components/sections/factories/factories-skeleton/**` | updated to mirror | +12 |
| `app/(app)/factories/RevampFactory360Portfolio.tsx` | modified | +18 |
| `app/(app)/factories/page.tsx` | modified — `expiry_date`, counts query | +3 |
| `i18n/locales/{en,ar}/factories.json` | 3 keys removed, 5 added | 61 keys, parity |

## What the mock asked for, and what was actually there

Every figure was traced to the schema before anything was built:

| Mock | Schema | Shipped |
| --- | --- | --- |
| `PORTFOLIO — CR …` | `factories.cr_number` | **real** — eyebrow renamed `Portfolio`, title is the CR |
| Factories · High Risk | already present | **real** |
| Licence · Plant · Type · Stage | already present | **real** |
| `Valid` pill | `industrial_licenses.status` | **real** — moved from a fact row to a footer pill |
| Open Violations | reachable only `violations → inspections → visits → factory_id`; **no "open" flag** | **computed** — owner-agreed definition below |
| Active Penalties | `penalty_notices.status` is `issued/served/settled/withdrawn`; **no "active"** | **computed** — owner-agreed definition below |
| Compliance % | **no such column anywhere in the schema** | **dropped** — it could only ever print "Not available" |
| `Expiring Soon` pill | `industrial_licenses.expiry_date` exists; "soon" is a threshold | **shipped at 30 days**, owner-agreed |

## Decisions

1. **Open violations** = violations reached through `inspections → visits` for the
   factory, with `invalidated_at is null`. This is *not retracted*, which is the
   nearest thing the schema has to *open* — there is no resolution flag on
   `violations`. Owner-agreed as the working definition.
2. **Active penalties** = `penalty_notices` with status `issued` or `served`
   (i.e. not `settled` or `withdrawn`). `penalty_notices.factory_id` is a direct
   FK, so no join is needed. Owner-agreed.
3. **Licence expiry threshold** = 30 days, exported as
   `LICENCE_EXPIRY_SOON_DAYS` with a TSDoc note that it is a **display rule
   only** — no planning, enforcement or licensing decision reads it. Both
   definitions and the threshold are stated in one place so replacing them with
   governed values is a one-line change.
4. **Compliance % is removed, not stubbed.** A row that can only ever say "Not
   available" is noise, not honesty. The slot returns when a compliance score
   exists.
5. **Counts fail independently and visibly.** `PortfolioCounts` carries
   `openViolationsAvailable` / `activePenaltiesAvailable`; a failed read renders
   "Not available", never `0`. A fabricated zero on a violations count is worse
   than an admitted gap.

### The provenance pill — first pass, superseded below

*(Kept for the reasoning; the second pass removed the test rows themselves.)*

The owner called "Test data · not production" useless. It is a **safety signal** —
it exists so a seeded test factory is not mistaken for a real establishment on a
shared non-production database. What made it useless was that it repeated on
every licence card, so the one case that matters looked identical to the normal
case.

It now appears **once**, on the portfolio header, and **only when the portfolio
is not clean registry data**. Production data shows nothing at all; a test or
manual establishment shows one warning where it cannot be missed. The signal is
stronger than before, not weaker.

## Second pass — test data removed, not just its label

The first pass moved the "Test data · not production" pill to a single header
notice. The owner's point was broader: **this screen is going in front of real
users, so seeded records must not appear at all** — and where data is genuinely
absent, say so.

1. **Test factories are now filtered out of the screen entirely.** There were
   **two independent test signals and only one was being applied**:
   - `isTestFixtureEstablishment` — matches e2e fixtures by name and factory
     code (already applied);
   - `source === "saqeel_test_data"` or a source containing `"test"` — the
     source system's own marking, which `provenanceOf` used to *label* a row but
     nothing used to *exclude* it.

   The second is now `isTestSourceFactory`, applied to **both** the scope
   projection and the portfolio query. That matters: without the scope filter a
   test CR would still have appeared in the portfolio chooser even once its rows
   were hidden.

2. **An emptied portfolio now says so.** `isEmpty` covers
   `portfolioRows.length === 0`, so a CR whose rows were all test data renders
   the existing "No factories in the list" state instead of a blank column —
   previously the panel returned `null` and left nothing behind.

3. **The four stats are one card, not four.** A single `Card` with an overline
   `PORTFOLIO — <CR>` heading over a 2 × 2 `<dl>`, matching the reference. The
   pair is `column-reverse` so the count reads above its label while the DOM
   keeps the only order a `<dl>` permits — `<dt>` before its `<dd>`.

4. **Counts carry a tone.** `neutral` by default; `danger` for high risk and open
   violations, `warning` for active penalties — but **only when the value is
   non-zero**. A zero high-risk count is good news and must not be painted red,
   and an unavailable count stays neutral. The label always carries the meaning,
   so tone is redundancy, never the signal (WEB-003).

The provenance notice stays, but it can no longer say "test" — it now fires only
for manually created or unverified-source establishments, which are real records
a user should be warned about.

## Inventory taken before writing code

- **State/effects:** none added. The counts query is server-side; the panel stays
  presentational and the existing single `useState` (selected licence) is
  untouched.
- **Literals:** none. The new `.pills` rule is tokens only.
- **`<svg>`:** none.
- **Accessibility:** licence status, expiry and risk are now `StatusPill`s —
  text plus shape, never colour alone. The expiry pill renders only for
  `expired` / `expiringSoon`, so a valid licence does not carry a redundant
  badge. Dates go through `formatDate(iso, locale)` (Asia/Riyadh, Arabic-Indic
  digits), not raw ISO.
- **No `any`, no `as`:** the Supabase reads narrow through `isRecord` type
  predicates at the boundary.

## Numbers

```
Route: /factories
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
new queries     2 (violations via inner joins, penalty_notices), both scoped to
                the visible portfolio ids and skipped entirely when it is empty
```

## Accessibility

- axe: **NOT RUN.**
- Manual checklist (WEB-003 §10): **not performed.** Wants a pass in both themes
  and RTL — the licence card now ends in a wrapping pill row.

## Verification

- [x] `npm run typecheck` — zero errors, whole repo.
- [x] `npm run check:design-system-v5` — zero findings in changed files.
- [x] i18n parity — 61 keys, `en` + `ar`.
- [ ] `npm run lint` / `npm run gates` — no such scripts (T-000).
- [ ] `npm run test:e2e` — not run.
- [ ] **The two new queries have never executed.** The PostgREST filter
      `in("inspections.visits.factory_id", ids)` over a two-level `!inner` embed
      is the one thing here that cannot be checked without a database.

## Parked

- **`invalidated_at is null` is a proxy, not a definition.** If `violations`
  gains a resolution/closure state, the open-violations count must move to it.
- **"Active penalty" is an inferred status.** `penalty_notices` has no `active`;
  if the lifecycle grows a state the mapping needs revisiting.
- **The 30-day expiry threshold is a display rule.** It must not leak into
  planning or enforcement logic without being ruled a governed SLA.
- **Compliance % has no source at all.** It is not a UI gap — a per-factory
  compliance score would have to be defined and computed first.
- **The mock's AI panel is the end column, not the start panel.** `buildAiSide`
  carries factory summary, top risks, latest changes, recommended actions,
  predicted risk and "why high risk". Our `factory-context` already holds a
  Contextual AI card. That is the natural next slice.
- **The middle column is still largely mock-shaped**, and `/factories/cr/[id]`
  is untouched legacy.
- **`isTestSourceFactory` is applied on `/factories` only.** The same seeded
  rows are still reachable from every other screen that reads `factories`
  directly — `/operations`, `/planning`, the dossier routes and the AI briefing
  each carry their own partial filter or none. A single shared exclusion at the
  query layer would be the real fix, and it is a repo-wide change.
- **Two independent test filters now exist** (`isTestFixtureEstablishment` by
  name/code, `isTestSourceFactory` by source). They catch different things and
  both are needed; they should be folded into one predicate so a caller cannot
  apply half of it, which is exactly the bug this pass fixed.

## Blocked / open questions

None — the four governed-value gaps were ruled on by the owner and recorded.

## Proposed commit

```
feat(factories): real portfolio counts and licence expiry in start panel
```

## Next

The `/factories` **end panel** — the mock's AI side block — or the middle
column, whichever the owner takes next. One slice at a time.
