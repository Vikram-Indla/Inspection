# Figma QA register — 2026-08-01

What a developer should know before building from the file. Regenerate the numbers by
re-running the clip census described at the bottom.

## Clipping census

A node counts as clipped when its bounds fall outside a clipping ancestor, so the text
is cut on the canvas.

| Section | Frames | Real defects | Intentional scroll |
|---|---|---|---|
| SCREENS — EN · Light | 29 | 1 | 19 |
| SCREENS — EN · Dark | 29 | 1 | 19 |
| SCREENS — AR · RTL | 29 | 2 | 26 |
| SCREENS — AR · RTL · Dark | 29 | 2 | 26 |
| SCREENS — STATES · EN · Light | 73 | **0** | 0 |
| SCREENS — OVERLAYS · EN · Light | 6 | **0** | 0 |

195 frames, 9,630 component instances. Down from 134 clipped nodes at the start of
this pass. No frame truncates its sidebar; no text node is blank.

Width overflow, all 11 instances in EN · Light, accounted for:

| Where | Count | Reading |
|---|---|---|
| `SCR-WEB-100 table-wrap > thead/tr` | 9 | the intentional Planning scroll |
| `Factory 360 identity > context-badges` | 1 | open defect 1 below |
| `Analytics Select > Select option` | 1 | parent does not clip; nothing is cut |

## Intentional, do not "fix"

**SCR-WEB-100 Planning — the visit table scrolls horizontally.**
`saqeel-components.css:156` sets `.planning-visit-table { inline-size: max-content }`
inside `.table-wrap { overflow: auto }` (:221). The table is 1,275px wide in a 992px
wrapper, so four columns sit past the right edge in the frame. That is the runtime
behaviour, not a layout bug, and the frame is left showing it.

**The four columns you cannot see in the frame**, in order after `Risk`:

| # | Column | Width |
|---|---|---|
| 10 | Priority | 95px |
| 11 | AI score | 62px |
| 12 | Status | 127px |
| 13 | Last updated | 88px |

Full column order: Visit ID · Factory · CR · Licence · Authority · Visit type ·
Planning window · Inspector · Risk · **Priority · AI score · Status · Last updated**.

Every other table in the file uses base `.table`, which is `width: 100%` (:222), so its
columns fit the wrapper and none are hidden.

## Open defects

**1. Factory 360 — `identity` card, all four sections.**
A status line ("Reason · High-risk recommendation" / "Opened from Operations Center")
is wider than the 320px card. The label is now truncated with an ellipsis, but the
underlying cause is that the card was authored narrower than the content it carries. A
designer should decide whether the card widens or the copy shortens; truncation is a
stopgap, and a truncated *reason* is a poor reading experience on a risk card.

**2. SCR-WEB-200 — `panel-visit-filters`, AR sections only.**
The filter row's search field overruns its panel by a few pixels under RTL because the
field is authored at a fixed width rather than filling. Cosmetic, does not hide content.

Neither blocks a build. Both are recorded so nobody re-derives them from scratch.

## Fixed in this pass

- **Standard tables refitted.** Enforcement Library was hiding its `Action form` column
  entirely; Compliance Library and Execution were cutting columns. Refitted on natural
  column widths, excess taken only from columns above the median so short columns keep
  their labels, with ellipsis per `.cell-trunc` (:237). Columns holding buttons keep the
  width the control needs — a button cannot ellipsize.
- **`risk-stats` was collapsed to 1px tall** on Factory 360, hiding the whole stat block.
  Now 182px.
- **`Input` in the SCR-WEB-300 filter panel was 1px tall**, which is why the search field
  and the region select appeared to overlap.
- **SCR-WEB-300 tab strip** held 730px of tabs in a 489px rail, so `Actions` was cut off.
  Now wraps to two lines; every tab is visible.
- **Notification badge** was 14px hanging 4px above a clipping button on every frame in
  the file. `saqeel-runtime.css:967` puts it *inside* the trigger at 18px square,
  `inset-block-start: 2px`, `inset-inline-end: 1px`. Corrected at the component, and
  again per-frame in the AR sections, which are detached.
- **SCR-WEB-320** was 433px tall against a rail needing 711px, cutting the nav after
  `Planning`. Given a `minHeight` from the rail's intrinsic content height.

## How to re-run the census

For every TEXT node in every screen frame, walk up the ancestors; for each with
`clipsContent`, compare absolute bounds. Count a node once. Exclude `table-wrap` inside
`SCR-WEB-100`, which is the intentional scroll region above.
