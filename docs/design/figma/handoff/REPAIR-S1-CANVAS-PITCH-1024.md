# REPAIR — S1 Canvas Pitch 1024

**Agent:** S1-CanvasPitch1024 (repair writer)
**File:** `ML2PNwfShlQM2k44MvSEw5` (SAQEEL Web master)
**Page:** `6:9`
**Section:** `239:35967` — `SCREENS — 1024 · EN · Light  (17)`
**Date:** 2026-08-01
**Authority:** owner explicitly authorised the re-pitch of this protected delivery section, which V6-CanvasAndStagingCleanup measured but deliberately did not fix.

**Scope of change: POSITION ONLY.** No frame was resized, restyled, renamed, reparented, deleted, or swapped. All 17 frames keep their ids and every visual property. Child count before = 17, after = 17.

---

## 1. Root cause

Frames were laid out on a fixed **1000px row pitch** across a 5-column grid (x = 0, 1150, 2300, 3450, 4600). Nine frames are taller than 1000px, and the tallest is 2233px (`239:36402`). Any frame taller than the pitch bleeds into the row below it, in the same column. Six pairs genuinely overlapped.

A seventh frame, `239:38165`, sat off-grid at y=27859 as a sub-stack under `239:36540` in column 3, and collided with the row-2 occupant of that column.

---

## 2. BEFORE — measured state

Section bounds: `x=-80, y=26852, w=5784, h=4479`

| # | id | name | x | y | w | h | bottom |
|---|---|---|---|---|---|---|---|
| 1 | `239:35968` | SCR-WEB-500 — Operations Center — /operations | 0 | 26932 | 1024 | 1506 | 28438 |
| 2 | `239:36119` | SCR-WEB-100 — Planning — /planning | 1150 | 26932 | 1024 | 1351 | 28283 |
| 3 | `239:36402` | SCR-WEB-300 — Review & Approval — /reviews | 2300 | 26932 | 1024 | 2233 | 29165 |
| 4 | `239:36540` | SCR-WEB-200 — Visit Management Workspace — /visits | 3450 | 26932 | 1024 | 847 | 27779 |
| 5 | `239:36667` | SUPERSEDED — Factory 360 regions-only draft | 4600 | 26932 | 1024 | 929 | 27861 |
| 6 | `239:36800` | SCR-WEB-310 — Level 2 Review Workspace — /reviews/[id] | 0 | 27932 | 1024 | 1078 | 29010 |
| 7 | `239:36923` | SCR-WEB-320 — Version Comparison — /reviews/[id] | 1150 | 27932 | 1024 | 433 | 28365 |
| 8 | `239:37038` | SCR-WEB-110 — Bulk Planning Criteria — /planning/bulk | 2300 | 27932 | 1024 | 989 | 28921 |
| 9 | `239:37162` | SCR-WEB-120 — Single Visit Planning — /planning/single | 3450 | 27932 | 1024 | 755 | 28687 |
| 10 | `239:37280` | SCR-WEB-130 — Immediate Visit Planning — /planning/immediate | 4600 | 27932 | 1024 | 765 | 28697 |
| 11 | `239:37398` | SCR-WEB-140 — Visit Configuration & Assignment | 0 | 28932 | 1024 | 905 | 29837 |
| 12 | `239:37518` | SCR-WEB-150 — Plan Review & Publish | 1150 | 28932 | 1024 | 1065 | 29997 |
| 13 | `239:37648` | SCR-WEB-210 — Visit Detail — /visits/[id] | 2300 | 28932 | 1024 | 973 | 29905 |
| 14 | `239:37774` | SCR-VIR-700 — Virtual Appointment & Waiting Room | 3450 | 28932 | 1024 | 1123 | 30055 |
| 15 | `239:37903` | SCR-VIR-710 — Identity & OTP Verification | 4600 | 28932 | 1024 | 1031 | 29963 |
| 16 | `239:38031` | SCR-VIR-720 — Virtual Inspection Session — /virtual/[id] | 0 | 29932 | 1024 | 1319 | 31251 |
| 17 | `239:38165` | SCR-WEB-200 — Visit Management Workspace — drawer open | 3450 | 27859 | 1024 | 847 | 28706 |

