# 2026-08-12 · T-074 — `/operations/live` typography

`task: T-074` · `status: done` · `duration: 30m`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014`

---

## Goal

Audit `/operations/live` for typography after T-070/T-071 rebuilt it, and fix
what the render exposes.

## What changed

| File | Action |
| --- | --- |
| `saqeel/map/map-chrome.module.css` | **created** — one design-system home for Mapbox chrome |
| `operations/live/LiveMapInner.tsx` | canvas adopts `mapChrome.chrome` |
| `operations-map-panel/operations-map-panel.tsx` | canvas adopts `mapChrome.chrome` |
| `operations-map-panel/operations-map-panel.module.css` | 3 duplicated `:global(.mapboxgl-*)` rules deleted |
| `scripts/typography-baseline.json` | 939 → 938 |

## Decisions

**The rebuild was clean, and the gate was right about that.** T-070/T-071 left
`/operations/live` with **zero static violations**: a 32-line `page.tsx` inside
WEB-001's ceiling, a 13-line CSS module with **no typography at all**, no inline
`style={{ fontSize }}`, no retired roles. Rendered, it measured **5 sizes
(30 · 28 · 20 · 14 · 12), all on-scale, zero unstyled headings.** This is the
first route in the programme that arrived essentially correct.

**One real defect, and only measurement could see it: `allPlex: false`.** The
Mapbox attribution control rendered in `"Helvetica Neue", Arial` — **a second
typeface on the route**. It is third-party chrome injected by `mapbox-gl`'s own
stylesheet, so it appears in no source file, no token, and no gate rule. The
canvas CSS module was genuinely clean; the defect lived in a dependency.

**Fixed centrally rather than per route.** Mapbox normalisation already existed
in exactly one place — `operations-map-panel.module.css`, as a per-route
`:global()` block carrying a baselined violation. Copying it into
`live-map-inner.module.css` would have duplicated a hack and **added** a
violation. Instead the rules moved to a new
`components/saqeel/map/map-chrome.module.css`, which both canvases compose:

- the live map gets the app typeface for the first time,
- the duplicated per-route block is deleted, so the change **removes** a
  violation rather than adding one,
- any future map inherits the same chrome by importing one module.

This follows the T-072 lesson: the same primitive mistake had by then appeared in
three shared components, and the fix belongs where the thing is shared.

**Attribution is `label` (12px), not `body` (14px).** The first pass mirrored the
old rule's `body` and measured 14px — which visibly enlarged legally-required
fine print that Mapbox had been rendering at 12px. Map credit is chrome, so
`label` is the right role, and it restores the original visual weight. **Caught
by re-measuring after the change, not by reading it.**

## Inventory taken before writing code

- Route rendered signed-in **before** any edit; both size and typeface measured.
- Static scope checked first: **0 baselined violations** in `operations/live/**`.
- `git log`/`git status` checked for concurrent work — T-070/T-071 committed,
  tree clean.
- Existing Mapbox normalisation located before writing a new one.

## Numbers

```
                      before   after
distinct sizes           5        5    (30 · 28 · 20 · 14 · 12)
off-scale                0        0
typefaces                2        1
attribution size      12px     12px    (14px in an intermediate pass, reverted)
operations violations   30       29
repo violations        939      938
```

## Accessibility

- **axe:** not run. **Owed.**
- Manual (WEB-003 §10):
  - screen reader — no markup change beyond one added class on two map canvases
  - the Mapbox attribution keeps its own link semantics and its size
  - **320px, Arabic/RTL — not verified. Owed.**
- No colour, tone or status change; `--sqx-text-muted` carried across unchanged.

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run gates:typography` — PASSED, 938 known, **1 removed**
- [x] **`/operations/live` rendered signed-in and measured** — 5 sizes, 0
      off-scale, `allPlex: true`
- [x] Attribution re-measured after the `label` correction — **12px, Plex**
- [x] **`/operations` re-checked for regression** from the shared chrome change
      — 4 sizes, 0 off-scale, `allPlex: true`
- [x] Baseline diff audited — the single entry is this task's own
- [ ] axe, 320px, Arabic/RTL — **owed**

**Session expiry, diagnosed here and back-corrected into T-072.** The T-072
record originally blamed the Browser pane for `/dashboard` and `/factories`
hanging on `loading.tsx`. The real cause was **the browser session expiring
mid-task**: the routes returned the login page and the fallback never swapped.
Probing three routes for `Keep me signed in` confirmed it. **When a route hangs
on its fallback, fetch it and check for the login markup before blaming the
renderer.** T-072's record has been amended.

## Retirement

No change.

## Parked

- `MapPanel`/`MapMarker`/`MapToolbar` in `components/saqeel/map/` still carry
  legacy global class names (`map-panel`, `t-heading`, `btn btn-ghost`) and
  inline `style={{ gap }}`. Out of typography scope, but that directory now owns
  a stylesheet and is the natural place to finish the job.
- `/operations` still has 29 violations, **26 of them the dead
  `operations.module.css`** (T-072) awaiting deletion.

## Blockers

None.
