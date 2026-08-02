# REPAIR-V2 — Tables and data density — 2026-08-01

File `ML2PNwfShlQM2k44MvSEw5`. Territory: page `6:9` (SCREENS) excluding sections
`339:42098` and `384:45164`, plus the Table library page `13:2`.

## What was measured

Every node named `table-wrap` in the territory, and every `Table cell` inside it.

- **Wrapper fit** — `table-wrap.width` against the width of its `thead`/`tr` rows.
- **Cell fit** — each visible child of each visible `Table cell` against the cell's own
  bounds, on all four edges. Invisible nodes are excluded: the AR cells carry a hidden
  `cell-badge` at a fixed 104px and a hidden `cell-text` at 104px, which a naive census
  reports as 158 overflows. None of them render. They are not defects.
- **Density** — body row heights per table, checked for uniformity.

77 frames hold tables. 15 in EN · Light, 14 each in EN · Dark, AR · RTL and AR · RTL · Dark,
6 in OVERLAYS, 10 in 1024, 4 in EXTERNAL.

## Tables audited — wrapper fit

Only five tables in the whole territory are wider than their wrapper, and all five are the
same table: `SCR-WEB-100` Planning. That is the documented intentional scroll
(`KNOWN-DEFECTS.md`, `.planning-visit-table { inline-size: max-content }` inside
`.table-wrap { overflow: auto }`). **Left scrolling.**

| Frame | Wrap | Wrapper | Table | Verdict |
|---|---|---|---|---|
| `29:528` Planning EN · Light | `32:652` | 992 | 1275 | intentional scroll — untouched |
| `95:7390` Planning EN · Dark | `95:7497` | 992 | 1275 | intentional scroll — untouched |
| `95:14038` Planning AR · RTL | `95:14145` | 992 | 1166 → 1292 | scroll kept; Factory column repaired |
| `97:13535` Planning AR · RTL · Dark | `97:13688` | 992 | 1166 → 1292 | scroll kept; Factory column repaired |
| `239:36119` Planning 1024 | `239:36169` | 984 | 1275 | intentional scroll — untouched |

Every other table uses base `.table` at wrapper width. **No column is hidden anywhere else
in the territory.** The prior pass on Enforcement Library, Compliance Library and Execution
held: re-measured, all three sit exactly at 992 with zero overflow.

## Tables repaired

One defect class, in two frames.

**AR · RTL Planning — the `المنشأة` (Factory) column had collapsed to 40px.** Its cells held
factory names 81–142px wide with `cell-text` at HUG and `textTruncation: DISABLED`, so nine
rows of Arabic text spilled across the neighbouring column and past the table's own right
edge. This is not the intentional scroll — the scroll is the table being wider than the
wrapper, which is preserved. A 40px column is a collapse: at runtime `max-content` would size
that column to its content and never to 40px, and the EN twin of the same table authors it at
166px.

Repair: the Factory column set to 166px, matching EN exactly, in the header row and all eight
body rows. No truncation override was added — at 166px the cell's inner width is 150px and the
widest name is 142px, so every name fits whole, which is precisely how the EN table behaves. No
new class, no token, no invented value.

| Table | Frame | Wrap | Wrapper | Column before | Column after | Table before | Table after | Previously spilling |
|---|---|---|---|---|---|---|---|---|
| Planning visit table, AR · RTL | `95:14038` | `95:14145` | 992 | Factory 40px | Factory 166px | 1166 | 1292 | 9 cells, 6–110px past the cell |
| Planning visit table, AR · RTL · Dark | `97:13535` | `97:13688` | 992 | Factory 40px | Factory 166px | 1166 | 1292 | 9 cells, 6–110px past the cell |

All other columns in both tables were already at EN parity and were not touched:
Last updated 88 · Status 108 · AI score 131 · Priority 82 · Risk 82 · Inspector 78 ·
Planning window 92 · Visit type 69 · Authority 148 · Licence 82 · CR 91 ·
**Factory 40 → 166** · Visit ID 75.

### Nodes touched — 18 in total

`95:14145` (AR · RTL): `180:12375`, `180:12418`, `180:12460`, `180:12502`, `180:12544`,
`180:12586`, `180:12628`, `180:12670`, `180:12712`

`97:13688` (AR · RTL · Dark): `180:13860`, `180:13902`, `180:13944`, `180:13986`,
`180:14028`, `180:14070`, `180:14112`, `180:14154`, `180:14196`

## Verification

Re-ran the full census after the repair, across the entire territory:

- **Visible cell overflow: 0.** Down from 18.
- **Density: 0 issues.** Every table's body rows share one height — 33px in the EN screens,
  36px in the AR screens, 44px in the library `Table row` Data variants.
- Re-measured both repaired tables node by node: Factory 166px on all nine rows, widest text
  142px against a 150px inner width, table 1292px in a 992px wrapper — still scrolling, as
  intended.

**Responsive re-measure at 1280 / 1024 / 834 / 680 could not be completed** — the Figma MCP
tool-call limit for the seat was reached immediately after verification. It should be run
before this is signed off. Two things bound the risk in the meantime: the repaired column is
inside a `max-content` scroll table, whose column widths do not vary with the wrapper, and the
1024 breakpoint of Planning is authored as its own frame (`239:36119`, wrapper 984, table 1275)
which was measured and is unchanged.

## Table library page `13:2`

No defects. `table-wrap` `13:3` is 760px with every row at 760px. The `Table cell`
component set `71:14` and the `Table row` set `108:296` (Header and Data, 3–8 columns, all
992px) are internally consistent. The six "overflows" a raw census reports on `71:14` are the
24px inset between the component-set frame and its variants, not clipped content.

## Not in this pass

- `Factory 360 identity` card and `SCR-WEB-200 panel-visit-filters` under RTL remain open in
  `KNOWN-DEFECTS.md`. Neither is table geometry.
- The hidden `cell-badge` / `cell-text` pairs in the AR cells are authored at 104px inside
  cells as narrow as 56px. They render nothing today, but any future pass that makes a badge
  visible in an AR table will find it overflowing its cell. That is a component contract
  question, not a page-level geometry fix.
