# 2026-08-08 · T-020 (detail page) slice 4 — main-column sections

`task: T-020 /factories/[id] transform (sliced, slice 4 of ~6)` · `status: done` · `duration: ~1.5h`
`rules applied: WEB-002, WEB-009, WEB-012`

---

## Goal

Migrate the four main-column narrative sections of `/factories/[id]` off legacy
`sq-table`/`sq-lozenge`/`cd-timeline` markup onto the SAQEEL `DataTable`,
`Timeline`, `Card` and `StatusPill` primitives: the observed-locations table,
the risk-history block (with its `ContextualAiPanel`), the Spatial Case
Timeline, and the tabular inspection history. Strings already flow through
`t()`, so this is a markup/visual transform, not i18n.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `components/sections/factories/factory-location-log/factory-location-log.tsx` | created | 47 |
| `components/sections/factories/factory-risk-history/factory-risk-history.tsx` | created | 66 |
| `components/sections/factories/factory-risk-history/factory-risk-history.module.css` | created | 21 |
| `components/sections/factories/factory-case-timeline/factory-case-timeline.tsx` | created | 109 |
| `components/sections/factories/factory-case-timeline/factory-case-timeline.module.css` | created | 26 |
| `components/sections/factories/factory-inspection-history/factory-inspection-history.tsx` | created | 79 |
| `app/(app)/factories/[id]/page.tsx` | modified | 4 sections swapped; slice-4 view-model consts added; 3 legacy JSX comments dropped |

- **Observed-locations table** (`sq-table` + kind `sq-lozenge`) →
  `FactoryLocationLog` on `DataTable`: when (row-header `CellTime`), kind
  (`StatusPill` — override → danger, else info), observed coords (`<bdi>`
  numeric), mismatch/reason, visit (`CellLink`). Empty rows fall to the
  built-in `DataTable` empty state.
- **Risk history** (`sq-table` + related-violations `sq-row`) →
  `FactoryRiskHistory` on `DataTable`. The legacy `ContextualAiPanel` is passed
  in as an `ai` slot (kept in the page, where its ~10 `t()` props live), so the
  section stays presentational. Related violations render as danger
  `StatusPill`s, or the role-aware "no related / restricted" caption.
- **Spatial Case Timeline** (two `<ol className="cd-timeline">`) →
  `FactoryCaseTimeline` on the `Timeline` primitive: one timeline for the visit
  narrative (each visit's inspection/findings/actions/reviews as the event
  `detail`, findings & reviews as `StatusPill`s), one for the recorded case-event
  log (source sync, risk snapshots, penalties, evidence). Empty visits fall to an
  `EmptyState`; the log renders whenever it has entries, matching legacy.
- **Inspection history** (9-column `sq-table`) → `FactoryInspectionHistory` on
  `DataTable`: planning/operational/inspection statuses as `StatusPill`s,
  versions as muted text + a report `CellLink`, violations/actions/reviews gated
  by a `sensitive` prop (role) that renders the "restricted" caption otherwise.

## Decisions

- **View models built in the page, sections stay presentational.** Each section
  takes typed, pre-formatted row/event arrays + a `strings` bundle — the same
  contract the operations tables use (`OperationsHistoryTable`,
  `OperationsRiskTable`, `OperationsTimeline`). Enum labelling, date stamping and
  tone selection happen once in the page (`stamp`/`day`/`actionsLine`/
  `reviewTone` `const` arrows), never inside the section.
- **The signature timeline adopts the generic `Timeline` primitive.** The custom
  per-kind spine glyphs (`◉ ↻ ◆ § ●`) are dropped; the event kind is carried by
  the title/meta instead. This is a deliberate simplification toward the design
  system — the "connective, not causal" fact set is unchanged.
- **Categorical statuses (planning / operational) use tone `neutral`,
  inspection uses `info`.** These enums carry no health/severity semantics, so
  they are not mapped to success/warning/danger — only the risk band, findings
  and review decisions (which do) get semantic tones.
- **Anchor nav preserved without touching the strip.** The `cd-secstrip` links
  target `#location`/`#risk`/`#timeline`/`#history`; each new `Card` sets its
  `CardHeader` `titleId` to that id, so the `<h2 id="…">` is the scroll target.
  The nav strip and `cd-w3`/`cd-main3` layout are untouched (slice 6).
- **Server components, no DOM writes (WEB-012).**

## Verification

- [x] Static: four new files have no comments/`let`/`any`/`svg`/non-null/
  CSS-literals; balanced; all module tokens (`--sqx-text-subheading`,
  `--sqx-text-link`/`-hover`, `--sqx-numeric-tabular`, …) defined in
  `saqeel.css`; `DataTable`/`Timeline`/`EmptyState`/`Stack`/`Card`/`StatusPill`
  imports + named exports resolve from disk; no leftover
  `sq-table`/`sq-lozenge`/`cd-timeline`/`cd-tl__`/`<section id="location|risk|
  timeline|history">` in the page; each component well under the 200-line limit.
- [ ] `npm run typecheck` / browser / Arabic — not run (SWC/env blocker).

## Parked / remaining slices

5. Documents / representatives / products / materials / workforce sections
   (each still `sq-table` + its own `sq-banner` error + `sq-state` empty; the
   `VALIDITY_BADGE`/`docValidity`/`num`/`saudization`/`retry` view helpers stay
   until then).
6. `cd-w3`/`cd-main3`/`cd-side3` layout → grid primitive; `cd-secstrip` nav;
   route-file slim (reads → `features/factories/`); delete orphaned
   `cd-*`/`sq-f360__*` CSS.

## Proposed commit

```
refactor(factories): migrate detail-page main column to saqeel data-table + timeline
```

## Next

Slice 5 — the documents / representatives / products / materials / workforce
sections (tables + per-section error/empty states).
