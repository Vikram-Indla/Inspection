# 2026-08-17 · T-137 — the heading sweep under Admin and Inspector

`task: T-137` · `status: done` · `duration: ~2h`
`rules applied: WEB-003, WEB-014` · `owner signed in as Admin, then as Inspector, for this task`

---

## Goal

T-136 promoted the shell page title from h2 to h1 and warned that any content
heading starting at h3 would become a **skip**. Only Planner-visible routes had
been tested. This sweeps the rest under the two roles I could not reach, and
fixes what it finds.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/items/page.tsx` | 5 × h3 → h2, 1 × h4 → h3 |
| `app/(app)/admin/integrations/page.tsx` | 3 × h3 → h2 |
| `components/sections/admin-planning-expiry/expiry-screen.module.css` | Status column 12% → 15%, Reason 21% → 18% |

## The sweep

Ten routes under two roles, each measured with axe against
`wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` plus the `heading-order`,
`page-has-heading-one` and `landmark-no-duplicate-main` rules.

```
ADMIN
/admin/planning/expiry   1→2→2→2→2→2   ok
/admin/access            1→2→2→2       ok
/admin/packages          1→2           ok
/admin/localization      1→2→2         ok
/admin/workflows         1→2→3         ok
/admin/items             1→3→3→3→3→3   SKIP → fixed → 1→2→2→2→2→2
/admin/integrations      1→3→3→3→2→2   SKIP → fixed → 1→2→2→2→2→2

INSPECTOR
/field                   (no headings at all)
/field/my-tasks          3→3→3→3→3     no h1
/dashboard               2→2→2→3→3→3→2→2  ok (no h1 — known, title="")
```

**Two real skips found and fixed**, both the exact shape T-136 predicted: page
sections written at h3 under a shell that used to be h2.

`/admin/items` needed the order to be right: promoting its five section h3s to h2
would have turned a nested `h4` into a **new** skip, so the h4 was demoted first
and the five promoted by id afterwards. Tag balance was asserted before and after
(`h2 5/5 · h3 1/1 · h4 0`).

## `/field` is outside the migration entirely, and it is measurable

The Inspector pass produced the most important finding, and it is not a heading
skip.

```
stylesheet   /saqeel-ds/saqeel/styles.css   the parallel design system, still linked
/field       headings 0 · role="heading" 0  ← the page has NO heading structure
/field/my-tasks  5 headings, all h3, no h1
```

Every visual heading on `/field` is a `<div>` or `<span>`:

```
"Good afternoon, Synthetic"   <div>   16px / 700   ← the page title
"AI Daily Brief"              <span>  14px / 600
"Today's operations map"      <div class="t-label">  13px / 500
"Inspections"                 <div>   12.5px / 600
```

A screen-reader user has **no headings to navigate the field home by at all** —
which is worse than a skip, and invisible to `heading-order` because that rule
only fires on an increase greater than one.

The type scale tells the same story in one line. Same viewport, same session:

```
/dashboard        13 · 15 · 20 · 24 · 32        the approved scale, exactly
/field/my-tasks   11.5 · 12 · 12.5 · 13 · 13.5 · 14 · 14.5 · 16 · 19
```

**Nine ad-hoc sizes, five of them below the 13px floor, and weight 700 above the
590 cap.** T-129 → T-132 moved the whole application onto one palette, one
typeface and one scale by retargeting tokens — and `/field` inherited none of it,
because it links its own stylesheet that defines its own tokens. This is the
CORRECTION entry in `01-PROJECT-STATUS.md` confirmed by measurement: the parallel
sheet is not a token override of `--sqx-*`, it is a separate system, and the
migration is the only thing that removes it.

**Not fixed here.** Giving `/field` a heading structure is part of migrating it
(tracker T-023/T-024), not a heading-order sweep.

## A defect in my own work, found only because the role changed

I built `/admin/planning/expiry` in T-127 and ported it in T-134, but every
previous session was a Planner — which meant I had only ever seen its
**access-refusal** state. Rendering it as an Admin showed **"Superseded"
truncating to "Supers…"** in every row.

The measurement misled me twice before it settled:

```
pill root    scrollW 89 = clientW 89   "no overflow"
label child  scrollW 75 > clientW 59   truncated (overflow:hidden + ellipsis)
```

The root reported no overflow **because the label child absorbed it**. I checked
the root first, disbelieved the screenshot, re-screenshotted, scrolled to prove
the renderer was live, and only then inspected the children. Root cause was mine:
`colStatus: 12%` leaves a 91px content box after the cell's 24px padding, and the
pill needs ~101px. Widened to 15%, taking 3% from Reason.

```
after   0 of 33 status labels truncated · "Superseded" 75 = 75
```

The 4 remaining "truncated" nodes the detector reported are the `<caption>`
elements deliberately made visually hidden — clipped elements always report
`scrollWidth > clientWidth`, so that is a false positive of my own check.

**A screen you have only seen in one role is a screen you have not seen.**

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, 107 below baseline
- [x] `npm run gates:typography` — PASSED, 129 below baseline
- [x] `npm run check:design-system-v5` — 76, unchanged
- [x] `npm run verify:dates` — 17 passed
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] axe on 10 routes across Admin and Inspector: **0 WCAG violations**,
      0 heading-order after the fixes, 0 duplicate-main
- [x] Temp axe file removed and its absence verified three ways, twice
- [ ] 200% zoom, browser e2e — still owed

## Parked

- **`/field` has no heading structure.** `/field` renders zero headings;
  `/field/my-tasks` renders five h3s and no h1. This belongs to the `/field`
  migration, and it is now measured rather than assumed.
- **`/field` is still on the parallel design system** — nine font sizes against
  the approved five, five of them below the 13px floor, weight 700 above the cap.
  The `<link>` comes out last, per the standing correction, but the gap is now
  quantified.
- **19 routes still have no `h1`** (T-136's list), `/dashboard` among them.
- **`page-has-heading-one` never fires in these runs.** It is outside the WCAG
  tags and appears not to run even when requested by rule name, so *"no h1"* has
  to be detected by counting `document.querySelectorAll('h1')` directly. Any
  future gate should count, not rely on that rule.

## Proposed commit

```
fix(a11y): repair heading order on admin routes and the expiry status column
```

## Next

`/field` is now the single largest accessibility and design-language gap in the
application, and it is fully measured: no headings, its own stylesheet, nine
off-scale sizes. That is a migration, and it wants its own sequence of tasks.
