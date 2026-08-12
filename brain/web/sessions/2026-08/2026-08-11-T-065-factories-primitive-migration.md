# 2026-08-11 · T-065 — `/factories` primitive migration (part 2 of 2)

`task: T-065` · `status: done` · `duration: 1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014`

---

## Goal

Part 2 of the owner's split. Move `/factories` off feature-CSS typography and
onto the type primitives, so the route cannot drift back. No visual change
intended — part 1 already made it render correctly.

## What changed

**Type primitives extended** (three gaps found by the migration, not before it):

| File | Change |
| --- | --- |
| `saqeel/type/text.tsx` | `dir` prop (`auto`/`ltr`/`rtl`) and `live` prop (`alert`/`status`) |
| `saqeel/type/heading.tsx` | `visual` extended with `bodyStrong` and `label` |
| `saqeel/type/type.module.css` | rules for the two new heading visuals |
| `saqeel/type/index.ts` | exports `TextDirection`, `TextLiveRole` |

**20 components migrated** across `components/sections/factories/`:
`factories-portfolio`, `factory-ai-advisory`, `factory-actions`,
`factory-case-timeline`, `factory-compliance`, `factory-context`,
`factory-documents`, `factory-identity`, `factory-location`, `factory-overview`,
`factory-profile`, `factory-risk`, `factory-risk-history`,
`factory-risk-outlook`, `factory-section-nav`, `factory-sections`,
`factory-snapshot`, `factory-trends`, `factory-trust`, `factories-scope-bar`.

**Two stylesheets deleted entirely** — `factory-context.module.css` and
`factory-identity.module.css` held nothing but typography once migrated.

## Decisions

**Three primitive gaps, all found only by doing the migration:**

1. **`dir="auto"` was unavailable.** Nine call sites carry it on
   user-supplied data — factory names, coordinates, provenance lines. In an
   Arabic-first app that is not decoration: without it a mixed
   Arabic/Latin string renders in the wrong visual order. Migrating without it
   would have silently broken RTL correctness on the exact strings that need it.
   Added to `Text`.
2. **`role="alert"` collided with my own `role` prop.** `Text`'s `role` names
   the typography role, so an ARIA role could not be passed. Rather than rename
   `role` across every existing call site, added an explicit `live` prop taking
   `alert`/`status`. Two call sites needed it.
3. **`Heading` could not express a heading that renders small.** It offered only
   `display`/`heading`/`subheading`, and two real headings need `body-strong`
   (the portfolio card's factory name) and `label` (the portfolio summary
   heading). This bit twice before being fixed properly — see below.

**The `Heading` gap caused a real regression I nearly shipped.** Converting
`factory-trends`' `<h3>` titles to `visual="subheading"` moved them 14px → 16px
and added a **fifth** size to the route. Measurement caught it. Extending
`HeadingVisual` restored 14px. The principle: **a heading's semantic level and
its visual weight are independent — that is the whole point of the `visual`
prop, so it must cover the whole scale**, not just the large end.

**I nearly traded an accessibility regression for a lint win.** The portfolio
summary was an `<h2 id>` used by the card's `aria-labelledby`. My first pass
converted it to `<Text as="span">`, which satisfies the gate and **removes a
heading from the document outline**. Caught on review and reverted; once
`Heading visual="label"` existed it became a proper `<h2>` again. **A violation
count is never worth a real heading.**

**Mixed-content containers keep no font declaration and inherit `body`.**
`factory-case-timeline`'s `.line`, `factories-scope-bar`'s `.count` and
`factory-section-nav`'s `.item` are flex rows of pills, links and badges, not
text nodes. Wrapping each fragment in `Text` would be noise. Their `font:`
declaration was deleted and they inherit 14px `body` from `body` — same rendered
result, gate clean, markup unchanged.

