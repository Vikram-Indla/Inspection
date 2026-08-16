# 2026-08-16 · T-120 — `/field`'s parallel design system does not override SAQEEL, and the backlog was blocked on a premise that is false

`task: T-120` · `status: done — measurement task; the ruling itself is the owner's` · `duration: 0.5h`
`rules applied: WEB-002, WEB-005, WEB-007, WEB-014`

---

## Goal

Measure exactly what breaks if `public/saqeel-ds/saqeel/styles.css` is removed
from `/field`, so the owner can rule on whether `/field` joins SAQEEL or is
declared separate — a question `01-PROJECT-STATUS.md` has been holding open
since 2026-08-12.

## What changed

No source file was changed. This is a measurement.

## The finding — the recorded blocker does not exist

`01-PROJECT-STATUS.md` states:

> migrating those 38 files onto type primitives while that stylesheet redefines
> `--font-*` and `--type-*` for the whole subtree is work against a live
> override: the primitives would render inside a scope that has already replaced
> the tokens they consume.

**The premise is false.** The tokens the primitives consume are `--sqx-*`, and
the parallel system does not define a single one:

```
tokens defined by public/saqeel-ds/**            113
tokens defined by src/app/saqeel.css             479
  ↳ defined by BOTH                                0        ← no override
tokens defined by the FROZEN src/app/tokens.css
  ↳ defined by BOTH                              109        ← this is what it overrides
occurrences of "sqx" anywhere in public/saqeel-ds  0
```

`public/saqeel-ds` overrides **the frozen legacy sheet**, which is the sheet the
programme is deleting anyway. It cannot reach `--sqx-text-body`,
`--sqx-text-heading` or any other role, because it has never heard of them.

`saqeel.css` is imported by `src/app/layout.tsx:2`, above every route including
`/field`, so a `<Text>` or `<Heading>` rendered inside `/field` resolves its role
from the same place it does on `/dashboard`.

**Consequence: the `/field` typography migration is not blocked by the parallel
stylesheet.** 658 violations — 43% of the entire remaining baseline — have been
recorded as blocked on a token collision that does not occur.

## What the parallel system *does* affect

It styles element selectors, not classes:

```
:root · body · h1,h2,h3,h4,h5,h6 · h1 · h2 · h3 · h4 · p · a · a:hover
[dir="rtl"], [lang="ar"] · [dir="rtl"] .t-mono · ::selection
```

A type primitive sets its font through a CSS Module **class** (specificity
0,1,0), which beats every element selector above (0,0,1) regardless of load
order. So the parallel sheet governs bare `<p>`/`<h2>`/`<a>` and legacy `t-*`
classes — **exactly the markup a migration removes** — and stops governing each
element the moment that element becomes a primitive.

This means the migration is **incremental and self-limiting**: each file
migrated is a file the parallel sheet no longer reaches. There is no
big-bang cutover, and the `<link>` can stay until the last file is done.

## Numbers

```
/field typography violations              658  (43% of 1,542)
/field files carrying them                 38
type scale imposed by public/saqeel-ds     13 steps  (SAQEEL has 9)
tokens it redefines that SAQEEL uses        0
tokens it redefines that tokens.css owns  109
```

## Verification

- [x] Token sets extracted from both systems and diffed, both directions
- [x] `grep -rc sqx public/saqeel-ds/` — zero matches
- [x] `saqeel.css` confirmed imported at `src/app/layout.tsx:2`, above `/field`
- [x] Selector inventory of `public/saqeel-ds/saqeel/tokens/typography.css`
- [ ] **Not measured in a browser** — see Blocked

## Blocked / open questions

**This is a specificity argument, not a measurement, and this repository has an
explicit rule about the difference.** `01-PROJECT-STATUS.md` (2026-08-12)
records that `document.fonts.check()` produced a confidently wrong answer and
concludes: *a font claim is a width measurement or it is a guess.*

The measurement owed is one line on a `/field` route with a type primitive on
screen — computed `font-size`, `font-weight` and `line-height` of a `<Text>`,
compared against the same primitive on `/dashboard`. **It could not be taken
here: `/field` requires an authenticated Inspector session, and the persona
credentials are absent (see T-119).**

So: the token analysis is conclusive that no `--sqx-*` is overridden, and that
is enough to say **the recorded blocker is wrong**. Whether anything *else* on
`/field` interferes is one measurement away, under an Inspector session.

## The ruling itself

Still the owner's, and now cheaper to make:

- **`/field` joins SAQEEL** — 38 files, incremental, no cutover, no token
  conflict. The `<link>` is removed last, not first.
- **`/field` is declared separate** — 658 violations leave the baseline and the
  programme owns 884, not 1,542.

The second option was previously the pragmatic one because migration looked
blocked. It no longer does.

## Parked

- **`/field` is the offline PWA channel** and carries the two largest files in
  the application — `Workspace.tsx` (1,991 lines / 130 KB) and `Startup.tsx`
  (1,384 lines / 85 KB). Whatever the typography ruling, those are the highest
  regression risk in the repository and should not be migrated in the same task
  as anything else.
- **`public/saqeel-ds/saqeel/tokens/fonts.css` `@import`s three families from
  `fonts.googleapis.com`** — already recorded 2026-08-12 and still present. The
  offline channel still carries the runtime network dependency the root layout
  deliberately removed by self-hosting.
