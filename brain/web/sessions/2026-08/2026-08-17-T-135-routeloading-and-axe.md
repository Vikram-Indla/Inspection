# 2026-08-17 · T-135 — `RouteLoading` off the landmark defect, and the axe debt discharged

`task: T-135` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-006 §5, WEB-014`

---

## Goal

Two things that had been owed for a long time, chosen because they compose:
fix `RouteLoading` — a duplicate-ARIA-landmark defect on **31 routes** from one
18-line file — and use it as the occasion to finally run axe, which every record
since T-127 has listed as owed.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/RouteLoading.tsx` | rebuilt on `SkeletonRegion` | 18 → 19 |
| `components/saqeel/count-badge/count-badge.tsx` | `aria-label` on a generic element replaced | 3 lines |

Two files. The first reaches 31 routes, the second every labelled `CountBadge`.

## `RouteLoading` — four rule breaches in eighteen lines

Both shells render `<main id="main-content">`
(`app-shell.tsx:42`, `ShellClient.tsx:649`), and `RouteLoading` rendered its own
`<main className="sq-content">` inside that. **Every one of its 31 importing
routes served two `main` landmarks** while loading.

It also carried, in the same file:

```
<main className="sq-content">        second landmark on 31 routes
glyph="◫"                            glyph-as-icon (rule 8 / v5 emoji-as-icon)
EmptyState from components/ root      the closed directory
isAr ? ar : en  ×2                    the banned locale ternary
```

Rebuilt on `SkeletonRegion`, which is the right primitive for a loading state and
already renders `<div role="status" aria-busy aria-live>` with a visually-hidden
label. That removed the landmark, the glyph and the closed-directory import at
once, and the loading state now looks like the rest of the system instead of an
`EmptyState` with a Unicode square.

**No file was added to `components/` root**, which is closed (WEB-002 §3):
`SkeletonRegion` and `Skeleton` bring their own styles, so the rebuild needed no
CSS module. Verified: `git status` shows zero untracked files under
`src/components/`.

**The `bodyEn`/`bodyAr` props are used by two callers and were not dropped.** With
bones replacing prose there is nowhere to show that sentence, so it is appended to
the announced label — the fact survives even though the pixels changed.

## What was *not* done, and why

The 31 callers pass literal `en=` / `ar=` string pairs — roughly **62 hardcoded
strings**, which is the banned pattern at the API level, not just in the file. The
`isAr ? ar : en` ternary is inherent to that API and cannot be removed without
changing all 31 callers and creating i18n namespaces for 31 routes. That is its
own task; the count is recorded in PARKED rather than half-migrated here.

## The axe debt, discharged

`axe-core@4.12.1` is already a dependency. It is 572 KB, too large to inject
through a single evaluate call, so it was served from the dev server for the
duration of the run and **deleted immediately after** — verified by `rm`, a 404
from the same URL, and `git status` showing nothing axe-related left in the tree.

Run against `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`:

```
surface                          passes  violations  incomplete
/dashboard  dark  · en              30        0          2
/dashboard  light · en              30        0          2
/dashboard  dark  · ar (RTL)        30        0          2
/factories  dark  · en              33        0          3 → 2 after the fix
```

**Zero violations on every surface, in both themes and both directions.** That is
the first real axe evidence this programme has, and it makes the "axe owed" line
in eight previous records answerable rather than aspirational.

### The one real defect axe found

`aria-prohibited-attr` on `span[aria-label="Factories shown"]`. `CountBadge` put
`aria-label` on a bare `<span>` (or `<sup>`) with **no role** — and ARIA prohibits
naming a generic element, so **the label was being discarded by assistive
technology entirely.** Two call sites pass `label`; both were silently unlabelled.

This is T-122's ruling arriving again from a different direction — *an `aria-*`
attribute is a no-op unless the element it lands on can carry it*. Fixed by
rendering the number visibly and the label in a `sqx-visually-hidden` span, so the
badge announces "1 Factories shown" while still showing "1". Measured after:

```
visual text        "1"
announced text     "1 Factories shown"
aria-label         absent
aria-prohibited-attr  gone
```

### The two `incomplete` results, characterised rather than dismissed

- **`aria-valid-attr-value`** on `DateRangePicker`'s trigger: `aria-controls`
  points at a React-generated id that does not exist while the popover is closed.
  axe cannot resolve it; strictly, `aria-controls` should reference a present
  element, so this is a **minor real finding** on a primitive, parked.
- **`color-contrast`** on a `sup`: the superscript `CountBadge` is partially
  overlapped, so axe cannot sample the backdrop. Its contrast was measured by
  hand in T-130 (7.13 dark / 4.61 light / 10.22 neutral) and passes.

## A finding worth more than the fix

`/factories` measures **`main: 1, h1: 0`** — and axe's own
`page-has-heading-one` rule **did not flag it**, because it is a best-practice
rule outside the WCAG tags I ran.

So the missing-`h1` problem already recorded against `/dashboard` is **not
route-specific**: legacy `Shell` renders the page title as
`<Heading level={2} visual="display">`, so **every route using it has no `h1`** —
77 importers. The heading outline on `/factories` starts at H2 and never has a
level 1.

**A clean axe run under the WCAG tags does not mean the heading outline is
sound.** Worth stating plainly, because "axe: 0 violations" is exactly the kind of
number that stops further looking.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, **107** below baseline (was 104; RouteLoading's
      comment block went with the rebuild)
- [x] `npm run gates:typography` — PASSED, 129 below baseline
- [x] `npm run check:design-system-v5` — 76, unchanged
- [x] `npm run verify:dates` — 17 passed
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] **axe 4.12.1: 0 violations across 4 surfaces** (dark/light/Arabic/second route)
- [x] Temporary axe file removed and its absence verified three ways
- [ ] 200% zoom, browser e2e — still owed

## Parked

- **~62 hardcoded strings in the 31 `RouteLoading` callers.** Each passes
  `en="…" ar="…"` literals. Removing the `isAr ? ar : en` ternary means changing
  all 31 callers and giving 31 routes an i18n namespace.
- **No `h1` on any legacy-`Shell` route** (77 importers) — `Shell` renders the
  title at `level={2}`. One shell-wide fix serves all of them, which is why it has
  not been taken piecemeal.
- **`DateRangePicker`'s `aria-controls`** references an id that does not exist
  while closed.
- **A gate for the axe run.** It worked, but only because a 572 KB file was
  temporarily copied into `public/`. Doing this per task is a trap; it belongs in
  a script with the dev server and cleanup handled.
- `StatusPill` still defaults `ping` to true (11 dots animating on `/dashboard`).

## Proposed commit

```
fix(a11y): remove the duplicate main landmark and label count badges correctly
```

## Next

The heading-outline fix is now the largest single accessibility win left: one
change to `Shell` gives 77 routes an `h1`. It needs the owner's agreement because
the brief has said not to touch the shell.