**`.statValue` lost its size mid-migration and measurement caught it.** A
regex strip removed `font: var(--sqx-text-metric)` from the portfolio KPI values
without a primitive replacing it, which would have shrunk every portfolio number
from 28px to 14px. Fixed with `<Metric tone="inherit">` inside the existing
`<dd>`, so the status tone colours (`--sqx-status-critical` et al.) are
preserved exactly rather than swapped for `Text`'s slightly different
`--sqx-text-danger` family. **Do not change colours while migrating typography.**

**`font: inherit` on `.select` is kept and is not a violation.** The gate
patterns match `font-size`/`font-weight`/etc. and `font: var(--sqx-text-*)`;
`font: inherit` is neither. It is the fix for T-064's Arial bug and must stay.

## Inventory taken before writing code

- All 76 violations enumerated by file and rule before any edit.
- Every CSS rule paired with its call site, so rules carrying layout as well as
  typography were stripped rather than deleted.
- Import graph re-walked: `FactoryList.tsx` + `factory-list.module.css` have
  **zero importers** — dead, same as `DashboardView`. Not migrated.
- `factory360.module.css` confirmed live but on `/factories/cr/[id]`, a
  different route on the pre-Saqeel `--type-*` token set.

## Numbers

```
                                    before   after
violations — components/sections/factories/   62      0
violations — factories scope (all routes)     76     11
violations — repo                          1,067  1,002
distinct sizes on /factories                   4      4   (unchanged — intended)
typefaces                                      1      1
stylesheets deleted                            0      2
```

Every heading on the route now computes to an on-scale size (12 / 14 / 20).
Before this task the portfolio `<h3>` computed to 17px — the UA default — even
though its text rendered at 14px inside a child span.

## Accessibility

- **axe:** not run — needs the production build. **Owed.**
- Manual (WEB-003 §10):
  - screen reader — heading outline preserved and improved; the portfolio
    summary is still an `<h2>` carrying the `id` that `aria-labelledby` targets,
    and the factory-name `<h3>` is now a real `Heading`
  - **`dir="auto"` preserved on all nine user-data call sites** — this was the
    main RTL risk in the task
  - `role="alert"` / `role="status"` preserved via the new `live` prop
  - **320px, Arabic/RTL — not verified. Owed.**
- One deliberate loss: `.select[aria-pressed="true"] .name` bolded the selected
  factory. Selection is still carried by the accent colour **and** the check
  icon, so it remains text-plus-shape (WEB-002 §5).

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED, 1,002 known, 0 new
- [x] **Rendered signed-in and measured after every batch** — 4 sizes, 0
      off-scale, `allPlex: true`
- [x] Heading audit: every `<h1>/<h2>/<h3>` in `<main>` computes to 12/14/20px
- [x] Baseline diff reviewed — all 65 removals are this task's own files
- [ ] `npm run lint` — script still does not exist (parked)
- [ ] axe, 320px, Arabic/RTL — **owed**

**Browser-pane note:** one tab stalled on the `loading.tsx` fallback while a
direct `fetch()` of the same URL returned the full 330 KB of SSR HTML. The page
was fine; the hidden pane had stopped compositing. Opening a fresh tab resolved
it. This is the same limitation T-061 recorded for `getBoundingClientRect()` —
**if the pane looks stuck, verify against the server response before believing
the DOM.**

## Retirement

`FactoryList.tsx` + `factory-list.module.css` (3 violations) — zero importers,
route renders `RevampFactory360Portfolio`. Added to the parked orphan list
alongside the `DashboardView` tree; both want one deletion task.

## Parked

The 11 remaining factories-scope violations, none on `/factories`:

- `factory360.module.css` (6) + `cr/[id]/page.tsx` inline style (1) —
  `/factories/cr/[id]`, still on the pre-Saqeel `--type-*` tokens. Its own route
  task.
- `factory-list.module.css` (3) — dead, retirement.
- `FactorySpatialMap.module.css` (1) — `/factories/[id]`.

## Blockers

None.
