# REPAIR-V6-CANVAS — canvas and staging cleanup

Agent: V6-CanvasAndStagingCleanup
File: `ML2PNwfShlQM2k44MvSEw5` (SAQEEL Web master) — no other file opened.
Property class touched: node **position** and **section bounds** only. No fill, text, size,
component swap, or structural change was made to any node.

**Nothing was deleted.** Every node named below still exists, with the same id, the same
parent type of container, and the same visual properties. Moving a component never breaks its
instances, and no instance was touched.

---

## 1. Loose nodes on page `6:9` (`— SCREENS —`)

**Found: zero.**

Page `6:9` has 18 top-level children and every one of them is a `SECTION`. The 0,0 pile
recorded in `P0-CANVAS-REPAIR-OPERATIONS-CENTER.md` (24 `panel-content/*` components plus
`DetailRow` stacked on the Dashboard delivery frame `21:2`) has not recurred.

Parking section `384:45164` — `COMPONENTS — panel-content (parked · not delivery canvas)` —
holds all 25 of those components in a clean two-row grid at y=96199 / y=96503, with zero
mutual overlap. It was inspected and needed no maintenance. Its bounds
(x=-80, y=96119, 5080x684) were left unchanged.

## 2. Overlaps against delivery frames

**Found: zero.** No node anywhere on `6:9` intersects a delivery frame without being its
child, and no section on `6:9` overlaps another section. There was no intruder to move.

## 3. Overlaps repaired — inspector sections on `6:9`

Sections `305:40149`, `310:40972` and `312:42490` each laid 1024px-wide frames on a 954px
column pitch, so every frame overlapped its right-hand neighbour by 70px — 18 collisions
across the three sections. Re-pitched to 1104px (1024 + 80 gutter). Row y-positions and all
frame sizes are unchanged; only the x of columns 1–3 moved.

| Section | Node id | before abs. x | after abs. x |
|---|---|---|---|
| `305:40149` | `305:40298` | 874 | 1024 |
| `305:40149` | `305:40461` | 1828 | 2128 |
| `305:40149` | `305:40533` | 2782 | 3232 |
| `305:40149` | `306:40708` | 874 | 1024 |
| `305:40149` | `306:40848` | 1828 | 2128 |
| `305:40149` | `306:40976` | 2782 | 3232 |
| `310:40972` | `310:40989` | 874 | 1024 |
| `310:40972` | `310:41015` | 1828 | 2128 |
| `310:40972` | `310:41030` | 2782 | 3232 |
| `310:40972` | `310:41069` | 874 | 1024 |
| `310:40972` | `310:41088` | 1828 | 2128 |
| `310:40972` | `310:41109` | 2782 | 3232 |
| `312:42490` | `312:42925` | 874 | 1024 |
| `312:42490` | `312:43315` | 1828 | 2128 |
| `312:42490` | `312:43466` | 874→ see note | 2128 |
| `312:42490` | `312:44142` | 874 | 1024 |
| `312:42490` | `312:44481` | 1828 | 2128 |
| `312:42490` | `312:44825` | 2782 | 3232 |

(`312:43466` moved 2782 → 3232; the two rows of that section use the same four columns.)

Section bounds extended to fit, origin unchanged:

| Section | before | after |
|---|---|---|
| `305:40149` | x=-80 y=35202 3856x3053 | x=-80 y=35202 **4416**x3053 |
| `310:40972` | x=-80 y=38555 3856x3053 | x=-80 y=38555 **4416**x3053 |
| `312:42490` | x=-80 y=45928 3856x3053 | x=-80 y=45928 **4416**x3053 |

No section overlaps another after the widening.

## 4. Overlaps NOT repaired — out of remit

Eight sibling overlaps remain on `6:9` and were deliberately left alone.

