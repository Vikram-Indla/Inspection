# 2026-08-11 · T-064 — `/factories` visible typography

`task: T-064` · `status: done (part 1 of 2)` · `duration: 1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014`

---

## Goal

Owner split the `/factories` work: everything **visible** first, the
architectural primitive migration second. This is part 1 — make the route render
on-scale in one typeface.

## What changed

| File | Action |
| --- | --- |
| `sections/factories/factories-portfolio/*.module.css` | `font: inherit` on the button; `.heading` → `body-strong`; `.summaryLabel`/`.statLabel`/`.term` → `label`; `.value` → `body-strong` |
| `saqeel/definition-list/definition-list.module.css` | `term` `overline` → `label` (shared primitive) |
| `sections/factories/factory-snapshot/*.module.css` | label `overline` → `label` |
| `sections/factories/factory-compliance/*.module.css` | label `overline` → `label` |
| `sections/factories/factory-profile/*.module.css` | label `overline` → `label` |
| `sections/factories/factory-risk-outlook/*.module.css` | label `overline` → `label` |
| `sections/factories/factory-trust/*.module.css` | label `overline` → `label` |
| `sections/factories/factory-context/factory-context.tsx` | eyebrow → description |
| `sections/factories/factory-identity/factory-identity.tsx` | title/eyebrow **inverted** |
| `sections/factories/factory-overview/factory-overview.tsx` | eyebrow → trailing `StatusPill` |
| `sections/factories/factories-skeleton/*.tsx` | eyebrow → description |
| `sections/factories/factory-dossier-skeleton/*.tsx` | eyebrow → description |
| 19 `.module.css` across the scope | 29 retired `caption`/`code`/`body-lg` refs → canonical |
| `scripts/typography-baseline.json` | re-levelled 1,104 → 1,067 |

## Decisions

**The factory name was rendering in Arial.** The single most important string on
the route, in a different typeface from the entire rest of the application:

```
span.factories-portfolio_name    → Arial 13.33px   ← the factory name
button.factories-portfolio_select → Arial 13.33px  ← no `font: inherit`
h3.factories-portfolio_heading   → plexArabic 12px
```

**`<button>` does not inherit `font` from its parent** — with no explicit rule it
takes the UA default, which is Arial 13.33px on Chrome/Windows. `.name` set only
`font-weight`, so it inherited the button's Arial. Nothing in the source looks
wrong; `.select` simply never said `font: inherit`. This is the same failure
class as the `--sqx-font-sans` bug in T-058: **the typeface is decided by
something absent, and absence is invisible in review.** Only measurement finds
it.

**A heading was rendering smaller than its own content.** `.heading` is the
`<h3>` wrapping the factory name and was set to `label` (12px) — smaller than
body — while containing 13px text. Now `body-strong`.

**`body-strong` over `subheading` for the picker row.** `subheading` (16px) was
tried first and measured: it produced a **fifth** size and rendered the same
factory name at 20px (card titles), 16px (picker) and 14px (elsewhere) on one
screen. The picker is a selection control, not a section title, so `body-strong`
is both semantically right and keeps the route at four sizes matching
`/dashboard`. Recorded because the 16px version looks defensible in source and
only measurement showed the cost.

**11px `overline` → 12px `label`, 31 instances.** WEB-014 §2 assigns `overline`
to "the uppercase eyebrow above a card title". None of these were that — they
are key-value keys ("Plant number", "Licence type") and in-card section labels
("Predicted risk", "Why this risk", "Inspection reports", "Identity"). They lose
their uppercase, matching the `MetricStrip` treatment from T-058.

**`DefinitionList` was fixed in the shared primitive**, so this corrects every
screen using it, not just `/factories` — same reach as `DataTable` in T-059.

**Three eyebrow call sites, three different correct answers** — this is why the
gate rule cannot auto-fix:

1. `factory-context` — "Selected context" above the factory name. A subtitle in
   the wrong slot. → `description`.
2. `factory-identity` — "Identity" above a CR code. **The title was in the wrong
   slot, not the eyebrow.** "Identity" is the card's name; the code is its
   value. → `title="Identity"`, `description=<bdi>{code}</bdi>`.
3. `factory-overview` — "Opened from Factory 360" above the factory name, but
   the card **already had a description** (code · CR · location), so the eyebrow
   had nowhere to go. It is navigational provenance, not a subtitle. → a neutral
   `StatusPill` in `trailing`, following the precedent set by the dashboard's
   capacity card.

## Inventory taken before writing code

Presented to the owner and confirmed before any edit (WEB-008). Route rendered
signed-in **first**, per the T-059 lesson.

- Rendered audit: 6 distinct sizes, 2 typefaces, 31 × 11px labels.
- Ancestry walked from the Arial node to find the unstyled button.
- Static debt enumerated by rule: 113 violations across 57 entries.
- 5 eyebrow call sites read individually rather than pattern-replaced.
- No new i18n keys; no new client islands; no `<svg>`; no state or effects.

## Numbers

```
                          before      after
distinct sizes               6          4     (28 · 20 · 14 · 12)
typefaces                    2          1
off-scale sizes              1 (13px)   0
11px labels                 31          0
retired-role refs           31          0
eyebrow call sites           5          0
violations (route)         113         76
violations (repo)        1,104      1,067
```

`/factories` now renders the **same four sizes as `/dashboard`**.

## Accessibility

- **axe:** not run — needs the production build. **Owed.**
- Manual (WEB-003 §10):
  - screen reader — `titleId`/`labelledBy` wiring untouched on all three
    converted cards; `factory-identity`'s `<h2>` now carries the section name
    ("Identity") rather than a bare code, which reads better in a heading list
  - smallest text rose 11px → 12px across 31 places
  - keyboard / dark / reduced motion — unaffected
  - **320px, Arabic/RTL — not verified. Owed.**
- `factory-overview`'s provenance moved into a `StatusPill`, which carries a
  text label — no colour-only meaning introduced (WEB-002 §5).

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED, 1,067 known, 0 new
- [x] **Rendered signed-in and measured**: 4 sizes, 0 off-scale, `allPlex: true`
- [x] Arial confirmed eliminated by canvas measurement, not by reading the stack
- [x] CSS diffs reviewed line-by-line — an over-broad `text-transform` regex was
      caught and verified to have hit exactly one rule per file
- [ ] `npm run lint` — script still does not exist (parked)
- [ ] axe, 320px, Arabic/RTL — **owed**

## Retirement

`CardHeader.eyebrow` drops 21 → 16 call sites.

## Parked

Part 2 of this route: **76 violations remain** — 55 `font-shorthand` and 21
`raw-typography-property`, all architectural (feature CSS consuming tokens
directly instead of composing the type primitives). No visual change; the route
renders correctly today. Same shape as the dashboard's part 2.

## Blockers

None.
