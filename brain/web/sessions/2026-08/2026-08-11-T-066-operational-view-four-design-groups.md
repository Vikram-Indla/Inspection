# 2026-08-11 · T-066 — Operational View: restore the design's four metric groups

`task: T-066` · `status: partial (axe, 320px, screenshots owed)` · `duration: 1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-006, WEB-008, WEB-011, WEB-013`

---

## Goal

Clean the dashboard's Operational View: restore the four labelled metric groups
the approved design specifies, and drop the header sentence that restated two of
its own cards.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `components/dashboard/operational-view/operational-view.tsx` | one 7-card section → four design groups; summary dropped; `fill` import removed | 136 → 161 |
| `i18n/locales/{en,ar}/dashboard.json` | +3 group keys, −1 dead `priorities.summary` | net +2 each |
| `e2e/web-admin-m1-dashboard.spec.ts` | asserts all four group headings | 4 → 6 assertions |
| `e2e/dashboard-business.spec.ts` | asserts two of the group headings | 3 → 3 assertions |

## Decisions

**The design already answered this screen, and the shipped code had ignored one
line of it.** `design/final-cut/saqeel-revamp.html` defines `OPERATIONAL` as
**four labelled groups**, not a flat list:

| Design group | Metrics |
| --- | --- |
| Today's operations | Today's planned visits · Today's visit completion rate |
| Execution status | Active field inspections · Overdue planned visits |
| Approvals | Inspection reports awaiting approval · Returned inspection reports |
| Operational exceptions | High-priority visits pending execution |

Shipped, all seven sat under one "Today's operations" heading — which is
**factually wrong for four of them**: returned reports and reports awaiting
approval are Approvals, and overdue visits are Execution status. A supervisor
scanning for approvals had no reason to look under "today".

**The `today` array was already in the design's exact group order** — planned,
completion, active, overdue, awaiting, returned, high-priority. Only the group
boundaries had been lost, so this is pure composition: no query, no metric, no
value and no ordering changed. That is why the diff carries no functional risk.

**The seven-card row was also why the screen looked broken.** `CardGrid min="md"`
fits six at 1700px, so the seventh stranded alone beside roughly 1100×180px of
dead space — the largest single element on the screen. Under the design's
grouping there is no orphan: the singleton is a deliberate, labelled group.

**The header sentence I moved in T-062 is deleted, and that one was mine.**
"{high} high-priority visits are pending execution; {overdue} published visits
are past their recorded window" sat directly above
`High-priority visits pending execution` and `Overdue planned visits` — the two
cards it restates. T-062 relocated it from the deleted priorities panel to avoid
losing copy; adjacent to its own cards it was provably redundant, so the right
call was to drop it, not move it. `priorities.summary` is deleted from both
locales. **The governance footnote survives** — "Based on current records only.
No AI-generated recommendation." is a claim, not data — and now sits on
Operational exceptions, closest to the OPS-KPI-009 nudges surface it came from.

**`priorities.footnote` keeps its key name** though no priorities panel exists.
Renaming churns both locales for no user-visible gain; the string is unchanged.
Recorded so the name is not read as a leftover bug.

**The specs T-062 wrote had to be re-pointed again, one task later.** T-062
asserted the summary sentence was visible; this task deletes that sentence. Both
specs now assert the four **group headings**, which is the durable contract —
`Approvals` uses `exact: true`, because "Inspection reports awaiting approval" and
"Open Review & Approval" would otherwise match a substring lookup. **A spec that
asserts a sentence is hostage to copy; a spec that asserts structure is not.**

**Filtered drills were raised, not taken** (owner ruling). Four of the seven cards
share two destinations — "Open Execution" twice, "Open Planning" twice — and none
is filtered. See Parked for exactly why each is blocked.

## Inventory taken before writing code

- **State and effects:** none. The groups are a `readonly` array literal built at
  render; no `let`, no `any`, no new client boundary.
