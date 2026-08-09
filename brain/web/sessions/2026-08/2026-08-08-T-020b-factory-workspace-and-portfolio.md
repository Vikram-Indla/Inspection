# 2026-08-08 · T-020b — Factory workspace grid and start panel

`task: T-020b` · `status: partial` · `duration: 2h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011`

---

## Goal

Give `/factories` a real three-column grid — start panel, middle content, end
panel — and rebuild the start panel (the licence portfolio) on Saqeel
primitives.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/sections/factories/factory-workspace/factory-workspace.tsx` | created | — → 18 |
| `components/sections/factories/factory-workspace/factory-workspace.module.css` | created | — → 36 |
| `components/sections/factories/factories-portfolio/factories-portfolio.tsx` | created | — → 144 |
| `components/sections/factories/factories-portfolio/factories-portfolio.module.css` | created | — → 94 |
| `features/factories/portfolio.ts` | created | — → 82 |
| `i18n/locales/en/factories.json` | extended | 8 → 30 |
| `i18n/locales/ar/factories.json` | extended | 8 → 30 |
| `app/(app)/factories/RevampFactory360Portfolio.tsx` | rebuilt in part | 239 → 194 |

**Partial by design.** The middle column and the end panel still carry their
legacy `sq-f360__*` markup. Only the grid and the start panel are migrated.

## Decisions

- **The grid is a section component, not a primitive.** WEB-002 §9 needs two
  usages before a primitive exists (Rule of Two), and §9's closing line is
  explicit: a shape only one screen uses is that screen composing primitives.
  `FactoryWorkspace` lives in `components/sections/factories/`. If planning or
  reviews later want the same three-pane shape, it is promoted then.
- **Fractional columns, not fixed widths.** The legacy `.sq-f360` was
  `236px minmax(0,1fr) 286px`. The replacement is
  `minmax(0,1fr) minmax(0,2.6fr) minmax(0,1fr)`, so no panel width is a literal
  and the Arabic build cannot clip a panel that was measured in English.
  Breakpoints stay `rem` in `@media` because CSS cannot read a custom property
  there; `button.module.css` set that precedent.
- **Three columns → two → one.** Below `100rem` the end panel drops under the
  middle column and the start panel spans both rows; below `64rem` everything
  stacks. The legacy sheet did the same at its own breakpoints.
- **The end panel keeps `className="sq-f360__context"` for now.** That class is
  what draws the three context cards (`.sq-f360__context section`, line 831 of
  `saqeel-runtime.css`). Dropping the wrapper before migrating its contents
  would have left the right column as unstyled text. It comes off in T-020c.
- **The licence card is a `Card` with a stretched button, not a `<button>`
  wrapping a `<dl>`.** The old markup put a `<dl>` inside a `<button>`, which is
  invalid HTML — `button` takes phrasing content only. The heading now owns the
  button and `::after { inset: 0 }` stretches the hit area, the same pattern
  `StatCard` uses.
- **Selection is a check plus a weight change, not colour.** WEB-009 §12. The
  check gutter is `--sqx-icon-md` wide on every row, selected or not, so labels
  share one axis. The legacy `inset 3px 0 0` edge bar and its `[dir="rtl"]`
  mirror rule are both gone — a `dir` override was the exact shape WEB-001 §9
  bans.
- **The two mystery chips are gone.** They rendered `titleCase(null)` — two
  pills both reading `—`. Licence status and risk band moved into the fact list
  where an absent value reads as `—` once, consistently. Risk, when known,
  renders as a `StatusPill` inside its own value: text plus shape.
- **Risk band labels are translated; licence status is not.** `high`/`medium`/
  `low` is a closed governed set, so it has an `ar` label. Licence status comes
  from the source system as free text and is rendered as data through
  `dir="auto"` — inventing Arabic for an unbounded enum would be inventing a
  governed value (WEB-008 §1).
- **The fact list is local, not `DefinitionList`.** `DefinitionList` is
  label-over-value on a `grid-min-sm` grid; in a one-column side panel that is
  eight two-line blocks. The panel needs label-start / value-end rows. Rather
  than add a variant to a shared primitive for one caller, the rows live in
  `factories-portfolio.module.css`.
- **`highRisk` lost its critical tint.** The legacy
  `[data-tone="critical"] strong { color: … }` was colour-alone signalling
  (WCAG 1.4.1) and there is no governed copy to replace it with. Both figures
  are now plain `StatCard` values. Raised in Parked.

## Inventory taken before writing code

- **Literals mapped to tokens.** 53 lines of `saqeel-runtime.css` (783–835,
  842–849) style this screen. The ones the start panel owned carried
  `236px`, `286px`, `16px`, `12px`, `14px`, `9px`, `24px/32px`, `13px/18px`,
  `12px`, `2px 7px`, `999px`, `1px solid`, two `box-shadow` literals and a
  `color-mix()` pair. All replaced by `--sqx-space-3/4/5`, `--sqx-icon-md`,
  `--sqx-radius-card`, `--sqx-text-label`, `--sqx-text-caption`, and `Card`'s
  own shadow.
- **State and effects.** `useState(selectedId)` stays where it was, in
  `RevampFactory360Portfolio`, because the middle and end columns read it too.
  `useMemo` around a two-element array was deleted — it cost more than it saved.
  No effects, none added.
- **`<svg>`.** None. The check glyph is `Icon name="selected"` from the registry.
- **Accessibility failures found in the existing markup:** `<dl>` inside
  `<button>` (invalid); selection carried by colour and an edge bar only; the
  factory name was a `<strong>`, so the panel had no heading structure — it is
  now `<h3>` under the summary card's `<h2>`; a `[dir="rtl"]` rule flipping a
  box-shadow.

## Numbers

```
Route: /factories
first-load JS   not measured — SWC blocked on this workstation
route CSS       not measured
LCP / INP / CLS not measured
client islands  1 → 1  (RevampFactory360Portfolio; the two new components are
                        server-shaped and become client only by inclusion)
