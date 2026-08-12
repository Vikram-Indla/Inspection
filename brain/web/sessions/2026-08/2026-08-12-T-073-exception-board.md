# 2026-08-12 · T-073 — `/operations/exceptions` on SAQEEL: enum labels, the third journey nav, a developer invariant on the supervisor's screen

`task: T-073` · `status: partial (axe, 320px, keyboard, light theme, e2e owed)` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-006, WEB-008, WEB-009, WEB-011, WEB-013`

---

## Goal

Owner-reported: the exception board is legacy UI with a legacy loading state and
duplicated navigation. Migrate it to the design system without losing a fact.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/operations/exceptions/page.tsx` | rebuilt as composition | **80 → 36** |
| `features/operations/exceptions/queries.ts` | created | 50 |
| `features/operations/exceptions/view.ts` | created | 37 |
| `components/operations/operations-board/operations-board.tsx` | created | 57 |
| `components/operations/operations-board/operations-board-skeleton.tsx` | created | 34 |
| `app/(app)/operations/exceptions/loading.tsx` | off `RouteLoading` | 8 → 8 |
| `i18n/locales/{en,ar}/operations.json` | `board` namespace, 21 keys each | — |
| `e2e/mvp2-modules-live.spec.ts` | per-route state selector | — |

## Decisions

**The group heading was a raw database enum.** `{g.category.replace(/_/g, " ")}`
rendered `correction overdue` and `review overdue` — lowercase, untranslated,
straight from the column. WEB-000 §9 and WEB-008 §2 both name it: *never render a
raw database value as a label; `{value: v, label: v}` is a defect.* It is also
precisely **why that heading could never be Arabic** — there was no label to
translate, only a column. Four categories now resolve through
`board.category[category]` in both locales.

**A developer invariant was on the supervisor's screen, and it could not fail.**
The banner ended in `{invariantOk ? "✓" : "⚠"}` — `groupCountEqualsSource()`,
which checks that grouped counts equal the source count. `groupExceptions`
partitions every source into exactly one bucket, so the sum *always* equals the
length: **the `⚠` branch is unreachable by construction.** A tick that can only
ever be a tick tells the reader nothing, and a supervisor could not act on it
either way. Removed from the UI. **The guarantee is not weakened — it stays
proven in `mvp2-m2-09-exceptions.spec.ts`, which is where a partition bug would
actually be caught.** Owner ruling taken before the edit.

**Do not model a fail-closed state for a condition that cannot occur.** The first
proposal drew an *"Exception counts could not be verified"* state for a failed
invariant. Re-reading `groupExceptions` showed the branch was dead, so the state
would have been untestable code guarding an impossibility. **Check whether the
error state you are designing is reachable before designing it.**

**The journey nav was the third copy of the same defect.** Operations Center ·
Live operations · Execution · Review queue — four buttons duplicating the left
rail, after T-068 removed it from `/operations` and T-071 from `/operations/live`.
This was the last one on the operations family.

**The banner's claim survived; the banner did not.** *"Every count traces to a
real record, decisions stay on the record that owns them"* is a real governance
statement and worth keeping — it is now the card's description, where a
description belongs, instead of a full-width bar louder than the content it
explains.

**A degraded read and an empty result are two facts, and they were both shouted.**
A separate amber bar plus an empty state that *already* branches on `degraded`
meant a degraded-and-empty board said the same thing twice in two voices. The
empty state keeps its branch; the bar only renders when groups **did** load, which
is the only case where it adds anything.

**Two of four drill destinations were a guess.** `category === "review_overdue" ?
"/reviews" : "/execution"` sent `sync_conflict` and `override_pending` to
Execution by default. `DRILL_HREF` now maps only the two categories with a real
destination; a category without one renders its count and *Not configured*
instead of a confidently wrong link — CLAUDE.md §9's rule applied to a
destination rather than a value.

**The sort key was invisible again.** `ExceptionGroup.items` is built and sorted
newest-first and was never rendered — the same defect as the `/operations`
exceptions list in T-068. Each group now prints its most recent occurrence from
`items[0].occurredAt`. Real data, no invention.

**A shared spec selector should gain a per-route override, not be loosened.**
`mvp2-modules-live.spec.ts` asserts a visible `.sq-banner, .sq-state, .alert,
.panel` across **seven** routes; a SAQEEL card carries none of those. Widening the
shared string would have weakened the assertion for the six routes that have not
migrated — a legacy route could later lose its panel and still pass on a SAQEEL
match. The route table now takes an optional `state` selector, this route supplies
`[aria-labelledby="operations-board"]`, and the other six keep the legacy default
byte-for-byte.

