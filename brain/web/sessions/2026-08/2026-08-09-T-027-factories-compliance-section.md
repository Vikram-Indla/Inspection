# 2026-08-09 · T-027 — `/factories` compliance section

`task: T-027` · `status: done (static verification only)` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-008, WEB-011`

---

## Goal

Add the reference's **Compliance** block — inspection reports, violations,
penalties — to the end of the `/factories` middle column, on real records.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `features/factories/compliance.ts` | created | 182 |
| `components/sections/factories/factory-compliance/**` | created | 137 + 21 |
| `app/(app)/factories/RevampFactory360Portfolio.tsx` | modified | 275 → 336 |
| `app/(app)/factories/page.tsx` | modified — compliance query | +3 |
| `i18n/locales/{en,ar}/factories.json` | +20 keys each | 115 keys, parity |

## What the reference showed, and what the schema holds

| Reference | Schema | Shipped |
| --- | --- | --- |
| `INS-88213 — 10 Jul 2026` | `inspections` has **no reference column** — only a UUID | **the governed `visits.visit_reference`**, which is the human identifier the platform actually issues |
| `Approved` / `Returned` pill | `reviews.decision` (`approve` / `return` / `reject`) | **real** — plus the inspection's own `status`, which is a different axis and is shown separately |
| Violation title + category | `violation_codes.title` / `.code` / `.level` | **real** — `level` is the governed severity |
| Violation `Open` / `Closed` | **no such state exists.** `violations` has only `invalidated_at`, which means *retracted*, not *resolved* | **omitted**, with a line under the table saying so |
| `Fine — SAR 4,000` | `penalty_notices` has **no amount column** | **omitted** — the notice number, status and issue date are shown instead |
| Penalty status | `issued` / `served` / `settled` / `withdrawn` | **real** |
| Trends (compliance %, risk sparklines) | compliance has no column anywhere; risk history exists but a sparkline is a charting task | **omitted** — see Parked |

### Penalties are RLS-restricted, and that is not the same as "none"

`penalty_notices` is readable only by reviewer / ops / auditor /
compliance_admin / leadership. Every other role gets an **empty result, not an
error** — so a planner would have seen "No penalty notice has been issued",
which is a false statement about the record.

`queryFactoryCompliance` returns `penaltiesReadable`, and the section renders a
`restricted` `EmptyState` — *"Penalty notices are not visible to your role"* —
instead of the empty state. **An empty result under RLS must never be rendered
as an absence of facts.**

This also casts doubt on something T-024 shipped: the **Active penalties** stat
counts the same table, so for a role that cannot read it the tile shows `0`
rather than "restricted". Recorded in Parked — it is the same bug in a place I
did not look at the time.

## Decisions

1. **The violation open/closed pill is not faked.** The reference's most useful
   column is the one with no source. Rather than map `invalidated_at` onto
   "closed" — which would report retracted violations as resolved, a materially
   wrong compliance claim — the column is dropped and a caption states that
   violations carry no open/closed state and only retracted ones are excluded.
2. **`visit_reference`, not a shortened UUID.** `/planning` already treats a
   visit without its governed reference as unusable; showing eight hex
   characters as if it were a report number would invent an identifier.
3. **Three `DataTable`s, not bespoke lists.** Each section gets the canonical
   table — responsive stacking, empty states and cell types for free, and the
   same row rhythm as every other table in the app.
4. **Status and review decision are separate columns.** The reference collapses
   them into one pill; they are different axes (`inspections.status` is
   lifecycle, `reviews.decision` is a human outcome) and merging them would lose
   the distinction the platform is built on.

## Inventory taken before writing code

- **Client islands:** unchanged. `factory-compliance` is presentational.
- **Literals:** none.
- **Accessibility:** every level, status and decision is a `StatusPill` — text
  plus shape. Dates go through `formatDate(locale)` and `CellTime` carries the
  machine-readable `dateTime`. The restricted state is an `EmptyState`, not a
  silent blank.
- **No `any`, no `as`:** the four reads narrow through `isRecord` predicates.

## Numbers

```
Route: /factories
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
new queries     4 (inspections, penalty_notices, then reviews + violations keyed
                by the inspection ids), all scoped to the visible portfolio
```

## Accessibility

- axe: **NOT RUN.**
- Manual checklist (WEB-003 §10): **not performed.** Three stacked tables want a
  pass at 320 px and in RTL.

## Verification

- [x] `npm run typecheck` — zero errors, whole repo.
- [x] `npm run check:design-system-v5` — zero findings in changed files.
- [x] i18n parity — 115 keys, `en` + `ar`.
- [ ] `npm run lint` / `npm run gates` — no such scripts (T-000).
- [ ] `npm run test:e2e` — not run.
- [ ] **None of the four reads has executed.** The `visits!inner(factory_id)`
      filter shape is now used by three separate queries on this screen and is
      still unproven against a database.

## Parked

- **`RevampFactory360Portfolio.tsx` is 336 lines against a 200-line component
  limit** (hard ceiling 400), up from ~170 before this slice. It is now mostly
  view-model construction; that belongs in `features/factories/`, leaving the
  component to compose. **This should be done before the next `/factories`
  slice** — it is within one slice of the hard ceiling.
- **The Active-penalties stat tile shows `0` for roles that cannot read
  `penalty_notices`** (T-024). It needs the same `penaltiesReadable` treatment
  this task introduced.
- **Violations have no resolution state.** Until `violations` gains one, no
  surface can honestly say a violation is closed.
- **`penalty_notices` has no amount**, so the reference's "Fine — SAR 4,000"
  cannot be shown anywhere.
- **Trends were not built.** A compliance trend has no source at all; a risk
  trend could be drawn from `factory_risk_snapshots`, but a sparkline is a
  charting task with its own guidance and should not be smuggled into a slice.

## Blocked / open questions

None.

## Proposed commit

```
feat(factories): compliance reports, violations and penalties section
```

## Next

**Extract the `/factories` view models** out of `RevampFactory360Portfolio`
before it hits the ceiling, then `/factories/cr/[id]`.
