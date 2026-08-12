# 2026-08-12 · T-085 — the Method filter offered six options that could never match

`task: T-085` · `status: done` · `duration: 1h`
`rules applied: WEB-000 §9, WEB-004, WEB-006 §4, WEB-008, WEB-011, WEB-013`

---

## Goal

Fix the `/planning` Method filter, which rendered ten options of which six were
titles and full sentences used as filter *values*, each returning an empty list
with no error.

## What changed

| File | Action | Detail |
| --- | --- | --- |
| `lib/planning/visit-list.ts` | added | `PLANNING_METHODS` + `PlanningMethod`; `PlanningListFilters.method` narrowed from `string` |
| `features/planning/queries.ts` | fixed | `method` whitelisted in `parsePlanningParams`, exactly as `tab` already was |
| `components/planning/planning-screen/planning-screen.tsx` | fixed | options built from `PLANNING_METHODS`, not from whatever keys the object holds |
| `i18n/locales/en/planning.json` | deleted | 6 dead keys (`{bulk,single,immediate}{Title,Desc}`) |
| `i18n/locales/ar/planning.json` | deleted | the same 6 |
| `features/planning/create-methods.ts` | **deleted** | 33 lines, closed dead file |

No new copy authored, in either locale. The three surviving labels are the
reviewed strings that were already there.

## Decisions

**The defect was a data-shape assumption, not a typo.** `planning-screen.tsx:97`
read `Object.entries(messages.methods)` as if `methods` were a value→label map.
It is not — it held **nine** keys: three real method values *and* six
title/description strings for a card picker. `planning-drafts.tsx:38` uses the
same object correctly as `methods[draft.method]`, so **one object was serving two
incompatible contracts** and only one of them was true.

**Fixed at two layers, because either alone leaves the hole open.** Cleaning the
JSON would have made `Object.entries` correct *by coincidence* — the next key
added to `methods` would silently become a filter option again. So the option
list is now derived from `PLANNING_METHODS`, and the URL parameter is validated
against the same constant. A bad value can be neither offered nor injected.

**The whitelist pattern already existed three lines up.** `tab` was validated
against `PLANNING_TABS` in the same function while `method` was passed straight
through with `first(sp.method) || undefined`. The fix is the existing pattern
applied to the field that was missed — not a new mechanism.

**`PLANNING_METHODS` went in `visit-list.ts`, beside `PLANNING_TABS`.** That file
already owns `PLANNING_TABS`, `PLANNING_SORT_KEYS` and `DEFAULT_PLANNING_SORT`,
and it is where the filter is *applied* (line 258). The dead
`create-methods.ts` held the only prior `"bulk" | "single" | "immediate"` union;
putting the survivor anywhere else would have made a second home for one fact.

**The dead file was deleted, not retired.** WEB-006 §4's three conditions all
clear: zero importers, no string-referenced path, and **no spec reads it as
text** — the T-077 trap was checked explicitly before deleting.

## Inventory taken before writing code

- 3 competing vocabularies for the same 3 methods (`methods.*`,
  `methods.*Title`, `create.*.title`), with two different Arabic renderings each.
- `planningCreateMethods()` — the only consumer of `methods.*Title/*Desc` — is
  **never called**. 12 dead strings across two locales.
- The live method picker is `create.*`, asserted by
  `web-admin-m2-batch-002.spec.ts:78` via `nav[aria-label="Create visit methods"]`.
  Untouched by this task.
- No state, no effects, no `<svg>` changed. One `useState`/`useEffect` count
  unchanged — this task adds no client code.

## Numbers

```
Method filter options   10 → 4   (3 methods + reset; was 9 + reset)
Broken options           6 → 0
Dead i18n strings       12 → 0   (6 keys × 2 locales)
Dead source                −33 lines (create-methods.ts)
Locale parity           1011 = 1011 keys, identical key sets
```

Measured against the running dev server as a seeded Planner, using the
`Showing N of M` counter:

