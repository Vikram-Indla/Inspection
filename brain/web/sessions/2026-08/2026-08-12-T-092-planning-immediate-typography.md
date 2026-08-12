# 2026-08-12 · T-092 — `/planning/immediate` was clean and still rendered two typefaces

`task: T-092` · `status: done` · `duration: 30m`
`rules applied: WEB-000, WEB-002, WEB-003, WEB-008, WEB-009, WEB-011, WEB-014 §2.0, §4.1`

---

## Goal

Take `/planning/immediate` through the same pass as the rest of the family. It
already reported **1 violation** — the shell — so the question was whether that
count was true.

## What changed

**One file.** `components/GeoMap.tsx` now composes
`components/saqeel/map/map-chrome.module.css`, which it never did.

| File | Action | Detail |
| --- | --- | --- |
| `components/GeoMap.tsx` | fixed | import `mapChrome`, add `.chrome` to both className branches |

Nothing in `app/(app)/planning/immediate/` or
`components/sections/planning-immediate/` needed changing — that tree was
genuinely clean.

## Decisions

**The static check said clean and it was right; the render said otherwise.**
Three greps came back empty on this route: no `.t-*` legacy classes (T-091's
hole), **no string-literal `className` at all**, and no typography declaration in
any CSS in the tree. Then the measured render showed **two typefaces**:

```
families: ["plexArabic", "Helvetica Neue"]
```

Three elements — `© Mapbox`, `© OpenStreetMap`, `Improve this map` — inside
`.mapboxgl-ctrl-attrib-inner`, injected by `mapbox-gl`'s own stylesheet. **This
is exactly the defect T-074 found on `/operations/live`**, in a component no
source file in this route references.

**T-074's fix was real but reached two files, not the app.** Its record states
the chrome moved to a shared module *"that both canvases compose, so … any future
map inherits the same chrome."* That is true of the two operations canvases —
`operations-map-panel.tsx` and `LiveMapInner.tsx` — and **only** those two.
`GeoMap`, which has **18 consumers**, was never wired up. So every map in the
application except the operations pair has been rendering Helvetica Neue
attribution since T-074.

**The fix belongs in `GeoMap`, not in this route.** Adding the class per-screen
would have fixed one of eighteen and duplicated a hack — the same argument T-074
itself used when it refused to copy the per-route `:global()` block, and the same
one T-083 used for the design-system floor.

**The className change had to preserve a load-bearing invariant.** `GeoMap`
carries an eleven-line comment explaining that `mapboxgl-map` must appear in
*every* value React writes: Mapbox adds the class at construction, React
overwrites the attribute on the next render, and losing it removes the
`position: relative` that the absolutely-positioned canvas resolves against —
"the map paints over the entire page". Both branches keep it:

```tsx
className={ready ? `${mapChrome.chrome} mapboxgl-map`
                 : `${mapChrome.chrome} mapboxgl-map sq-map-loading`}
```

Verified in the DOM rather than assumed: `position: relative`, and the canvas
rect **exactly equals** the container rect (385 × 254 at y=352), so nothing
escaped its box.

## Inventory taken before writing code

- `app/(app)/planning/immediate/` — 5 files; `ImmediateForm.tsx` is **live**
  (imported by `page.tsx`), unlike `BulkForm.tsx` which T-091 found dead.
- `components/sections/planning-immediate/` — 8 component directories, **zero**
  typography declarations, **zero** string-literal classNames.
- The only map on the route is `location-dispatch` → `GeoMap`.

## Numbers

```
/planning/immediate   1 → 1 violations   (the shell; the tree was already at 0)
repo baseline       749 → 749            (unchanged — this defect was never counted)

rendered            before                          after
typefaces           2 (plexArabic, Helvetica Neue)  1 (plexArabic)
attribution         Helvetica Neue 12px             plexArabic 12px / 600  = label
off-scale sizes     0                               0
sizes               30 · 20 · 16 · 14 · 12          unchanged
```

**The baseline did not move, and that is the point of this task.** The defect was
never in the count.

`GeoMap` has 18 consumers, so the same correction now applies to `/planning/single`,
`/planning/map`, `/factories/[id]`, `/visits/map`, `/operations`, `/execution`,
`/admin/gis`, `/dashboard` and every `/field/*` map.

## Accessibility

- Attribution is **legally required text**; it is now 12px `label` rather than
  Helvetica Neue 12px. T-074 ruled attribution is `label`, not `body`, precisely
  so the fix does not enlarge fine print Mapbox renders at 12px — that ruling is
  preserved here by reusing its module unchanged.
- No markup, roles, landmarks or headings changed.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — script does not exist (T-083)
- [x] `npm run gates:typography` — 749, none new (no re-baseline: nothing counted changed)
- [x] Static sweep of the route tree — no `.t-*`, no literal classNames, no declarations
- [x] **Rendered and measured before and after** — 2 typefaces → 1
- [x] Map container invariant checked in the DOM — `mapboxgl-map` present,
      `position: relative`, canvas rect == container rect
- [x] Second GeoMap consumer spot-checked (`/planning/map`) — one typeface, no regression
- [ ] The other 16 GeoMap surfaces are **not** individually verified
- [ ] `npm run test:e2e` — not run; needs a production build

## Retirement

Nothing retired.

## Parked

1. **`GeoMap`'s own unavailable state carries two defects it renders when Mapbox
   fails** — `<p className="t-caption">` (the T-091 invisible-violation class,
   11.5px) and `<span className="sq-state__glyph">⌖</span>` (a glyph-as-icon,
   CLAUDE.md rule 8). **Not rendered here** because the map loaded; T-072's rule
   applies — *error and empty states are part of the route and must be provoked,
   not assumed.*
2. **16 of the 18 GeoMap surfaces are unverified.** The change is a pure
   className addition and the invariant was checked on two of them, but
   `/field/*` needs an inspector persona (T-069) and several others need data
   this workstation lacks.
3. **A shared-component fix should be verified at the component, not at one
   call site.** T-074 verified its fix on the route it was working and recorded
   a claim about "any future map" that was not true. There is no gate for
   "component X composes module Y"; the only check is a render per consumer.

## Blocked / open questions

None.

## Proposed commit

```
fix(maps): give every mapbox canvas the saqeel attribution chrome
```

## Next

`/planning/visits` — 16 violations, all owned by `components/sections/visits/`.