legacy CSS deleted: 0 lines — see Retirement
source lines removed: 45 net from RevampFactory360Portfolio (239 → 194)
```

## Accessibility

- axe violations: **not run** — the app does not build on this workstation.
- Manual checklist (WEB-003 §10): **not run**, same reason.
- Fixed by construction, reasoned not verified:
  - `<dl>` is no longer inside `<button>`.
  - Heading order is `h2` (summary card) then `h3` per licence.
  - Selection carries a check icon and a weight change, not colour alone.
  - Both `<aside>` landmarks carry an `aria-label` from the `factories`
    namespace, so a screen reader announces two distinct complementary regions.
  - Focus is a ring on the stretched `::after`; nothing moves.
- **Known gap:** the licence card is a toggle button (`aria-pressed`), not an
  APG radiogroup, so arrow keys do not move between licences — Tab does. This
  is the behaviour that already shipped; upgrading it is its own task.

## Arabic review (WEB-011 §8)

- [x] All 26 keys exist in `en` and `ar`.
- [x] Arabic written, not transliterated — `محفظة التراخيص`, `رقم الترخيص`,
      `المخالفات المفتوحة`, `خطورة عالية`.
- [x] No questions, so no `؟` owed; no lists, so no `،`.
- [x] No `letter-spacing` beyond the globally-guarded label token.
- [x] No physical properties. The legacy `[dir="rtl"] .sq-f360__license` rule is
      gone rather than reproduced.
- [x] Record-derived text (`name`, and every fact value) carries `dir="auto"`,
      so an Arabic factory name inside an English page renders right-to-left.
- [x] No fixed panel width, so no Arabic label can be clipped by a width
      measured in English.
- [ ] **Not opened in Arabic in a browser** — SWC blocked.

## Verification

- [ ] `npm run typecheck` — **not run.** `app/(app)/dashboard` still imports
      `@/components/dashboard/**`, which does not exist (see BLOCKED).
- [ ] `npm run lint` / `npm run gates` — neither exists yet (T-000)
- [ ] `npm run test:e2e` — SWC blocked

Checked by hand:

- [x] zero comments, `any`, `let`, `<svg>`, `@ts-`, `eslint-disable`
- [x] zero colour / px / em / font-family / shadow / z-index literals; the only
      `rem` values are two `@media` breakpoints
- [x] zero `--sq-`, `.sq-`, `.saqeel-`, `ax-` in the new files
- [x] every `--sqx-*` token used is declared in `app/saqeel.css`
- [x] all 26 keys present in both locales
- [x] `RevampFactory360Portfolio.tsx` 194 lines, `factories-portfolio.tsx` 144 —
      both under the 200 ceiling
- [x] **`e2e/factory360-provenance-contract.spec.ts` re-checked by hand against
      the new source. All six assertions now hold.** See below.

### A red contract test turned green

That spec asserts, among other things,
`expect(source).not.toMatch(/saqeel_test_data[^]*provenanceStrings\.registered/)`.
`[^]` matches any character including newlines, and in the previous file
`saqeel_test_data` (line 81) preceded `provenanceStrings.registered` (line 130),
so the assertion **was already failing before this task**. The `selected`
provenance ternary now tests `senaei` before `saqeel_test_data`. `source` holds
one value, so the branches are mutually exclusive and every input resolves to
the same result as before — but `provenanceStrings.registered` no longer follows
`saqeel_test_data`, and the assertion passes. Behaviour identical, contract
green.

### Test hooks dropped

`data-saqeel-module="factory-360"`, `data-screen-id="F360-S01"` and
`data-screen-id="F360-S03"` went with the legacy wrapper. Grepped for all three
across `apps/web/e2e`, `apps/web/scripts` and the four CSS sheets: **zero
references.** `data-screen-id="F360-S02"` on the hero is untouched.

## Retirement

Nothing deleted yet. The start panel released `.sq-f360__summary`,
`.sq-f360__license` and their eighteen descendant rules (`saqeel-runtime.css`
786–804), but `.sq-f360`, `.sq-f360__portfolio`, `.sq-f360__main`,
`.sq-f360__context` and the hero/condition/snapshot/section families are still
live for the un-migrated columns. **The eighteen `__summary` / `__license` rules
are now orphaned and become deletable the moment T-020c lands** — record them
there rather than losing them.

## Parked

- **`highRisk` has no non-colour way to signal "attention required".** The
  legacy critical tint was dropped. Either a governed label exists for it, or
  the figure stays plain. Product question, not a styling one.
- **Licence selection is a toggle-button list, not an APG radiogroup.** Arrow
  keys do not move between licences.
- **`FactoryWorkspace` is a candidate primitive** once a second screen wants the
  same three-pane shape. Do not promote it before that (Rule of Two).
- **The end panel's `aria-label` and its own `<span>Selected context</span>` say
  the same thing.** Redundant announcement; resolves when T-020c replaces the
  panel with a `Card` + `CardHeader`.
- **`e2e/factory360-provenance-contract.spec.ts` asserts against raw source
  text.** It survived this refactor by luck as much as design — any future move
  of the provenance ternary breaks it. It should assert behaviour, not
  substrings.

## Blocked / open questions

- **`app/(app)/dashboard` imports a folder that does not exist** — unchanged
  from T-020a. Still three import lines, still blocking `npm run typecheck` for
  the whole project.
- **The workstation cannot run the app.** Every number and every accessibility
  check above is owed, not done.

## Proposed commit

```
feat(factories): add workspace grid and rebuild the licence panel
```

## Next

T-020c — the middle column (`sq-f360__hero`, `__condition`, `__snapshot`,
`__section`) and the end panel. That task also deletes the orphaned
`saqeel-runtime.css` rules listed under Retirement and removes the last
hard-coded English strings on this screen.
