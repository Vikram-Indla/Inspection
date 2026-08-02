# Source import batch 01 — Establishment Details

First of the six remaining canonical journey batches. **Source is the iPad file; destination is
the English responsive Web master.** Repo routes are evidence only, not delivery routing.

## Source

| | |
|---|---|
| Concept | `Establishment Details` — **75 frames**, the largest concept in the source |
| Read from | `1831:155723` (834×2681, the fullest variant) on page `1065:77494` |
| iPad chrome present in source | `Top Bar`, `Home Indicator` — **not delivered**, reference only |

## Destination

| | |
|---|---|
| Frame | **`364:45987`** in `339:42098` |
| Name | `SOURCE-IMPORT — Establishment Details — iPad “Establishment Details” (75 frames) — INSPECTOR responsive · EN · Light` |
| Regions | 9-tab strip · Establishment data · Contacts ×2 · Declared data by 5 categories · export action |

The source's nine tabs are carried as a **wrapping chip strip**, not a fixed tablet tab bar —
that is the responsive-web translation of the same navigation.

## The finding this batch produced

The source's `Checking list` blocks carry **three reporting periods and a total** per declared
line:

> `العمالة الحالية (الفترة الأولى)` · `العمالة (الفترة الثانية)` · `العمالة (الفترة الثالثة)` · `المجموع`

My `DataChecklist` had **one value per line**. That was wrong — it lost the period structure that
makes the data meaningful.

**`DataChecklistRow` `319:84` rebuilt**: term + period line, then `Period 1 · Period 2 · Period 3
· Total` as four right-aligned columns. `DataChecklist` `319:164` inherits it across all five
categories. Every quantity is governed, so every one renders `Not configured`.

This is the third time reading the source properly has corrected a component I had already called
finished — after `Answer Bar` (two governed option sets, not duplicates) and `ChecklistQuestion`
(`value_date` is a response kind).

## Fixed in-batch

Period columns started at 78px, which made `Not configured` wrap to two lines — legible but
cramped, and exactly the "crunched label" the acceptance condition names. Widened to 100px.

## Responsive

| Width | Height | Clipped | Crunched |
|---|--:|--:|--:|
| 1280 | 1330 | 0 | 0 |
| 1024 | 1330 | 0 | 0 |
| 834 | 1330 | 0 | 0 |
| 680 | 1363 | 0 | 0 |

0 off-ramp sizes, 0 unbound fills. Tab and category strips wrap; the declared-data rows hold
their columns.

## Non-delivery dispositions recorded

| Source element | Disposition |
|---|---|
| `Top Bar` instance | **iPad chrome — not delivered.** The web `App topbar` collapses responsively |
| `Home Indicator` | **Device chrome — not delivered** |
| Fixed 834 tab bar | **Translated**, not copied — becomes a wrapping chip strip |

## Remaining source batches

| # | Concept | Source frames | Status |
|--:|---|--:|---|
| 1 | Establishment Details | 75 | **done** |
| 2 | Establishment Management | 27 | next |
| 3 | Inspection Items | 23 | |
| 4 | Violation Report | 8 | |
| 5 | Incident Report | 4 | |
| 6 | Destruction + Production Line reports | 30 | |
