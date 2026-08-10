# 2026-08-10 · T-046 — `/planning/bulk` slice 3: review route to the cap

`task: T-046` · `status: partial (slice 3 done; slices 4–5 open)` · `duration: 1h`
`rules applied: WEB-000, WEB-001 §2, WEB-002, WEB-008, WEB-011`

---

## Goal

Take `app/(app)/planning/bulk/review/page.tsx` from 288 lines to the 40-line
cap, and give the review screen a real Arabic resource instead of an English
fallback.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/planning/bulk/review/page.tsx` | rebuilt | 288 → **30** |
| `i18n/locales/en/planning.json` | extended | +197 (`planning.bulkReview`) |
| `i18n/locales/ar/planning.json` | extended | +197 (`planning.bulkReview`) |
| `features/planning-bulk/review-strings.ts` | created | — → 22 |
| `features/planning-bulk/queries.ts` | extended | 57 → 88 |
| `components/sections/planning-bulk/review-screen/review-screen.tsx` | created | — → 22 |
| `components/sections/planning-bulk/review-access-state/review-access-state.tsx` | created | — → 26 |
| `app/(app)/planning/bulk/review/ReviewClient.tsx` | modified (stylesheet import only) | 853 → 855 |

## Decisions

**`review.css` was NOT deleted, and the tracker was wrong to say it would be.**
The slice description said "288 → ≤ 40 and delete `review.css`". The import
lived in `page.tsx`, but the 58 classes it defines are consumed by
`ReviewClient` (**44**) and `EvidenceLedger` (**12**) — `page.tsx` used exactly
one, `cd-panelpad`. Deleting it here would have stripped the styling off the
entire review screen. The import moved to `ReviewClient`, the file that actually
uses it, which is both correct today and the precondition for deleting it in
slice 4. **Verify what a stylesheet is holding up before believing the file that
imports it owns it.**

**`loadBulkReview()` is a three-state union.** `denied | unauthorized | ready`,
with the draft resume folded in, so the route cannot reach `ReviewClient`
without having handled both failures. This replaces two inline guard blocks that
each rendered their own `<Shell>`, and it collapses `draftUnavailable` from a
pair of `let` bindings mutated in an `if` into a derived field.

**The JSON mirrors `ReviewStrings` exactly, so the builder is three lines.**
`buildReviewStrings(locale)` returns `planning.bulkReview` directly — 197 keys
including the nested `ev` and `bl` groups. A key that drifts is a **type error**
at the return statement, which is the whole reason the shape was authored to
match rather than mapped key by key.

**Namespace is `planning.bulkReview`, not `planning.review`.** `review` would
read as the reviews feature (`/reviews`), which is a different domain with its
own strings module.

## Inventory taken before writing code

Measured on `review/page.tsx` at HEAD:

- 288 lines against a 40-line cap
- **21 comment lines**, including the CD-025 / SCR-WEB-150 / M6 requirement IDs
- **210 `t()` calls** inline in the route
- **2 `let`** (`initialDraft`, `draftUnavailable`), both mutated inside an `if`
- 7 legacy `className` uses — `sq-banner sq-banner--critical`, `panel
  cd-panelpad sq-permission`, `sq-state`, `sq-state__glyph`, `t-caption`,
  `sq-link`, `badge badge-info`
- 1 hand-authored icon import (`IconBlocked` from `app/icons`)
- 0 `useState`, 0 `useEffect` — the route was already server-only

## Numbers

```
Route: /planning/bulk/review
page.tsx                  288 → 30 lines
comments in page.tsx       21 → 0
t() calls in page.tsx     210 → 0
let in page.tsx             2 → 0
legacy classes in page.tsx  7 → 0
app/icons imports           1 → 0
Arabic keys on this screen  0 → 197
client islands              1 → 1   (ReviewClient, unchanged)
legacy CSS deleted          0 lines — see below
```

## Accessibility

- The unauthorized state was a hand-built `sq-state` block with an `IconBlocked`
  glyph and an `<h4 tabIndex={-1}>` — a heading level with no `h3` above it, and
  a bare `<a class="sq-link">` as its action. It is now `EmptyState` with
  `icon="restricted"`, `tone="warning"` and a `Button` action, which owns its own
  heading semantics and focus treatment.
- The denied state was `sq-banner--critical` with `role="alert"`; it is now
  `PlanningNotice tone="danger"`, which carries the tone as a text label as well
  as a surface.
- axe **not run** — the route redirects to `/login` without a seeded account.
- Manual checklist: **not run**, same reason.

## Verification

- [x] `npm run typecheck` — clean
- [x] `next dev` — `/planning/bulk/review` compiles, 1714 modules, no warnings;
      `GET` returns 307 to `/login` in both locales as an anonymous caller
- [x] en/ar key parity asserted structurally before write; the script refuses to
      write on mismatch and names the offending keys
- [ ] `npm run lint` / `npm run gates` — the scripts do not exist (T-000)
- [ ] Definition of Done — not fully ticked; no authenticated render

## Retirement

Nothing marked. `review.css` moved one step closer to deletion by having its
import relocated onto its real consumer; it dies with `ReviewClient` in slice 4.

## Parked

- **`ReviewClient` still has zero `t()` calls of its own.** This slice made the
  `strings` prop bilingual, which covers the copy that flows through it — but any
  string hardcoded **inside** the 853-line component is still English-only. That
  is slice 4, and it is the reason slice 4 cannot be a pure markup migration.
- **`review/loading.tsx` is still `RouteLoading`** — a centred glyph, no mirror
  of the screen. It wants the same treatment `/planning/bulk` just got, including
  the `<Shell>` wrapper that the bulk skeleton initially missed.
- **`loadBulkDraft` lives in `actions.ts`**, a `"use server"` write module, and is
  now called from `queries.ts`. It is a read; it belongs on the read side. Moving
  it is slice 5 work, together with the rest of that 846-line file.

## Blocked / open questions

Unchanged from slice 1b: the compiler runs, a seeded account does not exist, so
no authenticated render, no axe, no manual checklist.

## Proposed commit

```
refactor(planning): compose the bulk review route from a screen
```

## Next

Slice 4 — `ReviewClient` (853 lines, 19 legacy classes, 7 effects), tracker
item T-046.