- **Literals mapped to tokens:** no CSS changed at all.
- **`<svg>`:** none introduced.
- **Duplication found:** the header sentence restating two of its own cards; four
  cards sharing two unfiltered drill targets; and OPS-KPI-006 still rendering
  twice (Planner strip tile and the Inspector capacity table, carried from T-061).
- **Accessibility:** `h2` landmarks 4 → 7 on this view, each naming a real group
  instead of one heading covering seven unrelated metrics. `titleId`
  `dashboard-todays-operations` is preserved because `web-admin-m1-dashboard`
  and `dashboard-business` both assert that heading by name.

## Numbers

Verified signed-in as persona `planner`, EN and AR RTL, from the DOM.

```
Route: /dashboard?view=operational
metric sections               1 → 4
cards per section             7 → 2 · 2 · 2 · 1   (design: 2 · 2 · 2 · 1)
orphan cards                  1 → 0
dead space beside the orphan  ~1100 × 180px → none
h2 landmarks on the view      4 → 7
header sentences restating own cards  1 → 0
i18n keys                     +3 −1 per locale
console errors                0 → 0
typecheck                     clean
design-system-v5              91 → 91 (pre-existing, none in touched files)
```

Read from the rendered DOM after the change, EN then AR:
`Today's operations` (2) · `Execution status` (2) · `Approvals` (2) ·
`Operational exceptions` (1, with the footnote in its own `<footer>`) — and in
`ar`: `عمليات اليوم` · `حالة التنفيذ` · `الاعتمادات` · `الاستثناءات التشغيلية`,
same card counts, footnote intact, summary absent in both locales.

## Accessibility

- axe: **not run** — owed, with T-060–T-063.
- Manual: **Arabic/RTL verified** — all four group headings render in `ar` with
  the correct card counts. Dark verified. **Keyboard, screen reader, 200% zoom,
  320 px, reduced motion and greyscale owed.**
- Improved here: seven metrics that shared one misleading `h2` now sit under four
  accurate ones, which is what a screen-reader user navigates by.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — script does not exist in this repo
- [x] `npm run gates` — `check:design-system-v5` unchanged at 91 pre-existing
      findings; typography green
- [ ] `npm run test:e2e` — not run; both edited specs need the seeded personas
- [x] Grepped for `priorities.summary` across `src` and `e2e` after deleting it —
      zero references

**The typography gate now reports 31 violations removed and again invites
`gates:typography:update`. Not run, and not this task's** — the removals are the
concurrent `/factories` typography pass in the same working tree (T-064 and its
follow-on). This diff changes no typography declaration. Same call as T-062.

## Retirement

Nothing marked or deleted.

## Parked

1. **Filtered drills — the precise blockers.** "Open Execution" appears on
   Today's planned visits and Returned inspection reports; "Open Planning" on
   Overdue planned visits and High-priority visits.
   - **`/execution` accepts no `searchParams` at all** (`export default async
     function ExecutionPage()`), so two of the four cannot be filtered without
     rebuilding that route.
   - `/planning` **can** filter — `parsePlanningParams` reads `tab`, `priority`,
     `windowFrom/To`, `inspectorId` — but `PLANNING_TABS` (`returned`, `expired`,
     …) describes **visit planning status** while these cards count **inspection
     reports**, and the `priority` values come from a DB lookup this workstation
     cannot read. Wiring either without confirming the object and the key would
     send the reader to a plausible **wrong** list, which is worse than an
     unfiltered one.
2. **OPS-KPI-006 still renders twice** — Planner strip tile and Inspector
   capacity table (carried from T-061).
3. **Two card anatomies on one screen** — Planner tiles are label → value →
   disclosure; group cards are title → question → value → disclosure → footer.
   Both are legal under WEB-014 §5.2; whether they should differ side by side is
   an owner call.
4. Everything parked in T-061–T-063 still stands, including the skeleton drift
   and its `effectiveView` trap.

## Blocked / open questions

None new.

## Proposed commit

```
refactor(dashboard): group operational metrics as the design defines them
```

## Next

Run the owed axe and 320 px pass across T-060–T-066 in one sweep, or take the
`ROLE_DASHBOARD_METRICS` overlap that has been parked since T-060.
