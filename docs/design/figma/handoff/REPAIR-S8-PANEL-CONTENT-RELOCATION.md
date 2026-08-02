# REPAIR S8 — `panel-content/*` relocation off `— SCREENS —`

File `ML2PNwfShlQM2k44MvSEw5` (SAQEEL Web master).

## What this closes

`P0-CANVAS-REPAIR-OPERATIONS-CENTER.md` moved 25 loose components off the delivery canvas into
parking section `384:45164`, and named the root cause it could not fix: those components lived on
the `— SCREENS —` page `6:9`, so anything authored there without an explicit position defaults to
`0,0` — on top of the first delivery frame `21:2` (Dashboard). V6 confirmed the parking section was
tidy but the defect still armed.

The owner authorised the move. All 25 are now on a library page. The trap is disarmed: authoring on
`— SCREENS —` no longer produces `panel-content` components at the origin, because the family no
longer lives there.

## Destination and rationale

**`Panel & KPI` `11:44`.** Not a new page. Two independent reasons, both already true in the file:

1. **The family already has a member there.** `panel-content/placeholder` `152:8` sits on `11:44` at
   `(2400,0)`. It is the generic slot component every `panel-content/*` variant specialises. Moving
   the other 24 onto `11:44` reunites the family with its own base case rather than inventing a
   third location for it.
2. **`DetailRow` has a structural sibling there.** `DescriptionList row` `166:12` is on `11:44` at
   `(1200,1100)`. `DetailRow` is the same kind of node — a label/value row primitive consumed inside
   panels — so it belongs beside its sibling, not on `Identity & Misc` `14:87`.

`Identity & Misc` `14:87` was inspected and rejected: it holds identity and chrome miscellany
(`avatars`, `user-chip`, `pagination`, `kbd`, `divider`, `accordion`, `Accordion header`,
`RemoteVideoTile`) and has no panel-composition members at all. A dedicated new library page was
also considered and rejected — it would split `panel-content/*` across two pages, since
`panel-content/placeholder` is on `11:44` and is not mine to move.

### Placement

`11:44` was re-measured immediately before writing, as instructed — V6's move of the `Panel`
component set `152:17` to `(0,1100)` is present and was accounted for. Occupied bands at the time of
the move:

| Band | Extent |
|---|---|
| Row 1 — existing components | y 0 – 453, x 0 – 2800 |
| Row 2 — `Panel` set `152:17` + `DescriptionList row` `166:12` | y 1100 – 1892, x 0 – 1760 |

The relocated grid starts at **y = 2100**, a 208px clear gutter below the lowest existing content
(y 1892). Grid is 5 columns × 5 rows, column pitch 800, row pitch 320. Widest member is 750
(`visits-filters`), tallest is 244 (`filter-builder` / `visit-configuration`), so every cell has
clear air on both axes.

**Overlap audit after the move: 0 overlapping pairs across all 35 top-level nodes on `11:44`.**

## The 25 components — before and after

Every one was in section `384:45164` on page `6:9` (`— SCREENS —`) before. All 25 are now direct
children of page `11:44` (`Panel & KPI`). Nothing was renamed, detached, restyled, or deleted;
position and parentage only.

| # | Node id | Name | Before | After (page `11:44`) |
|---|---|---|---|---|
| 1 | `167:7087` | DetailRow | `6:9` § `384:45164` (40,80) | (0, 2100) |
| 2 | `193:19029` | panel-content/SCR-WEB-110-filter-builder | `6:9` § `384:45164` (784,80) | (800, 2100) |
| 3 | `193:19323` | panel-content/SCR-WEB-120-factory-search | `6:9` § `384:45164` (1124,80) | (1600, 2100) |
| 4 | `193:19359` | panel-content/SCR-WEB-120-visit-configuration | `6:9` § `384:45164` (1464,80) | (2400, 2100) |
| 5 | `193:19569` | panel-content/SCR-WEB-130-identity-location | `6:9` § `384:45164` (1804,80) | (3200, 2100) |
| 6 | `193:19550` | panel-content/SCR-WEB-130-urgency-reason | `6:9` § `384:45164` (2144,80) | (0, 2420) |
| 7 | `193:19612` | panel-content/SCR-WEB-130-visit-type | `6:9` § `384:45164` (2484,80) | (800, 2420) |
| 8 | `193:19786` | panel-content/SCR-WEB-140-configuration-form | `6:9` § `384:45164` (2824,80) | (1600, 2420) |
| 9 | `241:38647` | panel-content/insp-246-find-an-establishment | `6:9` § `384:45164` (3164,80) | (2400, 2420) |
| 10 | `241:38854` | panel-content/insp-248-request | `6:9` § `384:45164` (3504,80) | (3200, 2420) |
| 11 | `241:38897` | panel-content/insp-248-supporting-evidence | `6:9` § `384:45164` (3844,80) | (0, 2740) |
| 12 | `241:39105` | panel-content/insp-249-correction | `6:9` § `384:45164` (4184,80) | (800, 2740) |
| 13 | `241:39304` | panel-content/insp-250-objection | `6:9` § `384:45164` (4524,80) | (1600, 2740) |
| 14 | `241:39708` | panel-content/insp-252-decision | `6:9` § `384:45164` (40,384) | (2400, 2740) |
| 15 | `241:39933` | panel-content/insp-253-decision | `6:9` § `384:45164` (380,384) | (3200, 2740) |
| 16 | `241:40101` | panel-content/insp-254-decision | `6:9` § `384:45164` (720,384) | (0, 3060) |
| 17 | `241:40276` | panel-content/insp-255-decision | `6:9` § `384:45164` (1060,384) | (800, 3060) |
| 18 | `193:19631` | panel-content/inspector-picker — Multi=No | `6:9` § `384:45164` (1400,384) | (1600, 3060) |
| 19 | `193:19843` | panel-content/inspector-picker — Multi=Yes | `6:9` § `384:45164` (1740,384) | (2400, 3060) |
| 20 | `305:40629` | panel-content/scr-ipad-630-question | `6:9` § `384:45164` (2080,384) | (3200, 3060) |
| 21 | `306:40695` | panel-content/scr-ipad-640-note | `6:9` § `384:45164` (2420,384) | (0, 3380) |
| 22 | `306:40744` | panel-content/scr-ipad-650-finding | `6:9` § `384:45164` (2632,384) | (800, 3380) |
| 23 | `195:20582` | panel-content/scr-vir-710-otp-state | `6:9` § `384:45164` (2972,384) | (1600, 3380) |
| 24 | `195:20957` | panel-content/scr-vir-720-notes | `6:9` § `384:45164` (3312,384) | (2400, 3380) |
| 25 | `189:17744` | panel-content/visits-filters | `6:9` § `384:45164` (3652,384) | (3200, 3380) |