---

## 3. Collision list — BEFORE (6)

Full pairwise AABB scan, 136 pairs tested. All 6 collisions are same-column vertical bleed.

| # | Frame A | Frame B | Column | Overlap Y (px) |
|---|---|---|---|---|
| 1 | `239:35968` (1506) | `239:36800` | x=0 | 506 |
| 2 | `239:36800` (1078) | `239:37398` | x=0 | 78 |
| 3 | `239:36119` (1351) | `239:36923` | x=1150 | 351 |
| 4 | `239:36402` (2233) | `239:37038` | x=2300 | 989 |
| 5 | `239:36402` (2233) | `239:37648` | x=2300 | 233 |
| 6 | `239:38165` (off-grid) | `239:37162` | x=3450 | 755 |

Every colliding pair is a delivery frame on both sides — there is no intruder node, which is exactly why V6 stopped.

---

## 4. Method applied

1. Column structure preserved exactly — same 5 columns at x = 0, 1150, 2300, 3450, 4600. No reflow, no reorder, no change of column count.
2. Reading order preserved — every frame stays in its original column and its original row band, in the same sequence.
3. Row pitch is no longer fixed. Each row band is sized from the **tallest frame in that row plus a 120px gutter**:

| Row band | Tallest member | Band height | Gutter | New row y |
|---|---|---|---|---|
| A | `239:36402` @ 2233 | 2233 | 120 | 58580 |
| B | `239:36800` @ 1078 | 1078 | 120 | 60933 |
| C | `239:37774` @ 1123 | 1123 | 120 | 62131 |
| D | `239:38031` @ 1319 | 1319 | — | 63374 |

4. `239:38165` keeps its original relationship — a sub-stack directly beneath `239:36540` in column 3, now at a clean 120px gutter (58580 + 847 + 120 = 59547). It sits wholly inside Row A's 2233px band, so it clears Row B.
5. Section bounds extended from h=4479 to **h=6273** (80px top pad + 6113 content + 80px bottom pad).

### The section itself was moved — and why

Re-pitched content is 6113px tall. Held at its original y=26852, the section would have ended at y=33125 and **overlapped delivery section `241:38503`** (`SCREENS — EXTERNAL (INSP-239)`, y=31731–34802) and then `305:40149`. Those coordinates are barred from change.

No gutter reduction can avoid this: the minimum stacked content height (2233+1078+1123+1319 = 5753 with zero gutters) already exceeds the 4879px of clear canvas between `236:33670` and `241:38503`.

Per instruction — move the section rather than leave an overlap — section `239:35967` was relocated from **y=26852 → y=58500**, x unchanged at -80, into the clear band below the delivery stack.

- Nearest section above: `342:42171`, bottom y=58047 → **453px clear gap**
- Nearest section below: `384:45164`, y=96119 → **31346px clear gap**
- Build bands at y=100000–149999, 160000, 180000, 200000, 220000, 240000, 260000 are far below the new bottom (64773) and were not approached.

Note: the Figma Plugin API does **not** carry section children when the section's `y` is set programmatically. Children were re-anchored explicitly by absolute coordinate afterwards, and containment was re-verified (0 frames outside section bounds, child count still 17).

---

## 5. AFTER — final state

Section bounds: `x=-80, y=58500, w=5784, h=6273` (bottom = 64773)

