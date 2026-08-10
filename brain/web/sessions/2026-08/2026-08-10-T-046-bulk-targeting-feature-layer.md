# 2026-08-10 · T-046 — `/planning/bulk` slice 1a: targeting feature layer + notices

`task: T-046` · `status: in-progress (slice 1a done; 1b–5 not started)` · `duration: 2h`
`rules applied: WEB-000, WEB-001 §2 §4, WEB-002, WEB-008, WEB-011`
`commits: ade13015, 9fbddfd8`

---

## Goal

Begin the `/planning/bulk` migration by moving the route's three Supabase reads
into a feature layer behind the narrowing boundary, and convert the entry
screen's banners and context pill onto SAQEEL.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `features/planning-bulk/queries.ts` | created | — → 58 |
| `features/planning-bulk/shapes.ts` | created | — → 74 |
| `features/planning-bulk/view.ts` | created | — → 90 |
| `app/(app)/planning/bulk/page.tsx` | modified | 424 → 337 |

## Decisions

**A four-state union, not three inline guards.** `loadBulkTargeting()` returns
`denied | unauthorized | unavailable | ready`, so the route cannot reach
`factories` without having handled every failure. The old code wrote the same
three guards inline three times, each with its own duplicated `<Shell>` block.

**The reads matter more than most.** These rows feed `evalNode`, so a wrong
value does not just render badly — it changes **which factories get inspected**.
Putting them behind `lib/postgrest` (T-042) means a schema drift fails closed
with a logged reason instead of silently mis-evaluating criteria. Three
`as unknown as` casts died with it.

**`PlanningNotice` was reused, not rebuilt.** It already carries tone as text
**plus** surface, so the advisory/blocking distinction survives greyscale —
which the `sq-banner--warning` colour class did not.

**Comments were left in place.** `page.tsx` still carries its `M01-*` / `CD-021`
requirement-ID comments. They violate WEB-000 §2, but stripping them belongs
with slice 1b, which moves this code into a screen component and rewrites it —
deleting them twice would be wasted work.

## Inventory taken before writing code

Full route inventory recorded before any edit (14 files, 3,512 lines):

- **Zero SAQEEL imports** on the entire route before this task.
- Route files 424 and 288 against a 40-line cap; `ReviewClient.tsx` 853 against
  a 400 ceiling; `actions.ts` 846 against 300.
- 505 comments, 70 inline `style={{}}`, ~180 legacy class uses, 26 `sq-lozenge`
  (colour-only status), 15 native controls, 18 `useState`, 9 `useEffect`
  (4 with `exhaustive-deps` suppressed), 5 `tr()` calls with **inline Arabic**.
- `ReviewClient` has **0** `t()` calls — hardcoded English.
- Clean already: zero `<svg>`, zero `div` with `onClick`, zero `alt=""`.

## Numbers

```
Route: /planning/bulk
page.tsx              424 → 337 lines
supabase calls in route   5 → 0
as unknown as             3 → 0
legacy classes in page.tsx  4 → 0
```

## Accessibility

No markup changed beyond banner/pill substitution, which improves it: tone now
carries a text label rather than colour alone. axe **not run**.

## Verification

- [x] `npm run typecheck` — clean
- [ ] Everything else — owed

## Retirement

Nothing marked.

## Parked

- **`lib/supabase-pagination.ts` is now unused by this route** but still has
  legacy callers elsewhere. It retires when they do.
- **A `sed` intended to tidy blank lines stripped every blank line in
  `page.tsx`.** Recovered with `git show HEAD:…` (read-only) and the edits
  re-applied programmatically. **Never run a whitespace regex across a whole
  source file** — the diff looked correct and the file was unreadable.

## Blocked / open questions

**Corrects a stale PARKED entry:** "There is no datetime primitive" is **wrong**.
`DateRangePicker` already accepts `withTime`, `timeStep` and `timeLabels`, and
emits `YYYY-MM-DDTHH:mm` — the `datetime-local` shape. It is already in
production in `visit-configuration` and `visit-bulk-actions`. The two
`datetime-local` inputs in `ReviewClient` are a from/to window and map directly
onto it. **Slice 4 is not blocked.**

## Proposed commit

```
refactor(planning): move bulk banners and context pill onto saqeel
```

## Next

Slice 1b — `page.tsx` 337 → ≤ 40: string blocks to
`features/planning-bulk/strings.ts`, composition to
`components/planning-bulk/bulk-screen/`.
