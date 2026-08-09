# 2026-08-09 · T-021c — Primitive refinements + Visit Management skeleton

`task: T-021c` · `status: done (static verification only)` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-005, WEB-009, WEB-011`

---

## Goal

Four owner-reported refinements. Three are defects in **base primitives** and
are fixed there so every screen inherits them; the fourth retires the legacy
Visit Management loading state for a skeleton that mirrors the real layout.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/saqeel/data-table/data-table.tsx` | modified — `grow` rung deleted | 105 → 105 |
| `components/saqeel/data-table/data-table.module.css` | modified | 167 → 171 |
| 20 × `components/sections/**/*.tsx` | modified — `width: "grow"` removed | −1 line each |
| `components/saqeel/menu-surface/menu-row.tsx` | modified — check moved to end, count → `sup` | 35 → 37 |
| `components/saqeel/menu-surface/menu-surface.module.css` | modified — `.count` added | 157 → 175 |
| `components/saqeel/select/select.tsx` | modified — count → `sup` inside the value | 147 → 145 |
| `components/saqeel/select/select.module.css` | modified — `.count` added | 63 → 73 |
| `components/saqeel/status-pill/status-pill.module.css` | modified — symmetric padding | 61 → 63 |
| `components/sections/visits/visits-skeleton/visits-skeleton.tsx` (+ module) | created | 86 + 69 |
| `app/(app)/visits/loading.tsx` | rebuilt | 12 → 13 |
| `app/(app)/planning/visits/loading.tsx` | rebuilt | 1 → 13 |
| `i18n/locales/{en,ar}/planning.json` | extended — 2 keys each | 263 keys, parity |

## The four fixes

### 1 · `DataTable` — one column was eating every pixel of slack

`.head[data-width="grow"] { inline-size: 100% }` handed **all** surplus width to
a single column. On the visits table that produced the reported dead gap after
FACTORY *and* starved its neighbour into wrapping `V-2062` across two lines.

The rule is deleted, and with it the `grow` rung on `DataColumn.width`
(now `"min" | "auto"`). With no column claiming 100 %, the auto table layout
distributes surplus across all columns in proportion to their content — which is
the consistent rhythm that was asked for. `min` is kept: control and flag
columns genuinely must hug.

**This follows the T-030 precedent exactly** — when a rung is actively harmful,
delete the rung rather than re-tune it, so it cannot come back. 20 call sites
across dashboard, factories, operations, planning and visits were updated; a
repo-wide grep for `grow` under `components/sections` returns zero.

### 2 · `Select` / `MenuRow` — the count read as a second object, and the check squatted the leading edge

- The count was a `CountBadge` **sibling** of the label, separated by the flex
  gap. It is now a `<sup>` **inside** the label, so it belongs to the value it
  counts. `sup` already carries the smaller size and the raise, so **no
  `font-size` is spent** — nothing to token, nothing to invent. `line-height: 0`
  stops the raised glyph growing the row.
- `MenuRow`'s order was check → label → count. It is now label + count → check.
  The reserved check gutter still keeps labels on one axis, but it now sits at
  the **end**, so the dead space at the start of every unselected row is gone.
- `CountBadge` itself is untouched and still used by `factories-scope-bar`, so
  nothing is orphaned.

### 3 · `StatusPill` — the trailing letter was touching the border

`.pill` set `padding-inline: --sqx-space-2`, and `.pill[data-ping]` overrode
only `padding-inline-**start**` to `--sqx-space-3`. Every pinging pill therefore
had twice the air at the leading edge as at the trailing one — exactly what was
reported.

`padding-inline: --sqx-space-3` is now the single value for **all** pills, and
`[data-ping]` adjusts only the `gap` between dot and label. One padding, no
variant. Pills get marginally wider app-wide; that is the intended correction.

### 4 · Visit Management loading state