```
                      before(implied)   after
no filter                    101         101
?method=bulkTitle              0         101   ← invalid value now ignored
?method=singleDesc             0         101   ← invalid value now ignored
?method=bulk                   8           8   ← unchanged, still discriminates
?method=single                 1           1   ← unchanged
?method=immediate              0           0   ← see Blocked
```

The real filters are byte-for-byte unchanged in behaviour; only the values that
could never match stopped emptying the list.

## Accessibility

No markup changed — the same `SaqeelSelect` renders a shorter option list. Not
re-run. Removing six options that returned nothing is a net reduction in
cognitive load for a screen-reader user paging the listbox.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **script does not exist** (raised in T-083)
- [x] `npm run gates:typography` — PASSED, 851, none new
- [x] `npm run check:design-system-v5` — no findings in any changed file
- [x] Locale parity asserted by script — 1011 keys, identical
- [x] Behaviour measured on the running dev server, five filter values
- [ ] `npm run test:e2e` — not run; needs a production build

## Retirement

`features/planning/create-methods.ts` **deleted** (33 lines, zero importers,
no spec reference). Its `PlanningCreateMethodKey` union survives as
`PlanningMethod` in `lib/planning/visit-list.ts`.

## Parked

1. **`?method=immediate` can never match a visit — and it is not this task's
   bug.** `rowSelect`/`countSelect` (visit-list.ts:229, 241) switch the
   `visit_plans` embed to `!inner` as soon as a method filter is set, while
   line 340 *derives* the label `"immediate"` from **`visit_plans` being NULL**
   (`v.visit_plans?.method ?? "immediate"`). So a visit displayed as *Immediate*
   is precisely one the inner join excludes. Measured: `?method=immediate`
   returns the empty state against a 101-visit list. **The filter and the label
   disagree about what "immediate" is.** The fix is a ruling, not a patch —
   either the filter means `visit_plans IS NULL`, or immediate visits should
   carry a plan row. **Do not guess**: WEB-000 §9.
2. **Three vocabularies for three methods remain two.** `methods.{bulk,single,
   immediate}` ("Bulk"/"Single"/"Immediate") and `create.{key}.title`
   ("Single Visit"/"Bulk Planning"/"Immediate Visit"), with Arabic `فردية`
   vs `فردية`/`جماعية` vs `جماعي`. Not merged here — the two serve different
   surfaces (filter value vs picker card) and merging is a copy decision.
3. **`assistant.quick.planSingle` = "Plan one visit"**, `planBulk` =
   "Plan multiple visits" — the one/multiple inconsistency the owner reported.
   Not in this task's diff; it is the next one.
4. **`f360.actions.planSingle` has two different English defaults for one key** —
   `"Plan single visit"` in `factories/cr/[id]:401`, `"Plan one visit"` in
   `factories/[id]:298` and `field/factory-360/[id]:373` — and its Arabic lives
   in an in-code map at `lib/factory360/arabic.ts:211`, which WEB-013 lists as
   retiring legacy.

## Blocked / open questions

**Does `method=immediate` mean "no plan row"?** Parked item 1 needs an owner
ruling before it can be fixed. It is now more visible, not less: with the six
junk options gone, a planner will actually reach for *Immediate* and receive a
confident, wrong, empty answer.

## Proposed commit

```
fix(planning): stop the method filter offering values that never match
```

## Next

The one/multiple vocabulary rename (parked 3 and 4), then `/planning/single`
typography — 8 own violations across 5 modules, inventoried and confirmed to sit
entirely on plain text.

## Measurement note for the next session

**My first measurement was wrong and nearly went into this record.** A regex for
`\d+\s*(visits|results|of)` matched a bucket counter and reported the unfiltered
list as **2 visits**; the real total is **101**, printed by
`Showing N of M scoped visits`. The error was visible only because a *filtered*
result (8) exceeded the supposed unfiltered total (2) — an impossibility that
forced a re-measure. **When a number contradicts an invariant, re-measure before
explaining it.** The `V-\d+` reference regex was equally unreliable; the rendered
counter was the only trustworthy signal.