| # | id | name | x | y | w | h | bottom |
|---|---|---|---|---|---|---|---|
| 1 | `239:35968` | SCR-WEB-500 — Operations Center — /operations | 0 | 58580 | 1024 | 1506 | 60086 |
| 2 | `239:36119` | SCR-WEB-100 — Planning — /planning | 1150 | 58580 | 1024 | 1351 | 59931 |
| 3 | `239:36402` | SCR-WEB-300 — Review & Approval — /reviews | 2300 | 58580 | 1024 | 2233 | 60813 |
| 4 | `239:36540` | SCR-WEB-200 — Visit Management Workspace — /visits | 3450 | 58580 | 1024 | 847 | 59427 |
| 5 | `239:36667` | SUPERSEDED — Factory 360 regions-only draft | 4600 | 58580 | 1024 | 929 | 59509 |
| 6 | `239:38165` | SCR-WEB-200 — Visit Management Workspace — drawer open | 3450 | 59547 | 1024 | 847 | 60394 |
| 7 | `239:36800` | SCR-WEB-310 — Level 2 Review Workspace — /reviews/[id] | 0 | 60933 | 1024 | 1078 | 62011 |
| 8 | `239:36923` | SCR-WEB-320 — Version Comparison — /reviews/[id] | 1150 | 60933 | 1024 | 433 | 61366 |
| 9 | `239:37038` | SCR-WEB-110 — Bulk Planning Criteria — /planning/bulk | 2300 | 60933 | 1024 | 989 | 61922 |
| 10 | `239:37162` | SCR-WEB-120 — Single Visit Planning — /planning/single | 3450 | 60933 | 1024 | 755 | 61688 |
| 11 | `239:37280` | SCR-WEB-130 — Immediate Visit Planning — /planning/immediate | 4600 | 60933 | 1024 | 765 | 61698 |
| 12 | `239:37398` | SCR-WEB-140 — Visit Configuration & Assignment | 0 | 62131 | 1024 | 905 | 63036 |
| 13 | `239:37518` | SCR-WEB-150 — Plan Review & Publish | 1150 | 62131 | 1024 | 1065 | 63196 |
| 14 | `239:37648` | SCR-WEB-210 — Visit Detail — /visits/[id] | 2300 | 62131 | 1024 | 973 | 63104 |
| 15 | `239:37774` | SCR-VIR-700 — Virtual Appointment & Waiting Room | 3450 | 62131 | 1024 | 1123 | 63254 |
| 16 | `239:37903` | SCR-VIR-710 — Identity & OTP Verification | 4600 | 62131 | 1024 | 1031 | 63162 |
| 17 | `239:38031` | SCR-VIR-720 — Virtual Inspection Session — /virtual/[id] | 0 | 63374 | 1024 | 1319 | 64693 |

---

## 6. Proof — 0 collisions

Verification ran as a single read-back script against live node state after all writes.

**Test A — pairwise frame overlap inside `239:35967`**
Axis-aligned bounding-box intersection (`a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom`) over all 17 frames = 136 unique pairs.

```
frameCount: 17
frameCollisionCount: 0
frameCollisions: []
```

**Test B — containment**
Every frame lies wholly inside the extended section bounds.

```
framesOutsideSectionBounds: []
```

**Test C — section vs every other section on page `6:9`**
Same AABB test, section `239:35967` against all 17 sibling sections.

```
sectionCollisionCount: 0
sectionCollisions: []
nearestSectionAbove: 342:42171  bottom=58047  gap=453
nearestSectionBelow: 384:45164  y=96119       gap=31346
```

**Result: 0 frame collisions, 0 section collisions, 17/17 frames contained.**

---

## 7. Untouched — confirmed

No write was issued to any node outside `239:35967` and its 17 children. Specifically untouched:

- Delivery sections `148:6893`, `148:6894`, `148:6895`, `148:6896`, `224:23956`, `236:33670`, `241:38503`, `336:45770`
- Sections `339:42098`, `384:45164`
- Sections `305:40149`, `310:40972`, `311:41750`, `312:42490`, `342:42170`, `342:42171`
- All build bands at y=100000–149999, 160000, 180000, 200000, 220000, 240000, 260000 (`423:47937` and any concurrent writes)
- Component library pages

---

## 8. Evidence

- Before: `docs/design/figma/handoff/evidence/S1-canvas-pitch-1024-BEFORE.png`
- After: `docs/design/figma/handoff/evidence/S1-canvas-pitch-1024-AFTER.png`

Note on the renders: the Figma screenshot renderer anchors the section render box at page y=0, so reported render heights (31251 before, 64693 after) are content-bottom-from-origin, not section height. Section height is authoritative from the measured node state: 4479 → 6273.

## 9. Quota

No API call limit was hit. All planned writes and verifications completed. 5 `use_figma`/screenshot round trips used.