- **`239:35967`** (`SCREENS — 1024 · EN · Light`) — 6 overlaps. Frames sit on a 1000px row
  pitch while several are 1351–2233px tall, so tall frames bleed into the row below. This is
  a protected delivery section; its coordinates carry traceability and both parties in every
  collision are delivery frames of that same section, so there is no intruder to move.
  Repairing it needs an owner decision, not a janitorial move.
  Affected pairs: `239:35968`/`239:36800`, `239:36119`/`239:36923`,
  `239:36402`/`239:37038`, `239:36402`/`239:37648`, `239:36800`/`239:37398`,
  `239:37162`/`239:38165`.
- **`339:42098`** — 2 overlaps (`383:45019`/`385:45287`, `383:45124`/`385:45164`). Active
  build territory belonging to another agent. Not entered.

Section `423:47937` and everything below y=100000 on `6:9` was likewise not entered.

## 5. Component library pages tidied

Twelve overlaps across six of the thirteen library pages. All resolved by moving the
newer/smaller node clear; no established layout was rearranged beyond what the collision
required. The remaining seven pages (`9:2`, `11:22`, `13:2`, `73:2`, `14:2`, `14:87`,
`14:157`) were censused and were already clean.

| Page | Node id | Name | before (x,y) | after (x,y) |
|---|---|---|---|---|
| `7:394` Button | `8:34` | Button modifiers | 0, 470 | 0, **500** |
| `9:55` Form Controls | `11:2` | Select / Seg / Combo / FileUpload | 0, 260 | 0, **360** |
| `11:44` Panel & KPI | `26:364` | Operational KPI | 1902, 0 | **1820**, 0 |
| `11:44` Panel & KPI | `27:491` | Factory card | 2260, 0 | **2080**, 0 |
| `11:44` Panel & KPI | `152:8` | panel-content/placeholder | 1400, 0 | **2400**, 0 |
| `11:44` Panel & KPI | `152:17` | Panel (component set) | 1400, 200 | **0, 1100** |
| `11:44` Panel & KPI | `166:12` | DescriptionList row | 1400, 700 | **1200, 1100** |
| `13:49` Nav & Chrome | `18:10` | nav-item | 900, 0 | **300, 200** |
| `13:49` Nav & Chrome | `156:205` | Brand mark | 1400, 0 | **1820**, 0 |
| `13:49` Nav & Chrome | `156:213` | Brand lockup | 1400, 80 | **1820**, 80 |
| `14:31` Progress & Spine | `15:29` | spine | 260, 0 | **500**, 0 |
| `14:118` State | `179:12964` | saqeel-state--rls-denied | 0, 400 | 0, **1180** |
| `14:118` State | `179:12969` | saqeel-state--unauthorized | 0, 540 | 0, **1320** |

The 1040x792 `Panel` component set `152:17` was the main sprawler on `11:44` — it sat across
the whole right-hand cluster and collided with three neighbours. It now has its own row
below the component strip.

Each page was re-scanned after its edit and returned **zero** remaining overlaps.

## 6. Final census

| Check | Result |
|---|---|
| Loose (non-SECTION) top-level nodes on `6:9` | **0** |
| Top-level children of `6:9` | 18, all SECTION |
| Components overlapping a delivery frame | **0** |
| Section-vs-section overlaps on `6:9` | **0** |
| Sibling overlaps inside `305:40149` / `310:40972` / `312:42490` | **0** (was 18) |
| Sibling overlaps inside `239:35967` | 6 — protected, escalated not moved |
| Sibling overlaps inside `339:42098` | 2 — other agent's territory, not entered |
| Overlaps on the 13 component library pages | **0** (was 12) |
| Parked section `384:45164` internal overlaps | **0** |
| Nodes deleted | **0** |

## 7. Root cause note, carried forward

The `panel-content/*` components still live on the `— SCREENS —` page rather than a library
page. Anything authored there without an explicit position still defaults to 0,0, which is
directly on top of the first delivery frame. The parking section contains today's population,
but the defect will recur until those components are relocated to a library page. That
relocation is a library-ownership decision and was not made here.
