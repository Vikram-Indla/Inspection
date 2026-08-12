# 2026-08-12 · T-069 — factory-family typography sweep

`task: T-069` · `status: partial (field surfaces not rendered)` · `duration: 1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014`

---

## Goal

Owner asked for the remaining factory-named routes in one pass. Typography only
— the legacy structural migration stays with its owner (WEB-014 §11).

## What changed

| File | Action |
| --- | --- |
| `factories/[id]/FactorySpatialMap.{tsx,module.css}` | empty state → `Text`; rule deleted |
| `sections/planning-single/factory-results/{tsx,module.css}` | `.name` → `Text bodyStrong`; `.codes` retired `code` role → `Mono`; two rules deleted |
| `sections/planning-single/single-visit-screen/factory-search.tsx` | `eyebrow` → `description` |
| `field/factory-360/page.tsx` | inline-sized `∅` glyph → `Icon`; inline-styled `<h2>` → `Heading` |
| `field/factory-360/[id]/page.tsx` | inline-sized `⛔`/`∅` glyphs → `Icon`; `headerName` → `Heading`; 5 × `tileValue` + 2 × `statBig` → `Metric`; `<h3>` → `Heading`; 6 × `<summary><span>` → `Text` |
| `field/factory-360/[id]/field-factory360.module.css` | 7 raw declarations removed |
| `field/inspection/[id]/factory-verification.module.css` | 25 raw declarations removed |
| `scripts/typography-baseline.json` | 1,000 → 959 |

## Decisions

**Controls got `font: inherit`, not a primitive.** `factory-verification.module.css`
is a dense iPad form and most of its sized classes sit on `<button>` and
`<label>` — `.chip`, `.check`, `.statusChip`, `.evidenceAttach`. **Deleting a
`font-size` from a button does not make it inherit; it makes it Arial**, which is
exactly the T-064 bug. Those five got `font: inherit` (gate-legal, and the
established fix). Pure-text classes had their declaration deleted and now
inherit `body`.

**Decorative glyphs became icons rather than sized text.** `<div style={{
fontSize: 32 }}>⛔</div>` is a decorative graphic typed as text. CLAUDE.md rule 9
says a decorative graphic is an `aria-hidden` icon, so they are now
`<Icon name="restricted" size="xl" />` and `<Icon name="factory" size="xl" />`.
That removes the inline-font violation *and* the rule-9 violation together.

**`factory-verification` is not a factories route and was flagged as such
before starting.** It lives on `/field/inspection/[id]` — T-024, *"the largest
single file; split last, after every primitive exists"*. It was included because
the owner asked for every factory-named file, but its 25 violations belong to a
route that has not been designed yet.

**Two regex mistakes, both caught by typecheck.** A `<summary><span>` → `Text`
replacement assumed every summary ended `</span>{badge(` — three did not, and
left unbalanced JSX. A second pass inserted `font: inherit` where one already
existed, producing duplicate declarations in two rules. **Bulk regex edits across
20 files need a compile and a diff read, not just a gate run** — the gate was
green while the JSX was broken, because the gate only reads CSS and single
lines.

## Inventory taken before writing code

- All 49 factory-family violations enumerated by file and rule.
- Each class paired with its call site to separate control from prose.
- `factory-verification`'s route ownership checked against the tracker (T-024).
- `FactoryList` re-confirmed dead — **not migrated**, it needs deleting.

## Numbers

```
                              before   after
factory-family violations       49       8
repo violations              1,000     959
files touched                    —      11
stylesheet rules deleted         —      14
```

Remaining 8, both out of scope by design:

- `factories/cr/[id]/factory360.module.css` — 5 (`font-weight` ×3,
  `line-height` ×2). Affect no size; die with T-020's rebuild.
- `factories/factory-list.module.css` — 3. **Dead code**; needs deletion, not
  migration.

## Accessibility

- **axe:** not run. **Owed.**
- Manual (WEB-003 §10):
  - screen reader — heading levels unchanged; `⛔`/`∅` were already
    `aria-hidden` and `Icon` keeps them so; `titleId`/`labelledBy` untouched
  - **field/iPad touch targets** — `.chip`, `.check` and `.evidenceAttach` keep
    their `min-block-size: 50px`; only the font declaration changed. Their text
    moves from ~12.5–13.4px to the inherited 14px, which is a legibility gain on
    a device held at arm's length, but **it was not measured on device**
  - **320px, Arabic/RTL — not verified. Owed.**

## Verification

- [x] `npm run typecheck` — clean (one unrelated error in
      `operations/sections/labels.ts` is another agent's uncommitted work)
- [x] `npm run gates:typography` — PASSED, 959 known, 0 new
- [x] Baseline diff audited entry-by-entry — **all 41 removals are this task's
      own files**, none absorbed from the concurrent session
- [x] `/planning/single` rendered signed-in — 4 sizes, 0 off-scale, one
      typeface; the `factory-search` title-above-description change confirmed
      visually
- [ ] **`/field/factory-360`, `/field/factory-360/[id]` and
      `/field/inspection/[id]` were NOT rendered.** They require an inspector
      persona; the planner session is redirected to `/login`. **This is the
      largest untested surface in the task — 34 of the 41 changes are on it.**
- [ ] `/factories/[id]` not rendered — it redirects to `cr/[id]` unless the
      factory has no CR, so `FactorySpatialMap`'s empty state needs a CR-less
      fixture to see
- [ ] axe, 320px, Arabic/RTL — **owed**

**Visiting `/field/factory-360` ended the planner browser session** — the app
redirected to `/login` and subsequent `/factories` loads followed it. Re-auth is
the owner's (agents do not enter credentials). Budget for this before planning
browser verification that crosses persona boundaries.

## Retirement

No change. `FactoryList.tsx` + `factory-list.module.css` still await deletion.

## Parked

- **Field surfaces need an inspector-session verification pass.** Specifically:
  `.statVal` moved 20px → its tile value is now `Metric` (28px), and
  `.rosterFoot strong` moved 18px → 28px. Both are dense iPad rows and **28px
  could overflow**. If it does, the fix is the layout, not the type role
  (WEB-014 §10).
- `factory-verification`'s 25 fixes sit on a screen scheduled for rebuild under
  T-024; whoever does that rebuild is bound by WEB-014 §11.

## Blockers

None for the code. Verification of the field surfaces is blocked on an inspector
session.
