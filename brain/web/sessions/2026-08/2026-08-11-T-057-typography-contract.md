# 2026-08-11 · T-057 — Typography contract: nine roles, type primitives, ratcheted gate

`task: T-057` · `status: done` · `duration: 2h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-009, WEB-011, WEB-014 (authored)`

---

## Goal

Remove the source of typographic inconsistency across `apps/web` — not by
correcting call sites, but by cutting the scale down to a set that cannot be
chosen wrongly and making typography unreachable from feature code.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `apps/web/src/app/saqeel.css` | rebuilt typography block | 963 → 971 |
| `apps/web/src/components/saqeel/type/text.tsx` | created | — → 100 |
| `apps/web/src/components/saqeel/type/heading.tsx` | created | — → 46 |
| `apps/web/src/components/saqeel/type/metric.tsx` | created | — → 20 |
| `apps/web/src/components/saqeel/type/type.module.css` | created | — → 139 |
| `apps/web/src/components/saqeel/type/index.ts` | created | — → 15 |
| `apps/web/src/components/saqeel/index.ts` | barrel export added | 118 → 136 |
| `apps/web/src/components/saqeel/card/card.module.css` | title → `heading`, description → `body` | 219 → 219 |
| `apps/web/scripts/check-typography.mjs` | created | — → 173 |
| `apps/web/scripts/typography-baseline.json` | generated | — → 382 |
| `apps/web/e2e/typography-scale-contract.spec.ts` | created | — → 74 |
| `apps/web/package.json` | `gates`, `gates:typography`, `gates:typography:update` | 47 → 50 |
| `brain/web/rules/WEB-014-typography-contract.md` | created | — → 233 |
| `CLAUDE.md` | rule 7 corrected to `saqeel.css`; rule 7b added | 210 → 224 |
| `brain/web/README.md` | rule index row + range `WEB-000 … WEB-014` | — | 
| `.claude/launch.json` | created (dev server config for preview) | — → 13 |

## Decisions

**The old rule was being obeyed.** Both components the owner named
(`factory-risk-outlook`, `factory-ai-advisory`) used only `var(--sqx-text-*)`,
had zero hardcoded values, and passed every gate. The inconsistency was
*token-legal*. This is the finding that shaped everything else: a stricter rule,
or better-behaved agents, would not have prevented it.

**Cause was choice, not disobedience.** Twelve roles with four inside a 2px band
(10 / 11.5 / 11.5 / 12) and no selection rule. Measured usage:
`caption` 164 · `label` 68 · `body` 59 · `overline` 33 · `body-strong` 23 ·
`code` 21 · `subheading` 15 · `metric` 5 · `title` 4 · `heading` 4 ·
`body-lg` 2 · `display` 1. **72% of usage at ≤12px, 3.5% above 16px** — the
app had no typographic top end, which is why it did not read as enterprise.

**Retire by aliasing, not deleting.** Deleting `caption` would have made
`font: var(--sqx-text-caption)` unresolvable at 164 call sites, dropping the
declaration and falling back to inherited type — a broken tree hours before a
demo. Retired roles instead resolve to their canonical replacement. This means
**the alias performs the migration**: all 164 caption sites became 14px/1.6 in
one edit, which is precisely the defect the owner reported. Screen-by-screen
work is now cleanup, not a prerequisite. The aliases are scaffolding and WEB-014
§2.1 forbids writing new references to them.

**No `SectionCard` was built.** `Card`/`CardHeader` already enforced
eyebrow → title → description. The owner's "subtitle before title" complaint was
caused by screens hand-rolling cards in their own CSS modules, not by the
component. The fix is WEB-014 §5 making the existing component mandatory —
building a second one would have violated the ledger rule.

**Authoring boundary is `src/components/saqeel/`, not `type/`.** The pure form
(only the type primitive may touch a font property) would require rewriting
`Button`, `Card`, `DataGrid` and every other primitive tonight. The enforced
boundary is *feature code may not style text; the design system may* — which
captures the drift without a high-risk refactor before a demo.

**14px body, not 15px.** 15px remains the better choice for a ministry system
read on office monitors, and is a one-token change
(`--sqx-text-body-size: 0.9375rem`). It was not taken tonight because
`caption` → `body` already moves 164 sites up 22%; 15px would make it 30% and
risk table reflow hours before the demo. Revisit after.

**Card titles 16px → 20px.** The single largest visual change in this task.
`CardHeader.title` was `subheading`; against 27px metrics it read as a table
header. One card-title size app-wide is what makes the screens look deliberate.

## Inventory taken before writing code

- **Scale audited** — 12 roles, exact rem/px/line/weight/tracking recorded; four
  roles found inside a 2px band; two prose sizes (14px, 15px) found.
- **Usage counted** — 399 token consumptions across ~100 CSS modules, tallied
  per role (above).
- **Literals mapped** — **203 raw `font-size` declarations** and 44 raw
  `line-height` declarations already shipped, in direct violation of CLAUDE.md
  rule 7. Worst offenders `dashboard.module.css` (52px, 34px, 22px, 18px),
  `field/*` (12.5px, 13.5px, 14.5px), `admin/templates/form-builder.module.css`.
  This is why agents drifted: **precedent beat prose.**