**`RouteLoading` renders a second `<main>` inside the shell's `<main>`.** Nested
landmarks on every route that uses it. This route is off it; the component still
has other consumers and is parked, not fixed.

## Inventory taken before writing code

- **State:** none. The screen is fully server-rendered and stays that way — **zero
  client islands**, down from zero (`NotYetBoundary` and `EmptyState` were legacy
  but server-side).
- **Effects:** none, before or after.
- **Literals:** none introduced.
- **`<svg>`:** none. `glyph="—"` (an em dash as an icon) and `NotYetBoundary`'s
  `◌` both gone; the empty state now takes a registry icon.
- **Reads:** two inline `sb.from()` calls in the route, untyped —
  `(cases ?? []).map(...)` over `any`. Now behind `readRows` + a `Shape<T>` each.
- **Accessibility failures found:** an `<h1 class="sr-only">Exception board</h1>`
  duplicating the Shell's own heading — the same string twice in the
  accessibility tree.

## Numbers

```
Route: /operations/exceptions
route file             80 → 36 lines   (cap 40)
legacy class uses      11 → 0   (verified in the rendered DOM: 0)
className attributes   11 → 0
SAQEEL components       0 → 7
glyph-as-icon           2 → 0
duplicate nav entries   4 → 0
duplicate headings      2 → 1
untyped reads           2 → 0
i18n keys in code      17 → 0   (21 keys per locale, parity asserted 138/138)
client islands          0 → 0
```

## Accessibility

- **axe: not run.** Owed.
- Manual checklist (WEB-003 §10): keyboard — owed · screen reader — owed ·
  200% zoom — owed · 320 px — owed · Arabic/RTL — resources verified, render
  owed · **dark — verified** · light — owed · reduced motion — the skeleton
  honours it · greyscale — owed
- **Fixed:** the duplicated `sr-only` h1; two glyphs-as-icons; a status
  communicated by a tick character.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — no `lint` script exists
- [x] `npm run gates` — typography PASSED, **zero new**, none of this task's
      files flagged by `check:design-system-v5`. **Not re-baselined.**
- [x] i18n parity asserted by script — **138/138 keys**, no orphan either side;
      every `board.*` Arabic value confirmed to contain no Latin prose.
- [x] **Rendered and inspected signed in:** the board card present and labelled,
      heading *Open exceptions*, **zero legacy-class elements**, **zero links**
      in the card (nav gone), no `sr-only` h1, no `✓ ⚠ ◫ ◌` anywhere, the empty
      state carrying `role="status"` and a real registry icon, and the
      methodology banner gone.
- [ ] `npm run test:e2e` — needs the seeded personas
- [ ] Definition of Done — not fully ticked

**Not verified: the populated board.** The seeded scope has no open cases or risk
exceptions, so only the empty state could be exercised. The group tiles, the
*most recent* line and the two drill links have not been seen with data.

## Retirement

Nothing marked. This route no longer imports `RouteLoading` or `NotYetBoundary`;
both keep other consumers. `lib/operations/exceptions.ts` is untouched — it was
already pure, correct and unit-tested.

## Parked

- `RouteLoading` renders `<main>` inside the shell's `<main>` — nested landmarks
  on every remaining consumer.
- `scopeToBranch()` is exported and unit-tested but **never called**; every
  source is built with `branch: null`, so branch scoping is dead on this screen.
- `ExceptionCategory` has four values; this page can only ever produce two
  (`cases` → `correction_overdue`, `risk_exceptions` → `review_overdue`).
- The `exc.*` rows seeded in `20260731120000_…_ar_strings.sql` are now orphaned —
  five keys whose English no longer matches the code and whose consumers are
  gone. They were already not reaching the page.
- Three near-identical notice components still have no shared primitive.

## Blocked / open questions

- **21 newly authored Arabic strings need a native review** — the whole
  `operations.board` namespace. Twelve of the seventeen `exc.*` keys it replaces
  had **no Arabic anywhere**, so most of this screen was English to an Arabic
  reader; the other five had `draft` Arabic in a migration whose English no
  longer matched the code.

## Proposed commit

```
refactor(operations): rebuild the exception board on saqeel
```

## Next

axe, 320 px, keyboard, light theme, an Arabic render, and the module-live suite.
**And the board with data in scope** — the group tiles have never been seen.

## Measurement request (WEB-005 §8 — for the human)

`/operations/exceptions`, before and after: first-load JS, route CSS, LCP, CLS.