The P0 list of 25 ids was verified against the live file before anything moved — section `384:45164`
held exactly those 25 nodes, no more and no fewer. The list was not trusted blind.

## Instance proof

Counted across the **whole file** via `ComponentNode.instances`, which resolves instances on every
page, not just the current one. Counted immediately before the first move and immediately after the
last.

| Node id | Name | Instances before | Instances after |
|---|---|---|---|
| `167:7087` | DetailRow | 158 | 158 |
| `189:17744` | panel-content/visits-filters | 7 | 7 |
| `193:19029` | SCR-WEB-110-filter-builder | 3 | 3 |
| `193:19323` | SCR-WEB-120-factory-search | 3 | 3 |
| `193:19359` | SCR-WEB-120-visit-configuration | 3 | 3 |
| `193:19550` | SCR-WEB-130-urgency-reason | 3 | 3 |
| `193:19569` | SCR-WEB-130-identity-location | 3 | 3 |
| `193:19612` | SCR-WEB-130-visit-type | 3 | 3 |
| `193:19631` | inspector-picker — Multi=No | 3 | 3 |
| `193:19786` | SCR-WEB-140-configuration-form | 3 | 3 |
| `193:19843` | inspector-picker — Multi=Yes | 3 | 3 |
| `195:20582` | scr-vir-710-otp-state | 3 | 3 |
| `195:20957` | scr-vir-720-notes | 3 | 3 |
| `241:38647` | insp-246-find-an-establishment | 1 | 1 |
| `241:38854` | insp-248-request | 1 | 1 |
| `241:38897` | insp-248-supporting-evidence | 1 | 1 |
| `241:39105` | insp-249-correction | 1 | 1 |
| `241:39304` | insp-250-objection | 1 | 1 |
| `241:39708` | insp-252-decision | 1 | 1 |
| `241:39933` | insp-253-decision | 1 | 1 |
| `241:40101` | insp-254-decision | 1 | 1 |
| `241:40276` | insp-255-decision | 1 | 1 |
| `305:40629` | scr-ipad-630-question | 0 | 0 |
| `306:40695` | scr-ipad-640-note | 0 | 0 |
| `306:40744` | scr-ipad-650-finding | 0 | 0 |
| | **Total** | **207** | **207** |

Exact match on the total and on every individual component. Zero instances broken.

Three components carry 0 instances — `scr-ipad-630-question`, `scr-ipad-640-note`,
`scr-ipad-650-finding`. That is their pre-existing state, unchanged by this move, and is recorded
here as an observation only. It is not a defect this repair introduced and nothing was done about
it.

## Parking section `384:45164`

**Removed.** After the last batch it held 0 children, and its only purpose — holding components off
the delivery canvas until a library home was authorised — is now served by `11:44`. The removal is
guarded: the script re-read the section, confirmed `children.length === 0`, and would have aborted
without deleting had anything still been inside. No component was deleted; the section was an empty
container.

## Loose-node census on `— SCREENS —` `6:9`

After the move and the section removal:

| Check | Result |
|---|---|
| Top-level nodes on `6:9` | 20 |
| Of which sections | 20 |
| **Loose top-level non-section nodes** | **0** |

The 20 remaining top-level nodes are all delivery/reference sections (`SCREENS — EN · Light`,
`— EN · Dark`, `— AR · RTL`, `— AR · RTL · Dark`, `— STATES`, `— OVERLAYS`, `— 1024`,
`— EXTERNAL (INSP-239)`, the INSPECTOR sections, the two `REFERENCE ONLY` sections, and the four
`SCREENS — BUILD` bands). Every one of them was left untouched.

## Territory

Only section `384:45164` (now removed) and destination page `11:44` were written to. No delivery
section, no section `339:42098`, no section `239:35967`, and no build band at y = 100000–149999,
160000, 180000, 200000, 220000, 240000, 260000 or 280000 was read for write or modified. Nothing was
restyled — no fill, token, size, name, description or property definition was altered on any of the
25 components. Position and parentage only.

## Quota

No API limit was hit. The move completed in full: 25 of 25 relocated, in three batches of 10 / 10 /
5, each verified on return. Nothing is half-moved and nothing remains on `— SCREENS —`.