The legacy `loading.tsx` rendered a centred "Loading visits" `EmptyState` inside
the legacy `Shell` — a spinner-shaped box that mirrored nothing and guaranteed a
full re-layout on hydration.

`visits-skeleton` mirrors the real composition section for section: scope bar →
five status tiles on `CardGrid` → filter bar → selected-visit card → the table
card with a shaded header band and eight rows → the count/load-more footer. It
reuses `Card`/`CardGrid`/`Stack`/`Skeleton`/`SkeletonRegion` — no new primitive.
Same approach as `factories-skeleton` and `dashboard-skeleton`.

`/planning/visits/loading.tsx` was a one-line re-export of the `/visits` one,
which meant the planning route highlighted `/visits` in the rail while loading.
It is now its own file with `current="/planning"`.

## Inventory taken before writing code

- **Literals:** none introduced. The one raw value in the new module is
  `@media (max-width: 75rem)`, which **deliberately matches
  `data-table.module.css:110`** so the skeleton stacks at the same breakpoint as
  the real table. CSS media queries cannot read custom properties, so this is
  unavoidable rather than a shortcut; the precedent is the primitive itself.
- **`<svg>`:** none. Icons stay on the registry.
- **State/effects:** none added. The skeleton and both loading routes are Server
  Components; `visits-skeleton` ships zero client JS.
- **Accessibility:** `SkeletonRegion` supplies `role="status"`, `aria-busy`,
  `aria-live` and a visually-hidden label; every bone is inside its
  `aria-hidden` inner wrapper. The `sup` count stays in the accessible name of
  its option, as the `CountBadge` did — no announcement regressed.

## Numbers

```
Route: /visits · /planning/visits
first-load JS   NOT MEASURED — production build is the human's (WEB-005 §8)
client islands  unchanged (4); the skeleton adds none
legacy CSS deleted: 0 lines
```

## Accessibility

- axe: **NOT RUN.**
- Manual checklist (WEB-003 §10): **not performed.** Every claim above is a
  static reading. Three of these four changes are purely visual and want a real
  browser pass in both themes and in RTL — in particular the `sup` baseline in
  Arabic, where the numeral shaping differs.

## Verification

- [x] `npm run typecheck` — clean for every file here. The pre-existing
      `shell-topbar.tsx:81` error is unchanged and untouched.
- [x] `npm run check:design-system-v5` — zero findings in any file changed.
- [x] i18n parity — 263 keys, `en` and `ar`, no drift.
- [x] `grep -rn grow components/sections` — zero.
- [ ] `npm run lint` / `npm run gates` — still no such scripts (T-000).
- [ ] `npm run test:e2e` — not run.

## Retirement

Nothing newly marked. The legacy `EmptyState`-based visits loading state was
replaced in place rather than marked, since `loading.tsx` is a route file with a
single owner and no other importer.

## Parked

- **CSS comments.** WEB-000 §2 bans `/* */` without scoping to a language, yet
  `saqeel.css`, `data-table.module.css` and `menu-surface.module.css` all carry
  rationale comments written under these rules. I followed the files' existing
  convention and commented the three primitive fixes, because each records *why
  the obvious thing is wrong* — which no name can carry. **This needs an owner
  ruling:** either WEB-000 §2 explicitly exempts design-system CSS rationale, or
  these comments come out repo-wide.
- **`DataTable` column widths are now entirely content-driven.** If a screen
  ever needs a genuinely fixed proportion, that is a new, explicit rung
  (a numeric weight), not a revival of `grow`.
- **`CountBadge` now has exactly one consumer** (`factories-scope-bar`). If that
  one moves to the `sup` treatment for consistency, the primitive can retire.

## Blocked / open questions

None. All four changes are visual and need a browser pass, not a decision.

## Proposed commit

```
fix(saqeel): even table columns, superscript counts, symmetric pills
```

## Next

**T-021b** — the bulk-action forms still hold native `<select>` and
`datetime-local` controls (no datetime primitive exists), and the four sibling
visit views are untouched legacy.