- **Owner's named examples traced to source** — `factory-risk-outlook.module.css`
  `.body` = `body` vs `.meta` = `caption`; `factory-ai-advisory.module.css`
  `.lead` = `body` vs `.note` = `caption`. Both token-clean.
- **Existing components checked before building** — `Card`, `CardHeader`,
  `CardValue`, `StatCard`, `KPICard`, `MetricStrip`, `DescriptionList` all read;
  no `Text`/`Heading`/`Metric`/`Overline`/`Mono` existed; no barrel collision.
- **State and effects** — none. This task added no client components; all five
  primitives are Server Components with no `"use client"`.
- **`<svg>`** — none added.
- **i18n** — no user-visible string introduced; the primitives render `children`
  only, so no namespace was needed (WEB-013 clean by construction).

## Numbers

```
Typography roles          12 → 9   (4 retired as resolving aliases)
Prose sizes                2 → 1   (14px; 11.5px caption eliminated)
Card-title sizes           2 → 1   (20px)
Roles within a 2px band    4 → 0
Type usage at ≤12px      72% → measured per screen during burndown
Typography violations     1,130 baselined across 380 entries (ratchet floor)
Retired-alias call sites    191 (caption 164 · code 21 · title 4 · body-lg 2)
                                 all corrected by the alias, none edited
New client islands           0
```

Bundle and LCP numbers not taken: this task ships no route change and no client
JS, and a production build is the human's to run (WEB-005 §8). **Measurement
request:** first-load JS on `/factories` and `/dashboard` before and after, to
confirm the type primitives add nothing to the shared chunk.

## Accessibility

- **axe:** not run — requires the production build and an authenticated session.
  **Owed.**
- **Manual checklist (WEB-003 §10):**
  - keyboard — n/a, no interactive element added
  - screen reader — `Heading` renders a true `h1`–`h6` chosen by outline, never
    by appearance; `visual` decouples size from level so no task needs to skip a
    level to get a size
  - 200% zoom — all nine roles are `rem`-based; no `px` in the scale
  - 320px — not verified in a browser. **Owed.**
  - Arabic/RTL — `:lang(ar)` overrides rewritten to canonical roles only, so
    aliases inherit correctly (`caption-line` now resolves through `body-line`
    = 1.8). **But see the parked finding: `/ar/login` serves `lang="en"`, so
    these overrides may not be firing on any route.** Not introduced here.
  - dark — token-driven, unchanged
  - reduced motion — untouched
  - greyscale — unaffected; no status colour changed
- **Floor raised:** smallest text in the system is now 11px (`overline`,
  uppercase, never a sentence), up from 10px. Prose never below 14px, up from
  11.5px. Both are net accessibility improvements.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — **script does not exist** (parked, found in T-053)
- [x] `npm run gates:typography` — PASSED, 1,130 known, 0 new
- [x] Gate proven to fail on a new violation — probe added to
      `metric-card.module.css`, gate exited 1 naming file and line, probe removed
- [ ] `npm run gates` — fails on `check:design-system-v5`, **verified
      pre-existing** by stashing this diff and re-running (parked)
- [ ] `npm run test:e2e` — needs a production build (human's to run)
- [x] All 77 `--sqx-text-*` tokens consumed in `src` resolve against the 78
      defined; zero dangling
- [x] `saqeel.css` brace depth balanced at EOF
- [x] **Live token values read from the running dev server** —
      display 30/1.15 · heading 20/1.3 · subheading 16/1.4 · body 14/1.6 ·
      body-strong 14/1.6 · label 12/1.4 · overline 11/1.3 · metric 28/1.1 ·
      mono 13/1.5; aliases caption 14/1.6 · body-lg 14/1.6 · title 30/1.15 ·
      code 13/1.5. All correct.
- [ ] Authenticated screens not viewed — sign-in requires credentials the agent
      does not enter. **Owed: owner to eyeball `/factories` and `/dashboard`
      before the demo**, specifically for table reflow from the 11.5px → 14px
      rise.
- [ ] Definition of Done (WEB-006 §5) — not fully ticked; axe, 320px and the
      browser pass are owed above.

## Retirement

No component retired. Four **tokens** retired as aliases — `--sqx-text-caption`,
`--sqx-text-body-lg`, `--sqx-text-title`, `--sqx-text-code`. They are not
`@retiring`-bannered because they are CSS custom properties, not components;
their retirement is enforced by the `retired-typography-role` gate rule instead,
and they are deleted when the baseline reaches zero entries for that rule.

## Parked

Four items added to the tracker's PARKED section: the missing `lint` script
(amended — `gates` now exists), the pre-existing `check:design-system-v5`
failure, the `/ar/login` `lang="en"` finding, and the 1,130-violation burndown.

## Blockers

None. The burndown is incremental by design and every screen task carries its
own share under WEB-014 §8.
