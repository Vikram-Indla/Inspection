# Batch 09 — Field Home, and a QA check that was missing

Ownership resolved: the **canonical English responsive Web master** is the delivery authority.
The disputed 1024 rebuild and the 834 / Arabic / dark frames are preserved as source and
reference. Nothing was reverted or deleted.

## The QA gap this batch exposed

My verification has always asked *"does anything overflow a parent that clips?"* That misses the
more common defect: **text overflowing a parent that does not clip**. Figma renders it spilling
over the neighbour, so it looks crunched but never registers as clipped.

Field Home hit it immediately — the metric captions read
`assigned · window begins toc` and `returned for correction · this p`, visibly cut, with the old
detector reporting **0 clipped**.

**The acceptance check is now two-part:**

| Condition | Meaning |
|---|---|
| `clipped` | overflows a parent with `clipsContent` |
| `crunched` | **text** overflows any parent, clipping or not |

Both must be 0 at 1280, 1024, 834 and 680.

**Re-audited every frame built so far under the stricter check — all 10 clean:**
Establishments ×3, Records ×3, the three Establishments states, and Field Home.
So the gap produced exactly one real defect, and it was in this batch.

## Built

| | |
|---|---|
| Frame | **`346:42363`** in `339:42098` |
| Name | `UNGOVERNED — Field Home — /field — INSPECTOR responsive · EN · Light` |
| Persona | Inspector |
| Repo route | `/field` — 836 lines, reachable from the taskbar |
| Required states | **empty, error, loading, offline, permission, validation** — six, the most of any route |
| Dependencies | `FieldHome`, `DailyBriefingCard`, `FieldMetricStrip`, `FieldHeaderSync`, `FieldScopeProvider`; `Badge` `9:25`, `ExceptionMark` `172:98`, `seg-opt` `70:6`, `Button` `8:32`, `section-title` `70:12` |
| Jira | **NONE FOUND** — evidence gap, recorded, not treated as a blocker |

**Structure taken from the shipped code, including its warning.** `FieldMetricStrip.tsx` carries
an explicit comment that the mission row, the Daily/Weekly control and the four metrics are
**one card** — and that treating the mission and a metric card as two surfaces "was the
structural miss" in an earlier attempt. The contract follows that: one card, not two.

**Governed empty state preserved.** The same file notes that *Est. finish time* has no reachable
input, so the label stays and the value renders the empty state. The contract renders
`Not configured`, matching the shipped behaviour rather than inventing a clock time.

## Responsive

| Width | Height | Clipped | Crunched |
|---|--:|--:|--:|
| 1280 | 639 | 0 | 0 |
| 1024 | 639 | 0 | 0 |
| 834 | 721 | 0 | 0 |
| 680 | 721 | 0 | 0 |

The metric grid reflows from one row to two below 1024; the mission chips wrap.

**Fixed in-batch:** metric cards were `FIXED 150` with auto-width text, so captions overflowed.
Cards widened to 170 and every metric text set to `FILL` so it wraps inside its card.

## Evidence gaps recorded, not blocking

- **Jira NONE FOUND** — no inspector epic exists.
- **`/field` has no catalogue row**, hence the `UNGOVERNED` frame name.
- Dark and AR variants not built; English is the canonical delivery target.
