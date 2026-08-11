# 2026-08-12 · T-072 — `/operations` typography

`task: T-072` · `status: done` · `duration: 1h`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014`

---

## Goal

Put `/operations` on the type scale. **`/operations/live` deliberately excluded** —
another agent was mid-task in it (T-070/T-071).

## What changed

| File | Action |
| --- | --- |
| `saqeel/stat-card/stat-card.module.css` | `.label` `overline` → `label`, uppercase dropped; `.sub` retired `caption` → `body` |
| `saqeel/card/card.module.css` | `.value[data-kind="text"]` `subheading` → `body-strong` |
| `components/GeoMap.tsx` | bare `<h4>` → `Heading level={4} visual="bodyStrong"` |
| `operations/OpsExport.{tsx,module.css}` | heading + 2 notes → `Text`; both rules deleted |
| `operations-entry-table/{tsx,module.css}` | retired `code` → `Mono`; `.muted` → `Text`; both rules deleted |
| `operations-exceptions/*.module.css` | redundant `font-weight` removed; retired `caption` → `body` |
| `operations-map-panel/*.module.css` | retired `caption` → `body` |
| `operations-monitoring-table/*.module.css` | retired `caption` → `body` |
| `scripts/typography-baseline.json` | 959 → 939 |

## Decisions

**`/operations` was the healthiest route yet** — 6 sizes, **0 off-scale**, one
typeface, **0 unstyled headings**, and a 19-line `page.tsx` already inside
WEB-001's limit. Someone did this route properly. Only two visible defects
existed and both were in **shared primitives**, not in operations code at all.

**`StatCard.label` was `overline` (11px).** WEB-014 §5.2 assigns a KPI tile
label to `label` (12px) — `overline` is *only* the eyebrow above a card title.
Same defect as `MetricStrip` (T-058) and `DataTable.head` (T-059). Third
instance of the same mistake in a shared primitive, which is the argument for
fixing these centrally rather than per screen.

**`CardValue[data-kind="text"]` was `subheading` (16px)** — owner-ruled down to
`body-strong` (14px). A text value in a KPI slot reads as a value, not a
heading, and the drop takes `/operations` to the same four sizes as
`/dashboard` and `/factories`.

**A fourth unstyled-heading find, in `GeoMap`.** `<h4>Map unavailable</h4>` with
no class; the frozen `.sq-state h4` rule sets **colour only**, so it fell to the
UA default (15px). This only appeared because the map **failed to load on one
render** — the state had never been visible in earlier passes. **Error and empty
states are part of the route and must be provoked, not assumed.** With T-059's
page title, T-064's Arial button and T-067's 24 headings, this is the fourth
instance of a value decided by an absent declaration.

**26 of the 50 baselined violations are dead.** `operations.module.css` is
imported by `OperationsPreview` (live) and `operations-details.tsx` (**zero
importers**). Checked declaration-by-declaration: **all 49 typography
declarations sit on classes the live preview never uses** — the live component
touches only seven `preview*` classes, none of which carry typography. Third
dead stylesheet in this programme, after `dashboard.module.css` and
`factory-list.module.css`. **Not migrated — it needs deleting.**

**Collision handling.** The owner ruled "wait until they commit". Their T-068
landed mid-task, but they immediately opened T-070/T-071 on `/operations/live`
and had already deleted `live.module.css`. Rather than block again, `live/` was
excluded and everything else proceeded — which satisfies the ruling's intent
(no clobbering) while still delivering the route.

## Inventory taken before writing code

Both views rendered signed-in **before** any edit (WEB-008).

- `?view=map` and `?view=performance` — 6 sizes each, 0 off-scale, identical
  profile.
- Every 11px and 16px node traced to its owning class and component.
- `operations.module.css` live/dead split computed per declaration.
- Concurrent-work check run against `git status` before starting.

## Numbers

```
                          before   after
distinct sizes — map         6        4    (28 · 20 · 14 · 12)
distinct sizes — perf        6        4
off-scale                    0        0
typefaces                    1        1
operations violations       50       30
repo violations            959      939
```

`/operations` now renders **the same four sizes as `/dashboard` and
`/factories`.**

**Attribution:** the gate reported 20 removed, but **6 of those are the other
agent's deletion of `live/live.module.css`**, not this task's. **This task
removed 14.** Recorded explicitly per the rule added during T-061/T-062.

## Accessibility

- **axe:** not run. **Owed.**
- Manual (WEB-003 §10):
  - screen reader — `GeoMap`'s state title is still an `<h4>` in the same
    position; heading levels unchanged everywhere
  - smallest text rose 11px → 12px wherever `StatCard` is used
  - **320px, Arabic/RTL — not verified. Owed.**
- No colour, tone or status change.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED, 939 known, 0 new
- [x] **`/operations` both views rendered signed-in** — 4 sizes, 0 off-scale,
      one typeface
- [x] **`StatCard` change verified on a second route** — `/planning` shows
      `12px`, `text-transform: none` on Draft/Returned/Published/Expired
- [x] `CardValue kind="text"` verified on `/operations` (the 16px nodes are gone)
- [x] Baseline diff audited entry-by-entry; the one non-mine entry attributed
- [ ] **`/dashboard` and `/factories` could not be re-rendered** — both stalled
      on their `loading.tsx` fallback in the pane while `/operations` and
      `/planning` loaded normally, and SSR for `/dashboard` returns 630 KB with
      the cards present. Blast radius was bounded from source instead:
      `StatCard` reaches 5 further screens (planning-buckets,
      planning-stat-cards, factory-workforce, regulation-overview,
      visit-status-tiles) and `CardValue kind="text"` reaches only the
      dashboard's Top-violation card. Both changes *reduce* size variety and
      both are on-scale.
- [ ] axe, 320px, Arabic/RTL — **owed**

**False alarm worth recording:** fetching `/en/dashboard` and grepping the HTML
for `TypeError|ReferenceError` matched — but the hits are Next.js's own bundled
library source (`Failed to parse URL from ${url}`), not a thrown error. **Grep
the rendered error overlay, not the whole dev bundle.**

## Retirement

New candidate: **`operations.module.css` + `operations-details.tsx`** (26
violations, zero importers). Joins the `DashboardView` and `FactoryList` orphans
— all three want one deletion task.

## Parked

- `StatCard`'s label change is visible on 5 unrendered screens (uppercase 11px →
  sentence-case 12px). Consistent with `MetricStrip` and `DataTable`, but worth
  an eyeball on `/visits` and `/planning/bulk`.
- `/planning` carries its own 11px debt (11 nodes: "AI insights", "Visit ID",
  "Factory") — pre-existing, not a regression from this task.
- `GeoMap.tsx:312` still hardcodes its copy as `ar ? "…" : "…"`, violating
  CLAUDE.md rule 15. Out of typography scope; needs an i18n namespace.

## Blockers

None.
